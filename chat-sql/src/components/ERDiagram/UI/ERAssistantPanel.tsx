// ER图智能助手面板组件

import React, { useState, useCallback, useEffect } from 'react';
import {
  Paper,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  Collapse,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Quiz as QuizIcon,
  Rule as RuleIcon,
} from '@mui/icons-material';
import { AgentType, ER_ASSISTANT_TABS, AGENTS_INFO } from '@/types/agents';
import { useChatContext } from '@/contexts/ChatContext';
import { MessageList, DynamicMessageInput } from '@/components/ChatBot';
import { Message } from '@/types/chatbot';
import { ChatMessage } from '@/types/chat';

interface ERAssistantPanelProps {
  className?: string;
}

// 图标映射
const ICON_MAP = {
  Quiz: QuizIcon,
  Rule: RuleIcon,
};

const ERAssistantPanel: React.FC<ERAssistantPanelProps> = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [sessionIds, setSessionIds] = useState<Partial<Record<AgentType, string>>>({});

  // 使用ChatContext
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    error,
    selectSession,
    createNewSession,
    sendAgentMessage,
    clearError,
  } = useChatContext();

  // 转换ChatMessage到Message格式
  const convertChatMessagesToMessages = useCallback((chatMessages: ChatMessage[]): Message[] => {
    return chatMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: msg.timestamp,
      metadata: msg.metadata ? {
        module: msg.metadata.module || 'ER',
        topic: msg.metadata.topic,
        action: msg.metadata.action,
      } : undefined,
    }));
  }, []);

  // Tab切换处理
  const handleTabChange = useCallback(async (event: React.SyntheticEvent, newTabIndex: number) => {
    const agentType = ER_ASSISTANT_TABS[newTabIndex].agentType;
    let sessionId = sessionIds[agentType];
    
    if (!sessionId) {
      // 创建新会话
      await createNewSession();
      // 获取新创建的会话ID
      const newSessionId = currentSessionId;
      if (newSessionId) {
        sessionId = newSessionId;
        setSessionIds(prev => ({ ...prev, [agentType]: sessionId }));
      }
    }

    // 选择会话
    if (sessionId) {
      await selectSession(sessionId);
    }
    setActiveTabIndex(newTabIndex);
  }, [sessionIds, createNewSession, selectSession]);

  // 收起/展开处理
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 消息发送处理
  const handleSendMessage = useCallback(async (agentType: string, inputValues: Record<string, string>) => {
    await sendAgentMessage(agentType as AgentType, inputValues);
  }, [sendAgentMessage]);

  // 获取当前激活的智能体类型
  const currentAgentType = ER_ASSISTANT_TABS[activeTabIndex]?.agentType || AgentType.ER_QUIZ_GENERATOR;

  // 获取图标组件
  const getTabIcon = (agentType: AgentType) => {
    const agentInfo = AGENTS_INFO[agentType];
    const IconComponent = ICON_MAP[agentInfo.icon as keyof typeof ICON_MAP];
    return IconComponent ? <IconComponent fontSize="small" /> : null;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* 头部 - Tab导航栏 */}
      <Box
        sx={{
          borderBottom: '1px solid var(--card-border)',
          backgroundColor: 'var(--header-bg)',
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Tabs
          value={activeTabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            flex: 1,
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'var(--secondary-text)',
              '&.Mui-selected': {
                color: 'var(--primary-text)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--link-color)',
            },
          }}
        >
          {ER_ASSISTANT_TABS.map((tab, index) => (
            <Tab
              key={tab.agentType}
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {getTabIcon(tab.agentType)}
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    {tab.label}
                  </Typography>
                </Stack>
              }
            />
          ))}
        </Tabs>

        {/* 右侧按钮组 */}
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <Tooltip title="历史记录">
            <IconButton size="small" sx={{ color: 'var(--secondary-text)' }}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isExpanded ? '收起' : '展开'}>
            <IconButton
              size="small"
              onClick={handleToggleExpanded}
              sx={{ color: 'var(--secondary-text)' }}
            >
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 内容区域 */}
      <Collapse in={isExpanded} timeout={200}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: isExpanded ? 'calc(100vh - 200px)' : 0, // 动态高度
            minHeight: isExpanded ? 300 : 0,
          }}
        >
          {/* 消息列表 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MessageList
              messages={convertChatMessagesToMessages(messages)}
              isLoading={isLoading}
              onActionConfirm={() => {}} // 暂时空实现
            />
          </Box>

          {/* 输入区域 */}
          <Box
            sx={{
              // borderTop: '1px solid var(--card-border)',
              backgroundColor: 'var(--input-bg)',
              p: 1,
              flexShrink: 0,
            }}
          >
            <DynamicMessageInput
              selectedAgent={currentAgentType}
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ERAssistantPanel;
