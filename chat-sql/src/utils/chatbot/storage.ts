// 本地存储工具函数

import {
  ChatHistory,
  ChatSettings,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_POSITION,
  DEFAULT_SIZE,
  Message
} from '@/types/chatBotTypes/chatbot';

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
   * 根据ID从IndexedDB获取特定的聊天历史记录
   */
  static async getChatHistoryById(historyId: string): Promise<ChatHistory | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.CHAT_HISTORY], 'readonly');
      const store = transaction.objectStore(this.STORE_NAMES.CHAT_HISTORY);

      const result = await new Promise<ChatHistory | undefined>((resolve, reject) => {
        const request = store.get(historyId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();
      return result || null;
    } catch (error) {
      console.error('Failed to get chat history by ID from IndexedDB:', error);
      throw error;
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
   * 清空所有聊天历史记录
   */
  static async clearAllHistory(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAMES.CHAT_HISTORY], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAMES.CHAT_HISTORY);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to clear all chat history from IndexedDB:', error);
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
   * 获取聊天历史记录 - 从IndexedDB获取，localStorage作为备用
   */
  static async getChatHistory(): Promise<ChatHistory[]> {
    try {
      // 首先尝试从IndexedDB获取
      const indexedDBHistory = await ChatIndexedDB.getChatHistory();
      if (indexedDBHistory.length > 0) {
        return indexedDBHistory;
      }

      // 如果IndexedDB没有数据，尝试从localStorage获取并迁移
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (stored) {
        const localHistory: ChatHistory[] = JSON.parse(stored);
        // 迁移到IndexedDB
        for (const item of localHistory) {
          try {
            await ChatIndexedDB.saveChatHistory(item);
          } catch (migrateError) {
            console.warn('Failed to migrate history item to IndexedDB:', migrateError);
          }
        }
        // 迁移完成后清除localStorage
        localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
        return localHistory;
      }

      return [];
    } catch (error) {
      console.error('Failed to get chat history:', error);
      // 降级到localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        return stored ? JSON.parse(stored) : [];
      } catch (localError) {
        console.error('Failed to get chat history from localStorage:', localError);
        return [];
      }
    }
  }

  /**
   * 保存聊天历史记录 - 已废弃，使用addChatHistory代替
   * @deprecated 使用addChatHistory代替
   */
  static saveChatHistory(history: ChatHistory[]): void {
    console.warn('saveChatHistory is deprecated, use addChatHistory instead');
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  /**
   * 添加新的聊天记录 - 仅保存到IndexedDB
   */
  static async addChatHistory(newHistory: ChatHistory): Promise<void> {
    try {
      // 保存到IndexedDB
      await ChatIndexedDB.saveChatHistory(newHistory);
    } catch (error) {
      console.error('Failed to add chat history to IndexedDB:', error);
      throw error; // 抛出错误，让调用方处理
    }
  }

  /**
   * 删除指定的聊天记录 - 仅从IndexedDB删除
   */
  static async deleteChatHistory(historyId: string): Promise<void> {
    try {
      // 从IndexedDB删除
      await ChatIndexedDB.deleteChatHistory(historyId);
    } catch (error) {
      console.error('Failed to delete chat history from IndexedDB:', error);
      throw error; // 抛出错误，让调用方处理
    }
  }

  /**
   * 清空所有聊天历史记录 - 从IndexedDB清空
   */
  static async clearAllHistory(): Promise<void> {
    try {
      // 从IndexedDB清空
      await ChatIndexedDB.clearAllHistory();
    } catch (error) {
      console.error('Failed to clear all chat history from IndexedDB:', error);
      throw error; // 抛出错误，让调用方处理
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

  // ===== 基于会话的新方法 =====

  /**
   * 创建新会话
   * @param initialMessages 可选的初始消息数组
   * @returns 返回新创建的会话ID
   */
  static async createSession(
    initialMessages: Message[] = []
  ): Promise<string> {
    try {
      // 生成会话标题
      const firstUserMessage = initialMessages.find(msg => msg.sender === 'user');
      const title = firstUserMessage ?
        truncateText(firstUserMessage.content, 30) :
        '新对话';

      const newSession: ChatHistory = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        messages: initialMessages,
        title,
      };

      // 保存到IndexedDB
      await ChatIndexedDB.saveChatHistory(newSession);

      console.log('新会话已创建:', newSession.id, newSession.title);
      return newSession.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * 更新会话的消息列表
   * @param sessionId 会话ID
   * @param messages 完整的消息列表
   */
  static async updateSession(sessionId: string, messages: Message[]): Promise<void> {
    try {
      // 获取现有会话
      const existingSession = await ChatIndexedDB.getChatHistoryById(sessionId);
      if (!existingSession) {
        throw new Error(`会话不存在: ${sessionId}`);
      }

      // 更新标题（基于第一条用户消息）
      const firstUserMessage = messages.find(msg => msg.sender === 'user');
      const newTitle = firstUserMessage ?
        truncateText(firstUserMessage.content, 30) :
        existingSession.title;

      // 创建更新后的会话对象
      const updatedSession: ChatHistory = {
        ...existingSession,
        messages,
        title: newTitle,
        timestamp: new Date().toISOString(), // 更新时间戳
      };

      // 保存到IndexedDB
      await ChatIndexedDB.saveChatHistory(updatedSession);

      console.log('会话已更新:', sessionId, `消息数量: ${messages.length}`);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * 根据会话ID获取完整的会话数据
   * @param sessionId 会话ID
   * @returns 返回ChatHistory对象，如果不存在则返回null
   */
  static async getSession(sessionId: string): Promise<ChatHistory | null> {
    try {
      const session = await ChatIndexedDB.getChatHistoryById(sessionId);
      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * 根据ID获取特定的聊天记录 - 从IndexedDB获取
   */
  static async getChatHistoryById(historyId: string): Promise<ChatHistory | null> {
    try {
      const allHistory = await ChatIndexedDB.getChatHistory();
      return allHistory.find(item => item.id === historyId) || null;
    } catch (error) {
      console.error('Failed to get chat history by ID from IndexedDB:', error);
      // 降级到localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        if (stored) {
          const history: ChatHistory[] = JSON.parse(stored);
          return history.find(item => item.id === historyId) || null;
        }
      } catch (localError) {
        console.error('Failed to get chat history by ID from localStorage:', localError);
      }
      return null;
    }
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
  static async exportData(): Promise<string> {
    const data = {
      history: await this.getChatHistory(),
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
  static async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);

      if (data.history && Array.isArray(data.history)) {
        // 将历史记录导入到IndexedDB
        for (const historyItem of data.history) {
          try {
            await this.addChatHistory(historyItem);
          } catch (historyError) {
            console.warn('Failed to import history item:', historyError);
          }
        }
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
export const truncateText = (text: string | import('@/types/chatBotTypes/agents').AgentOutputPart[], maxLength: number = 30): string => {
  // 处理结构化对象（parts数组）
  if (typeof text === 'object' && Array.isArray(text)) {
    // 从parts数组中提取文本内容
    const textParts = text.filter((part: import('@/types/chatBotTypes/agents').AgentOutputPart) =>
      part.type === 'text'
    ).map((part: import('@/types/chatBotTypes/agents').AgentOutputPart) => part.content).join(' ') || '';

    const textContent = textParts || JSON.stringify(text);
    if (textContent.length <= maxLength) {
      return textContent;
    }
    return textContent.substring(0, maxLength) + '...';
  }

  // 处理字符串
  if (typeof text === 'string') {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  // 处理其他类型
  const stringText = JSON.stringify(text);
  if (stringText.length <= maxLength) {
    return stringText;
  }
  return stringText.substring(0, maxLength - 3) + '...';
};
