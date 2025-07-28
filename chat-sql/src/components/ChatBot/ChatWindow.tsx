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
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Try as AIIcon } from '@mui/icons-material';
import { ChatWindowProps, ActionConfig, Message } from '@/types/chatbot';
import { ChatMessage } from '@/types/chat';
import { AgentType } from '@/types/agents';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatSettings } from '@/contexts/ChatSettingsContext';
import { useSelection } from '@/contexts/SelectionContext';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import { useRouter } from 'next/navigation';
import { ERDiagramData } from '@/types/erDiagram';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DynamicMessageInput from './DynamicMessageInput';
import ChatSidebar from './ChatSidebar';
import SettingsModal from './SettingsModal';

/**
 * 将ChatMessage转换为MessageList组件期望的Message格式
 */
const convertChatMessagesToMessages = (chatMessages: ChatMessage[]): Message[] => {
  return chatMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.role === 'user' ? 'user' : 'ai',
    timestamp: msg.timestamp,
    metadata: msg.metadata && msg.metadata.module ? {
      module: msg.metadata.module,
      topic: msg.metadata.topic,
      action: msg.metadata.action
    } : undefined
  }));
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  position = { x: 'center', y: 'center' },
  size = { width: '60%', height: '70%' },
}) => {
  // 状态管理
  const [currentPosition, setCurrentPosition] = useState(() => {
    const parsePosition = (value: number | 'center', base: number, size: number): number => {
      if (value === 'center') {
        return Math.floor((base - size) / 2);
      }
      return value;
    };

    const baseWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const baseHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const width = typeof size.width === 'string' && size.width.endsWith('%')
      ? Math.floor(baseWidth * parseFloat(size.width) / 100)
      : typeof size.width === 'number'
        ? size.width
        : 400;
    const height = typeof size.height === 'string' && size.height.endsWith('%')
      ? Math.floor(baseHeight * parseFloat(size.height) / 100)
      : typeof size.height === 'number'
        ? size.height
        : 600;

    return {
      x: parsePosition(position.x as number | 'center', baseWidth, width),
      y: parsePosition(position.y as number | 'center', baseHeight, height),
    };
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(AgentType.CHAT);

  // 使用新的ChatContext
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    error,
    selectSession,
    createNewSession,
    sendMessage,
    sendAgentMessage,
    deleteSession,
    clearAllSessions,
    clearError,
  } = useChatContext();

  const {
    settings,
    saveSettings,
    updateWindowSize,
    getWindowSize,
  } = useChatSettings();

  // 选择状态管理
  const { setSelectedERId, setSelectedBplusId, setSelectedCodingId } = useSelection();

  // 路由管理
  const router = useRouter();

  // 从设置中获取窗口大小，支持百分比初始值
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number }>(() => {
    const baseWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const baseHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const parseSize = (value: number | string, base: number): number => {
      if (typeof value === 'string' && value.endsWith('%')) {
        const percent = parseFloat(value) / 100;
        return Math.floor(base * percent);
      }
      return typeof value === 'number' ? value : parseInt(value);
    };

    return {
      width: parseSize(size.width, baseWidth),
      height: parseSize(size.height, baseHeight),
    };
  });

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 当窗口打开时，如果没有当前会话，创建新会话
  useEffect(() => {
    if (isOpen && !currentSessionId && sessions.length === 0) {
      createNewSession();
    }
  }, [isOpen, currentSessionId, sessions.length, createNewSession]);

  // 当窗口大小变化时，保存到设置中
  useEffect(() => {
    updateWindowSize(currentSize);
  }, [currentSize]); // 移除updateWindowSize依赖，因为它现在是稳定的



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
    setIsResizing(false);
  }, []);

  // 窗口大小调整功能
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, [isFullscreen]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || isFullscreen) return;

    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newWidth = Math.max(300, e.clientX - rect.left);
    const newHeight = Math.max(400, e.clientY - rect.top);

    setCurrentSize({
      width: newWidth,
      height: newHeight,
    });
  }, [isResizing, isFullscreen]);

  // 监听鼠标移动和释放事件
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleMouseUp]);

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

  // 处理动作确认 - 智能体结果持久化与可视化系统
  const handleActionConfirm = async (action: ActionConfig) => {
    console.log('Action confirmed:', action);

    // 检查是否在客户端环境
    if (typeof window === 'undefined') return;

    try {
      // 根据action类型和目标执行相应操作
      switch (action.type) {
        case 'navigate':
          // 直接页面跳转
          router.push(action.target);
          break;

        case 'visualize':
          // 可视化操作 - 保存数据并跳转
          await handleVisualizationAction(action);
          break;

        case 'update':
          // 更新当前页面内容
          console.log('Update action:', action.params);
          break;
      }
    } catch (error) {
      console.error('执行动作失败:', error);
    }finally{
      // 关闭窗口
      onClose();
    }
  };

  // 处理可视化动作的核心逻辑
  const handleVisualizationAction = async (action: ActionConfig) => {
    const { target, params } = action;

    // 根据目标页面执行不同的保存和跳转逻辑
    switch (target) {
      case '/er-diagram':
        await handleERDiagramVisualization(params);
        break;

      case '/Bplus':
        await handleBPlusVisualization(params);
        break;

      case '/':
        await handleCodingVisualization(params);
        break;

      default:
        // 默认跳转
        router.push(`${target}?${new URLSearchParams(params || {})}`);
    }
  };

  // ER图可视化处理
  const handleERDiagramVisualization = async (params: Record<string, any> | undefined) => {
    if (!params || !params.erData) {
      console.error('ER图数据缺失');
      return;
    }

    try {
      // 动态导入 ERDiagramContext 以避免循环依赖
      const { erDiagramStorage } = await import('@/services/erDiagramStorage');

      // 解析 ER 图数据
      let erDiagramData: ERDiagramData;
      if (typeof params.erData === 'string') {
        erDiagramData = JSON.parse(params.erData);
      } else {
        erDiagramData = params.erData;
      }

      // 保存新记录并获取 ID
      const newDiagramId = await erDiagramStorage.saveDiagram(erDiagramData);

      // 更新全局选择状态
      setSelectedERId(newDiagramId);

      // 跳转到可视化页面
      router.push(`/er-diagram?id=${newDiagramId}`);

    } catch (error) {
      console.error('ER图可视化处理失败:', error);
    }
  };

  // B+树可视化处理
  const handleBPlusVisualization = async (params: Record<string, any> | undefined) => {
    if (!params) {
      console.error('B+树参数缺失');
      return;
    }

    try {
      // 动态导入 B+树历史存储服务
      const { getBPlusHistoryStorage } = await import('@/lib/bplus-tree/historyStorage');
      const historyStorage = await getBPlusHistoryStorage();

      // 创建新的 B+树会话
      const sessionData = {
        name: params.sessionName || '智能体生成的B+树',
        description: params.description || '由AI智能体自动生成',
        order: params.order || 3,
        tags: ['AI生成', '智能体'],
        steps: [],
        currentStepIndex: -1,
        isCompleted: false,
      };

      const newSessionId = await historyStorage.createSession(sessionData);

      // 更新全局选择状态
      setSelectedBplusId(newSessionId);

      // 跳转到可视化页面
      router.push(`/Bplus?sessionId=${newSessionId}`);

    } catch (error) {
      console.error('B+树可视化处理失败:', error);
    }
  };

  // 编码可视化处理
  const handleCodingVisualization = async (params: Record<string, any> | undefined) => {
    if (!params || !params.codingData) {
      console.error('编码数据缺失');
      return;
    }

    try {
      // 动态导入记录存储服务
      const { saveLLMProblem } = await import('@/services/recordsIndexDB');

      // 保存编码数据
      const newRecordId = await saveLLMProblem(params.codingData);

      // 更新全局选择状态
      setSelectedCodingId(newRecordId);

      // 跳转到主页面
      router.push(`/?recordId=${newRecordId}`);

    } catch (error) {
      console.error('编码可视化处理失败:', error);
    }
  };

  // 处理新建对话
  const handleNewChat = async () => {
    try {
      await createNewSession();
    } catch (error) {
      console.error('创建新会话失败:', error);
    }
  };

  // 处理加载历史记录（选择会话）
  const handleLoadHistory = async (historyId: string) => {
    try {
      await selectSession(historyId);
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };



  // 切换历史记录侧边栏
  const handleToggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  // 处理删除会话
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 切换最小化
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 根据智能体类型获取标题
  const getAgentTitle = (agentType: AgentType): string => {
    switch (agentType) {
      case AgentType.CHAT:
        return '对话';
      case AgentType.SCHEMA_GENERATOR:
        return 'DDL生成器';
      case AgentType.ER_GENERATOR:
        return 'ER图生成器';
      default:
        return '对话';
    }
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
            historyCount={sessions.length}
            chatHistory={sessions.map(session => ({
              id: session.id,
              timestamp: session.updatedAt,
              messages: [], // 不再在这里传递消息
              module: session.module || 'coding',
              title: session.title
            }))}
            onLoadHistory={handleLoadHistory}
            onDeleteHistory={handleDeleteSession}
            onEditHistoryTitle={() => {}} // 暂时禁用编辑标题功能
            onClearAllHistory={clearAllSessions}
            currentHistoryId={currentSessionId || undefined}
            isHistoryOpen={isHistoryOpen}
            onToggleHistory={handleToggleHistory}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
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
                  {getAgentTitle(selectedAgent)}
                </Typography>
                {isLoading && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'var(--secondary-text)' }}
                  >
                    正在思考...
                  </Typography>
                )}
                {currentSessionId && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'var(--secondary-text)' }}
                  >
                    {sessions.find(s => s.id === currentSessionId)?.title} • {messages.length} 条消息
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

            {/* 错误提示 */}
            {error && (
              <Alert
                severity="error"
                onClose={clearError}
                sx={{ m: 1 }}
              >
                {error}
              </Alert>
            )}

            {/* 聊天内容 */}
            {!isMinimized && (
              <>
                <MessageList
                  messages={convertChatMessagesToMessages(messages)}
                  isLoading={isLoading}
                  onActionConfirm={handleActionConfirm}
                />

                {/* 动态消息输入 */}
                <DynamicMessageInput
                  selectedAgent={selectedAgent}
                  onSendMessage={sendAgentMessage}
                  disabled={isLoading || !currentSessionId}
                />
              </>
            )}

            {/* 调整大小手柄 */}
            {!isFullscreen && !isMinimized && (
              <Box
                onMouseDown={handleResizeMouseDown}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  cursor: 'nw-resize',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderBottom: '8px solid var(--icon-color)',
                    opacity: 0.5,
                  },
                }}
              />
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
