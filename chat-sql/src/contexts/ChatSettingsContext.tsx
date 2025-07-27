// ChatSettings Context - 全局管理聊天设置状态

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatSettings, DEFAULT_SETTINGS } from '@/types/chatbot';
import { ChatStorage } from '@/utils/chatbot/storage';
import { ChatAPI } from '@/utils/chatbot/chatAPI';

interface ChatSettingsContextType {
  // 状态
  settings: ChatSettings;
  isLoading: boolean;
  error: string | null;
  isTestingConnection: boolean;

  // 操作
  loadSettings: () => void;
  saveSettings: (newSettings: ChatSettings) => void;
  updateSettings: (partialSettings: Partial<ChatSettings>) => void;
  resetSettings: () => void;
  clearError: () => void;

  // 窗口大小管理
  updateWindowSize: (size: { width: number; height: number }) => void;
  getWindowSize: () => { width: number; height: number };

  // API相关
  testConnection: (testSettings?: ChatSettings) => Promise<boolean>;
  getAvailableModels: () => Promise<string[]>;

  // 验证和状态
  validateSettings: (settingsToValidate: ChatSettings) => string[];
  isSettingsComplete: () => boolean;
  getSettingsStatus: () => {
    isComplete: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  };
  getApiPlatformDisplayName: (platform: string) => string;

  // 导入导出
  exportSettings: () => string;
  importSettings: (jsonData: string) => boolean;
}

const ChatSettingsContext = createContext<ChatSettingsContextType | undefined>(undefined);

interface ChatSettingsProviderProps {
  children: ReactNode;
}

export const ChatSettingsProvider: React.FC<ChatSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  /**
   * 加载设置
   */
  const loadSettings = useCallback(() => {
    try {
      setIsLoading(true);
      const savedSettings = ChatStorage.getChatSettings();
      setSettings(savedSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat settings:', err);
      setError('加载设置失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存设置
   */
  const saveSettings = useCallback((newSettings: ChatSettings) => {
    try {
      ChatStorage.saveChatSettings(newSettings);
      setSettings(newSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to save chat settings:', err);
      setError('保存设置失败');
      throw err;
    }
  }, []);

  /**
   * 更新部分设置
   */
  const updateSettings = useCallback((partialSettings: Partial<ChatSettings>) => {
    const newSettings = { ...settings, ...partialSettings };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  /**
   * 重置设置为默认值
   */
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  /**
   * 测试API连接
   */
  const testConnection = useCallback(async (testSettings?: ChatSettings): Promise<boolean> => {
    const settingsToTest = testSettings || settings;
    
    if (!settingsToTest.apiKey.trim()) {
      setError('请先配置API Key');
      return false;
    }

    try {
      setIsTestingConnection(true);
      setError(null);
      
      const isConnected = await ChatAPI.testConnection(settingsToTest);
      
      if (!isConnected) {
        setError('API连接测试失败，请检查配置');
      }
      
      return isConnected;
    } catch (err) {
      console.error('Connection test failed:', err);
      setError('连接测试失败');
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  }, [settings]);

  /**
   * 获取可用模型列表
   */
  const getAvailableModels = useCallback(async (): Promise<string[]> => {
    try {
      return await ChatAPI.getAvailableModels(settings);
    } catch (err) {
      console.error('Failed to get available models:', err);
      return [];
    }
  }, [settings]);

  /**
   * 验证设置
   */
  const validateSettings = useCallback((settingsToValidate: ChatSettings): string[] => {
    const errors: string[] = [];

    // 验证系统提示词
    if (!settingsToValidate.systemPrompt.trim()) {
      errors.push('系统提示词不能为空');
    }

    // 验证API Key
    if (!settingsToValidate.apiKey.trim()) {
      errors.push('API Key不能为空');
    }

    // 验证API平台特定配置
    if (settingsToValidate.apiPlatform === 'dify') {
      if (!settingsToValidate.apiEndpoint?.trim()) {
        errors.push('Dify平台需要配置API端点');
      }
    }

    return errors;
  }, []);

  /**
   * 导出设置
   */
  const exportSettings = useCallback((): string => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  /**
   * 导入设置
   */
  const importSettings = useCallback((jsonData: string): boolean => {
    try {
      const importedSettings = JSON.parse(jsonData);
      
      // 验证导入的设置
      const validationErrors = validateSettings(importedSettings);
      if (validationErrors.length > 0) {
        setError(`导入的设置无效: ${validationErrors.join(', ')}`);
        return false;
      }

      saveSettings(importedSettings);
      return true;
    } catch (err) {
      console.error('Failed to import settings:', err);
      setError('导入设置失败，请检查JSON格式');
      return false;
    }
  }, [validateSettings, saveSettings]);

  /**
   * 获取API平台显示名称
   */
  const getApiPlatformDisplayName = useCallback((platform: string): string => {
    switch (platform) {
      case 'bailianai':
        return '百炼AI';
      case 'dify':
        return 'Dify';
      default:
        return platform;
    }
  }, []);

  /**
   * 检查设置是否完整
   */
  const isSettingsComplete = useCallback((): boolean => {
    return validateSettings(settings).length === 0;
  }, [settings, validateSettings]);

  /**
   * 获取设置状态描述
   */
  const getSettingsStatus = useCallback((): {
    isComplete: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  } => {
    const errors = validateSettings(settings);
    
    if (errors.length === 0) {
      return {
        isComplete: true,
        message: '设置配置完整',
        type: 'success',
      };
    }

    if (!settings.apiKey.trim()) {
      return {
        isComplete: false,
        message: '请配置API Key以启用AI功能',
        type: 'warning',
      };
    }

    return {
      isComplete: false,
      message: `配置不完整: ${errors.join(', ')}`,
      type: 'error',
    };
  }, [settings, validateSettings]);

  /**
   * 更新窗口大小
   */
  const updateWindowSize = useCallback((size: { width: number; height: number }) => {
    const newSettings = {
      ...settings,
      windowSize: size,
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  /**
   * 获取窗口大小
   */
  const getWindowSize = useCallback((): { width: number; height: number } => {
    return settings.windowSize || { width: 400, height: 600 };
  }, [settings.windowSize]);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 组件挂载时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const contextValue: ChatSettingsContextType = {
    // 状态
    settings,
    isLoading,
    error,
    isTestingConnection,

    // 操作
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    clearError,

    // 窗口大小管理
    updateWindowSize,
    getWindowSize,

    // API相关
    testConnection,
    getAvailableModels,

    // 验证和状态
    validateSettings,
    isSettingsComplete,
    getSettingsStatus,
    getApiPlatformDisplayName,

    // 导入导出
    exportSettings,
    importSettings,
  };

  return (
    <ChatSettingsContext.Provider value={contextValue}>
      {children}
    </ChatSettingsContext.Provider>
  );
};

export const useChatSettings = (): ChatSettingsContextType => {
  const context = useContext(ChatSettingsContext);
  if (context === undefined) {
    throw new Error('useChatSettings must be used within a ChatSettingsProvider');
  }
  return context;
};
