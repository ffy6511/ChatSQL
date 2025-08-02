// 智能体聊天窗口相关类型定义

import { AgentOutputPart } from "./agents";

export interface Message {
  id: string;
  content: string | AgentOutputPart[];
  sender: "user" | "ai";
  timestamp: string;
}

export interface ChatHistory {
  id: string;
  timestamp: string;
  messages: Message[];
  title?: string;
}

export interface ChatSettings {
  systemPrompt: string;
  apiPlatform: "bailianai" | "dify";
  apiKey: string;
  apiEndpoint?: string;
  enableStreaming?: boolean;
  temperature?: number;
  maxTokens?: number;
  // 窗口大小设置
  windowSize?: {
    width: number;
    height: number;
  };
}

export interface ChatState {
  isOpen: boolean;
  currentMessages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatContextType {
  // 聊天状态
  chatState: ChatState;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;

  // 聊天操作
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  toggleChat: () => void;

  // 历史记录
  chatHistory: ChatHistory[];
  loadHistory: (historyId: string) => void;
  saveCurrentChat: (title?: string) => void;
  deleteHistory: (historyId: string) => void;

  // 设置
  settings: ChatSettings;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChatSidebarProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount?: number;
  isHistoryExpanded?: boolean;
  onToggleHistory?: () => void;
}

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

// API相关类型
export interface ChatAPIRequest {
  message: string;
  history?: Message[];
  settings: ChatSettings;
}

export interface ChatAPIResponse {
  success: boolean;
  data?: {
    text: string;
  };
  error?: string;
}

// 本地存储相关类型
export interface StorageKeys {
  CHAT_HISTORY: string;
  CHAT_SETTINGS: string;
  CHAT_POSITION: string;
  CHAT_SIZE: string;
}

export const STORAGE_KEYS: StorageKeys = {
  CHAT_HISTORY: "chatbot_history",
  CHAT_SETTINGS: "chatbot_settings",
  CHAT_POSITION: "chatbot_position",
  CHAT_SIZE: "chatbot_size",
} as const;

export const DEFAULT_POSITION = { x: 16, y: 16 };
export const DEFAULT_SIZE = { width: 400, height: 600 };

// 默认配置
export const DEFAULT_SETTINGS: ChatSettings = {
  systemPrompt:
    "你是一个专业的数据库和SQL助手，可以帮助用户解决SQL编程、ER图建模、B+树可视化等相关问题。",
  apiPlatform: "bailianai",
  apiKey: "",
  apiEndpoint: "",
  enableStreaming: true,
  temperature: 0.7,
  maxTokens: 2000,
  windowSize: DEFAULT_SIZE,
};

export const DEFAULT_CHAT_STATE: ChatState = {
  isOpen: false,
  currentMessages: [],
  isLoading: false,
  error: null,
};

// 快捷键配置
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_CHAT: "ctrl+k",
  OPEN_HISTORY: "ctrl+h",
} as const;
