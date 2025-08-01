/**
 * 处理 Markdown 格式文本内容的显示
 */

import React from 'react';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { RendererProps } from '@/types/chatBotTypes/renderers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer: React.FC<RendererProps> = ({
  message,
  isUser,
  config,
  className,
  onCopy,
}) => {
  // 复制功能
  const handleCopy = () => {
    const contentStr = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);

    if (onCopy) {
      onCopy(contentStr);
    } else {
      navigator.clipboard.writeText(contentStr);
    }
  };

  // 渲染 Markdown 内容
  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({node, ...props}) => (
          <Typography
            component="a"
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: isUser ? 'rgba(255,255,255,0.9)' : 'var(--link-color)',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none',
              },
            }}
          />
        ),
        p: ({node, ...props}) => (
          <Typography component="div" {...props} />
        ),
        code: ({node, ...props}) => (
          <Typography 
            component="code" 
            {...props}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }}
          />
        ),
        pre: ({node, ...props}) => (
          <Box 
            component="pre" 
            {...props}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '1em',
              borderRadius: '4px',
              overflow: 'auto',
              margin: '1em 0'
            }}
          />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );

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
        {renderMarkdown(typeof message.content === 'string' ? message.content : JSON.stringify(message.content))}
      </Typography>
    </Box>
  );
};

export default MarkdownRenderer;
