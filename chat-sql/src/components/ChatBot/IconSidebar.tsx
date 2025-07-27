import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface IconSidebarProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  isHistoryOpen: boolean;
}

const IconSidebar: React.FC<IconSidebarProps> = ({
  onNewChat,
  onToggleHistory,
  onOpenSettings,
  historyCount,
  isHistoryOpen,
}) => {
  return (
    <Box
      sx={{
        width: 48,
        height: '100%',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1,
        gap: 1,
      }}
    >
      {/* 新建对话按钮 */}
      <Tooltip title="新建对话" placement="right">
        <IconButton
          onClick={onNewChat}
          sx={{
            color: 'var(--icon-color)',
            backgroundColor: 'var(--button-bg)',
            border: '1px solid var(--button-border)',
            borderRadius: 1,
            width: 36,
            height: 36,
            '&:hover': {
              backgroundColor: 'var(--button-hover-bg)',
              borderColor: 'var(--button-hover-border)',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* 历史记录按钮 */}
      <Tooltip title="历史记录" placement="right">
        <IconButton
          onClick={onToggleHistory}
          sx={{
            color: isHistoryOpen ? 'var(--primary-color)' : 'var(--icon-color)',
            backgroundColor: isHistoryOpen ? 'var(--selected-bg)' : 'transparent',
            borderRadius: 1,
            width: 36,
            height: 36,
            '&:hover': {
              backgroundColor: isHistoryOpen ? 'var(--selected-bg)' : 'var(--hover-bg)',
            },
          }}
        >
          <Badge
            badgeContent={historyCount}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--badge-text)',
                fontSize: '0.625rem',
                height: 16,
                minWidth: 16,
                right: -2,
                top: -2,
              },
            }}
          >
            <HistoryIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 弹簧间距 */}
      <Box sx={{ flex: 1 }} />

      {/* 设置按钮 */}
      <Tooltip title="设置" placement="right">
        <IconButton
          onClick={onOpenSettings}
          sx={{
            color: 'var(--icon-color)',
            borderRadius: 1,
            width: 36,
            height: 36,
            '&:hover': {
              backgroundColor: 'var(--hover-bg)',
            },
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default IconSidebar;
