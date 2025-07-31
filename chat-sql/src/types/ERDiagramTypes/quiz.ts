import { ERDiagramData } from '@/types/ERDiagramTypes/erDiagram';

/**
 * Quiz题目接口定义
 */
export interface Quiz {
  id: string; // 唯一标识符，使用UUID格式
  name: string; // 题目名称，支持用户自定义或自动生成
  description: string; // 题目描述文本（来自er_quiz_generator的description字段）
  referenceAnswer: ERDiagramData; // 标准答案ER图数据（来自er_quiz_generator的erData字段）
  createdAt: number; // 创建时间戳
  updatedAt?: number; // 可选的更新时间戳
}

/**
 * 创建Quiz时的输入数据类型
 */
export type CreateQuizInput = Omit<Quiz, 'id' | 'createdAt'>;

/**
 * 更新Quiz时的输入数据类型
 */
export type UpdateQuizInput = Partial<Omit<Quiz, 'id'>>;

/**
 * Quiz存储服务接口
 */
export interface QuizStorageService {
  addQuiz(quizData: CreateQuizInput): Promise<string>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  updateQuiz(id: string, updates: UpdateQuizInput): Promise<void>;
  deleteQuiz(id: string): Promise<void>;
  searchQuizzes(keyword: string): Promise<Quiz[]>;
  getQuizzesByDateRange(startDate: number, endDate: number): Promise<Quiz[]>;
}

/**
 * Quiz选择器组件的Props接口
 */
export interface QuizSelectorProps {
  value: string; // 当前选中的quiz_id
  onChange: (quizId: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Quiz历史面板的Props接口
 */
export interface QuizHistoryPanelProps {
  onQuizSelect?: (quiz: Quiz) => void;
  onQuizDelete?: (quizId: string) => void;
  onQuizUpdate?: (quizId: string, updates: UpdateQuizInput) => void;
}

/**
 * Quiz验证请求的数据结构
 */
export interface QuizVerificationRequest {
  quiz_id: string;
  user_answer_session_id: string;
}

/**
 * Quiz验证的完整数据结构
 */
export interface QuizVerificationData {
  quiz: Quiz;
  userAnswer: ERDiagramData;
  description: string;
  erDiagramDone: string; // JSON字符串
  erDiagramAns: string; // JSON字符串
}

/**
 * Quiz搜索和筛选选项
 */
export interface QuizSearchOptions {
  keyword?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Quiz统计信息
 */
export interface QuizStats {
  totalCount: number;
  recentCount: number; // 最近7天创建的题目数量
  averageDescriptionLength: number;
  oldestQuizDate?: number;
  newestQuizDate?: number;
}
