// 聊天API调用封装

import {
  ChatAPIRequest,
  ChatAPIResponse,
  AIResponse,
  ChatSettings,
  Message
} from '@/types/chatbot';

/**
 * 聊天API管理类
 */
export class ChatAPI {
  /**
   * 发送消息到AI服务
   */
  static async sendMessage(request: ChatAPIRequest): Promise<ChatAPIResponse> {
    try {
      const { message, history, settings } = request;
      
      // 根据不同平台调用不同的API
      switch (settings.apiPlatform) {
        case 'bailianai':
          return await this.callBailianAI(message, history, settings);
        case 'dify':
          return await this.callDify(message, history, settings);
        default:
          throw new Error(`不支持的API平台: ${settings.apiPlatform}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送消息失败',
      };
    }
  }

  /**
   * 调用百炼AI API
   */
  private static async callBailianAI(
    message: string, 
    history: Message[] = [], 
    settings: ChatSettings
  ): Promise<ChatAPIResponse> {
    try {
      // 构建消息历史
      const messages = [
        {
          role: 'system',
          content: settings.systemPrompt,
        },
        ...history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await fetch('/api/chat/bailianai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          messages,
          model: 'qwen-plus',
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 解析AI响应，提取metadata
      const aiResponse = this.parseAIResponse(data.choices[0].message.content);
      
      return {
        success: true,
        data: aiResponse,
      };
    } catch (error) {
      console.error('BailianAI API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '百炼AI调用失败',
      };
    }
  }

  /**
   * 调用Dify API
   */
  private static async callDify(
    message: string, 
    history: Message[] = [], 
    settings: ChatSettings
  ): Promise<ChatAPIResponse> {
    try {
      const response = await fetch(settings.apiEndpoint || '/api/chat/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: message,
          response_mode: 'blocking',
          conversation_id: '',
          user: 'chatbot-user',
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 解析AI响应
      const aiResponse = this.parseAIResponse(data.answer);
      
      return {
        success: true,
        data: aiResponse,
      };
    } catch (error) {
      console.error('Dify API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dify调用失败',
      };
    }
  }

  /**
   * 解析AI响应，提取metadata信息
   */
  private static parseAIResponse(content: string): AIResponse {
    // 默认响应结构
    const defaultResponse: AIResponse = {
      text: content,
      metadata: {
        module: 'coding', // 默认模块
      },
    };

    try {
      // 尝试从响应中提取JSON格式的metadata
      const metadataMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (metadataMatch) {
        const metadata = JSON.parse(metadataMatch[1]);
        const textWithoutMetadata = content.replace(metadataMatch[0], '').trim();
        
        return {
          text: textWithoutMetadata,
          metadata: {
            module: metadata.module || 'coding',
            topic: metadata.topic,
            action: metadata.action,
          },
        };
      }

      // 尝试从响应中识别关键词来推断模块
      const lowerContent = content.toLowerCase();
      let moduleType: 'coding' | 'ER' | 'Bplus' = 'coding';

      if (lowerContent.includes('er图') || lowerContent.includes('实体关系') || lowerContent.includes('entity')) {
        moduleType = 'ER';
      } else if (lowerContent.includes('b+树') || lowerContent.includes('b树') || lowerContent.includes('索引')) {
        moduleType = 'Bplus';
      }

      return {
        text: content,
        metadata: {
          module: moduleType,
        },
      };
    } catch (error) {
      console.error('Failed to parse AI response metadata:', error);
      return defaultResponse;
    }
  }

  /**
   * 测试API连接
   */
  static async testConnection(settings: ChatSettings): Promise<boolean> {
    try {
      const testRequest: ChatAPIRequest = {
        message: '你好',
        settings,
      };
      
      const response = await this.sendMessage(testRequest);
      return response.success;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取支持的模型列表
   */
  static async getAvailableModels(settings: ChatSettings): Promise<string[]> {
    try {
      switch (settings.apiPlatform) {
        case 'bailianai':
          return ['qwen-plus', 'qwen-turbo', 'qwen-max'];
        case 'dify':
          return ['default'];
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }
}

/**
 * 模拟AI响应（用于开发测试）
 */
export const mockAIResponse = async (message: string): Promise<AIResponse> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = [
    {
      text: '我理解您的问题。让我为您提供一个详细的SQL查询示例。',
      metadata: { module: 'coding' as const },
    },
    {
      text: '这是一个很好的ER图设计问题。我建议您创建以下实体和关系。',
      metadata: { 
        module: 'ER' as const,
        action: {
          type: 'navigate' as const,
          target: '/er-diagram',
          params: { autoCreate: true },
        },
      },
    },
    {
      text: 'B+树的插入操作需要考虑节点分裂的情况。让我为您演示这个过程。',
      metadata: { 
        module: 'Bplus' as const,
        action: {
          type: 'visualize' as const,
          target: '/Bplus',
          params: { operation: 'insert', value: 42 },
        },
      },
    },
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};
