// 消息输入组件

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import { MessageInputProps } from '@/types/chatbot';

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = '请输入...',
}) => {
  const [message, setMessage] = useState('');
  const textFieldRef = useRef<HTMLInputElement>(null);

  // 处理发送消息
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');
    
    // 重新聚焦输入框
    setTimeout(() => {
      textFieldRef.current?.focus();
    }, 100);
  };

  // 处理键盘事件
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };



  // 自动调整文本框高度
  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.style.height = 'auto';
      textFieldRef.current.style.height = `${Math.min(textFieldRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
      }}
    >
      {/* 输入区域 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--input-bg)',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'var(--input-border)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& .MuiInputBase-input': {
              color: 'var(--input-text)',
              '&::placeholder': {
                color: 'var(--secondary-text)',
                opacity: 1,
              },
            },
          }}
        />

        {/* 发送按钮 */}
        <Tooltip title="发送 (Enter)">
          <IconButton
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            color="primary"
            sx={{
              backgroundColor: message.trim() ? 'primary.main' : 'grey.300',
              color: 'white',
              '&:hover': {
                backgroundColor: message.trim() ? 'primary.dark' : 'grey.400',
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default MessageInput;
