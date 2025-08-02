// 聊天记录持久化服务 - 基于IndexedDB的单例模式实现

import {
  ChatSession,
  ChatMessage,
  ChatStorageInterface,
  generateId,
  truncateText,
} from "@/types/chat";

/**
 * 聊天存储服务类 - 单例模式
 */
export class ChatStorage implements ChatStorageInterface {
  private static instance: ChatStorage;
  private static readonly DB_NAME = "ChatSystemDB";
  private static readonly DB_VERSION = 1;
  private static readonly SESSIONS_STORE = "sessions";
  private static readonly MESSAGES_STORE = "messages";

  private db: IDBDatabase | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ChatStorage {
    if (!ChatStorage.instance) {
      ChatStorage.instance = new ChatStorage();
    }
    return ChatStorage.instance;
  }

  /**
   * 初始化IndexedDB连接
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        ChatStorage.DB_NAME,
        ChatStorage.DB_VERSION,
      );

      request.onerror = () => {
        reject(new Error(`IndexedDB打开失败: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建会话存储对象仓库
        if (!db.objectStoreNames.contains(ChatStorage.SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(
            ChatStorage.SESSIONS_STORE,
            {
              keyPath: "id",
            },
          );

          // 创建索引
          sessionsStore.createIndex("session_id", "session_id", {
            unique: false,
          });
          sessionsStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          sessionsStore.createIndex("updatedAt", "updatedAt", {
            unique: false,
          });
          sessionsStore.createIndex("module", "module", { unique: false });
        }

        // 创建消息存储对象仓库
        if (!db.objectStoreNames.contains(ChatStorage.MESSAGES_STORE)) {
          const messagesStore = db.createObjectStore(
            ChatStorage.MESSAGES_STORE,
            {
              keyPath: "id",
            },
          );

          // 创建索引
          messagesStore.createIndex("session_id", "session_id", {
            unique: false,
          });
          messagesStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
          messagesStore.createIndex("role", "role", { unique: false });
        }
      };
    });
  }

  /**
   * 创建新的空会话
   */
  public async createSession(): Promise<ChatSession> {
    try {
      const db = await this.initDB();
      const now = new Date().toISOString();

      const newSession: ChatSession = {
        id: generateId(),
        session_id: null, // 初始为null，将在第一次API调用时设置
        title: "新对话",
        createdAt: now,
        updatedAt: now,
        module: "coding",
        messageCount: 0,
      };

      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(newSession);
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`创建会话失败: ${request.error?.message}`));
      });

      return newSession;
    } catch (error) {
      console.error("创建会话失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有会话列表
   */
  public async getAllSessions(): Promise<ChatSession[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readonly",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);
      const index = store.index("updatedAt");

      return new Promise((resolve, reject) => {
        const request = index.openCursor(null, "prev"); // 按更新时间倒序
        const sessions: ChatSession[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            sessions.push(cursor.value);
            cursor.continue();
          } else {
            resolve(sessions);
          }
        };

        request.onerror = () => {
          reject(new Error(`获取会话列表失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error("获取会话列表失败:", error);
      return [];
    }
  }

  /**
   * 重命名会话
   */
  public async renameSession(
    sessionId: string,
    newName: string,
  ): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);

      return new Promise<void>((resolve, reject) => {
        const getRequest = store.get(sessionId);
        getRequest.onsuccess = () => {
          const session = getRequest.result;
          if (!session) {
            reject(new Error("会话不存在"));
            return;
          }

          session.title = newName;
          session.updatedAt = new Date().toISOString();

          const putRequest = store.put(session);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () =>
            reject(new Error(`重命名会话失败: ${putRequest.error?.message}`));
        };
        getRequest.onerror = () =>
          reject(new Error(`获取会话失败: ${getRequest.error?.message}`));
      });
    } catch (error) {
      console.error("重命名会话失败:", error);
      throw error;
    }
  }

  /**
   * 获取指定会话
   */
  public async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readonly",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get(sessionId);
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          reject(new Error(`获取会话失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error("获取会话失败:", error);
      return null;
    }
  }

  /**
   * 更新会话信息
   */
  public async updateSession(session: ChatSession): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);

      return new Promise<void>((resolve, reject) => {
        const updatedSession = {
          ...session,
          updatedAt: new Date().toISOString(),
        };

        const request = store.put(updatedSession);
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`更新会话失败: ${request.error?.message}`));
      });
    } catch (error) {
      console.error("更新会话失败:", error);
      throw error;
    }
  }

  /**
   * 删除指定会话
   */
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      const db = await this.initDB();
      const session = await this.getSession(sessionId);

      if (session && session.session_id) {
        // 先删除相关的消息
        await this.deleteMessagesBySessionId(session.session_id);
      }

      // 删除会话
      const transaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.SESSIONS_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(sessionId);
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`删除会话失败: ${request.error?.message}`));
      });
    } catch (error) {
      console.error("删除会话失败:", error);
      throw error;
    }
  }

  /**
   * 保存消息
   */
  public async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.MESSAGES_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.MESSAGES_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(message);
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`保存消息失败: ${request.error?.message}`));
      });
    } catch (error) {
      console.error("保存消息失败:", error);
      throw error;
    }
  }

  /**
   * 根据session_id获取消息列表
   */
  public async getMessagesBySessionId(
    session_id: string,
  ): Promise<ChatMessage[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.MESSAGES_STORE],
        "readonly",
      );
      const store = transaction.objectStore(ChatStorage.MESSAGES_STORE);
      const index = store.index("session_id");

      return new Promise((resolve, reject) => {
        const request = index.getAll(session_id);
        request.onsuccess = () => {
          const messages = request.result || [];
          // 按时间戳排序
          messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          resolve(messages);
        };
        request.onerror = () => {
          reject(new Error(`获取消息失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error("获取消息失败:", error);
      return [];
    }
  }

  /**
   * 删除指定session_id的所有消息
   */
  public async deleteMessagesBySessionId(session_id: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(
        [ChatStorage.MESSAGES_STORE],
        "readwrite",
      );
      const store = transaction.objectStore(ChatStorage.MESSAGES_STORE);
      const index = store.index("session_id");

      return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(session_id));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => {
          reject(new Error(`删除消息失败: ${request.error?.message}`));
        };
      });
    } catch (error) {
      console.error("删除消息失败:", error);
      throw error;
    }
  }

  /**
   * 更新会话的消息数量
   */
  public async updateMessageCount(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session || !session.session_id) return;

      const messages = await this.getMessagesBySessionId(session.session_id);
      const updatedSession = {
        ...session,
        messageCount: messages.length,
        // 根据第一条用户消息更新标题
        title:
          messages.length > 0 && messages[0].role === "user"
            ? truncateText(messages[0].content, 30)
            : session.title,
      };

      await this.updateSession(updatedSession);
    } catch (error) {
      console.error("更新消息数量失败:", error);
      throw error;
    }
  }

  /**
   * 清空所有会话和消息
   */
  public async clearAllSessions(): Promise<void> {
    try {
      const db = await this.initDB();

      // 获取所有会话
      const sessions = await this.getAllSessions();

      // 删除所有消息
      const messagesTransaction = db.transaction(
        [ChatStorage.MESSAGES_STORE],
        "readwrite",
      );
      const messagesStore = messagesTransaction.objectStore(
        ChatStorage.MESSAGES_STORE,
      );
      await new Promise<void>((resolve, reject) => {
        const request = messagesStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`清空消息失败: ${request.error?.message}`));
      });

      // 删除所有会话
      const sessionsTransaction = db.transaction(
        [ChatStorage.SESSIONS_STORE],
        "readwrite",
      );
      const sessionsStore = sessionsTransaction.objectStore(
        ChatStorage.SESSIONS_STORE,
      );
      await new Promise<void>((resolve, reject) => {
        const request = sessionsStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error(`清空会话失败: ${request.error?.message}`));
      });
    } catch (error) {
      console.error("清空所有会话失败:", error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  public closeDB(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出单例实例
export const chatStorage = ChatStorage.getInstance();
