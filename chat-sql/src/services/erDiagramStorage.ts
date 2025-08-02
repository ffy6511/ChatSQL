import { ERDiagramData } from "@/types/ERDiagramTypes/erDiagram";

// 数据库配置
const DB_NAME = "ChatSQL_ERDiagrams";
const DB_VERSION = 1;
const STORE_NAME = "diagrams";

// 存储的图表元数据
export interface ERDiagramMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  entityCount: number;
  relationshipCount: number;
}

// 存储的完整图表数据
export interface StoredERDiagram {
  id: string;
  metadata: ERDiagramMetadata;
  data: ERDiagramData;
}

class ERDiagramStorage {
  private db: IDBDatabase | null = null;

  // 初始化数据库
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

          // 创建索引
          store.createIndex("name", "metadata.name", { unique: false });
          store.createIndex("createdAt", "metadata.createdAt", {
            unique: false,
          });
          store.createIndex("updatedAt", "metadata.updatedAt", {
            unique: false,
          });
        }
      };
    });
  }

  // 生成唯一ID
  private generateId(): string {
    return `er_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 计算图表统计信息
  private calculateStats(data: ERDiagramData): {
    entityCount: number;
    relationshipCount: number;
  } {
    return {
      entityCount: data.entities?.length || 0,
      relationshipCount: data.relationships?.length || 0,
    };
  }

  // 保存图表
  async saveDiagram(data: ERDiagramData, existingId?: string): Promise<string> {
    const db = await this.initDB();
    const id = existingId || this.generateId();
    const now = new Date().toISOString();
    const stats = this.calculateStats(data);

    const metadata: ERDiagramMetadata = {
      id,
      name: data.metadata?.title || "未命名图表",
      description: data.metadata?.description,
      createdAt: data.metadata?.createdAt || now,
      updatedAt: now,
      entityCount: stats.entityCount,
      relationshipCount: stats.relationshipCount,
    };

    const storedDiagram: StoredERDiagram = {
      id,
      metadata,
      data: {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: now,
        },
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storedDiagram);
      request.onsuccess = () => {
        resolve(id);
      };
      request.onerror = () => {
        console.error("保存图表失败:", request.error);
        reject(request.error);
      };
    });
  }

  // 加载图表
  async loadDiagram(id: string): Promise<StoredERDiagram> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error("Diagram not found"));
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to load diagram"));
      };
    });
  }

  // 获取所有图表列表
  async listDiagrams(): Promise<ERDiagramMetadata[]> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const diagrams = request.result.map(
          (item: StoredERDiagram) => item.metadata,
        );
        // 按更新时间倒序排列
        diagrams.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        resolve(diagrams);
      };

      request.onerror = () => {
        reject(new Error("Failed to list diagrams"));
      };
    });
  }

  // 删除图表
  async deleteDiagram(id: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete diagram"));
      };
    });
  }

  // 导出图表为JSON
  async exportDiagram(id: string): Promise<Blob> {
    const diagram = await this.loadDiagram(id);
    const jsonString = JSON.stringify(diagram.data, null, 2);
    return new Blob([jsonString], { type: "application/json" });
  }

  // 导入图表
  async importDiagram(jsonData: string): Promise<string> {
    try {
      const data: ERDiagramData = JSON.parse(jsonData);

      // 验证数据格式
      if (!data.entities || !data.relationships || !data.metadata) {
        throw new Error("Invalid diagram format");
      }

      return await this.saveDiagram(data);
    } catch (error) {
      throw new Error("Failed to import diagram: " + (error as Error).message);
    }
  }

  // 清空所有数据（用于测试或重置）
  async clearAll(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to clear storage"));
      };
    });
  }
}

// 导出单例实例
export const erDiagramStorage = new ERDiagramStorage();

// 导出类型和服务
export default ERDiagramStorage;
