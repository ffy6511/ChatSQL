import React, { useState } from "react";
import { Button, Tooltip, message } from "antd";
import {
  QuestionCircleOutlined,
  GithubOutlined,
  PlusCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useLLMContext } from "@/contexts/LLMContext";
import styles from "./SideBar.module.css";
import GuidingModal from "./GuidingModal";
import InitTutorialButton from "../Tutorial/InitTutorialButton";
import ThemeToggle from "./ThemeToggle";

const SideBar: React.FC<{ onToggleHistory?: () => void }> = ({
  onToggleHistory,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isGuidingModalOpen, setIsGuidingModalOpen] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const {
    setLLMResult,
    setCurrentProblemId,
    setShowLLMWindow,
    showLLMWindow,
    currentProblemId,
  } = useLLMContext();

  const handleOpenGuide = () => {
    setIsGuidingModalOpen(true);
  };

  const handleCloseGuide = () => {
    setIsGuidingModalOpen(false);
  };

  const handleNewChat = () => {
    // 检查是否已经在新建对话界面
    if (showLLMWindow && !currentProblemId) {
      messageApi.info("您已处于新建对话当中");
      return;
    }

    setLLMResult(null);
    setCurrentProblemId(null);
    setShowLLMWindow(true);
  };

  const handleToggleHistory = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed);
    onToggleHistory?.();
  };

  const handleGithubClick = () => {
    window.open("https://github.com/ffy6511/chatSQL", "_blank");
  };

  return (
    <div className="global-sidebar-container">
      {contextHolder}
      <div className="global-sidebar-top-buttons">
        <Tooltip title="新建对话" placement="right">
          <Button
            type="text"
            icon={<PlusCircleOutlined />}
            className="global-sidebar-action-button"
            onClick={handleNewChat}
          />
        </Tooltip>

        <Tooltip
          title={isHistoryCollapsed ? "展开历史记录" : "收起历史记录"}
          placement="right"
        >
          <Button
            type="text"
            icon={
              isHistoryCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            }
            className="global-sidebar-action-button"
            onClick={handleToggleHistory}
          />
        </Tooltip>
      </div>

      <div className="global-sidebar-menu-container">
        <div className="global-sidebar-menu-items">
          <ThemeToggle />
        </div>
        <div className="global-sidebar-menu-items">
          <InitTutorialButton className="global-sidebar-action-button" />
        </div>
      </div>

      <div className="global-sidebar-bottom-buttons">
        <Tooltip title="帮助" placement="right">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            className="global-sidebar-action-button"
            onClick={handleOpenGuide}
          />
        </Tooltip>

        <Tooltip title="GitHub仓库" placement="right">
          <Button
            type="text"
            icon={<GithubOutlined />}
            className="global-sidebar-action-button"
            onClick={handleGithubClick}
          />
        </Tooltip>
      </div>

      <GuidingModal isOpen={isGuidingModalOpen} onClose={handleCloseGuide} />
    </div>
  );
};

export default SideBar;
