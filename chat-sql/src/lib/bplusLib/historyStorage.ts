/**
 * B+树操作历史存储管理器
 * 使用IndexedDB实现历史会话和步骤的持久化存储
 * 采用简化的数据模型，将步骤直接存储在会话对象中
 */

import { HistorySession, HistoryStep } from "@/types/BplusTypes/bPlusHistory";

// 存储配置
const DB_NAME = "BPlusHistoryStorage";
const DB_VERSION = 2; // 升级到版本2，采用新的数据模型
const SESSIONS_STORE = "sessions";

/**
 * B+树历史存储管理器
 */
export class BPlusHistoryStorage {
  private db: IDBDatabase | null = null;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.initialize();
  }

  private async ensureInitialized() {
    await this.initialized;
  }

  /**
   * 初始化IndexedDB连接
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB for history storage"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建或更新会话存储
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionStore = db.createObjectStore(SESSIONS_STORE, {
            keyPath: "id",
          });
          sessionStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // 在 v2 中，我们不再需要独立的 steps_store
        if (db.objectStoreNames.contains("steps")) {
          db.deleteObjectStore("steps");
        }
      };
    });
  }

  /**
   * 生成唯一ID
   */
  public generateId(prefix: string = "item"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 创建新的历史会话
   */
  public async createSession(
    sessionData: Omit<
      HistorySession,
      "id" | "createdAt" | "updatedAt" | "statistics"
    >,
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const sessionId = this.generateId("session");
    const now = Date.now();

    const session: HistorySession = {
      ...sessionData,
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      steps: [], // 确保steps数组存在
      statistics: {
        totalOperations: 0,
        insertCount: 0,
        deleteCount: 0,
        resetCount: 0,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(session);
      request.onsuccess = () => resolve(sessionId);
      request.onerror = () => reject(new Error("Failed to create session"));
    });
  }

  /**
   * 获取单个历史会话 (现在已包含所有步骤)
   */
  public async getSession(sessionId: string): Promise<HistorySession | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readonly");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error("Failed to get session"));
    });
  }

  /**
   * 获取所有历史会话 (现在已包含所有步骤)
   */
  public async getAllSessions(): Promise<HistorySession[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readonly");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions = request.result.sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
        resolve(sessions);
      };
      request.onerror = () => reject(new Error("Failed to get all sessions"));
    });
  }

  /**
   * 更新历史会话的元数据 (不包括步骤)
   */
  public async updateSession(
    sessionId: string,
    updates: Partial<Omit<HistorySession, "steps">>,
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const getRequest = store.get(sessionId);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session) return reject(new Error("Session not found"));

        const updatedSession = {
          ...session,
          ...updates,
          updatedAt: Date.now(),
        };
        const putRequest = store.put(updatedSession);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () =>
          reject(new Error("Failed to update session"));
      };
      getRequest.onerror = () =>
        reject(new Error("Failed to get session for update"));
    });
  }

  /**
   * 删除历史会话
   */
  public async deleteSession(sessionId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete session"));
    });
  }

  /**
   * 添加历史步骤到指定会话
   */
  public async addStep(
    sessionId: string,
    stepData: Omit<HistoryStep, "id">,
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readwrite");
      const store = transaction.objectStore(SESSIONS_STORE);
      const getRequest = store.get(sessionId);

      getRequest.onerror = () =>
        reject(new Error("Failed to get session to add step"));
      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session) return reject(new Error("Session not found to add step"));

        const stepId = this.generateId("step");
        const newStep: HistoryStep = { ...stepData, id: stepId };

        // 更新会话
        session.steps.push(newStep);
        session.updatedAt = Date.now();

        // 更新统计
        session.statistics.totalOperations++;
        if (newStep.operation === "insert") session.statistics.insertCount++;
        else if (newStep.operation === "delete")
          session.statistics.deleteCount++;
        else if (newStep.operation === "reset") session.statistics.resetCount++;
        if (newStep.success) session.statistics.successCount++;
        else session.statistics.errorCount++;
        if (newStep.duration)
          session.statistics.totalDuration += newStep.duration;

        const putRequest = store.put(session);
        putRequest.onerror = () =>
          reject(new Error("Failed to save session with new step"));
        putRequest.onsuccess = () => resolve(stepId);
      };
    });
  }
}

// 单例实例
let historyStorageInstance: BPlusHistoryStorage | null = null;

/**
 * 获取历史存储管理器单例
 */
export const getBPlusHistoryStorage =
  async (): Promise<BPlusHistoryStorage> => {
    if (!historyStorageInstance) {
      historyStorageInstance = new BPlusHistoryStorage();
    }
    await historyStorageInstance.initialize();
    return historyStorageInstance;
  };
