/**
 * B+树操作历史存储管理器
 * 使用IndexedDB实现历史会话和步骤的持久化存储
 */

import { 
  HistorySession, 
  HistoryStep, 
  HistoryQuery, 
  HistoryStatistics,
  HistoryManagerConfig,
  HistoryEvent,
  HistoryEventListener
} from '@/types/bPlusHistory';

// 存储配置
const DB_NAME = 'BPlusHistoryStorage';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const STEPS_STORE = 'steps';
const CONFIG_STORE = 'config';

// 默认配置
const DEFAULT_CONFIG: HistoryManagerConfig = {
  maxSessions: 50,
  maxStepsPerSession: 100,
  autoSave: true,
  autoSaveInterval: 5000,
  compressData: false
};

/**
 * B+树历史存储管理器
 */
export class BPlusHistoryStorage {
  private db: IDBDatabase | null = null;
  private initialized: Promise<void>;
  private eventListeners: HistoryEventListener[] = [];
  private config: HistoryManagerConfig = DEFAULT_CONFIG;

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
        reject(new Error('Failed to open IndexedDB for history storage'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.loadConfig().then(() => resolve());
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建会话存储
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          sessionStore.createIndex('name', 'name', { unique: false });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          sessionStore.createIndex('order', 'order', { unique: false });
        }

        // 创建步骤存储
        if (!db.objectStoreNames.contains(STEPS_STORE)) {
          const stepStore = db.createObjectStore(STEPS_STORE, { keyPath: 'id' });
          stepStore.createIndex('sessionId', 'sessionId', { unique: false });
          stepStore.createIndex('timestamp', 'timestamp', { unique: false });
          stepStore.createIndex('operation', 'operation', { unique: false });
        }

        // 创建配置存储
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(listener: HistoryEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(listener: HistoryEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: HistoryEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in history event listener:', error);
      }
    });
  }

  /**
   * 创建新的历史会话
   */
  public async createSession(sessionData: Omit<HistorySession, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sessionId = this.generateId('session');
    const now = Date.now();
    
    const session: HistorySession = {
      ...sessionData,
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      statistics: {
        totalOperations: 0,
        insertCount: 0,
        deleteCount: 0,
        resetCount: 0,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(session);

      request.onsuccess = () => {
        this.emitEvent({
          type: 'session_created',
          timestamp: now,
          sessionId,
          data: session
        });
        resolve(sessionId);
      };

      request.onerror = () => {
        reject(new Error('Failed to create session'));
      };
    });
  }

  /**
   * 获取历史会话
   */
  public async getSession(sessionId: string): Promise<HistorySession | null> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get session'));
      };
    });
  }

  /**
   * 获取所有历史会话
   */
  public async getAllSessions(): Promise<HistorySession[]> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('updatedAt');
      const request = index.getAll();

      request.onsuccess = () => {
        // 按更新时间倒序排列
        const sessions = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(sessions);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all sessions'));
      };
    });
  }

  /**
   * 更新历史会话
   */
  public async updateSession(sessionId: string, updates: Partial<HistorySession>): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const getRequest = store.get(sessionId);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session) {
          reject(new Error('Session not found'));
          return;
        }

        const updatedSession = {
          ...session,
          ...updates,
          id: sessionId, // 确保ID不被覆盖
          updatedAt: Date.now()
        };

        const putRequest = store.put(updatedSession);
        
        putRequest.onsuccess = () => {
          this.emitEvent({
            type: 'session_updated',
            timestamp: Date.now(),
            sessionId,
            data: updatedSession
          });
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error('Failed to update session'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get session for update'));
      };
    });
  }

  /**
   * 删除历史会话
   */
  public async deleteSession(sessionId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE, STEPS_STORE], 'readwrite');
      
      // 删除会话
      const sessionStore = transaction.objectStore(SESSIONS_STORE);
      const deleteSessionRequest = sessionStore.delete(sessionId);

      // 删除相关步骤
      const stepStore = transaction.objectStore(STEPS_STORE);
      const stepIndex = stepStore.index('sessionId');
      const getStepsRequest = stepIndex.getAll(sessionId);

      getStepsRequest.onsuccess = () => {
        const steps = getStepsRequest.result;
        steps.forEach(step => {
          stepStore.delete(step.id);
        });
      };

      deleteSessionRequest.onsuccess = () => {
        this.emitEvent({
          type: 'session_deleted',
          timestamp: Date.now(),
          sessionId
        });
        resolve();
      };

      deleteSessionRequest.onerror = () => {
        reject(new Error('Failed to delete session'));
      };
    });
  }

  /**
   * 添加历史步骤
   */
  public async addStep(sessionId: string, stepData: Omit<HistoryStep, 'id'>): Promise<string> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stepId = this.generateId('step');
    const step: HistoryStep = {
      ...stepData,
      id: stepId
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STEPS_STORE, SESSIONS_STORE], 'readwrite');
      
      // 添加步骤
      const stepStore = transaction.objectStore(STEPS_STORE);
      const addStepRequest = stepStore.add(step);

      // 更新会话统计
      const sessionStore = transaction.objectStore(SESSIONS_STORE);
      const getSessionRequest = sessionStore.get(sessionId);

      getSessionRequest.onsuccess = () => {
        const session = getSessionRequest.result;
        if (session) {
          // 更新统计信息
          session.statistics.totalOperations++;
          if (step.operation === 'insert') session.statistics.insertCount++;
          else if (step.operation === 'delete') session.statistics.deleteCount++;
          else if (step.operation === 'reset') session.statistics.resetCount++;
          
          if (step.success) session.statistics.successCount++;
          else session.statistics.errorCount++;
          
          if (step.duration) session.statistics.totalDuration += step.duration;
          
          session.updatedAt = Date.now();
          sessionStore.put(session);
        }
      };

      addStepRequest.onsuccess = () => {
        this.emitEvent({
          type: 'step_added',
          timestamp: Date.now(),
          sessionId,
          stepId,
          data: step
        });
        resolve(stepId);
      };

      addStepRequest.onerror = () => {
        reject(new Error('Failed to add step'));
      };
    });
  }

  /**
   * 生成唯一ID
   */
  public generateId(prefix: string = 'item'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CONFIG_STORE], 'readonly');
      const store = transaction.objectStore(CONFIG_STORE);
      const request = store.get('config');

      request.onsuccess = () => {
        if (request.result) {
          this.config = { ...DEFAULT_CONFIG, ...request.result.value };
        }
        resolve();
      };

      request.onerror = () => {
        resolve(); // 使用默认配置
      };
    });
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 单例实例
let historyStorageInstance: BPlusHistoryStorage | null = null;

/**
 * 获取历史存储管理器单例
 */
export const getBPlusHistoryStorage = async (): Promise<BPlusHistoryStorage> => {
  if (!historyStorageInstance) {
    historyStorageInstance = new BPlusHistoryStorage();
    await historyStorageInstance.initialize();
  }
  return historyStorageInstance;
};
