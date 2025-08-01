import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { 
  Quiz, 
  CreateQuizInput, 
  UpdateQuizInput, 
  QuizStorageService,
  QuizSearchOptions,
  QuizStats
} from '@/types/ERDiagramTypes/quiz';

/**
 * IndexedDB数据库结构定义
 */
interface QuizDB extends DBSchema {
  quizzes: {
    key: string;
    value: Quiz;
    indexes: {
      'by-created-at': number;
      'by-updated-at': number;
      'by-name': string;
    };
  };
}

/**
 * Quiz存储服务实现类
 */
class QuizStorageServiceImpl implements QuizStorageService {
  private dbName = 'quiz-storage';
  private version = 1;
  private db: IDBPDatabase<QuizDB> | null = null;

  /**
   * 初始化数据库连接
   */
  private async initDB(): Promise<IDBPDatabase<QuizDB>> {
    if (this.db) {
      return this.db;
    }

    try {
      this.db = await openDB<QuizDB>(this.dbName, this.version, {
        upgrade(db) {
          // 创建quizzes对象存储
          const quizStore = db.createObjectStore('quizzes', {
            keyPath: 'id',
          });

          // 创建索引
          quizStore.createIndex('by-created-at', 'createdAt');
          quizStore.createIndex('by-updated-at', 'updatedAt');
          quizStore.createIndex('by-name', 'name');
        },
      });

      return this.db;
    } catch (error) {
      console.error('初始化Quiz数据库失败:', error);
      throw new Error('无法初始化Quiz存储服务');
    }
  }

  /**
   * 添加新题目
   */
  async addQuiz(quizData: CreateQuizInput): Promise<string> {
    try {
      const db = await this.initDB();
      const id = uuidv4();
      const now = Date.now();

      const quiz: Quiz = {
        id,
        ...quizData,
        createdAt: now,
        updatedAt: quizData.updatedAt || now,
      };

      await db.add('quizzes', quiz);
      console.log('题目保存成功:', id);
      return id;
    } catch (error) {
      console.error('保存题目失败:', error);
      throw new Error('保存题目失败，请重试');
    }
  }

  /**
   * 根据ID获取题目
   */
  async getQuiz(id: string): Promise<Quiz | undefined> {
    try {
      const db = await this.initDB();
      const quiz = await db.get('quizzes', id);
      return quiz;
    } catch (error) {
      console.error('获取题目失败:', error);
      throw new Error('获取题目失败');
    }
  }

  /**
   * 获取所有题目
   */
  async getAllQuizzes(): Promise<Quiz[]> {
    try {
      const db = await this.initDB();
      const quizzes = await db.getAllFromIndex('quizzes', 'by-created-at');
      // 按创建时间倒序排列（最新的在前）
      return quizzes.reverse();
    } catch (error) {
      console.error('获取题目列表失败:', error);
      throw new Error('获取题目列表失败');
    }
  }

  /**
   * 更新题目
   */
  async updateQuiz(id: string, updates: UpdateQuizInput): Promise<void> {
    try {
      const db = await this.initDB();
      const existingQuiz = await db.get('quizzes', id);
      
      if (!existingQuiz) {
        throw new Error('题目不存在');
      }

      const updatedQuiz: Quiz = {
        ...existingQuiz,
        ...updates,
        updatedAt: Date.now(),
      };

      await db.put('quizzes', updatedQuiz);
      console.log('题目更新成功:', id);
    } catch (error) {
      console.error('更新题目失败:', error);
      throw new Error('更新题目失败');
    }
  }

  /**
   * 删除题目
   */
  async deleteQuiz(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      await db.delete('quizzes', id);
      console.log('题目删除成功:', id);
    } catch (error) {
      console.error('删除题目失败:', error);
      throw new Error('删除题目失败');
    }
  }

  // 删除全部题目
  async deleteAllQuizzes(): Promise<void> {
    try{
      const db = await this.initDB();
      await db.clear('quizzes');
      console.log('所有题目已删除');
    }catch (error){
      console.error('删除所有题目失败:', error);
      throw new Error('删除所有题目失败');
    }
  }
  

  /**
   * 搜索题目
   */
  async searchQuizzes(keyword: string): Promise<Quiz[]> {
    try {
      const db = await this.initDB();
      const allQuizzes = await this.getAllQuizzes();
      
      if (!keyword.trim()) {
        return allQuizzes;
      }

      const lowerKeyword = keyword.toLowerCase();
      return allQuizzes.filter(quiz => 
        quiz.name.toLowerCase().includes(lowerKeyword) ||
        quiz.description.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('搜索题目失败:', error);
      throw new Error('搜索题目失败');
    }
  }

  /**
   * 根据日期范围获取题目
   */
  async getQuizzesByDateRange(startDate: number, endDate: number): Promise<Quiz[]> {
    try {
      const db = await this.initDB();
      const allQuizzes = await this.getAllQuizzes();
      
      return allQuizzes.filter(quiz => 
        quiz.createdAt >= startDate && quiz.createdAt <= endDate
      );
    } catch (error) {
      console.error('按日期范围获取题目失败:', error);
      throw new Error('按日期范围获取题目失败');
    }
  }

  /**
   * 获取题目统计信息
   */
  async getQuizStats(): Promise<QuizStats> {
    try {
      const allQuizzes = await this.getAllQuizzes();
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      const recentQuizzes = allQuizzes.filter(quiz => quiz.createdAt >= sevenDaysAgo);
      const totalDescriptionLength = allQuizzes.reduce((sum, quiz) => sum + quiz.description.length, 0);

      return {
        totalCount: allQuizzes.length,
        recentCount: recentQuizzes.length,
        averageDescriptionLength: allQuizzes.length > 0 ? Math.round(totalDescriptionLength / allQuizzes.length) : 0,
        oldestQuizDate: allQuizzes.length > 0 ? Math.min(...allQuizzes.map(q => q.createdAt)) : undefined,
        newestQuizDate: allQuizzes.length > 0 ? Math.max(...allQuizzes.map(q => q.createdAt)) : undefined,
      };
    } catch (error) {
      console.error('获取题目统计失败:', error);
      throw new Error('获取题目统计失败');
    }
  }

  /**
   * 清空所有题目（用于测试或重置）
   */
  async clearAllQuizzes(): Promise<void> {
    try {
      const db = await this.initDB();
      await db.clear('quizzes');
      console.log('所有题目已清空');
    } catch (error) {
      console.error('清空题目失败:', error);
      throw new Error('清空题目失败');
    }
  }
}

// 创建单例实例
export const quizStorage = new QuizStorageServiceImpl();

// 导出类型和服务
export type { QuizStorageService };
export default quizStorage;
