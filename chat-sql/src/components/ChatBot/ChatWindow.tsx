// 主聊天窗口组件

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Slide,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  DragIndicator as DragIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { ChatWindowProps, ActionConfig } from '@/types/chatbot';
import { useChat } from '@/hooks/chatbot/useChat';
import { useChatHistory } from '@/hooks/chatbot/useChatHistory';
import { useChatSettings } from '@/hooks/chatbot/useChatSettings';
import { ChatStorage } from './utils/storage';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatSidebar from './ChatSidebar';
import SettingsModal from './SettingsModal';

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  position = { x: 16, y: 16 },
  size = { width: 400, height: 600 },
}) => {
  // 状态管理
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentSize, setCurrentSize] = useState(size);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Hooks
  const {
    chatState,
    sendMessage,
    clearChat,
    setMessages,
    addWelcomeMessage,
  } = useChat();

  const {
    chatHistory,
    saveCurrentChat,
    loadHistoryById,
    deleteHistory,
    updateHistoryTitle,
  } = useChatHistory();

  const {
    settings,
    saveSettings,
  } = useChatSettings();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && chatState.currentMessages.length === 0) {
      addWelcomeMessage();
    }
  }, [isOpen, chatState.currentMessages.length, addWelcomeMessage]);

  // 保存位置和大小到本地存储
  useEffect(() => {
    ChatStorage.saveChatPosition(currentPosition);
  }, [currentPosition]);

  useEffect(() => {
    ChatStorage.saveChatSize(currentSize);
  }, [currentSize]);

  // 拖拽功能
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullscreen) return;
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, [isFullscreen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isFullscreen || typeof window === 'undefined') return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // 限制窗口不超出屏幕边界
    const maxX = window.innerWidth - currentSize.width;
    const maxY = window.innerHeight - currentSize.height;

    setCurrentPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragOffset, currentSize, isFullscreen]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 处理动作确认
  const handleActionConfirm = (action: ActionConfig) => {
    // 这里可以集成路由跳转逻辑
    console.log('Action confirmed:', action);

    // 检查是否在客户端环境
    if (typeof window === 'undefined') return;

    // 根据action类型执行相应操作
    switch (action.type) {
      case 'navigate':
        // 使用React Router进行页面跳转
        window.location.href = action.target;
        break;
      case 'visualize':
        // 跳转到可视化页面并传递参数
        window.location.href = `${action.target}?${new URLSearchParams(action.params || {})}`;
        break;
      case 'update':
        // 更新当前页面内容
        console.log('Update action:', action.params);
        break;
    }
  };

  // 处理新建对话
  const handleNewChat = () => {
    clearChat();
    addWelcomeMessage();
  };

  // 处理加载历史记录
  const handleLoadHistory = (historyId: string) => {
    const messages = loadHistoryById(historyId);
    if (messages) {
      setMessages(messages);
    }
  };

  // 处理保存当前对话
  const handleSaveCurrentChat = () => {
    if (chatState.currentMessages.length > 1) { // 至少有用户消息和AI回复
      saveCurrentChat(chatState.currentMessages);
    }
  };

  // 切换最小化
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 计算窗口样式
  const getWindowStyle = () => {
    if (isFullscreen) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1300,
      };
    }

    // 服务器端渲染时使用默认值
    if (typeof window === 'undefined') {
      return {
        position: 'fixed' as const,
        bottom: 16,
        right: 16,
        width: currentSize.width,
        height: isMinimized ? 'auto' : currentSize.height,
        zIndex: 1300,
      };
    }

    return {
      position: 'fixed' as const,
      bottom: window.innerHeight - currentPosition.y - currentSize.height,
      right: window.innerWidth - currentPosition.x - currentSize.width,
      width: currentSize.width,
      height: isMinimized ? 'auto' : currentSize.height,
      zIndex: 1300,
    };
  };

  return (
    <>
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          ref={windowRef}
          elevation={8}
          sx={{
            ...getWindowStyle(),
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: isFullscreen ? 0 : 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            cursor: isDragging ? 'grabbing' : 'default',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {/* 侧边栏 */}
          <ChatSidebar
            onNewChat={handleNewChat}
            onOpenHistory={() => {}} // 不再需要，历史记录已集成到侧边栏
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            historyCount={chatHistory.length}
            chatHistory={chatHistory}
            onLoadHistory={handleLoadHistory}
            onDeleteHistory={deleteHistory}
            onEditHistoryTitle={updateHistoryTitle}
          />

          {/* 主内容区域 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 标题栏 */}
            <Box
              ref={headerRef}
              onMouseDown={handleMouseDown}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                backgroundColor: 'var(--sidebar-bg)',
                borderBottom: '1px solid var(--sidebar-border)',
                cursor: isFullscreen ? 'default' : 'grab',
                '&:active': {
                  cursor: isFullscreen ? 'default' : 'grabbing',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography
                  variant="subtitle2"
                  sx={{ color: 'var(--primary-text)', fontWeight: 'bold' }}
                >
                  智能助手
                </Typography>
                {chatState.isLoading && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'var(--secondary-text)' }}
                  >
                    正在思考...
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {!isFullscreen && (
                  <Tooltip title={isMinimized ? '展开' : '最小化'}>
                    <IconButton
                      size="small"
                      onClick={toggleMinimize}
                      sx={{ color: 'var(--icon-color)' }}
                    >
                      <MinimizeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
                  <IconButton
                    size="small"
                    onClick={toggleFullscreen}
                    sx={{ color: 'var(--icon-color)' }}
                  >
                    {isFullscreen ? (
                      <FullscreenExitIcon fontSize="small" />
                    ) : (
                      <FullscreenIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="关闭">
                  <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ color: 'var(--icon-color)' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* 聊天内容 */}
            {!isMinimized && (
              <>
                <MessageList
                  messages={chatState.currentMessages}
                  isLoading={chatState.isLoading}
                  onActionConfirm={handleActionConfirm}
                />

                <MessageInput
                  onSendMessage={sendMessage}
                  disabled={chatState.isLoading}
                  placeholder="请输入您的问题..."
                />
              </>
            )}
          </Box>
        </Paper>
      </Slide>

      {/* 设置Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  );
};

export default ChatWindow;
