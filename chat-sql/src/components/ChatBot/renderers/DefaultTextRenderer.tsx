/**
 * 默认文本渲染器组件
 * 处理普通文本内容的显示，保持现有的样式和功能
 */

import React from 'react';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { RendererProps } from '@/types/chatbot/renderers';

/**
 * 默认文本渲染器组件
 */
const DefaultTextRenderer: React.FC<RendererProps> = ({
  message,
  isUser,
  config,
  className,
  onCopy,
}) => {
  // 复制功能
  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  // 处理文本内容，支持换行和链接
  const renderTextContent = (content: string) => {
    // 简单的链接检测和渲染
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Typography
            key={index}
            component="a"
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: isUser ? 'rgba(255,255,255,0.9)' : 'var(--link-color)',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none',
              },
            }}
          >
            {part}
          </Typography>
        );
      }
      return part;
    });
  };

  return (
    <Box className={className} sx={{ position: 'relative' }}>
      {/* 复制按钮 */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity: 0,
          transition: 'opacity 0.2s',
          '&:hover': { opacity: 1 },
          '.message-bubble:hover &': { opacity: 1 },
        }}
      >
        <Tooltip title="复制文本">
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--secondary-text)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: isUser ? 'white' : 'var(--primary-text)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          fontSize: '14px',
          fontFamily: 'inherit',
          pr: 5, // 为复制按钮留出空间
        }}
      >
        {renderTextContent(message.content)}
      </Typography>
    </Box>
  );
};

export default DefaultTextRenderer;
