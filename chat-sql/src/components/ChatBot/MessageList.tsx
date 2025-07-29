// 消息列表组件

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Person as UserIcon,
  Launch as LaunchIcon,
  Visibility as VisualizeIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { MessageListProps, Message, ActionConfig } from '@/types/chatbot';
import { formatTimestamp } from '@/utils/chatbot/storage';
import MessageContentRenderer from './renderers/MessageContentRenderer';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onActionConfirm,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionConfig | null;
    message: string;
  }>({
    open: false,
    action: null,
    message: '',
  });

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 处理动作确认
  const handleActionClick = (action: ActionConfig) => {
    const actionMessages = {
      navigate: `确定要跳转到 ${action.target} 页面吗？`,
      visualize: `确定要在 ${action.target} 中进行可视化操作吗？`,
      update: `确定要更新 ${action.target} 的内容吗？`,
    };

    setConfirmDialog({
      open: true,
      action,
      message: actionMessages[action.type] || '确定要执行此操作吗？',
    });
  };

  // 确认执行动作
  const handleConfirmAction = () => {
    if (confirmDialog.action && onActionConfirm) {
      onActionConfirm(confirmDialog.action);
    }
    setConfirmDialog({ open: false, action: null, message: '' });
  };

  // 取消动作
  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: null, message: '' });
  };

  // 复制消息内容
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // 获取动作图标
  const getActionIcon = (type: ActionConfig['type']) => {
    switch (type) {
      case 'navigate':
        return <LaunchIcon fontSize="small" />;
      case 'visualize':
        return <VisualizeIcon fontSize="small" />;
      case 'update':
        return <UpdateIcon fontSize="small" />;
      default:
        return <LaunchIcon fontSize="small" />;
    }
  };

  // 获取模块标签颜色
  const getModuleChipColor = (module: string) => {
    switch (module) {
      case 'coding':
        return 'primary';
      case 'ER':
        return 'secondary';
      case 'Bplus':
        return 'success';
      default:
        return 'default';
    }
  };

  // 渲染单条消息
  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const hasAction = message.metadata?.action;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          mb: 2,
          alignItems: 'flex-start',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* 消息内容 */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser ? 'var(--link-color)' : 'var(--card-bg)',
            borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
            border: '1px solid var(--card-border)',
            position: 'relative',
            '&:hover .message-actions': {
              opacity: 1,
            },
            flexGrow: 1,
            maxWidth: '90%',
            marginLeft: isUser? 'auto': 0,
            marginRight: isUser? 0: 'auto',
          }}
        >
          {/* 消息内容渲染 */}
          <MessageContentRenderer
            message={message}
            isUser={isUser}
            onCopy={handleCopyMessage}
          />

          {/* 模块标签 */}
          {!isUser && message.metadata?.module && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={message.metadata.module}
                size="small"
                color={getModuleChipColor(message.metadata.module) as any}
                variant="outlined"
              />
              {message.metadata.topic && (
                <Chip
                  label={message.metadata.topic}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 0.5 }}
                />
              )}
            </Box>
          )}

          {/* 动作按钮 */}
          {hasAction && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={getActionIcon(message.metadata!.action!.type)}
                onClick={() => handleActionClick(message.metadata!.action!)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                {message.metadata!.action!.type === 'navigate' && '跳转页面'}
                {message.metadata!.action!.type === 'visualize' && '开始可视化'}
                {message.metadata!.action!.type === 'update' && '更新内容'}
              </Button>
            </Box>
          )}



          {/* 时间戳 */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--secondary-text)',
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </Paper>

        {/* 用户头像 */}
        {isUser && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--secondary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 1,
              flexShrink: 0,
            }}
          >
            <UserIcon sx={{ fontSize: 18, color: 'white' }} />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 消息列表 */}
      {messages.length === 0 && !isLoading ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="body2" color="var(--secondary-text)">
              有什么可以帮您？
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {messages.map(renderMessage)}
          
          {/* 加载指示器 */}
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                }}
              >
                <AIIcon sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: 'grey.100',
                  borderRadius: '16px 16px 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  flexGrow: 1,
                }}
              >
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="var(--secondary-text)">
                  正在思考...
                </Typography>
              </Paper>
            </Box>
          )}
        </>
      )}

      {/* 滚动锚点 */}
      <div ref={messagesEndRef} />

      {/* 动作确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认操作</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
          {confirmDialog.action?.params && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="var(--secondary-text)">
                参数：
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontSize: '12px',
                  mt: 0.5,
                  backgroundColor: 'var(--code-bg)',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(confirmDialog.action.params, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>取消</Button>
          <Button onClick={handleConfirmAction} variant="contained">
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageList;
