import React from "react";
import { Box, IconButton, Tooltip, Badge } from "@mui/material";
import {
  Add as AddIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Storage as StorageIcon,
  AccountTree as AccountTreeIcon,
  Quiz as QuizIcon,
  Rule as VerifyIcon,
} from "@mui/icons-material";
import { AgentType } from "@/types/chatBotTypes/agents";

interface IconSidebarProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  isHistoryOpen: boolean;
  selectedAgent: AgentType;
  onAgentChange: (agentType: AgentType) => void;
}

// 参数配置
const ICON_SIZE = 36;

const IconSidebar: React.FC<IconSidebarProps> = ({
  onNewChat,
  onToggleHistory,
  onOpenSettings,
  historyCount,
  isHistoryOpen,
  selectedAgent,
  onAgentChange,
}) => {
  // 智能体图标映射
  const getAgentIcon = (agentType: AgentType) => {
    switch (agentType) {
      case AgentType.CHAT:
        return ChatIcon;
      case AgentType.SCHEMA_GENERATOR:
        return StorageIcon;
      case AgentType.ER_GENERATOR:
        return AccountTreeIcon;
      case AgentType.ER_QUIZ_GENERATOR:
        return QuizIcon;
      case AgentType.ER_VERIFIER:
        return VerifyIcon;
      default:
        return ChatIcon;
    }
  };

  // 智能体名称映射
  const getAgentName = (agentType: AgentType) => {
    switch (agentType) {
      case AgentType.CHAT:
        return "通用问答";
      case AgentType.SCHEMA_GENERATOR:
        return "DDL生成";
      case AgentType.ER_GENERATOR:
        return "ER图生成";
      case AgentType.ER_QUIZ_GENERATOR:
        return "ER图出题";
      case AgentType.ER_VERIFIER:
        return "ER图测评";
      default:
        return "通用聊天";
    }
  };
  return (
    <Box
      sx={{
        width: "2.5rem",
        height: "100%",
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 1,
        gap: 1,
      }}
    >
      {/* 新建对话按钮 */}
      <Tooltip title='新建对话' placement='right'>
        <IconButton
          onClick={onNewChat}
          sx={{
            color: "var(--icon-color)",
            backgroundColor: "var(--button-bg)",
            borderRadius: 4,
            width: ICON_SIZE,
            height: ICON_SIZE,
            "&:hover": {
              backgroundColor: "var(--hover-bg)",
            },
          }}
        >
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>

      {/* 历史记录按钮 */}
      <Tooltip title='历史记录' placement='right'>
        <IconButton
          onClick={onToggleHistory}
          sx={{
            color: isHistoryOpen ? "var(--primary-color)" : "var(--icon-color)",
            backgroundColor: "transparent",
            borderRadius: 4,
            width: ICON_SIZE,
            height: ICON_SIZE,
            "&:hover": {
              backgroundColor: isHistoryOpen
                ? "var(--hover-bg)"
                : "var(--hover-bg)",
            },
          }}
        >
          <Badge
            badgeContent={historyCount}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "var(--badge-bg)",
                color: "var(--badge-text)",
                fontSize: "0.625rem",
                height: 16,
                minWidth: 16,
                right: -2,
                top: 3,
              },
            }}
          >
            <HistoryIcon fontSize='small' />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 智能体选择区域 */}
      <Box sx={{ my: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {Object.values(AgentType).map((agentType) => {
          const IconComponent = getAgentIcon(agentType);
          const agentName = getAgentName(agentType);
          const isSelected = selectedAgent === agentType;

          return (
            <Tooltip key={agentType} title={agentName} placement='right'>
              <IconButton
                onClick={() => onAgentChange(agentType)}
                sx={{
                  color: isSelected
                    ? "var(--primary-color)"
                    : "var(--icon-color)",
                  // backgroundColor: isSelected
                  //   ? "var(--selected-bg)"
                  //   : "transparent",
                  borderRadius: 4,
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  // border: isSelected
                  //   ? "2px solid var(--primary-color)"
                  //   : "2px solid transparent",
                  "&:hover": {
                    color: isSelected
                      ? "var(--primary-color)"
                      : "var(--icon-color)",
                    backgroundColor: isSelected
                      ? "var(--selected-hover-bg)"
                      : "var(--hover-bg)",
                  },
                }}
              >
                <IconComponent fontSize='small' />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {/* 弹簧间距 */}
      <Box sx={{ flex: 1 }} />

      {/* 设置按钮 */}
      <Tooltip title='设置' placement='right'>
        <IconButton
          onClick={onOpenSettings}
          sx={{
            color: "var(--icon-color)",
            borderRadius: 4,
            width: ICON_SIZE,
            height: ICON_SIZE,
            "&:hover": {
              backgroundColor: "var(--hover-bg)",
            },
          }}
        >
          <SettingsIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default IconSidebar;
