// 消息列表组件

import React, { use, useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import {
  SmartToy as AIIcon,
  Person as UserIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { MessageListProps, Message } from "@/types/chatBotTypes/chatbot";
import { formatTimestamp } from "@/utils/chatbot/storage";
import MessageContentRenderer from "./renderers/MessageContentRenderer";
import ShinyText from "@/components/common/ShinyText";
import { chatLoadingTips } from "@/data/chatLoadingTips";
import styles from "./MessageList.module.css";

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载tips的状态
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setCurrentTip(
        chatLoadingTips[Math.floor(Math.random() * chatLoadingTips.length)]
      );

      timer = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 1;
          if (next % 5 === 0) {
            setCurrentTip(
              chatLoadingTips[
                Math.floor(Math.random() * chatLoadingTips.length)
              ]
            );
          }
          return next;
        });
      }, 1000);
    } else {
      setElapsedTime(0);
      return;
    }

    return () => {
      clearInterval(timer);
      setElapsedTime(0);
    };
  }, [isLoading]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 复制消息内容
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // 渲染单条消息
  const renderMessage = (message: Message) => {
    const isUser = message.sender === "user";

    return (
      <Box
        key={message.id}
        sx={{
          display: "flex",
          mb: 1,
          alignItems: "flex-start",
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        {/* AI头像 */}
        {!isUser && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--link-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1,
              flexShrink: 0,
            }}
          >
            <AIIcon sx={{ fontSize: 18, color: "white" }} />
          </Box>
        )}

        {/* 消息内容 */}
        <Paper
          elevation={1}
          className={isUser ? styles.userMessage : styles.aiMessage}
          sx={{
            p: "4px",
            borderRadius: "16px",
            position: "relative",
            "&:hover .message-actions": {
              opacity: 1,
            },
            maxWidth: "80%",
            alignSelf: isUser ? "flex-end" : "flex-start",
            wordBreak: "break-word",
          }}
        >
          {/* 消息内容渲染 */}
          <MessageContentRenderer
            message={message}
            isUser={isUser}
            onCopy={handleCopyMessage}
          />

          {/* 时间戳 */}
          <Typography
            variant='caption'
            sx={{
              display: "block",
              mt: 1,
              color: "var(--secondary-text)",
              textAlign: isUser ? "left" : "right",
              mr: isUser ? 0 : 1,
              ml: isUser ? 1 : 0,
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 消息列表 */}
      {messages.length === 0 && !isLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography variant='h6' color='var(--secondary-text)'>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--link-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1,
                  flexShrink: 0,
                }}
              >
                <AIIcon sx={{ fontSize: 18, color: "white" }} />
              </Box>

              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: "var(--card-bg)",
                  borderRadius: "16px 16px 16px 0",
                  border: "1px solid var(--card-border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ShinyText text='正在思考中...' speed={3} />
                  <Typography variant='body2' color='var(--secondary-text)'>
                    {elapsedTime}s
                  </Typography>
                </Box>
                <Typography
                  variant='caption'
                  color='var(--secondary-text)'
                  sx={{ mt: 1 }}
                >
                  {currentTip}
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
