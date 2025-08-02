// 聊天历史记录管理Hook

import { useState, useCallback, useEffect } from "react";
import { ChatHistory, Message } from "@/types/chatBotTypes/chatbot";
import {
  ChatStorage,
  ChatIndexedDB,
  generateId,
  truncateText,
} from "@/utils/chatbot/storage";

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载历史记录 - 优先从IndexedDB加载，失败时从localStorage加载
   */
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 首先尝试从IndexedDB加载
      let history = await ChatIndexedDB.getChatHistory();

      // 如果IndexedDB没有数据，尝试从ChatStorage获取（它会自动处理迁移）
      if (history.length === 0) {
        history = await ChatStorage.getChatHistory();
      }

      setChatHistory(history);
      console.log("Chat history loaded:", history.length, "records");
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError("加载历史记录失败");

      // 如果IndexedDB完全失败，尝试从localStorage加载
      try {
        const fallbackHistory = await ChatStorage.getChatHistory();
        setChatHistory(fallbackHistory);
      } catch (fallbackErr) {
        console.error("Failed to load fallback history:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存当前对话到历史记录
   */
  const saveCurrentChat = useCallback(
    async (messages: Message[], customTitle?: string): Promise<string> => {
      try {
        if (messages.length === 0) {
          throw new Error("没有消息可保存");
        }

        // 生成标题
        const firstUserMessage = messages.find((msg) => msg.sender === "user");
        const title =
          customTitle ||
          (firstUserMessage
            ? truncateText(firstUserMessage.content, 30)
            : "新对话");

        const newHistory: ChatHistory = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          messages,
          title,
        };

        // 保存到IndexedDB和localStorage
        await ChatStorage.addChatHistory(newHistory);

        // 更新本地状态
        setChatHistory((prev) => [newHistory, ...prev]);

        setError(null);
        return newHistory.id;
      } catch (err) {
        console.error("Failed to save chat history:", err);
        setError("保存对话失败");
        throw err;
      }
    },
    [],
  );

  /**
   * 根据ID加载特定的历史记录
   */
  const loadHistoryById = useCallback(
    async (historyId: string): Promise<Message[] | null> => {
      try {
        // 首先从当前状态中查找
        const currentHistory = chatHistory.find(
          (item) => item.id === historyId,
        );
        if (currentHistory) {
          setError(null);
          return currentHistory.messages;
        }

        // 如果当前状态中没有，从IndexedDB查找
        const allHistory = await ChatIndexedDB.getChatHistory();
        const history = allHistory.find((item) => item.id === historyId);

        if (!history) {
          // 最后尝试从ChatStorage查找
          const localHistory = await ChatStorage.getChatHistoryById(historyId);
          if (localHistory) {
            setError(null);
            return localHistory.messages;
          }
          throw new Error("历史记录不存在");
        }

        setError(null);
        return history.messages;
      } catch (err) {
        console.error("Failed to load history by ID:", err);
        setError("加载指定历史记录失败");
        return null;
      }
    },
    [chatHistory],
  );

  /**
   * 删除历史记录
   */
  const deleteHistory = useCallback(async (historyId: string) => {
    try {
      await ChatStorage.deleteChatHistory(historyId);

      // 更新本地状态
      setChatHistory((prev) => prev.filter((item) => item.id !== historyId));

      setError(null);
    } catch (err) {
      console.error("Failed to delete chat history:", err);
      setError("删除历史记录失败");
    }
  }, []);

  /**
   * 批量删除历史记录
   */
  const deleteMultipleHistory = useCallback(async (historyIds: string[]) => {
    try {
      // 并行删除所有历史记录
      await Promise.all(
        historyIds.map((id) => ChatStorage.deleteChatHistory(id)),
      );

      // 更新本地状态
      setChatHistory((prev) =>
        prev.filter((item) => !historyIds.includes(item.id)),
      );

      setError(null);
    } catch (err) {
      console.error("Failed to delete multiple chat history:", err);
      setError("批量删除历史记录失败");
    }
  }, []);

  /**
   * 清空所有历史记录
   */
  const clearAllHistory = useCallback(async () => {
    try {
      // 清空IndexedDB中的所有历史记录
      const allHistory = await ChatIndexedDB.getChatHistory();
      await Promise.all(
        allHistory.map((history) =>
          ChatIndexedDB.deleteChatHistory(history.id),
        ),
      );

      // 清空localStorage（如果还有残留数据）
      try {
        localStorage.removeItem("chat_history");
      } catch (localError) {
        console.warn("Failed to clear localStorage:", localError);
      }

      // 更新本地状态
      setChatHistory([]);
      setError(null);
    } catch (err) {
      console.error("Failed to clear all chat history:", err);
      setError("清空历史记录失败");
    }
  }, []);

  /**
   * 搜索历史记录
   */
  const searchHistory = useCallback(
    (keyword: string): ChatHistory[] => {
      if (!keyword.trim()) {
        return chatHistory;
      }

      const lowerKeyword = keyword.toLowerCase();
      return chatHistory.filter((history) => {
        // 搜索标题
        if (history.title?.toLowerCase().includes(lowerKeyword)) {
          return true;
        }

        // 搜索消息内容
        return history.messages.some((message) => {
          const contentStr =
            typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content);
          return contentStr.toLowerCase().includes(lowerKeyword);
        });
      });
    },
    [chatHistory],
  );

  /**
   * 按时间范围筛选历史记录
   */
  const filterByDateRange = useCallback(
    (startDate: Date, endDate: Date): ChatHistory[] => {
      return chatHistory.filter((history) => {
        const historyDate = new Date(history.timestamp);
        return historyDate >= startDate && historyDate <= endDate;
      });
    },
    [chatHistory],
  );

  /**
   * 获取历史记录统计信息
   */
  const getHistoryStats = useCallback(() => {
    const stats = {
      total: chatHistory.length,
      totalMessages: 0,
      averageMessagesPerChat: 0,
    };

    chatHistory.forEach((history) => {
      stats.totalMessages += history.messages.length;
    });

    stats.averageMessagesPerChat =
      stats.total > 0 ? Math.round(stats.totalMessages / stats.total) : 0;

    return stats;
  }, [chatHistory]);

  /**
   * 导出历史记录
   */
  const exportHistory = useCallback(async (): Promise<string> => {
    return await ChatStorage.exportData();
  }, []);

  /**
   * 导入历史记录
   */
  const importHistory = useCallback(
    async (jsonData: string): Promise<boolean> => {
      try {
        const success = await ChatStorage.importData(jsonData);
        if (success) {
          await loadHistory(); // 重新加载历史记录
        }
        return success;
      } catch (err) {
        console.error("Failed to import history:", err);
        setError("导入历史记录失败");
        return false;
      }
    },
    [loadHistory],
  );

  /**
   * 更新历史记录标题
   */
  const updateHistoryTitle = useCallback(
    async (historyId: string, newTitle: string) => {
      try {
        const allHistory = await ChatStorage.getChatHistory();
        const targetHistory = allHistory.find(
          (history) => history.id === historyId,
        );

        if (targetHistory) {
          const updatedHistory = { ...targetHistory, title: newTitle };
          // 更新IndexedDB中的记录
          await ChatIndexedDB.saveChatHistory(updatedHistory);

          // 更新本地状态
          setChatHistory((prev) =>
            prev.map((history) =>
              history.id === historyId
                ? { ...history, title: newTitle }
                : history,
            ),
          );
          setError(null);
        } else {
          throw new Error("历史记录不存在");
        }
      } catch (err) {
        console.error("Failed to update history title:", err);
        setError("更新标题失败");
      }
    },
    [],
  );

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
    filterByDateRange,

    // 统计和导入导出
    getHistoryStats,
    exportHistory,
    importHistory,
  };
};
