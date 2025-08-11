"use client";

import React, { useState, useEffect } from "react";
import { Button, Tooltip } from "antd";
import {
  HomeOutlined,
  HistoryOutlined,
  CodeOutlined,
  DatabaseOutlined,
  PartitionOutlined,
  MessageOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import styles from "./NavBar.module.css";
import ShareButton from "./ShareButton";
import ThemeToggle from "../SideBar/ThemeToggle";
import ChatWindow from "@/components/ChatBot/ChatWindow";

const NavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + K 打开/关闭聊天窗口
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 切换聊天窗口
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <>
      <nav className={styles.navBar}>
        <div className={styles.leftSection}>
          <div className={styles.logoContainer}>
            <img
              src='/assets/logo.svg'
              alt='Logo'
              className={styles.logoImage}
            />
            <h2 className={styles.logoText}>ChatSQL</h2>
          </div>
        </div>

        <div className={styles.middleSection}>
          <div className={styles.navTabs}>
            <Tooltip title='SQL练习'>
              <Button
                type={isActive("/") ? "primary" : "text"}
                icon={<CodeOutlined />}
                onClick={() => router.push("/")}
                className={`${styles.tabButton} ${
                  isActive("/") ? styles.activeTab : ""
                }`}
              >
                Coding
              </Button>
            </Tooltip>

            <Tooltip title='ER图建模'>
              <Button
                type={isActive("/er-diagram") ? "primary" : "text"}
                icon={<DatabaseOutlined />}
                onClick={() => router.push("/er-diagram")}
                className={`${styles.tabButton} ${
                  isActive("/er-diagram") ? styles.activeTab : ""
                }`}
              >
                ERDiagram
              </Button>
            </Tooltip>

            <Tooltip title='B+树可视化'>
              <Button
                type={isActive("/Bplus") ? "primary" : "text"}
                icon={<PartitionOutlined />}
                onClick={() => router.push("/Bplus")}
                className={`${styles.tabButton} ${
                  isActive("/Bplus") ? styles.activeTab : ""
                }`}
              >
                BPlus
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className={styles.rightSection}>
          {/* 主题切换 */}
          <Button
            type='text'
            icon={<ThemeToggle />}
            className={styles.navButton}
          />

          {/* 聊天按钮 */}
          <Tooltip title={`智能助手 (Ctrl+K)`}>
            <Button
              type='text'
              icon={isChatOpen ? <CloseOutlined /> : <MessageOutlined />}
              onClick={toggleChat}
              className={styles.navButton}
            />
          </Tooltip>

          <Tooltip title='返回主页'>
            <Button
              type='text'
              icon={<HomeOutlined />}
              onClick={() => router.push("/")}
              className={styles.navButton}
            />
          </Tooltip>
          {/* 暂时停用更新日志 */}
          {/* <Tooltip title='更新日志'>
            <Button
              type='text'
              icon={<HistoryOutlined />}
              onClick={() => router.push("/changelog")}
              className={styles.navButton}
            />
          </Tooltip> */}
        </div>
      </nav>

      {/* 聊天窗口 */}
      <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default NavBar;
