/**
 * SQL 语法高亮渲染器组件
 * 专注于 SQL 语法高亮渲染，使用 GitHub 风格的高亮主题
 */

import React, { useMemo } from 'react';
import { Box, Paper, IconButton, Tooltip } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github, githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { RendererProps, SqlRendererConfig } from '@/types/chatbot/renderers';

/**
 * SQL 渲染器组件 - 专注于 SQL 语法高亮渲染
 */
const SqlRenderer: React.FC<RendererProps> = ({
  message,
  isUser,
  config,
  className,
  onCopy,
}) => {
  // 类型安全的配置获取
  const sqlConfig = useMemo(() => {
    const defaultConfig: SqlRendererConfig = {
      type: 'sql',
      enableSyntaxHighlight: true,
      theme: 'auto',
      showLineNumbers: true,
      copyable: true,
      formatSql: true,
      keywordCase: 'upper',
    };
    return { ...defaultConfig, ...config } as SqlRendererConfig;
  }, [config]);

  // 提取和处理 SQL 内容
  const processedSql = useMemo(() => {
    let sql = message.content;

    // 如果包含代码块，提取其中的 SQL
    const codeBlockRegex = /```sql\s*([\s\S]*?)\s*```/;
    const match = sql.match(codeBlockRegex);
    if (match) {
      sql = match[1].trim();
    }

    // 格式化 SQL 关键词
    if (sqlConfig.formatSql && sqlConfig.keywordCase === 'upper') {
      sql = sql
        .replace(/\bSELECT\b/gi, 'SELECT')
        .replace(/\bFROM\b/gi, 'FROM')
        .replace(/\bWHERE\b/gi, 'WHERE')
        .replace(/\bINSERT\b/gi, 'INSERT')
        .replace(/\bINTO\b/gi, 'INTO')
        .replace(/\bUPDATE\b/gi, 'UPDATE')
        .replace(/\bSET\b/gi, 'SET')
        .replace(/\bDELETE\b/gi, 'DELETE')
        .replace(/\bCREATE\b/gi, 'CREATE')
        .replace(/\bTABLE\b/gi, 'TABLE')
        .replace(/\bDROP\b/gi, 'DROP')
        .replace(/\bALTER\b/gi, 'ALTER')
        .replace(/\bJOIN\b/gi, 'JOIN')
        .replace(/\bINNER JOIN\b/gi, 'INNER JOIN')
        .replace(/\bLEFT JOIN\b/gi, 'LEFT JOIN')
        .replace(/\bRIGHT JOIN\b/gi, 'RIGHT JOIN')
        .replace(/\bORDER BY\b/gi, 'ORDER BY')
        .replace(/\bGROUP BY\b/gi, 'GROUP BY')
        .replace(/\bHAVING\b/gi, 'HAVING');
    }

    return sql;
  }, [message.content, sqlConfig.formatSql, sqlConfig.keywordCase]);

  // 获取主题 - 使用 GitHub 风格
  const getTheme = () => {
    if (sqlConfig.theme === 'dark') return githubGist;
    if (sqlConfig.theme === 'light') return github;
    // auto: 根据用户消息类型选择
    return isUser ? githubGist : github;
  };

  // 复制功能
  const handleCopy = () => {
    if (onCopy) {
      onCopy(processedSql);
    } else {
      navigator.clipboard.writeText(processedSql);
    }
  };

  return (
    <Box className={className}>
      <Paper
        elevation={1}
        sx={{
          position: 'relative',
          backgroundColor: 'var(--code-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* 复制按钮 */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
            '.message-bubble:hover &': { opacity: 1 },
          }}
        >
          <Tooltip title="复制 SQL">
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

        {/* SQL 语法高亮 */}
        <SyntaxHighlighter
          language="sql"
          style={getTheme()}
          showLineNumbers={sqlConfig.showLineNumbers}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: '16px',
            paddingTop: '40px', // 为复制按钮留出空间
            backgroundColor: 'transparent',
            fontSize: '14px',
            fontFamily: ' Maple Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
          }}
        >
          {processedSql}
        </SyntaxHighlighter>
      </Paper>
    </Box>
  );
};

export default SqlRenderer;