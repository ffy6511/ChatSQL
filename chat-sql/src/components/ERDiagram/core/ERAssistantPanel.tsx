// ER图智能助手面板组件

import React, { useState, useCallback } from 'react';
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
  History as HistoryIcon,
  Quiz as QuizIcon,
  Rule as RuleIcon,
} from '@mui/icons-material';
import { AgentType, ER_ASSISTANT_TABS, AGENTS_INFO, AgentOutputPart } from '@/types/chatBotTypes/agents';
import { useChatContext } from '@/contexts/ChatContext';
import { MessageList, DynamicMessageInput } from '@/components/ChatBot';
import { Message } from '@/types/chatBotTypes/chatbot';
import { ChatMessage } from '@/types/chat';
import HistoryModal, { HistoryRecord } from '@/components/ERDiagram/core/QuizHistoryModal';
import { useHistoryRecords } from '@/hooks/useHistoryRecords';

interface ERAssistantPanelProps {
  className?: string;
}

// 图标映射
const ICON_MAP = {
  Quiz: QuizIcon,
  Rule: RuleIcon,
};

const ERAssistantPanel: React.FC<ERAssistantPanelProps> = () => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // 使用ChatContext
  const {
    sessions,
    messages,
    isLoading,
    error,
    sendAgentMessage,
    selectSession,
    refreshSessions,
  } = useChatContext();

  // 使用历史记录hook（保留用于ER图特定的历史记录）
  const {
    recentRecords,
    loading: historyLoading,
    handleDelete: deleteHistoryRecord,
    handleRename: renameHistoryRecord,
    refreshRecords
  } = useHistoryRecords();

  // 转换ChatMessage到Message格式
  const convertChatMessagesToMessages = useCallback((chatMessages: ChatMessage[]): Message[] => {
    return chatMessages.map(msg => {
      let metadata: any = undefined;

      if (msg.metadata) {
        // 处理parts格式的metadata
        if ('type' in msg.metadata && msg.metadata.type === 'parts') {
          // 从originalOutput中提取module信息
          const originalOutput = msg.metadata.originalOutput;
          metadata = {
            module: 'ER' as const, // parts格式通常来自ER模块
            topic: 'er-generation',
            action: originalOutput?.action || undefined
          };
        } else if ('module' in msg.metadata && msg.metadata.module) {
          // 处理标准格式的metadata
          metadata = {
            module: msg.metadata.module,
            topic: msg.metadata.topic,
            action: msg.metadata.action
          };
        }
      }

      // 检查是否存在结构化输出部分
      let content: string | AgentOutputPart[] = msg.content;
      if (msg.metadata && 'type' in msg.metadata && msg.metadata.type === 'parts') {
        const parts = msg.metadata.originalOutput?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
          content = parts;
        }
      }

      return {
        id: msg.id,
        content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp,
        metadata
      };
    });
  }, []);

  // Tab切换处理
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newTabIndex: number) => {
    setActiveTabIndex(newTabIndex);
    // ER模块使用独立的消息状态，不需要会话管理
  }, []);

  // 打开历史记录模态框
  const handleHistoryClick = useCallback(() => {
    setHistoryModalOpen(true);
    refreshRecords(); // 刷新ER图特定的历史记录
    refreshSessions(); // 刷新聊天会话历史记录
  }, [refreshRecords, refreshSessions]);

  // 关闭历史记录模态框
  const handleHistoryClose = useCallback(() => {
    setHistoryModalOpen(false);
  }, []);

  // 选择历史记录
  const handleHistorySelect = useCallback(async (record: HistoryRecord) => {
    try {
      // 检查是否是聊天会话记录
      if (record.type === 'CHAT_SESSION') {
        // 加载聊天会话
        await selectSession(record.id);
        console.log('已加载聊天会话:', record.id);
      } else {
        // 处理ER图特定的历史记录
        const { getProblemById } = await import('@/services/codingStorage');
        const problem = await getProblemById(parseInt(record.id));

        if (problem) {
          console.log('加载问题成功:', problem);

          // 构造 DifyResponse 格式的数据
          const difyResponse = {
            data: {
              outputs: problem.data
            }
          };

          // 这里可以根据需要处理历史记录的加载
          console.log('历史记录数据:', difyResponse);
          // TODO: 可以在这里添加将历史记录数据加载到ER图的逻辑
        }
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
    setHistoryModalOpen(false);
  }, [selectSession]);

  // 转换历史记录格式 - 合并聊天会话和ER图记录
  const convertToHistoryRecords = useCallback((records: any[]): HistoryRecord[] => {
    // 合并聊天会话和ER图特定记录
    const chatSessions: HistoryRecord[] = sessions
      .filter(session => session.module === 'ER' || session.messageCount > 0) // 只显示ER模块或有消息的会话
      .map(session => ({
        id: session.id,
        title: session.title,
        description: `聊天会话 - ${session.messageCount} 条消息`,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        type: 'CHAT_SESSION' as const,
        metadata: { module: session.module },
      }));

    const erRecords: HistoryRecord[] = records.map(record => ({
      id: record.id.toString(),
      title: record.title || '未命名记录',
      description: record.description,
      createdAt: new Date(record.createdAt),
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
      type: record.type || 'ER',
      metadata: record.metadata,
    }));

    // 合并并按更新时间排序
    const allRecords = [...chatSessions, ...erRecords];
    return allRecords.sort((a, b) => {
      const timeA = a.updatedAt?.getTime() || a.createdAt.getTime();
      const timeB = b.updatedAt?.getTime() || b.createdAt.getTime();
      return timeB - timeA; // 降序排列，最新的在前
    });
  }, [sessions]);

  // 删除历史记录包装函数
  const handleHistoryDelete = useCallback((recordId: string) => {
    deleteHistoryRecord(parseInt(recordId));
  }, [deleteHistoryRecord]);

  // 重命名历史记录包装函数
  const handleHistoryRename = useCallback((recordId: string, newTitle: string) => {
    renameHistoryRecord(parseInt(recordId), newTitle);
  }, [renameHistoryRecord]);

  // 消息发送处理 - 直接传递给ChatContext处理
  const handleSendMessage = useCallback(async (agentType: string, inputValues: Record<string, string>): Promise<AgentOutputPart[] | null> => {
    try {
      // 直接发送消息到智能体，让ChatContext处理所有逻辑
      return await sendAgentMessage(agentType as AgentType, inputValues);
    } catch (error) {
      console.error('发送消息失败:', error);
      return null;
    }
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
            width: '50%',
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
          {ER_ASSISTANT_TABS.map((tab) => (
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
            <IconButton
              size="small"
              sx={{ color: 'var(--secondary-text)' }}
              onClick={handleHistoryClick}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 内容区域 */}
      <Collapse in={true} timeout={200}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 200px)', // 动态高度
            minHeight: 300,
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
            />
          </Box>

          {/* 输入区域 */}
          <Box
            sx={{
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

      {/* 历史记录模态框 */}
      <HistoryModal
        open={historyModalOpen}
        onClose={handleHistoryClose}
        title="历史会话"
        records={convertToHistoryRecords(recentRecords)}
        loading={historyLoading}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
        onEdit={handleHistoryRename}
        searchPlaceholder="搜索历史会话..."
        emptyMessage="暂无历史会话"
      />
    </Paper>
  );
};

export default ERAssistantPanel;
