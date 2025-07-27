// ChatBot组件导出文件

// 主要组件
export { default as ChatWindow } from './ChatWindow';
export { default as MessageList } from './MessageList';
export { default as MessageInput } from './MessageInput';
export { default as ChatSidebar } from './ChatSidebar';
export { default as SettingsModal } from './SettingsModal';

// Hooks
export { useChat } from '@/hooks/chatbot/useChat';
export { useChatHistory } from '@/hooks/chatbot/useChatHistory';
export { useChatSettings } from '@/hooks/chatbot/useChatSettings';

// 工具函数
export { ChatAPI, mockAIResponse } from './utils/chatAPI';
export { ChatStorage, generateId, formatTimestamp, truncateText } from './utils/storage';

// 类型定义
export type {
  ModuleType,
  ActionType,
  ActionConfig,
  AIResponseMetadata,
  AIResponse,
  Message,
  ChatHistory,
  ChatSettings,
  ChatState,
  ChatContextType,
  ChatWindowProps,
  MessageListProps,
  MessageInputProps,
  ChatSidebarProps,
  SettingsModalProps,
  ChatAPIRequest,
  ChatAPIResponse,
  StorageKeys,
} from '@/types/chatbot';

// 常量
export {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CHAT_STATE,
  DEFAULT_POSITION,
  DEFAULT_SIZE,
  KEYBOARD_SHORTCUTS,
} from '@/types/chatbot';
