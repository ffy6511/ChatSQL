// 聊天状态管理Hook - 集成百炼平台API

import { useState, useCallback, useRef } from "react";
import {
  ChatState,
  Message,
  DEFAULT_CHAT_STATE,
} from "@/types/chatBotTypes/chatbot";
import {
  StreamChatResponse,
  ChatRequest,
} from "@/types/chatBotTypes/bailianai";
import { generateId, ChatStorage } from "@/utils/chatbot/storage";
import { useChatSettings } from "@/contexts/ChatSettingsContext";

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>(DEFAULT_CHAT_STATE);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { settings } = useChatSettings();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== 基于会话的方法 =====

  /**
   * 创建新会话
   */
  const createNewSession = useCallback(async (): Promise<string> => {
    try {
      // 创建新会话（不包含欢迎消息）
      const newSessionId = await ChatStorage.createSession([]);

      // 更新当前会话ID
      setCurrentSessionId(newSessionId);

      // 清空当前消息
      setChatState((prev) => ({
        ...prev,
        currentMessages: [],
        error: null,
      }));

      console.log("新会话已创建:", newSessionId);
      return newSessionId;
    } catch (error) {
      console.error("创建新会话失败:", error);
      throw error;
    }
  }, []);

  /**
   * 选择并加载指定会话
   */
  const selectSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        const session = await ChatStorage.getSession(sessionId);
        if (session) {
          setCurrentSessionId(sessionId);
          setChatState((prev) => ({
            ...prev,
            currentMessages: session.messages,
            error: null,
          }));
          console.log(
            "会话已加载:",
            sessionId,
            `消息数量: ${session.messages.length}`,
          );
        } else {
          throw new Error(`会话不存在: ${sessionId}`);
        }
      } catch (error) {
        console.error("加载会话失败:", error);
        setChatState((prev) => ({
          ...prev,
          error: "加载会话失败",
        }));
      }
    },
    [],
  );

  /**
   * 更新当前会话的消息
   */
  const updateCurrentSession = useCallback(
    async (messages: Message[]): Promise<void> => {
      if (!currentSessionId) {
        console.warn("没有当前会话ID，无法更新会话");
        return;
      }

      try {
        await ChatStorage.updateSession(currentSessionId, messages);
        console.log(
          "会话已更新:",
          currentSessionId,
          `消息数量: ${messages.length}`,
        );
      } catch (error) {
        console.error("更新会话失败:", error);
      }
    },
    [currentSessionId],
  );

  /**
   * 确保有当前会话（如果没有则创建新会话）
   */
  const ensureCurrentSession = useCallback(async (): Promise<string> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    // 创建新会话
    const newSessionId = await createNewSession();
    return newSessionId;
  }, [currentSessionId, createNewSession]);

  /**
   * 发送非流式消息
   */
  const sendNonStreamMessage = useCallback(
    async (content: string): Promise<void> => {
      try {
        // 确保有当前会话
        const sessionId = await ensureCurrentSession();

        // 创建用户消息
        const userMessage: Message = {
          id: generateId(),
          content: content.trim(),
          sender: "user",
          timestamp: new Date().toISOString(),
        };

        // 更新状态：添加用户消息，开始加载
        const messagesWithUser = [...chatState.currentMessages, userMessage];
        setChatState((prev) => ({
          ...prev,
          currentMessages: messagesWithUser,
          isLoading: true,
          error: null,
        }));

        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        // 构建请求体
        const requestBody = {
          message: content.trim(),
          parameters: {
            stream: false,
            temperature: settings.temperature || 0.7,
            maxTokens: settings.maxTokens || 2000,
          },
        };

        // 如果有会话ID，添加到请求中
        if (sessionId) {
          (requestBody as any).sessionId = sessionId;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // 创建AI消息
          const aiMessage: Message = {
            id: generateId(),
            content: result.data.text,
            sender: "ai",
            timestamp: new Date().toISOString(),
          };

          // 更新状态：添加AI消息，结束加载
          const finalMessages = [...messagesWithUser, aiMessage];
          setChatState((prev) => ({
            ...prev,
            currentMessages: finalMessages,
            isLoading: false,
            error: null,
          }));

          // 更新会话
          await updateCurrentSession(finalMessages);
        } else {
          throw new Error(result.error?.message || "API调用失败");
        }
      } catch (error) {
        console.error("Failed to send message:", error);

        // 更新错误状态
        setChatState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "发送消息失败",
        }));
      }
    },
    [
      chatState.currentMessages,
      settings,
      ensureCurrentSession,
      updateCurrentSession,
    ],
  );

  /**
   * 清空当前对话（创建新会话）
   */
  const clearChat = useCallback(async () => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      // 创建新会话
      await createNewSession();
    } catch (error) {
      console.error("创建新会话失败:", error);
      // 如果创建新会话失败，至少清空当前状态
      setCurrentSessionId(null);
      setChatState((prev) => ({
        ...prev,
        currentMessages: [],
        isLoading: false,
        error: null,
      }));
    }
  }, [createNewSession]);

  /**
   * 切换聊天窗口显示状态
   */
  const toggleChat = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  /**
   * 打开聊天窗口
   */
  const openChat = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      isOpen: true,
    }));
  }, []);

  /**
   * 关闭聊天窗口
   */
  const closeChat = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * 设置消息列表（用于加载历史记录）
   */
  const setMessages = useCallback((messages: Message[]) => {
    setChatState((prev) => ({
      ...prev,
      currentMessages: messages,
      error: null,
    }));
  }, []);

  /**
   * 发送消息 - 根据设置选择流式或非流式
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || chatState.isLoading) {
        return;
      }

      // 根据设置选择发送方式
      if (settings.enableStreaming) {
        return sendStreamMessage(content);
      } else {
        return sendNonStreamMessage(content);
      }
    },
    [chatState.isLoading, settings.enableStreaming],
  );

  /**
   * 重试发送最后一条消息
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = chatState.currentMessages
      .slice()
      .reverse()
      .find((msg) => msg.sender === "user");

    if (lastUserMessage) {
      // 移除最后的AI错误响应（如果有）
      const messagesWithoutLastAI = chatState.currentMessages.filter(
        (msg, index) => {
          if (
            msg.sender === "ai" &&
            index === chatState.currentMessages.length - 1
          ) {
            return false;
          }
          return true;
        },
      );

      setChatState((prev) => ({
        ...prev,
        currentMessages: messagesWithoutLastAI,
        error: null,
      }));

      // 重新发送消息
      const contentStr =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);
      sendMessage(contentStr);
    }
  }, [chatState.currentMessages, sendMessage]);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * 发送流式消息 - 使用百炼平台流式API
   */
  const sendStreamMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || chatState.isLoading) {
        return;
      }

      // 创建用户消息
      const userMessage: Message = {
        id: generateId(),
        content: content.trim(),
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      // 创建临时AI消息用于流式更新
      const aiMessageId = generateId();
      const tempAiMessage: Message = {
        id: aiMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      // 更新状态：添加用户消息和临时AI消息，开始加载
      setChatState((prev) => ({
        ...prev,
        currentMessages: [...prev.currentMessages, userMessage, tempAiMessage],
        isLoading: true,
        error: null,
      }));

      // 保存用户消息到IndexedDB
      try {
        await ChatStorage.saveMessage(
          userMessage,
          currentSessionId || "default",
        );
      } catch (error) {
        console.error("Failed to save user message:", error);
      }

      try {
        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const requestBody = {
          message: content,
          sessionId: currentSessionId || undefined,
          parameters: {
            stream: true,
            temperature: settings.temperature || 0.7,
            maxTokens: settings.maxTokens || 2000,
          },
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody as any),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取响应流");
        }

        let fullText = "";
        let finalSessionId = currentSessionId;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data: StreamChatResponse = JSON.parse(line.slice(6));

                  if (data.type === "chunk" && data.data) {
                    fullText += data.data.text;
                    if (data.data.sessionId) {
                      finalSessionId = data.data.sessionId;
                    }

                    // 实时更新AI消息内容
                    setChatState((prev) => ({
                      ...prev,
                      currentMessages: prev.currentMessages.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: fullText }
                          : msg,
                      ),
                    }));
                  } else if (data.type === "done") {
                    break;
                  } else if (data.type === "error") {
                    throw new Error(data.error?.message || "流式响应错误");
                  }
                } catch (parseError) {
                  console.warn("解析流式数据失败:", parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // 更新会话ID
        if (finalSessionId) {
          setCurrentSessionId(finalSessionId);
        }

        // 结束加载状态
        setChatState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        // 保存最终的AI消息到IndexedDB
        try {
          const finalAiMessage = chatState.currentMessages.find(
            (msg) => msg.id === aiMessageId,
          );
          if (finalAiMessage) {
            await ChatStorage.saveMessage(
              finalAiMessage,
              currentSessionId || "default",
            );
          }
        } catch (error) {
          console.error("Failed to save AI message:", error);
        }
      } catch (error) {
        console.error("Failed to send stream message:", error);

        // 移除临时AI消息并显示错误
        setChatState((prev) => ({
          ...prev,
          currentMessages: prev.currentMessages.filter(
            (msg) => msg.id !== aiMessageId,
          ),
          isLoading: false,
          error: error instanceof Error ? error.message : "发送流式消息失败",
        }));
      }
    },
    [currentSessionId, settings],
  );

  /**
   * 添加欢迎消息
   */
  const addWelcomeMessage = useCallback(() => {
    const welcomeMessage: Message = {
      id: generateId(),
      content:
        "有什么可以帮您？我可以协助您解决SQL编程、ER图建模、B+树可视化等相关问题。",
      sender: "ai",
      timestamp: new Date().toISOString(),
    };

    setChatState((prev) => ({
      ...prev,
      currentMessages: [welcomeMessage],
    }));
  }, []);

  return {
    // 状态
    chatState,
    setChatState,
    currentSessionId,

    // 基础操作
    sendMessage,
    sendStreamMessage,
    clearChat,
    toggleChat,
    openChat,
    closeChat,
    setMessages,
    retryLastMessage,
    clearError,
    addWelcomeMessage,

    // 会话管理
    createNewSession,
    selectSession,
    updateCurrentSession,
    ensureCurrentSession,
  };
};
