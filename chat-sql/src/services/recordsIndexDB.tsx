'use client'

export type LLMProblem = {
  id?: number; // IndexedDB自动生成的键
  data: any; // 直接存储整个LLM返回的数据
  createdAt: Date;
};

const DB_NAME = 'llm_problems_db';
const DB_VERSION = 1;
const STORE_NAME = 'problems';

// 初始化数据库
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject('IndexedDB 打开失败');
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
};

// 保存问题数据
export const saveLLMProblem = async (data: any): Promise<number> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const problemData = {
        data,
        createdAt: new Date()
      };
      
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(problemData);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject('保存问题失败');
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    throw error;
  }
};

// 获取所有问题
export const getAllProblems = async (): Promise<LLMProblem[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject('获取问题列表失败');
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    throw error;
  }
};

// 根据ID获取问题
export const getProblemById = async (id: number): Promise<LLMProblem | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject('获取问题失败');
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    throw error;
  }
};
