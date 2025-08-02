// 智能体消息渲染组件
import React from "react";
import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AgentOutputPart } from "@/types/chatBotTypes/agents";
import {
  renderAgentMessage,
  getOutputTypeLabel,
  isEvaluationOutput,
  hasStructuredData,
} from "@/utils/agentMessageRenderer";

interface AgentMessageRendererProps {
  output: AgentOutputPart[];
  className?: string;
}

/**
 * 智能体消息渲染组件
 * 根据AgentOutputPart[]自动渲染为合适的UI组件
 */
export const AgentMessageRenderer: React.FC<AgentMessageRendererProps> = ({
  output,
  className,
}) => {
  const messages = renderAgentMessage(output);
  const typeLabel = getOutputTypeLabel(output);
  const isEvaluation = isEvaluationOutput(output);
  const hasStructured = hasStructuredData(output);

  return (
    <Box className={className} sx={{ width: "100%" }}>
      {/* 消息类型标签 */}
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={typeLabel}
          size="small"
          color={isEvaluation ? "warning" : "primary"}
          variant="outlined"
        />
        {hasStructured && (
          <Chip
            label="结构化数据"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
      </Box>

      {/* 渲染消息列表 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((message, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: "var(--hover-bg)",
              border: "1px solid var(--border-color)",
            }}
          >
            {/* 消息标题 */}
            {message.metadata?.title && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "var(--secondary-text)",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {message.metadata.title}
                  {message.metadata.score !== undefined && (
                    <Chip
                      label={`${message.metadata.score}分`}
                      size="small"
                      color={
                        message.metadata.score >= 80
                          ? "success"
                          : message.metadata.score >= 60
                            ? "warning"
                            : "error"
                      }
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </>
            )}

            {/* 消息内容 */}
            {message.type === "text" && (
              <Typography
                variant="body1"
                sx={{
                  color: "var(--primary-text)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {message.content}
              </Typography>
            )}

            {message.type === "code" && (
              <Box
                sx={{
                  "& pre": {
                    margin: 0,
                    borderRadius: 1,
                    fontSize: "0.875rem",
                  },
                }}
              >
                <SyntaxHighlighter
                  language={message.metadata?.language || "sql"}
                  style={tomorrow}
                  customStyle={{
                    backgroundColor: "var(--code-bg)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {message.content}
                </SyntaxHighlighter>
              </Box>
            )}

            {message.type === "er-diagram" && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "var(--canvas-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="var(--secondary-text)">
                  ER图数据已生成，点击查看详情
                </Typography>
                {/* 这里可以集成ER图预览组件 */}
              </Box>
            )}

            {message.type === "evaluation" && (
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: "var(--primary-text)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.content}
                </Typography>
              </Box>
            )}

            {message.type === "suggestions" && (
              <Box>
                {Array.isArray(message.content) ? (
                  <Box
                    component="ul"
                    sx={{
                      pl: 2,
                      color: "var(--primary-text)",
                      "& li": { mb: 0.5 },
                    }}
                  >
                    {message.content.map((suggestion: string, idx: number) => (
                      <li key={idx}>
                        <Typography variant="body2">{suggestion}</Typography>
                      </li>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      color: "var(--primary-text)",
                      lineHeight: 1.6,
                    }}
                  >
                    {message.content}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default AgentMessageRenderer;
