// ER模块独立的上下文管理
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { DifyResponse } from '@/types/dify';
import { ChatMessage } from '@/types/chat';
import { AgentType, AGENTS_INFO } from '@/types/agents';
import { saveLLMProblem } from '@/services/recordsIndexDB';

interface ERContextType {
  // LLM窗口状态
  showLLMWindow: boolean;
  setShowLLMWindow: (v: boolean) => void;
  llmResult: DifyResponse | null;
  setLLMResult: (v: DifyResponse | null) => void;
  currentProblemId: number | null;
  setCurrentProblemId: (v: number | null) => void;
  refreshRecords?: () => void;

  // 聊天状态
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // 聊天方法
  sendAgentMessage: (agentType: string, inputValues: Record<string, string>) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const ERContext = createContext<ERContextType | null>(null);

export const useERContext = () => {
  const ctx = useContext(ERContext);
  if (!ctx) throw new Error('useERContext must be used within ERProvider');
  return ctx;
};

export const ERProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLLMWindow, setShowLLMWindow] = useState(true);
  const [llmResult, setLLMResult] = useState<DifyResponse | null>(null);
  const [currentProblemId, setCurrentProblemId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecords = () => {};

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 保存对话到历史记录
   */
  const saveToHistory = useCallback(async (
    agentType: string,
    userMessage: ChatMessage,
    aiMessage: ChatMessage,
    apiResponse: any
  ): Promise<void> => {
    try {
      // 构建历史记录数据
      const historyData = {
        title: `ER${agentType === AgentType.ER_QUIZ_GENERATOR ? '出题' : agentType === AgentType.ER_VERIFIER ? '验证' : '生成'} - ${new Date().toLocaleString()}`,
        data: {
          agentType,
          userInput: userMessage.content,
          aiResponse: aiMessage.content,
          apiResponse: apiResponse,
          timestamp: new Date().toISOString(),
          success: apiResponse.success || false
        },
        createdAt: new Date(),
        isFavorite: false,
        progress: 0,
        totalProblems: 1,
        completedProblems: [false]
      };

      // 保存到IndexedDB
      const savedId = await saveLLMProblem(historyData);
      console.log('ER对话已保存到历史记录，ID:', savedId);

      // 刷新记录列表（如果有的话）
      if (refreshRecords) {
        refreshRecords();
      }
    } catch (error) {
      console.error('保存ER对话历史记录失败:', error);
      throw error;
    }
  }, []);

  /**
   * 发送智能体消息 - ER模块专用版本
   */
  const sendAgentMessage = useCallback(async (agentType: string, inputValues: Record<string, string>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

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

      // 创建用户消息（显示用户的输入）
      const userContent = agentInfo.inputFields.length === 1
        ? inputValues[agentInfo.inputFields[0].name]
        : agentInfo.inputFields.map(field => `${field.label}: ${inputValues[field.name]}`).join('\n');

      const userMessage: ChatMessage = {
        id: `er-${Date.now()}-user`,
        content: userContent,
        role: 'user',
        timestamp: new Date().toISOString(),
        session_id: 'er-session' // ER模块使用固定的session_id
      };

      // 立即显示用户消息
      setMessages(prev => [...prev, userMessage]);

      // 构建API请求体
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

      // 根据智能体类型添加特定的参数到biz_params中
      if (agentType === AgentType.ER_GENERATOR) {
        requestBody.input.biz_params = {
          natural_language_query: inputValues.natural_language_query,
          provided_schema: inputValues.provided_schema,
        };
      } else if (agentType === AgentType.ER_QUIZ_GENERATOR) {
        requestBody.input.biz_params = {
          description_input: inputValues.description_input,
        };
      } else if (agentType === AgentType.ER_VERIFIER) {
        requestBody.input.biz_params = {
          description: inputValues.description,
          erDiagramDone: inputValues.erDiagramDone,
          erDiagramAns: inputValues.erDiagramAns,
        };
      }

      // 调用对应的API端点
      const response = await fetch(agentInfo.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 检查API响应是否成功
      if (!data.success) {
        throw new Error(data.error?.message || 'API调用失败');
      }

      // 获取AI回复内容 - 使用新的parts格式
      let aiContent: any = '';
      let aiMetadata: any = {};

      const output = data.data?.output;

      // 检查是否是新的AgentOutputPart[]格式
      if (Array.isArray(output)) {
        // 新的AgentOutputPart[]格式 - 直接使用数组
        aiContent = output;
        aiMetadata = {
          type: 'parts',
          agentType: agentType,
          originalOutput: output
        };
      } else {
        // 兼容旧格式的处理逻辑
        if (agentType === AgentType.ER_GENERATOR) {
          if (output?.erData) {
            aiContent = `ER图生成成功！\n描述：${output.description || '无描述'}\n\nER图数据已生成，可在画布中查看。`;
          } else {
            aiContent = output?.description || '抱歉，无法生成ER图数据。';
          }
        } else if (agentType === AgentType.ER_QUIZ_GENERATOR) {
          if (output?.description && output?.erData) {
            aiContent = `题目生成成功！\n\n题目描述：\n${output.description}\n\nER图数据已生成，题目已自动保存。`;
          } else {
            aiContent = '抱歉，无法生成完整的题目数据。';
          }
        } else if (agentType === AgentType.ER_VERIFIER) {
          if (output?.evaluation) {
            aiContent = `评价结果：\n${output.evaluation}`;
            if (output.score !== undefined) {
              aiContent += `\n\n得分：${output.score}分`;
            }
            if (output.suggestions && output.suggestions.length > 0) {
              aiContent += `\n\n改进建议：\n${output.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`;
            }
          } else {
            aiContent = '抱歉，无法完成ER图验证。';
          }
        } else {
          aiContent = data.data?.text || '抱歉，我无法处理您的请求。';
        }
      }

      // 创建AI回复消息
      const aiMessage: ChatMessage = {
        id: `er-${Date.now()}-assistant`,
        content: aiContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        session_id: 'er-session',
        metadata: aiMetadata.type === 'parts' ? aiMetadata : data.data?.metadata
      };

      // 显示AI回复
      const finalMessages = [...messages, userMessage, aiMessage];
      setMessages(finalMessages);

      // 保存到历史记录 - 无论成功还是失败都保存
      try {
        await saveToHistory(agentType, userMessage, aiMessage, data);
      } catch (saveError) {
        console.error('保存历史记录失败:', saveError);
        // 不影响主流程，只记录错误
      }

    } catch (error) {
      console.error('发送智能体消息失败:', error);
      setError(error instanceof Error ? error.message : '发送消息失败，请重试');

      // 即使出错也要保存历史记录
      try {
        const errorMessage: ChatMessage = {
          id: `er-${Date.now()}-error`,
          content: `错误：${error instanceof Error ? error.message : '发送消息失败'}`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          session_id: 'er-session'
        };

        // 如果有用户消息，保存错误记录
        const currentMessages = [...messages];
        if (currentMessages.length > 0) {
          const lastUserMessage = currentMessages[currentMessages.length - 1];
          if (lastUserMessage.role === 'user') {
            await saveToHistory(agentType, lastUserMessage, errorMessage, {
              success: false,
              error: { message: error instanceof Error ? error.message : '发送消息失败' }
            });
          }
        }
      } catch (saveError) {
        console.error('保存错误记录失败:', saveError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ERContext.Provider value={{
      // LLM窗口状态
      showLLMWindow,
      setShowLLMWindow,
      llmResult,
      setLLMResult,
      currentProblemId,
      setCurrentProblemId,
      refreshRecords,

      // 聊天状态
      messages,
      isLoading,
      error,

      // 聊天方法
      sendAgentMessage,
      clearMessages,
      clearError,
    }}>
      {children}
    </ERContext.Provider>
  );
};
