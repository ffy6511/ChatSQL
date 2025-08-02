"use client";

import React, { useState, useEffect } from "react";
import { Button, Tooltip, Dropdown } from "antd";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { DesktopOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import styles from "./ThemeToggle.module.css";

type ThemeType = "light" | "dark" | "system";

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeType>("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // 初始化主题
  useEffect(() => {
    // 从localStorage读取主题设置
    const savedTheme = (localStorage.getItem("theme") as ThemeType) || "system";
    setTheme(savedTheme);

    // 应用主题
    applyTheme(savedTheme);

    // 如果是system主题，添加媒体查询监听器
    if (savedTheme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? "dark" : "light");
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light",
        );
      };

      // 初始设置
      setActualTheme(mediaQuery.matches ? "dark" : "light");

      // 添加监听器
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // 应用主题
  const applyTheme = (themeType: ThemeType) => {
    if (themeType === "system") {
      // 系统
      const isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        isDarkMode ? "dark" : "light",
      );
      setActualTheme(isDarkMode ? "dark" : "light");
    } else {
      // 手动设置
      document.documentElement.setAttribute("data-theme", themeType);
      setActualTheme(themeType);
    }
  };

  // 切换主题
  const handleThemeChange = (type: ThemeType) => {
    setTheme(type);
    localStorage.setItem("theme", type);
    applyTheme(type);
  };

  // 获取当前主题图标
  const getThemeIcon = () => {
    if (actualTheme === "dark") {
      return <DarkModeIcon />;
    }
    return <LightModeIcon />;
  };

  // 下拉菜单项
  const items: MenuProps["items"] = [
    {
      key: "light",
      icon: <LightModeIcon />,
      label: "浅色",
      onClick: () => handleThemeChange("light"),
    },
    {
      key: "dark",
      icon: <DarkModeIcon />,
      label: "深色",
      onClick: () => handleThemeChange("dark"),
    },
    {
      key: "system",
      icon: <DesktopOutlined />,
      label: "系统",
      onClick: () => handleThemeChange("system"),
    },
  ];

  return (
    <div
      className={`${styles.themeToggleContainer} ${styles.globalStylesContainer}`}
    >
      <Dropdown
        menu={{ items }}
        placement="bottomRight"
        overlayClassName={styles.themeDropdown}
      >
        <Button
          type="text"
          icon={getThemeIcon()}
          className={styles.actionButton}
        />
      </Dropdown>
    </div>
  );
};

export default ThemeToggle;
