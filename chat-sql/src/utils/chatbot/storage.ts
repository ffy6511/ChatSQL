// 本地存储工具函数

import { 
  ChatHistory, 
  ChatSettings, 
  STORAGE_KEYS, 
  DEFAULT_SETTINGS,
  DEFAULT_POSITION,
  DEFAULT_SIZE 
} from '@/types/chatbot';

/**
 * 本地存储管理类
 */
export class ChatStorage {
  /**
   * 获取聊天历史记录
   */
  static getChatHistory(): ChatHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }

  /**
   * 保存聊天历史记录
   */
  static saveChatHistory(history: ChatHistory[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  /**
   * 添加新的聊天记录
   */
  static addChatHistory(newHistory: ChatHistory): void {
    const history = this.getChatHistory();
    history.unshift(newHistory); // 最新的记录放在前面
    
    // 限制历史记录数量（最多保存100条）
    if (history.length > 100) {
      history.splice(100);
    }
    
    this.saveChatHistory(history);
  }

  /**
   * 删除指定的聊天记录
   */
  static deleteChatHistory(historyId: string): void {
    const history = this.getChatHistory();
    const filteredHistory = history.filter(item => item.id !== historyId);
    this.saveChatHistory(filteredHistory);
  }

  /**
   * 根据ID获取特定的聊天记录
   */
  static getChatHistoryById(historyId: string): ChatHistory | null {
    const history = this.getChatHistory();
    return history.find(item => item.id === historyId) || null;
  }

  /**
   * 获取聊天设置
   */
  static getChatSettings(): ChatSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to get chat settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 保存聊天设置
   */
  static saveChatSettings(settings: ChatSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save chat settings:', error);
    }
  }

  /**
   * 获取聊天窗口位置
   */
  static getChatPosition(): { x: number; y: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_POSITION);
      return stored ? JSON.parse(stored) : DEFAULT_POSITION;
    } catch (error) {
      console.error('Failed to get chat position:', error);
      return DEFAULT_POSITION;
    }
  }

  /**
   * 保存聊天窗口位置
   */
  static saveChatPosition(position: { x: number; y: number }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_POSITION, JSON.stringify(position));
    } catch (error) {
      console.error('Failed to save chat position:', error);
    }
  }

  /**
   * 获取聊天窗口大小
   */
  static getChatSize(): { width: number; height: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SIZE);
      return stored ? JSON.parse(stored) : DEFAULT_SIZE;
    } catch (error) {
      console.error('Failed to get chat size:', error);
      return DEFAULT_SIZE;
    }
  }

  /**
   * 保存聊天窗口大小
   */
  static saveChatSize(size: { width: number; height: number }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SIZE, JSON.stringify(size));
    } catch (error) {
      console.error('Failed to save chat size:', error);
    }
  }

  /**
   * 清除所有聊天相关的本地存储
   */
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear chat storage:', error);
    }
  }

  /**
   * 导出聊天数据
   */
  static exportData(): string {
    const data = {
      history: this.getChatHistory(),
      settings: this.getChatSettings(),
      position: this.getChatPosition(),
      size: this.getChatSize(),
      exportTime: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入聊天数据
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.history) {
        this.saveChatHistory(data.history);
      }
      if (data.settings) {
        this.saveChatSettings(data.settings);
      }
      if (data.position) {
        this.saveChatPosition(data.position);
      }
      if (data.size) {
        this.saveChatSize(data.size);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import chat data:', error);
      return false;
    }
  }
}

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * 截取文本用于显示标题
 */
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};
