'use client'

import React from 'react';
import { Button, Tooltip, message } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import styles from './NavBar.module.css';

const ShareButton: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // 辅助函数：UTF-8 编码为 URL 安全的 Base64
  const utf8_to_b64url = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
      }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleShare = async () => {
    try {
      // 打开数据库
      const request = indexedDB.open('llm_problems_db');
      
      request.onerror = () => {
        messageApi.error('无法访问数据库');
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['problems'], 'readonly');
        const store = transaction.objectStore('problems');
        const request = store.getAll();

        request.onsuccess = async () => {
          const data = request.result;
          try {
            // 使用 URL 安全的 Base64 编码
            const shareData = utf8_to_b64url(JSON.stringify(data));
            const shareUrl = `${window.location.origin}/share?data=${shareData}`;
            await navigator.clipboard.writeText(shareUrl);
            messageApi.success('分享链接已复制到剪贴板');
          } catch (err) {
            console.error('编码或复制失败:', err);
            messageApi.error('生成分享链接失败');
          }
        };

        request.onerror = () => {
          messageApi.error('获取数据失败');
        };
      };
    } catch (error) {
      console.error('分享失败:', error);
      messageApi.error('分享失败');
    }
  };

  return (
    <>
      {contextHolder}
      <Tooltip title="分享数据库">
        <Button 
          type="text" 
          icon={<ShareAltOutlined />}
          onClick={handleShare}
          className={styles.navButton}
        />
      </Tooltip>
    </>
  );
};

export default ShareButton;
