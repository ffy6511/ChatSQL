/**
 * B+树持久化存储管理器
 * 使用IndexedDB实现B+树状态的持久化存储
 */

// B+树存储数据结构
export interface BPlusTreeStorageData {
  id: string;
  name: string;
  order: number;
  keys: number[];
  createdAt: Date;
  updatedAt: Date;
}

// 存储配置
const DB_NAME = "BPlusTreeStorage";
const DB_VERSION = 1;
const STORE_NAME = "trees";
const AUTO_SAVE_KEY = "auto-save";

export class BPlusTreeStorage {
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
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
    });
  }

  /**
   * 保存B+树状态
   */
  public async saveTree(
    data: Omit<BPlusTreeStorageData, "createdAt" | "updatedAt">,
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const now = new Date();
    const treeData: BPlusTreeStorageData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // 检查是否已存在，如果存在则更新updatedAt
      const getRequest = store.get(data.id);

      getRequest.onsuccess = () => {
        const existingData = getRequest.result;
        if (existingData) {
          treeData.createdAt = existingData.createdAt;
        }

        const putRequest = store.put(treeData);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error("Failed to save tree"));
      };

      getRequest.onerror = () =>
        reject(new Error("Failed to check existing tree"));
    });
  }

  /**
   * 加载B+树状态
   */
  public async loadTree(id: string): Promise<BPlusTreeStorageData | null> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to load tree"));
      };
    });
  }

  /**
   * 获取所有保存的B+树
   */
  public async getAllTrees(): Promise<BPlusTreeStorageData[]> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("updatedAt");
      const request = index.getAll();

      request.onsuccess = () => {
        // 按更新时间倒序排列
        const trees = request.result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        resolve(trees);
      };

      request.onerror = () => {
        reject(new Error("Failed to load trees"));
      };
    });
  }

  /**
   * 删除B+树
   */
  public async deleteTree(id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete tree"));
    });
  }

  /**
   * 自动保存当前B+树状态
   */
  public async autoSave(order: number, keys: number[]): Promise<void> {
    await this.saveTree({
      id: AUTO_SAVE_KEY,
      name: "自动保存",
      order,
      keys,
    });
  }

  /**
   * 加载自动保存的B+树状态
   */
  public async loadAutoSave(): Promise<BPlusTreeStorageData | null> {
    await this.ensureInitialized();
    return this.loadTree(AUTO_SAVE_KEY);
  }

  /**
   * 清空自动保存
   */
  public async clearAutoSave(): Promise<void> {
    await this.deleteTree(AUTO_SAVE_KEY);
  }

  /**
   * 生成唯一ID
   */
  public generateId(): string {
    return `tree-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
let storageInstance: BPlusTreeStorage | null = null;

/**
 * 获取存储管理器单例
 */
export const getBPlusTreeStorage = async (): Promise<BPlusTreeStorage> => {
  if (!storageInstance) {
    storageInstance = new BPlusTreeStorage();
    await storageInstance.initialize();
  }
  return storageInstance;
};
