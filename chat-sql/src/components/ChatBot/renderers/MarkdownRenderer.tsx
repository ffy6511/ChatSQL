import React from 'react';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { RendererProps } from '@/types/chatBotTypes/renderers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer: React.FC<RendererProps> = ({
  message,
  isUser,
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

  const contentStr = typeof message.content === 'string'
    ? message.content
    : JSON.stringify(message.content);

  return (
    <Box className={className} sx={{ position: 'relative', pr: 5, fontFamily: 'inherit' }}>
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
        <Tooltip title="Copy">
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

      <Box sx={{
        color: 'var(--primary-text)',
        wordBreak: 'break-word',
        fontSize: '14px',
        lineHeight: 1.5,
        pl: 2,
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontWeight: 600,
          marginTop: '1em',
          marginBottom: '0.4em',
        },
        '& h1': { fontSize: '1.5em' },
        '& h2': { fontSize: '1.35em' },
        '& h3': { fontSize: '1.2em' },
        '& p': {
          // 大幅减小段落的垂直边距，解决间隔过大的问题
          marginBlockStart: '0.2em',
          marginBlockEnd: '0.2em',
        },
        
        '& ul, & ol': {
          paddingLeft: '1em',
          // 减小整个列表的垂直边距
          marginBlockStart: '0.2em',
          marginBlockEnd: '0.4em', // 列表结束后可以稍微多留一点空间
        },
        '& ul': {
          listStyleType: 'disc',
        },
        '& ol': {
          listStyleType: 'decimal',
        },
        '& li': {
          marginBlockStart: '0.1em',
          marginBlockEnd: '0.1em',
        },
        '& a': {
          color: 'var(--link-color)',
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'none',
          },
        },
        '& code': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          padding: '0.2em 0.4em',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
        '& pre': {
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '1em',
          borderRadius: '4px',
          overflow: 'auto',
          margin: '1em 0',
        },
        '& pre code': {
          padding: 0,
          backgroundColor: 'transparent',
          fontSize: 'inherit',
        }
      }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {contentStr}
        </ReactMarkdown>
      </Box>
    </Box>
  );
};

export default MarkdownRenderer;