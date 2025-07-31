/**
 * JSON 渲染器组件
 * 专注于 JSON 数据的格式化显示和语法高亮，使用 GitHub 风格的高亮主题
 */

import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github, githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Code as CodeIcon,
  Visibility as VisualizeIcon,
} from '@mui/icons-material';
import { RendererProps, JsonRendererConfig } from '@/types/chatBotTypes/renderers';
import { visualize } from '@/services/visualizationService';

/**
 * JSON 渲染器组件 - 专注于 JSON 格式化和语法高亮
 */
const JsonRenderer: React.FC<RendererProps> = ({
  message,
  isUser,
  config,
  className,
  onCopy,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // 合并配置
  const jsonConfig = useMemo(() => {
    const defaultConfig: JsonRendererConfig = {
      type: 'json',
      enableSyntaxHighlight: true,
      theme: 'auto',
      showLineNumbers: true,
      copyable: true,
      indent: 2,
      collapsed: false,
      maxDepth: 10,
    };
    return { ...defaultConfig, ...config } as JsonRendererConfig;
  }, [config]);

  // 提取和处理 JSON 内容
  const processedJson = useMemo(() => {
    // 确保内容是字符串类型
    let jsonString = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content, null, 2);

    // 如果包含代码块，提取其中的 JSON
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonString.match(codeBlockRegex);
    if (match) {
      jsonString = match[1].trim();
    }

    // 尝试解析 JSON
    let parsedJson = null;
    let isValid = false;

    try {
      parsedJson = JSON.parse(jsonString);
      isValid = true;
    } catch (error) {
      // 如果解析失败，尝试修复常见问题
      try {
        const cleanedJson = jsonString
          .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
          .replace(/\/\/.*$/gm, '') // 移除行注释
          .replace(/'/g, '"'); // 修复单引号
        parsedJson = JSON.parse(cleanedJson);
        jsonString = cleanedJson;
        isValid = true;
      } catch (secondError) {
        // 如果仍然失败，保持原始内容
        isValid = false;
      }
    }

    return {
      json: jsonString,
      parsedJson,
      isValid
    };
  }, [message.content]);

  // 检测是否为ER图数据
  const isERDiagramData = useMemo(() => {
    if (!processedJson.isValid || !processedJson.parsedJson) return false;

    const data = processedJson.parsedJson;
    // 检查是否包含ER图的基本结构
    return (
      data &&
      typeof data === 'object' &&
      (data.entities || data.relationships ||
       (Array.isArray(data) && data.some((item: any) =>
         item && (item.entities || item.relationships || item.type === 'entity' || item.type === 'relationship')
       )))
    );
  }, [processedJson]);

  // 格式化 JSON
  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, jsonConfig.indent);
    } catch (error) {
      return JSON.stringify(obj);
    }
  };

  // 处理可视化 - 使用全局服务
  const handleVisualize = () => {
    if (processedJson.isValid && processedJson.parsedJson) {
      visualize(processedJson.parsedJson, 'er-diagram');
    }
  };

  // 截断深层对象
  const truncateDeepObject = (obj: any, currentDepth = 0): any => {
    if (currentDepth >= (jsonConfig.maxDepth || 10)) {
      return '[Object too deep]';
    }

    if (Array.isArray(obj)) {
      return obj.map(item => truncateDeepObject(item, currentDepth + 1));
    } else if (obj !== null && typeof obj === 'object') {
      const truncated: any = {};
      Object.keys(obj).forEach(key => {
        truncated[key] = truncateDeepObject(obj[key], currentDepth + 1);
      });
      return truncated;
    }

    return obj;
  };

  const { json, parsedJson, isValid } = processedJson;

  // 选择主题 - 使用 GitHub 风格
  const getTheme = () => {
    if (jsonConfig.theme === 'light') return github;
    if (jsonConfig.theme === 'dark') return githubGist;
    // auto: 根据用户消息类型选择
    return isUser ? githubGist : github;
  };

  // 处理复制
  const handleCopy = () => {
    const contentToCopy = showRaw ? json : (isValid ? formatJson(parsedJson) : json);
    if (onCopy) {
      onCopy(contentToCopy);
    } else {
      navigator.clipboard.writeText(contentToCopy);
    }
  };

  // 准备显示的 JSON 内容
  const displayJson = isValid ?
    (showRaw ? json : formatJson(truncateDeepObject(parsedJson))) :
    json;

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
        {/* 控制栏 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'var(--secondary-text)' }}>
            JSON {isValid ? '(有效)' : '(格式错误)'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* 展开/折叠按钮 */}
            <Tooltip title={isExpanded ? "折叠" : "展开"}>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  color: 'var(--icon-color)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* 原始/格式化切换 */}
            {isValid && (
              <Tooltip title={showRaw ? "显示格式化" : "显示原始"}>
                <IconButton
                  size="small"
                  onClick={() => setShowRaw(!showRaw)}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    color: 'var(--icon-color)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <CodeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* 可视化按钮 */}
            {isERDiagramData && (
              <Tooltip title="可视化 ER 图">
                <IconButton
                  size="small"
                  onClick={handleVisualize}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    color: 'var(--icon-color)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <VisualizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* 复制按钮 */}
            {jsonConfig.copyable && (
              <Tooltip title="复制 JSON">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    color: 'var(--icon-color)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* JSON 内容 */}
        <Collapse in={isExpanded}>
          <SyntaxHighlighter
            language="json"
            style={getTheme()}
            showLineNumbers={jsonConfig.showLineNumbers}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: '16px',
              backgroundColor: 'transparent',
              fontSize: '14px',
              fontFamily: 'Maple Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
            }}
          >
            {displayJson}
          </SyntaxHighlighter>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default JsonRenderer;