// 消息列表组件

import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Person as UserIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { MessageListProps, Message } from '@/types/chatbot';
import { formatTimestamp } from '@/utils/chatbot/storage';
import MessageContentRenderer from './renderers/MessageContentRenderer';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 复制消息内容
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // 渲染单条消息
  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';

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
        {/* AI头像 */}
        {!isUser && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--link-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              flexShrink: 0,
            }}
          >
            <AIIcon sx={{ fontSize: 18, color: 'white' }} />
          </Box>
        )}

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

          {/* 复制按钮 */}
          <Box
            className="message-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          >
            <Tooltip title="复制消息">
              <IconButton
                size="small"
                onClick={() => {
                  const content = typeof message.content === 'string' 
                    ? message.content 
                    : JSON.stringify(message.content, null, 2);
                  handleCopyMessage(content);
                }}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                <CopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

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
                alignItems: 'center',
                justifyContent: 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--link-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  flexShrink: 0,
                }}
              >
                <AIIcon sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '16px 16px 16px 0',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
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
    </Box>
  );
};

export default MessageList;
