"use client";

import React, { useState, useRef } from "react";
import { Button, Tooltip, message, Dropdown, Menu, Upload } from "antd";
import {
  ShareAltOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const ShareButton: React.FC<{ className?: string }> = ({ className }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 辅助函数：UTF-8 编码为 URL 安全的 Base64
  const utf8_to_b64url = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  // 辅助函数：URL 安全的 Base64 解码为 UTF-8
  const b64url_to_utf8 = (str: string) => {
    // 还原标准 Base64
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    // 添加补位
    while (str.length % 4) {
      str += "=";
    }

    try {
      return decodeURIComponent(
        atob(str)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    } catch (e) {
      throw new Error("解码失败：无效的数据");
    }
  };

  // 获取数据库数据
  const getDatabaseData = () => {
    return new Promise<any[]>((resolve, reject) => {
      try {
        const request = indexedDB.open("llm_problems_db");

        request.onerror = () => {
          reject(new Error("无法访问数据库"));
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(["problems"], "readonly");
          const store = transaction.objectStore("problems");
          const request = store.getAll();

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            reject(new Error("获取数据失败"));
          };
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  // 复制分享链接
  const handleCopyLink = async () => {
    try {
      const data = await getDatabaseData();
      // 使用 URL 安全的 Base64 编码
      const shareData = utf8_to_b64url(JSON.stringify(data));
      const shareUrl = `${window.location.origin}/share?data=${shareData}`;
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success("分享链接已复制到剪贴板");
    } catch (error) {
      console.error("复制链接失败:", error);
      messageApi.error("复制链接失败");
    }
  };

  // 导出数据到文件
  const handleExportFile = async () => {
    try {
      const data = await getDatabaseData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `chatSQL-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      messageApi.success("数据已导出到文件");
    } catch (error) {
      console.error("导出文件失败:", error);
      messageApi.error("导出文件失败");
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // 打开数据库
        const request = indexedDB.open("llm_problems_db");

        request.onerror = () => {
          messageApi.error("无法访问数据库");
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(["problems"], "readwrite");
          const store = transaction.objectStore("problems");

          // 清除现有数据
          store.clear().onsuccess = () => {
            // 导入处理后的数据
            data.forEach((item: any) => {
              // 处理日期字段
              const processedItem = {
                ...item,
                createdAt: item.createdAt
                  ? new Date(item.createdAt)
                  : new Date(),
                updatedAt: item.updatedAt
                  ? new Date(item.updatedAt)
                  : new Date(),
              };
              store.add(processedItem);
            });
          };

          transaction.oncomplete = () => {
            messageApi.success("数据导入成功");
            // 重定向到主页
            setTimeout(() => {
              window.location.href = "/";
            }, 1500);
          };
        };
      } catch (error) {
        console.error("导入失败:", error);
        messageApi.error("导入失败：文件格式不正确");
      }

      // 重置文件输入，以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // 触发文件选择对话框
  const handleImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      icon: <CopyOutlined />,
      label: "复制分享链接",
      onClick: handleCopyLink,
    },
    {
      key: "2",
      icon: <DownloadOutlined />,
      label: "导出到文件",
      onClick: handleExportFile,
    },
    {
      key: "3",
      icon: <UploadOutlined />,
      label: "从文件导入",
      onClick: handleImportFile,
    },
  ];

  return (
    <>
      {contextHolder}
      <Dropdown menu={{ items }} placement='bottomRight'>
        <Button type='text' icon={<ShareAltOutlined />} className={className} />
      </Dropdown>
      <input
        type='file'
        ref={fileInputRef}
        style={{ display: "none" }}
        accept='.json'
        onChange={handleFileSelect}
      />
    </>
  );
};

export default ShareButton;
