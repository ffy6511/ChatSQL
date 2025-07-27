// 智能体聊天窗口相关类型定义

export type ModuleType = 'coding' | 'ER' | 'Bplus';

export type ActionType = 'navigate' | 'visualize' | 'update';

export interface ActionConfig {
  type: ActionType;
  target: string;
  params?: Record<string, any>;
}

export interface AIResponseMetadata {
  module: ModuleType;
  topic?: string;
  action?: ActionConfig;
}

export interface AIResponse {
  text: string;
  metadata: AIResponseMetadata;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  metadata?: AIResponseMetadata;
}

export interface ChatHistory {
  id: string;
  timestamp: string;
  messages: Message[];
  module: ModuleType;
  title?: string;
}

export interface ChatSettings {
  systemPrompt: string;
  apiPlatform: 'bailianai' | 'dify';
  apiKey: string;
  apiEndpoint?: string;
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
  onActionConfirm?: (action: ActionConfig) => void;
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
  data?: AIResponse;
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
  CHAT_HISTORY: 'chatbot_history',
  CHAT_SETTINGS: 'chatbot_settings',
  CHAT_POSITION: 'chatbot_position',
  CHAT_SIZE: 'chatbot_size',
} as const;

// 默认配置
export const DEFAULT_SETTINGS: ChatSettings = {
  systemPrompt: '你是一个专业的数据库和SQL助手，可以帮助用户解决SQL编程、ER图建模、B+树可视化等相关问题。',
  apiPlatform: 'bailianai',
  apiKey: '',
  apiEndpoint: '',
};

export const DEFAULT_CHAT_STATE: ChatState = {
  isOpen: false,
  currentMessages: [],
  isLoading: false,
  error: null,
};

export const DEFAULT_POSITION = { x: 16, y: 16 };
export const DEFAULT_SIZE = { width: 400, height: 600 };

// 快捷键配置
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_CHAT: 'ctrl+k',
  OPEN_HISTORY: 'ctrl+h',
} as const;
