// 基于类型数组的消息部分渲染器 - 简化版本
import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert, ContentCopy, Visibility } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AgentOutputPart } from '@/types/agents';

interface MessagePartsRendererProps {
  parts: AgentOutputPart[];
  onVisualize?: (data: any) => void;
}

/**
 * 操作菜单组件
 */
const ActionMenu: React.FC<{
  content: any;
  onVisualize?: (data: any) => void;
  isERDiagram?: boolean;
}> = ({ content, onVisualize, isERDiagram }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(textContent);
    handleClose();
  };

  const handleVisualize = () => {
    if (onVisualize) {
      onVisualize(content);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip title="操作">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{ ml: 1 }}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCopy}>
          <ContentCopy sx={{ mr: 1 }} />
          复制
        </MenuItem>
        {(isERDiagram || onVisualize) && (
          <MenuItem onClick={handleVisualize}>
            <Visibility sx={{ mr: 1 }} />
            可视化
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

/**
 * 基于类型数组的消息部分渲染器 - 简化版本
 */
export const MessagePartsRenderer: React.FC<MessagePartsRendererProps> = ({
  parts,
  onVisualize
}) => {
  // 渲染单个部分
  const renderPart = (part: AgentOutputPart, index: number) => {
    const { type, content, metadata } = part;

    switch (type) {
      case 'text':
        return (
          <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {content}
              </Typography>
            </Box>
            <ActionMenu content={content} onVisualize={onVisualize} />
          </Box>
        );

      case 'sql':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Paper elevation={1} sx={{ overflow: 'hidden' }}>
                  <SyntaxHighlighter
                    language={metadata?.language || 'sql'}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {content}
                  </SyntaxHighlighter>
                </Paper>
              </Box>
              <ActionMenu content={content} onVisualize={onVisualize} />
            </Box>
          </Box>
        );

      case 'json':
        const isERDiagram = metadata?.dataType === 'er-diagram';
        return (
          <Box key={index} sx={{ mb: 2 }}>
            {isERDiagram && (
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--secondary-text)' }}>
                ER图数据
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Paper elevation={1} sx={{ overflow: 'hidden' }}>
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </SyntaxHighlighter>
                </Paper>
              </Box>
              <ActionMenu
                content={content}
                onVisualize={onVisualize}
                isERDiagram={isERDiagram}
              />
            </Box>
          </Box>
        );



      default:
        // 未知类型，作为文本处理
        return (
          <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">
                {typeof content === 'string' ? content : JSON.stringify(content)}
              </Typography>
            </Box>
            <ActionMenu content={content} onVisualize={onVisualize} />
          </Box>
        );
    }
  };

  return (
    <Box>
      {parts.map((part, index) => renderPart(part, index))}
    </Box>
  );
};

export default MessagePartsRenderer;
