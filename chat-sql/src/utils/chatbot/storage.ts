// 本地存储工具函数

import {
  ChatHistory,
  ChatSettings,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_POSITION,
  DEFAULT_SIZE,
  Message
} from '@/types/chatbot';

/**
 * IndexedDB存储管理类
 */
export class ChatIndexedDB {
  private static readonly DB_NAME = 'ChatBotDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAMES = {
    CHAT_HISTORY: 'chatHistory',
    MESSAGES: 'messages',
    SETTINGS: 'settings',
  };

  /**
   * 初始化IndexedDB
   */
  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建聊天历史存储
        if (!db.objectStoreNames.contains(this.STORE_NAMES.CHAT_HISTORY)) {
          const historyStore = db.createObjectStore(this.STORE_NAMES.CHAT_HISTORY, {
            keyPath: 'id',
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('module', 'module', { unique: false });
        }

        // 创建消息存储
        if (!db.objectStoreNames.contains(this.STORE_NAMES.MESSAGES)) {
          const messageStore = db.createObjectStore(this.STORE_NAMES.MESSAGES, {
            keyPath: 'id',
          });
          messageStore.createIndex('chatId', 'chatId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建设置存储
        if (!db.objectStoreNames.contains(this.STORE_NAMES.SETTINGS)) {
          db.createObjectStore(this.STORE_NAMES.SETTINGS, {
            keyPath: 'key',
          });
        }
      };
    });
  }

  /**
   * 保存聊天历史到IndexedDB
   */
  static async saveChatHistory(history: ChatHistory): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.CHAT_HISTORY], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAMES.CHAT_HISTORY);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(history);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to save chat history to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 从IndexedDB获取聊天历史
   */
  static async getChatHistory(): Promise<ChatHistory[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.CHAT_HISTORY], 'readonly');
      const store = transaction.objectStore(this.STORE_NAMES.CHAT_HISTORY);

      const histories = await new Promise<ChatHistory[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      db.close();

      // 按时间戳降序排序
      return histories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get chat history from IndexedDB:', error);
      return [];
    }
  }

  /**
   * 删除聊天历史
   */
  static async deleteChatHistory(historyId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.CHAT_HISTORY], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAMES.CHAT_HISTORY);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(historyId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to delete chat history from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 保存消息到IndexedDB
   */
  static async saveMessage(message: Message & { chatId: string }): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.MESSAGES], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAMES.MESSAGES);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(message);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to save message to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * 获取指定聊天的消息
   */
  static async getMessages(chatId: string): Promise<Message[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.MESSAGES], 'readonly');
      const store = transaction.objectStore(this.STORE_NAMES.MESSAGES);
      const index = store.index('chatId');

      const messages = await new Promise<(Message & { chatId: string })[]>((resolve, reject) => {
        const request = index.getAll(chatId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      db.close();

      // 移除chatId字段并按时间戳排序
      return messages
        .map(({ chatId, ...message }) => message)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get messages from IndexedDB:', error);
      return [];
    }
  }
}

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
   * 添加新的聊天记录（同时保存到localStorage和IndexedDB）
   */
  static async addChatHistory(newHistory: ChatHistory): Promise<void> {
    try {
      // 保存到IndexedDB
      await ChatIndexedDB.saveChatHistory(newHistory);

      // 同时保存到localStorage作为备份
      const history = this.getChatHistory();
      history.unshift(newHistory); // 最新的记录放在前面

      // 限制历史记录数量（最多保存100条）
      if (history.length > 100) {
        history.splice(100);
      }

      this.saveChatHistory(history);
    } catch (error) {
      console.error('Failed to add chat history:', error);
      // 如果IndexedDB失败，至少保存到localStorage
      const history = this.getChatHistory();
      history.unshift(newHistory);
      if (history.length > 100) {
        history.splice(100);
      }
      this.saveChatHistory(history);
    }
  }

  /**
   * 删除指定的聊天记录（同时从localStorage和IndexedDB删除）
   */
  static async deleteChatHistory(historyId: string): Promise<void> {
    try {
      // 从IndexedDB删除
      await ChatIndexedDB.deleteChatHistory(historyId);

      // 从localStorage删除
      const history = this.getChatHistory();
      const filteredHistory = history.filter(item => item.id !== historyId);
      this.saveChatHistory(filteredHistory);
    } catch (error) {
      console.error('Failed to delete chat history:', error);
      // 如果IndexedDB失败，至少从localStorage删除
      const history = this.getChatHistory();
      const filteredHistory = history.filter(item => item.id !== historyId);
      this.saveChatHistory(filteredHistory);
    }
  }

  /**
   * 保存消息到IndexedDB
   */
  static async saveMessage(message: Message, chatId: string): Promise<void> {
    try {
      await ChatIndexedDB.saveMessage({ ...message, chatId });
    } catch (error) {
      console.error('Failed to save message to IndexedDB:', error);
    }
  }

  /**
   * 从IndexedDB获取消息
   */
  static async getMessages(chatId: string): Promise<Message[]> {
    try {
      return await ChatIndexedDB.getMessages(chatId);
    } catch (error) {
      console.error('Failed to get messages from IndexedDB:', error);
      return [];
    }
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
