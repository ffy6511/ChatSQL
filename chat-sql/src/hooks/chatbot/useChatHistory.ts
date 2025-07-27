// 聊天历史记录管理Hook

import { useState, useCallback, useEffect } from 'react';
import { 
  ChatHistory, 
  Message, 
  ModuleType 
} from '@/types/chatbot';
import { ChatStorage, generateId, truncateText } from '@/components/ChatBot/utils/storage';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载历史记录
   */
  const loadHistory = useCallback(() => {
    try {
      setIsLoading(true);
      const history = ChatStorage.getChatHistory();
      setChatHistory(history);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('加载历史记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存当前对话到历史记录
   */
  const saveCurrentChat = useCallback((
    messages: Message[], 
    module: ModuleType = 'coding',
    customTitle?: string
  ): string => {
    try {
      if (messages.length === 0) {
        throw new Error('没有消息可保存');
      }

      // 生成标题
      const firstUserMessage = messages.find(msg => msg.sender === 'user');
      const title = customTitle || 
        (firstUserMessage ? truncateText(firstUserMessage.content, 30) : '新对话');

      const newHistory: ChatHistory = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        messages,
        module,
        title,
      };

      ChatStorage.addChatHistory(newHistory);
      
      // 更新本地状态
      setChatHistory(prev => [newHistory, ...prev]);
      
      setError(null);
      return newHistory.id;
    } catch (err) {
      console.error('Failed to save chat history:', err);
      setError('保存对话失败');
      throw err;
    }
  }, []);

  /**
   * 根据ID加载特定的历史记录
   */
  const loadHistoryById = useCallback((historyId: string): Message[] | null => {
    try {
      const history = ChatStorage.getChatHistoryById(historyId);
      if (!history) {
        throw new Error('历史记录不存在');
      }
      
      setError(null);
      return history.messages;
    } catch (err) {
      console.error('Failed to load history by ID:', err);
      setError('加载指定历史记录失败');
      return null;
    }
  }, []);

  /**
   * 删除历史记录
   */
  const deleteHistory = useCallback((historyId: string) => {
    try {
      ChatStorage.deleteChatHistory(historyId);
      
      // 更新本地状态
      setChatHistory(prev => prev.filter(item => item.id !== historyId));
      
      setError(null);
    } catch (err) {
      console.error('Failed to delete chat history:', err);
      setError('删除历史记录失败');
    }
  }, []);

  /**
   * 批量删除历史记录
   */
  const deleteMultipleHistory = useCallback((historyIds: string[]) => {
    try {
      historyIds.forEach(id => {
        ChatStorage.deleteChatHistory(id);
      });
      
      // 更新本地状态
      setChatHistory(prev => prev.filter(item => !historyIds.includes(item.id)));
      
      setError(null);
    } catch (err) {
      console.error('Failed to delete multiple chat history:', err);
      setError('批量删除历史记录失败');
    }
  }, []);

  /**
   * 清空所有历史记录
   */
  const clearAllHistory = useCallback(() => {
    try {
      ChatStorage.saveChatHistory([]);
      setChatHistory([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear all chat history:', err);
      setError('清空历史记录失败');
    }
  }, []);

  /**
   * 搜索历史记录
   */
  const searchHistory = useCallback((keyword: string): ChatHistory[] => {
    if (!keyword.trim()) {
      return chatHistory;
    }

    const lowerKeyword = keyword.toLowerCase();
    return chatHistory.filter(history => {
      // 搜索标题
      if (history.title?.toLowerCase().includes(lowerKeyword)) {
        return true;
      }
      
      // 搜索消息内容
      return history.messages.some(message => 
        message.content.toLowerCase().includes(lowerKeyword)
      );
    });
  }, [chatHistory]);

  /**
   * 按模块筛选历史记录
   */
  const filterByModule = useCallback((module: ModuleType): ChatHistory[] => {
    return chatHistory.filter(history => history.module === module);
  }, [chatHistory]);

  /**
   * 按时间范围筛选历史记录
   */
  const filterByDateRange = useCallback((
    startDate: Date, 
    endDate: Date
  ): ChatHistory[] => {
    return chatHistory.filter(history => {
      const historyDate = new Date(history.timestamp);
      return historyDate >= startDate && historyDate <= endDate;
    });
  }, [chatHistory]);

  /**
   * 获取历史记录统计信息
   */
  const getHistoryStats = useCallback(() => {
    const stats = {
      total: chatHistory.length,
      byModule: {
        coding: 0,
        ER: 0,
        Bplus: 0,
      },
      totalMessages: 0,
      averageMessagesPerChat: 0,
    };

    chatHistory.forEach(history => {
      stats.byModule[history.module]++;
      stats.totalMessages += history.messages.length;
    });

    stats.averageMessagesPerChat = stats.total > 0 
      ? Math.round(stats.totalMessages / stats.total) 
      : 0;

    return stats;
  }, [chatHistory]);

  /**
   * 导出历史记录
   */
  const exportHistory = useCallback((): string => {
    return ChatStorage.exportData();
  }, []);

  /**
   * 导入历史记录
   */
  const importHistory = useCallback((jsonData: string): boolean => {
    try {
      const success = ChatStorage.importData(jsonData);
      if (success) {
        loadHistory(); // 重新加载历史记录
      }
      return success;
    } catch (err) {
      console.error('Failed to import history:', err);
      setError('导入历史记录失败');
      return false;
    }
  }, [loadHistory]);

  /**
   * 更新历史记录标题
   */
  const updateHistoryTitle = useCallback((historyId: string, newTitle: string) => {
    try {
      const allHistory = ChatStorage.getChatHistory();
      const updatedHistory = allHistory.map(history => 
        history.id === historyId 
          ? { ...history, title: newTitle }
          : history
      );
      
      ChatStorage.saveChatHistory(updatedHistory);
      setChatHistory(updatedHistory);
      setError(null);
    } catch (err) {
      console.error('Failed to update history title:', err);
      setError('更新标题失败');
    }
  }, []);

  // 组件挂载时加载历史记录
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    // 状态
    chatHistory,
    isLoading,
    error,
    
    // 操作
    loadHistory,
    saveCurrentChat,
    loadHistoryById,
    deleteHistory,
    deleteMultipleHistory,
    clearAllHistory,
    updateHistoryTitle,
    
    // 搜索和筛选
    searchHistory,
    filterByModule,
    filterByDateRange,
    
    // 统计和导入导出
    getHistoryStats,
    exportHistory,
    importHistory,
  };
};
