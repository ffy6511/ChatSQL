// 聊天状态管理上下文

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  ChatContextType, 
  ChatState, 
  ChatMessage, 
  ChatSession,
  DEFAULT_CHAT_STATE,
  generateId 
} from '@/types/chat';
import { chatStorage } from '@/services/chatStorage';

// 状态管理的Action类型
type ChatAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_SESSION_IN_LIST'; payload: ChatSession }
  | { type: 'REMOVE_SESSION'; payload: string }
  | { type: 'CLEAR_MESSAGES' };

// Reducer函数
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'UPDATE_SESSION_IN_LIST':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        )
      };
    
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        currentSessionId: state.currentSessionId === action.payload ? null : state.currentSessionId,
        messages: state.currentSessionId === action.payload ? [] : state.messages
      };
    
    case 'CLEAR_MESSAGES':
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
      dispatch({ type: 'SET_LOADING', payload: true });
      const sessions = await chatStorage.getAllSessions();
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch (error) {
      console.error('刷新会话列表失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '加载会话列表失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * 选择会话 - 连接历史记录和消息窗口的关键方法
   */
  const selectSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const session = state.sessions.find(s => s.id === sessionId);
      
      if (!session) {
        dispatch({ type: 'SET_ERROR', payload: '会话不存在' });
        return;
      }

      dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId });
      
      // 如果会话有session_id，加载对应的消息
      if (session.session_id) {
        const messages = await chatStorage.getMessagesBySessionId(session.session_id);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      } else {
        // 新会话，清空消息
        dispatch({ type: 'CLEAR_MESSAGES' });
      }
      
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('选择会话失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '加载会话消息失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.sessions]);

  /**
   * 创建新会话
   */
  const createNewSession = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newSession = await chatStorage.createSession();
      
      // 更新状态
      dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession.id });
      dispatch({ type: 'CLEAR_MESSAGES' });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 刷新会话列表
      await refreshSessions();
    } catch (error) {
      console.error('创建新会话失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '创建新会话失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [refreshSessions]);

  /**
   * 发送消息 - 确保正确传递session_id给后端API
   */
  const sendMessage = useCallback(async (userInput: string): Promise<void> => {
    if (!userInput.trim()) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // 如果没有当前会话，自动创建新会话
      let currentSessionId = state.currentSessionId;
      let currentSession = currentSessionId ? state.sessions.find(s => s.id === currentSessionId) : null;
      
      if (!currentSessionId || !currentSession) {
        const newSession = await chatStorage.createSession();
        currentSessionId = newSession.id;
        currentSession = newSession;
        dispatch({ type: 'SET_CURRENT_SESSION', payload: currentSessionId });
        await refreshSessions();
      }

      // 创建用户消息（临时使用前端session ID，后续会更新）
      const userMessage: ChatMessage = {
        id: generateId(),
        content: userInput,
        role: 'user',
        timestamp: new Date().toISOString(),
        session_id: currentSession!.session_id || currentSessionId // 使用后端session_id或前端ID作为临时值
      };

      // 立即显示用户消息
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // 调用后端API，传递正确的session_id
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(data.error?.message || 'API调用失败');
      }

      // 从响应中获取session_id（API返回格式：data.data.sessionId）
      const backendSessionId = data.data?.sessionId;

      // 如果是新会话且获得了后端session_id，更新会话和消息
      if (!currentSession!.session_id && backendSessionId) {
        // 更新会话的session_id
        const updatedSession = {
          ...currentSession!,
          session_id: backendSessionId
        };
        await chatStorage.updateSession(updatedSession);
        dispatch({ type: 'UPDATE_SESSION_IN_LIST', payload: updatedSession });

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
        content: data.data?.text || '抱歉，我无法处理您的请求。',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        session_id: backendSessionId || currentSession!.session_id || currentSessionId,
        metadata: data.data?.metadata
      };

      // 显示AI回复
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });

      // 保存AI消息到数据库
      await chatStorage.saveMessage(aiMessage);

      // 更新会话的消息数量和标题
      await chatStorage.updateMessageCount(currentSessionId);

      // 刷新会话列表以更新统计信息
      await refreshSessions();

    } catch (error) {
      console.error('发送消息失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '发送消息失败，请重试' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSessionId, state.sessions, refreshSessions]);

  /**
   * 删除会话
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await chatStorage.deleteSession(sessionId);
      
      // 更新状态
      dispatch({ type: 'REMOVE_SESSION', payload: sessionId });
      dispatch({ type: 'SET_ERROR', payload: null });
      
    } catch (error) {
      console.error('删除会话失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '删除会话失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback((): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
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
    deleteSession,

    // 辅助方法
    clearError,
    refreshSessions,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook for using the context
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
