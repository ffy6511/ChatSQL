// 聊天状态管理上下文

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  ChatContextType,
  ChatState,
  ChatMessage,
  ChatSession,
  DEFAULT_CHAT_STATE,
  generateId,
} from "@/types/chat";
import { chatStorage } from "@/services/chatStorage";
import {
  AgentType,
  AGENTS_INFO,
  AgentOutputPart,
} from "@/types/chatBotTypes/agents";
import { quizStorage } from "@/services/quizStorage";

// 状态管理的Action类型
type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SESSIONS"; payload: ChatSession[] }
  | { type: "SET_CURRENT_SESSION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_SESSION_IN_LIST"; payload: ChatSession }
  | { type: "REMOVE_SESSION"; payload: string }
  | { type: "CLEAR_MESSAGES" }
  | { type: "CLEAR_ALL_SESSIONS" };

// Reducer函数
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_SESSIONS":
      return { ...state, sessions: action.payload };

    case "SET_CURRENT_SESSION":
      return { ...state, currentSessionId: action.payload };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "UPDATE_SESSION_IN_LIST":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.id ? action.payload : session,
        ),
      };

    case "REMOVE_SESSION":
      return {
        ...state,
        sessions: state.sessions.filter(
          (session) => session.id !== action.payload,
        ),
        currentSessionId:
          state.currentSessionId === action.payload
            ? null
            : state.currentSessionId,
        messages:
          state.currentSessionId === action.payload ? [] : state.messages,
      };

    case "CLEAR_MESSAGES":
      return { ...state, messages: [] };

    default:
      return state;
  }
};

// 创建Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider组件
interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, DEFAULT_CHAT_STATE);

  // 初始化时加载所有会话
  useEffect(() => {
    refreshSessions();
  }, []);

  /**
   * 刷新会话列表
   */
  const refreshSessions = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const sessions = await chatStorage.getAllSessions();
      dispatch({ type: "SET_SESSIONS", payload: sessions });
    } catch (error) {
      console.error("刷新会话列表失败:", error);
      dispatch({ type: "SET_ERROR", payload: "加载会话列表失败" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  /**
   * 选择会话 - 连接历史记录和消息窗口的关键方法
   */
  const selectSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const session = state.sessions.find((s) => s.id === sessionId);

        if (!session) {
          dispatch({ type: "SET_ERROR", payload: "会话不存在" });
          return;
        }

        dispatch({ type: "SET_CURRENT_SESSION", payload: sessionId });

        // 如果会话有session_id，加载对应的消息
        if (session.session_id) {
          const messages = await chatStorage.getMessagesBySessionId(
            session.session_id,
          );
          dispatch({ type: "SET_MESSAGES", payload: messages });
        } else {
          // 新会话，清空消息
          dispatch({ type: "CLEAR_MESSAGES" });
        }

        dispatch({ type: "SET_ERROR", payload: null });
      } catch (error) {
        console.error("选择会话失败:", error);
        dispatch({ type: "SET_ERROR", payload: "加载会话消息失败" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.sessions],
  );

  /**
   * 创建新会话
   */
  const createNewSession = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const newSession = await chatStorage.createSession();

      // 更新状态
      dispatch({ type: "SET_CURRENT_SESSION", payload: newSession.id });
      dispatch({ type: "CLEAR_MESSAGES" });
      dispatch({ type: "SET_ERROR", payload: null });

      // 刷新会话列表
      await refreshSessions();
    } catch (error) {
      console.error("创建新会话失败:", error);
      dispatch({ type: "SET_ERROR", payload: "创建新会话失败" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [refreshSessions]);

  // 重命名会话
  const renameSession = useCallback(
    async (sessionId: string, newSession: ChatSession): Promise<void> => {
      try {
        dispatch({ type: "UPDATE_SESSION_IN_LIST", payload: newSession });

        await chatStorage.renameSession(sessionId, newSession.title);
        await refreshSessions();
      } catch (error) {
        console.error("重命名会话失败:", error);
        dispatch({ type: "SET_ERROR", payload: "重命名会话失败" });
      }
    },
    [refreshSessions],
  );

  /**
   * 发送消息 - 确保正确传递session_id给后端API
   */
  const sendMessage = useCallback(
    async (userInput: string): Promise<void> => {
      if (!userInput.trim()) return;

      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // 如果没有当前会话，自动创建新会话
        let currentSessionId = state.currentSessionId;
        let currentSession = currentSessionId
          ? state.sessions.find((s) => s.id === currentSessionId)
          : null;

        if (!currentSessionId || !currentSession) {
          const newSession = await chatStorage.createSession();
          currentSessionId = newSession.id;
          currentSession = newSession;
          dispatch({ type: "SET_CURRENT_SESSION", payload: currentSessionId });
          await refreshSessions();
        }

        // 创建用户消息（临时使用前端session ID，后续会更新）
        const userMessage: ChatMessage = {
          id: generateId(),
          content: userInput,
          role: "user",
          timestamp: new Date().toISOString(),
          session_id: currentSession!.session_id || currentSessionId, // 使用后端session_id或前端ID作为临时值
        };

        // 立即显示用户消息
        dispatch({ type: "ADD_MESSAGE", payload: userMessage });

        // 调用后端API，传递正确的session_id
        const response = await fetch("/api/Schema-generator", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userInput,
            sessionId: currentSession!.session_id, // 传递后端session_id（可能为null）
            parameters: {
              stream: false,
              temperature: 0.7,
              maxTokens: 2000,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 检查API响应是否成功
        if (!data.success) {
          throw new Error(data.error?.message || "API调用失败");
        }

        // 从响应中获取session_id（API返回格式：data.data.sessionId）
        const backendSessionId = data.data?.sessionId;

        // 如果是新会话且获得了后端session_id，更新会话和消息
        if (!currentSession!.session_id && backendSessionId) {
          // 更新会话的session_id
          const updatedSession = {
            ...currentSession!,
            session_id: backendSessionId,
          };
          await chatStorage.updateSession(updatedSession);
          dispatch({ type: "UPDATE_SESSION_IN_LIST", payload: updatedSession });

          // 更新用户消息的session_id并重新保存
          userMessage.session_id = backendSessionId;
          await chatStorage.saveMessage(userMessage);
        } else if (currentSession!.session_id) {
          // 如果已有session_id，直接保存用户消息
          await chatStorage.saveMessage(userMessage);
        }

        // 创建AI回复消息
        const aiMessage: ChatMessage = {
          id: generateId(),
          content: data.data?.text || "抱歉，我无法处理您的请求。",
          role: "assistant",
          timestamp: new Date().toISOString(),
          session_id:
            backendSessionId || currentSession!.session_id || currentSessionId,
          metadata: data.data?.metadata,
        };

        // 显示AI回复
        dispatch({ type: "ADD_MESSAGE", payload: aiMessage });

        // 保存AI消息到数据库
        await chatStorage.saveMessage(aiMessage);

        // 更新会话的消息数量和标题
        await chatStorage.updateMessageCount(currentSessionId);

        // 刷新会话列表以更新统计信息
        await refreshSessions();
      } catch (error) {
        console.error("发送消息失败:", error);
        dispatch({ type: "SET_ERROR", payload: "发送消息失败，请重试" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.currentSessionId, state.sessions, refreshSessions],
  );

  /**
   * 发送智能体消息 - 支持动态智能体选择和参数适配， 并且返回对应的内容
   */
  const sendAgentMessage = useCallback(
    async (
      agentType: string,
      inputValues: Record<string, string>,
    ): Promise<AgentOutputPart[] | null> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // 获取智能体信息
        const agentInfo = AGENTS_INFO[agentType as AgentType];
        if (!agentInfo) {
          throw new Error(`未知的智能体类型: ${agentType}`);
        }

        // 验证必需的输入字段
        for (const field of agentInfo.inputFields) {
          if (field.required && !inputValues[field.name]?.trim()) {
            throw new Error(`请填写必需字段: ${field.label}`);
          }
        }

        // 如果没有当前会话，自动创建新会话
        let currentSessionId = state.currentSessionId;
        let currentSession = currentSessionId
          ? state.sessions.find((s) => s.id === currentSessionId)
          : null;

        if (!currentSessionId || !currentSession) {
          const newSession = await chatStorage.createSession();
          currentSessionId = newSession.id;
          currentSession = newSession;
          dispatch({ type: "SET_CURRENT_SESSION", payload: currentSessionId });
          await refreshSessions();
        }

        // 创建用户消息（使用结构化格式）
        const userMessageParts: AgentOutputPart[] = agentInfo.inputFields.map(
          (field) => ({
            type: "text",
            content: inputValues[field.name],
          }),
        );

        const userMessage: ChatMessage = {
          id: generateId(),
          content: userMessageParts,
          role: "user",
          timestamp: new Date().toISOString(),
          session_id: currentSession!.session_id || currentSessionId,
        };

        // 立即显示用户消息
        dispatch({ type: "ADD_MESSAGE", payload: userMessage });

        // 构建API请求体 - 按照百炼AI的标准格式
        const requestBody: any = {
          input: {
            prompt: "处理用户请求",
            biz_params: {},
          },
          parameters: {
            stream: false,
            temperature: 0.7,
            maxTokens: 2000,
          },
          debug: {},
        };

        // 如果有session_id，添加到input中
        if (currentSession!.session_id) {
          requestBody.input.session_id = currentSession!.session_id;
        }

        // 根据智能体类型添加特定的参数到biz_params中
        if (agentType === AgentType.SCHEMA_GENERATOR) {
          requestBody.input.biz_params = {
            natural_language_query: inputValues.natural_language_query,
          };
        } else if (agentType === AgentType.ER_GENERATOR) {
          requestBody.input.biz_params = {
            natural_language_query: inputValues.natural_language_query,
            provided_schema: inputValues.provided_schema,
          };
        } else if (agentType === AgentType.ER_QUIZ_GENERATOR) {
          requestBody.input.biz_params = {
            description_input: inputValues.description_input,
          };
        } else if (agentType === AgentType.ER_VERIFIER) {
          // 验证必需字段
          if (!inputValues.quiz_id?.trim()) {
            throw new Error("请选择要检验的题目");
          }

          // 从中提取ID
          const quizId = inputValues.quiz_id;

          // 在indexDB中获取记录
          const { quizStorage } = await import("@/services/quizStorage");
          const quizData = await quizStorage.getQuiz(quizId);

          if (!quizData) {
            throw new Error("未找到选中的题目，请重新选择");
          }

          requestBody.input.biz_params = {
            description: quizData.description,
            erDiagramDone: inputValues.erDiagramDone || "{}",
            erDiagramAns: quizData.referenceAnswer
              ? JSON.stringify(quizData.referenceAnswer)
              : "{}",
          };
        } else {
          // 默认聊天智能体 - 使用message字段
          requestBody.input.biz_params = {
            message: inputValues.message,
          };
        }

        // 调用对应的API端点
        const response = await fetch(agentInfo.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 检查API响应是否成功
        if (!data.success) {
          throw new Error(data.error?.message || "API调用失败");
        }

        // 直接获取核心数据
        const output = data.data?.output;
        const metadata = data.data?.metadata;
        const backendSessionId = data.data?.sessionId;

        // 验证新的数据结构是否存在
        if (!output || !Array.isArray(output)) {
          // 如果后端没有返回期望的 parts 数组，这是一个错误
          throw new Error("API响应格式不正确，缺少 output 数组。");
        }

        // 如果是新会话且获得了后端session_id，更新会话和消息
        if (!currentSession!.session_id && backendSessionId) {
          const updatedSession = {
            ...currentSession!,
            session_id: backendSessionId,
          };
          await chatStorage.updateSession(updatedSession);
          dispatch({ type: "UPDATE_SESSION_IN_LIST", payload: updatedSession });

          userMessage.session_id = backendSessionId;
          await chatStorage.saveMessage(userMessage);
        } else if (currentSession!.session_id) {
          await chatStorage.saveMessage(userMessage);
        }

        // 创建AI回复消息，content 直接使用后端返回的 output 对象
        const aiMessage: ChatMessage = {
          id: generateId(),
          content: output, // 直接使用 AgentOutputPart[] 数组
          role: "assistant",
          timestamp: new Date().toISOString(),
          session_id:
            backendSessionId || currentSession!.session_id || currentSessionId,
          metadata: metadata, // 直接使用后端返回的元数据
        };

        // 显示AI回复
        dispatch({ type: "ADD_MESSAGE", payload: aiMessage });

        // 保存AI消息到数据库
        await chatStorage.saveMessage(aiMessage);

        // 更新会话的消息数量和标题
        await chatStorage.updateMessageCount(currentSessionId);

        // 刷新会话列表以更新统计信息
        await refreshSessions();

        return data.data.output as AgentOutputPart[];
      } catch (error) {
        console.error("发送智能体消息失败:", error);
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "发送消息失败，请重试",
        });
        return null;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.currentSessionId, state.sessions, refreshSessions],
  );

  /**
   * 删除会话
   */
  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        await chatStorage.deleteSession(sessionId);

        // 更新状态
        dispatch({ type: "REMOVE_SESSION", payload: sessionId });
        dispatch({ type: "SET_ERROR", payload: null });
      } catch (error) {
        console.error("删除会话失败:", error);
        dispatch({ type: "SET_ERROR", payload: "删除会话失败" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [],
  );

  /**
   * 清空所有会话
   */
  const clearAllSessions = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await chatStorage.clearAllSessions();

      // 更新状态
      dispatch({ type: "SET_SESSIONS", payload: [] });
      dispatch({ type: "SET_CURRENT_SESSION", payload: null });
      dispatch({ type: "SET_MESSAGES", payload: [] });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      console.error("清空所有会话失败:", error);
      dispatch({ type: "SET_ERROR", payload: "清空所有会话失败" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback((): void => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  // Context值
  const contextValue: ChatContextType = {
    // 状态
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,

    // 核心方法
    selectSession,
    createNewSession,
    sendMessage,
    sendAgentMessage,
    deleteSession,
    clearAllSessions,
    renameSession,

    // 辅助方法
    clearError,
    refreshSessions,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

// Hook for using the context
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
