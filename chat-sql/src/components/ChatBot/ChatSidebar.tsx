// 聊天侧边栏组件

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Popover,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ChatSidebarProps, ChatHistory, ModuleType } from '@/types/chatbot';
import { formatTimestamp, truncateText } from './utils/storage';

interface ExtendedChatSidebarProps extends ChatSidebarProps {
  chatHistory?: ChatHistory[];
  onLoadHistory?: (historyId: string) => void;
  onDeleteHistory?: (historyId: string) => void;
  onEditHistoryTitle?: (historyId: string, newTitle: string) => void;
  currentHistoryId?: string;
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
  currentHistoryId,
}) => {
  const [historyAnchorEl, setHistoryAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 获取模块图标
  const getModuleIcon = (module: ModuleType) => {
    switch (module) {
      case 'coding':
        return '💻';
      case 'ER':
        return '🔗';
      case 'Bplus':
        return '🌳';
      default:
        return '💬';
    }
  };

  // 获取模块颜色
  const getModuleColor = (module: ModuleType) => {
    switch (module) {
      case 'coding':
        return '#1976d2';
      case 'ER':
        return '#9c27b0';
      case 'Bplus':
        return '#2e7d32';
      default:
        return '#666666';
    }
  };

  // 处理历史记录点击
  const handleHistoryClick = (historyId: string) => {
    if (onLoadHistory) {
      onLoadHistory(historyId);
    }
    handleHistoryClose(); // 关闭Popover
  };

  // 处理删除历史记录
  const handleDeleteHistory = (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation();
    if (onDeleteHistory) {
      onDeleteHistory(historyId);
    }
  };

  // 开始编辑标题
  const handleStartEditTitle = (e: React.MouseEvent, historyId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingHistoryId(historyId);
    setEditingTitle(currentTitle || '');
  };

  // 保存编辑的标题
  const handleSaveEditTitle = () => {
    if (editingHistoryId && onEditHistoryTitle) {
      onEditHistoryTitle(editingHistoryId, editingTitle);
    }
    setEditingHistoryId(null);
    setEditingTitle('');
  };

  // 取消编辑标题
  const handleCancelEditTitle = () => {
    setEditingHistoryId(null);
    setEditingTitle('');
  };

  // 搜索和筛选历史记录
  const filteredHistory = chatHistory.filter(history => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    // 搜索标题
    if (history.title?.toLowerCase().includes(query)) return true;

    // 搜索消息内容
    return history.messages.some(message =>
      message.content.toLowerCase().includes(query)
    );
  });

  // 按模块分组历史记录
  const groupedHistory = filteredHistory.reduce((groups, history) => {
    const moduleType = history.module;
    if (!groups[moduleType]) {
      groups[moduleType] = [];
    }
    groups[moduleType].push(history);
    return groups;
  }, {} as Record<ModuleType, ChatHistory[]>);

  // 处理历史记录按钮点击
  const handleHistoryButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (historyAnchorEl) {
      setHistoryAnchorEl(null);
    } else {
      setHistoryAnchorEl(event.currentTarget);
    }
  };

  // 关闭历史记录面板
  const handleHistoryClose = () => {
    setHistoryAnchorEl(null);
    setSearchQuery('');
  };

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
      }}
    >
      {/* 顶部按钮 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* 新建对话 */}
        <Tooltip title="新建对话" placement="right">
          <IconButton
            onClick={onNewChat}
            sx={{
              color: 'var(--icon-color)',
              '&:hover': {
                backgroundColor: 'var(--button-hover)',
                color: 'var(--icon-color-hover)',
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        {/* 历史记录 */}
        <Tooltip title="历史记录" placement="right">
          <IconButton
            onClick={handleHistoryButtonClick}
            sx={{
              color: 'var(--icon-color)',
              '&:hover': {
                backgroundColor: 'var(--button-hover)',
                color: 'var(--icon-color-hover)',
              },
            }}
          >
            <Badge badgeContent={historyCount} color="primary" max={99}>
              <HistoryIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ width: '80%', my: 1, borderColor: 'var(--divider-color)' }} />

      {/* 历史记录Popover */}
      <Popover
        open={Boolean(historyAnchorEl)}
        anchorEl={historyAnchorEl}
        onClose={handleHistoryClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 500,
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 2,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          },
        }}
        disableRestoreFocus
      >
          {/* 搜索框 */}
          <Box sx={{ p: 2, borderBottom: '1px solid var(--divider-color)' }}>
            <Typography variant="h6" sx={{ color: 'var(--primary-text)', mb: 1 }}>
              历史记录
            </Typography>
            <TextField
              size="small"
              placeholder="搜索历史记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--icon-color)' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'var(--input-bg)',
                  borderRadius: 2,
                  '& fieldset': { border: 'none' },
                },
              }}
              sx={{
                '& .MuiInputBase-input': {
                  color: 'var(--input-text)',
                },
              }}
            />
          </Box>

          {/* 历史记录列表 */}
          <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
            {filteredHistory.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  color: 'var(--secondary-text)',
                }}
              >
                <ChatIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  {searchQuery ? '未找到匹配的记录' : '暂无历史记录'}
                </Typography>
              </Box>
            ) : (
              <List dense>
                {Object.entries(groupedHistory).map(([moduleType, histories]) => (
                  <Box key={moduleType}>
                    {/* 模块分组标题 */}
                    <ListItem
                      sx={{
                        backgroundColor: 'var(--component-card)',
                        borderBottom: '1px solid var(--divider-color)',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            fontSize: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getModuleIcon(moduleType as ModuleType)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: getModuleColor(moduleType as ModuleType),
                              fontWeight: 'bold',
                            }}
                          >
                            {moduleType === 'coding' && 'SQL编程'}
                            {moduleType === 'ER' && 'ER图建模'}
                            {moduleType === 'Bplus' && 'B+树可视化'}
                          </Typography>
                        }
                      />
                    </ListItem>

                    {/* 该模块下的历史记录 */}
                    {histories.map((history) => (
                      <ListItem key={history.id} disablePadding>
                        <ListItemButton
                          selected={currentHistoryId === history.id}
                          onClick={() => handleHistoryClick(history.id)}
                          sx={{
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              borderLeft: '3px solid',
                              borderLeftColor: 'primary.main',
                            },
                            '&:hover': {
                              backgroundColor: 'var(--hover-bg)',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <ChatIcon
                              sx={{
                                fontSize: 16,
                                color: getModuleColor(moduleType as ModuleType),
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'var(--primary-text)',
                                  fontWeight: currentHistoryId === history.id ? 'bold' : 'normal',
                                }}
                              >
                                {truncateText(history.title || '未命名对话', 20)}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{ color: 'var(--secondary-text)' }}
                              >
                                {formatTimestamp(history.timestamp)} • {history.messages.length}条消息
                              </Typography>
                            }
                          />
                          
                          {/* 操作按钮 */}
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="编辑标题">
                              <IconButton
                                size="small"
                                onClick={(e) => handleStartEditTitle(e, history.id, history.title || '')}
                                sx={{ color: 'var(--icon-color)' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteHistory(e, history.id)}
                                sx={{ color: 'var(--icon-color)' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Popover>

      {/* 底部按钮 */}
      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Divider sx={{ width: '80%', borderColor: 'var(--divider-color)' }} />
        
        {/* 设置 */}
        <Tooltip title="设置" placement="right">
          <IconButton
            onClick={onOpenSettings}
            sx={{
              color: 'var(--icon-color)',
              '&:hover': {
                backgroundColor: 'var(--button-hover)',
                color: 'var(--icon-color-hover)',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ChatSidebar;
