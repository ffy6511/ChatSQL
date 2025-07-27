// 聊天系统核心数据类型定义

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  /** 消息唯一标识符 */
  id: string;
  /** 消息内容 */
  content: string;
  /** 消息发送者角色 */
  role: 'user' | 'assistant';
  /** 消息创建时间戳 */
  timestamp: string;
  /** 关联的会话ID（后端session_id） */
  session_id: string;
  /** 可选的元数据信息 */
  metadata?: {
    /** 模块类型 */
    module?: 'coding' | 'ER' | 'Bplus';
    /** 主题标签 */
    topic?: string;
    /** 动作配置 */
    action?: {
      type: 'navigate' | 'visualize' | 'update';
      target: string;
      params?: Record<string, any>;
    };
  };
}

/**
 * 聊天会话接口 - 只包含会话元数据
 */
export interface ChatSession {
  /** 前端会话唯一标识符 */
  id: string;
  /** 后端会话标识符，用于API调用 */
  session_id: string | null;
  /** 会话标题 */
  title: string;
  /** 会话创建时间 */
  createdAt: string;
  /** 会话最后更新时间 */
  updatedAt: string;
  /** 会话模块类型 */
  module?: 'coding' | 'ER' | 'Bplus';
  /** 消息数量统计 */
  messageCount: number;
}

/**
 * 聊天状态接口
 */
export interface ChatState {
  /** 所有会话列表 */
  sessions: ChatSession[];
  /** 当前选中的会话ID */
  currentSessionId: string | null;
  /** 当前会话的消息列表 */
  messages: ChatMessage[];
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 聊天上下文类型
 */
export interface ChatContextType {
  // 状态
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // 核心方法
  selectSession: (sessionId: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  sendMessage: (userInput: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // 辅助方法
  clearError: () => void;
  refreshSessions: () => Promise<void>;
}

/**
 * 存储服务接口
 */
export interface ChatStorageInterface {
  // 会话管理
  createSession(): Promise<ChatSession>;
  getAllSessions(): Promise<ChatSession[]>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  updateSession(session: ChatSession): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  
  // 消息管理
  saveMessage(message: ChatMessage): Promise<void>;
  getMessagesBySessionId(session_id: string): Promise<ChatMessage[]>;
  deleteMessagesBySessionId(session_id: string): Promise<void>;
  updateMessageCount(sessionId: string): Promise<void>;
}

/**
 * 默认聊天状态
 */
export const DEFAULT_CHAT_STATE: ChatState = {
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  error: null,
};

/**
 * 生成唯一ID的工具函数
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 格式化时间戳的工具函数
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

/**
 * 截断文本的工具函数
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};
