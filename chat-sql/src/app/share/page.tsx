'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { message } from 'antd';

// 创建一个内部组件来处理数据导入逻辑
const ImportHandler: React.FC = () => {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  // 辅助函数：URL 安全的 Base64 解码为 UTF-8
  const b64url_to_utf8 = (str: string) => {
    // 还原标准 Base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // 添加补位
    while (str.length % 4) {
      str += '=';
    }
    
    try {
      return decodeURIComponent(
        atob(str).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
    } catch (e) {
      throw new Error('解码失败：无效的分享数据');
    }
  };

  useEffect(() => {
    const importSharedData = async () => {
      try {
        const sharedData = searchParams?.get('data');
        if (!sharedData) {
          messageApi.error('无效的分享链接');
          return;
        }

        // 使用 URL 安全的 Base64 解码
        const decodedData = JSON.parse(b64url_to_utf8(sharedData));

        // 处理数据中的日期
        const processedData = decodedData.map((item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
        }));

        // 打开数据库
        const request = indexedDB.open('llm_problems_db');

        request.onerror = () => {
          messageApi.error('无法访问数据库');
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['problems'], 'readwrite');
          const store = transaction.objectStore('problems');

          // 清除现有数据
          store.clear().onsuccess = () => {
            // 导入处理后的数据
            processedData.forEach((item: any) => {
              store.add(item);
            });
          };

          transaction.oncomplete = () => {
            messageApi.success('数据导入成功');
            // 重定向到主页
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          };
        };
      } catch (error) {
        console.error('导入失败:', error);
        messageApi.error(error instanceof Error ? error.message : '导入失败');
      }
    };

    importSharedData();
  }, [searchParams, messageApi]);

  return (
    <div style={{ padding: '20px' }}>
      {contextHolder}
      <h1>正在导入分享内容...</h1>
    </div>
  );
};

// 主页面组件
const SharePage: React.FC = () => {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}><h1>加载中...</h1></div>}>
      <ImportHandler />
    </Suspense>
  );
};

export default SharePage;
