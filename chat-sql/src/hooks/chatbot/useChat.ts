// 聊天状态管理Hook

import { useState, useCallback, useRef } from 'react';
import { 
  ChatState, 
  Message, 
  DEFAULT_CHAT_STATE,
  AIResponse 
} from '@/types/chatbot';
import { ChatAPI, mockAIResponse } from '@/components/ChatBot/utils/chatAPI';
import { generateId } from '@/components/ChatBot/utils/storage';
import { useChatSettings } from './useChatSettings';

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>(DEFAULT_CHAT_STATE);
  const { settings } = useChatSettings();
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || chatState.isLoading) {
      return;
    }

    // 创建用户消息
    const userMessage: Message = {
      id: generateId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // 更新状态：添加用户消息，开始加载
    setChatState(prev => ({
      ...prev,
      currentMessages: [...prev.currentMessages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      // 调用API或使用模拟响应
      let aiResponse: AIResponse;
      
      if (settings.apiKey && settings.apiKey.trim()) {
        // 使用真实API
        const response = await ChatAPI.sendMessage({
          message: content,
          history: chatState.currentMessages,
          settings,
        });

        if (!response.success) {
          throw new Error(response.error || 'API调用失败');
        }

        aiResponse = response.data!;
      } else {
        // 使用模拟响应
        aiResponse = await mockAIResponse(content);
      }

      // 创建AI消息
      const aiMessage: Message = {
        id: generateId(),
        content: aiResponse.text,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        metadata: aiResponse.metadata,
      };

      // 更新状态：添加AI消息，结束加载
      setChatState(prev => ({
        ...prev,
        currentMessages: [...prev.currentMessages, aiMessage],
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // 更新错误状态
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '发送消息失败',
      }));
    }
  }, [chatState.currentMessages, chatState.isLoading, settings]);

  /**
   * 清空当前对话
   */
  const clearChat = useCallback(() => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setChatState(prev => ({
      ...prev,
      currentMessages: [],
      isLoading: false,
      error: null,
    }));
  }, []);

  /**
   * 切换聊天窗口显示状态
   */
  const toggleChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }, []);

  /**
   * 打开聊天窗口
   */
  const openChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isOpen: true,
    }));
  }, []);

  /**
   * 关闭聊天窗口
   */
  const closeChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * 设置消息列表（用于加载历史记录）
   */
  const setMessages = useCallback((messages: Message[]) => {
    setChatState(prev => ({
      ...prev,
      currentMessages: messages,
      error: null,
    }));
  }, []);

  /**
   * 重试发送最后一条消息
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = chatState.currentMessages
      .slice()
      .reverse()
      .find(msg => msg.sender === 'user');
    
    if (lastUserMessage) {
      // 移除最后的AI错误响应（如果有）
      const messagesWithoutLastAI = chatState.currentMessages.filter((msg, index) => {
        if (msg.sender === 'ai' && index === chatState.currentMessages.length - 1) {
          return false;
        }
        return true;
      });

      setChatState(prev => ({
        ...prev,
        currentMessages: messagesWithoutLastAI,
        error: null,
      }));

      // 重新发送消息
      sendMessage(lastUserMessage.content);
    }
  }, [chatState.currentMessages, sendMessage]);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * 添加欢迎消息
   */
  const addWelcomeMessage = useCallback(() => {
    const welcomeMessage: Message = {
      id: generateId(),
      content: '有什么可以帮您？我可以协助您解决SQL编程、ER图建模、B+树可视化等相关问题。',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      metadata: {
        module: 'coding',
      },
    };

    setChatState(prev => ({
      ...prev,
      currentMessages: [welcomeMessage],
    }));
  }, []);

  return {
    // 状态
    chatState,
    setChatState,
    
    // 操作
    sendMessage,
    clearChat,
    toggleChat,
    openChat,
    closeChat,
    setMessages,
    retryLastMessage,
    clearError,
    addWelcomeMessage,
  };
};
