// 重构后的聊天侧边栏组件

import React from "react";
import { Box } from "@mui/material";
import { ChatSidebarProps, ChatHistory } from "@/types/chatBotTypes/chatbot";
import { AgentType } from "@/types/chatBotTypes/agents";
import IconSidebar from "./IconSidebar";
import HistoryPanel from "./HistoryPanel";

// 扩展的ChatSidebar属性接口
interface ExtendedChatSidebarProps extends ChatSidebarProps {
  chatHistory?: ChatHistory[];
  onLoadHistory?: (historyId: string) => void;
  onDeleteHistory?: (historyId: string) => void;
  onEditHistoryTitle?: (historyId: string, newTitle: string) => void;
  onClearAllHistory?: () => void;
  currentHistoryId?: string;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  selectedAgent?: AgentType;
  onAgentChange?: (agentType: AgentType) => void;
}

const ChatSidebar: React.FC<ExtendedChatSidebarProps> = ({
  onNewChat,
  onOpenHistory,
  onOpenSettings,
  historyCount = 0,
  chatHistory = [],
  onLoadHistory,
  onDeleteHistory,
  onEditHistoryTitle,
  onClearAllHistory,
  currentHistoryId,
  isHistoryOpen = false,
  onToggleHistory,
  selectedAgent = AgentType.CHAT,
  onAgentChange,
}) => {
  // 调试信息
  console.log("ChatSidebar props:", {
    historyCount,
    chatHistoryLength: chatHistory.length,
    isHistoryOpen,
    currentHistoryId,
    chatHistory: chatHistory.slice(0, 3), // 只显示前3条用于调试
  });

  const handleToggleHistory = () => {
    if (onToggleHistory) {
      onToggleHistory();
    }
  };

  const handleLoadHistory = (historyId: string) => {
    if (onLoadHistory) {
      onLoadHistory(historyId);
    }
  };

  const handleDeleteHistory = (historyId: string) => {
    if (onDeleteHistory) {
      onDeleteHistory(historyId);
    }
  };

  const handleEditHistoryTitle = (historyId: string, newTitle: string) => {
    if (onEditHistoryTitle) {
      onEditHistoryTitle(historyId, newTitle);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        backgroundColor: "var(--sidebar-bg)",
        width: isHistoryOpen ? 328 : 48, // 48px (IconSidebar) + 280px (HistoryPanel)
        transition: "width 0.3s ease-in-out",
      }}
    >
      {/* 图标侧边栏 */}
      <IconSidebar
        onNewChat={onNewChat}
        onToggleHistory={handleToggleHistory}
        onOpenSettings={onOpenSettings}
        historyCount={historyCount}
        isHistoryOpen={isHistoryOpen}
        selectedAgent={selectedAgent}
        onAgentChange={onAgentChange || (() => {})}
      />

      {/* 历史记录面板 */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        chatHistory={chatHistory}
        currentHistoryId={currentHistoryId}
        onNewChat={onNewChat}
        onLoadHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
        onEditHistoryTitle={handleEditHistoryTitle}
        onClearAllHistory={onClearAllHistory}
      />
    </Box>
  );
};

export default ChatSidebar;
