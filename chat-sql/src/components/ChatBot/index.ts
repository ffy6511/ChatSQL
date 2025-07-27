// ChatBot组件导出文件

// 主要组件
export { default as ChatWindow } from './ChatWindow';
export { default as MessageList } from './MessageList';
export { default as MessageInput } from './MessageInput';
export { default as ChatSidebar } from './ChatSidebar';
export { default as SettingsModal } from './SettingsModal';

// Hooks
export { useChatContext } from '@/contexts/ChatContext';
export { useChatSettings } from '@/contexts/ChatSettingsContext';

// 工具函数
export { ChatAPI, mockAIResponse } from '@/utils/chatbot/chatAPI';
export { ChatStorage, generateId, formatTimestamp, truncateText } from '@/utils/chatbot/storage';

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
