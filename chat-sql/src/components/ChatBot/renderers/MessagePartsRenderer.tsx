// 基于类型数组的消息部分渲染器 - 简化版本
import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert, ContentCopy, Visibility } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AgentOutputPart } from '@/types/agents';
import { visualize } from '@/services/visualizationService';
import JsonRenderer from './JsonRenderer';
import SqlRenderer from './SqlRenderer';

interface MessagePartsRendererProps {
  parts: AgentOutputPart[];
}

/**
 * 操作菜单组件
 */
const ActionMenu: React.FC<{
  content: any;
  isERDiagram?: boolean;
  contentType?: 'text' | 'sql' | 'json';
}> = ({ content, isERDiagram, contentType }) => {
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
    // 根据内容类型确定可视化类型
    const visualizeType = isERDiagram ? 'er-diagram' : (contentType === 'sql' ? 'sql' : 'er-diagram');
    visualize(content, visualizeType);
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
        {(isERDiagram || contentType === 'sql') && (
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
  parts
}) => {
  // 渲染单个部分
  const renderPart = (part: AgentOutputPart, index: number) => {
    const { type, content, metadata } = part;

    // 创建模拟的Message对象供渲染器使用
    const mockMessage = {
      id: `part-${index}`,
      content: content,
      role: 'assistant' as const,
      sender: 'ai' as const,
      timestamp: new Date().toISOString(),
    };

    switch (type) {
      case 'text':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'var(--primary-text)' }}>
              {content}
            </Typography>
          </Box>
        );

      case 'sql':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <SqlRenderer
              message={mockMessage}
              isUser={false}
            />
          </Box>
        );

      case 'json':
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <JsonRenderer
              message={mockMessage}
              isUser={false}
            />
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
            <ActionMenu content={content} contentType="text" />
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
