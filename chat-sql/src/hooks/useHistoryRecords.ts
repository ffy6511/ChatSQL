// 历史记录管理Hook
import { useState, useEffect, useCallback } from 'react';

export interface HistoryRecordData {
  id?: number;
  title?: string;
  description?: string;
  createdAt: Date; // 改为Date类型以匹配LLMProblem
  updatedAt?: string;
  type?: string;
  metadata?: Record<string, any>;
  data: any; // 必需字段，与LLMProblem兼容
  isTutorial?: boolean; // 添加教程标识字段
  progress?: number; // 添加进度字段
  totalProblems?: number; // 添加总问题数字段
  isFavorite?: boolean; // 添加收藏字段
  completedProblems?: boolean[]; // 添加完成状态数组
}

/**
 * 历史记录管理Hook
 * 提供历史记录的增删改查功能
 */
export const useHistoryRecords = () => {
  const [recentRecords, setRecentRecords] = useState<HistoryRecordData[]>([]);
  const [favoriteRecords, setFavoriteRecords] = useState<HistoryRecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取历史记录
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getAllProblems } = await import('@/services/recordsIndexDB');
      const records = await getAllProblems();
      setRecentRecords(records);
      // 暂时将收藏记录设为空数组，可以根据需要实现收藏功能
      setFavoriteRecords([]);
    } catch (err) {
      console.error('获取历史记录失败:', err);
      setError('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除历史记录
  const handleDelete = useCallback(async (id: number) => {
    try {
      const { deleteProblem } = await import('@/services/recordsIndexDB');
      await deleteProblem(id);
      await fetchRecords(); // 刷新列表
    } catch (err) {
      console.error('删除历史记录失败:', err);
      setError('删除历史记录失败');
    }
  }, [fetchRecords]);

  // 重命名历史记录
  const handleRename = useCallback(async (id: number, newTitle: string) => {
    try {
      const { getProblemById, updateProblem } = await import('@/services/recordsIndexDB');
      const problem = await getProblemById(id);
      if (problem) {
        problem.title = newTitle;
        await updateProblem(problem);
        await fetchRecords(); // 刷新列表
      }
    } catch (err) {
      console.error('重命名历史记录失败:', err);
      setError('重命名历史记录失败');
    }
  }, [fetchRecords]);

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (id: number) => {
    try {
      // 暂时空实现，可以根据需要实现收藏功能
      console.log('切换收藏状态:', id);
    } catch (err) {
      console.error('切换收藏状态失败:', err);
      setError('切换收藏状态失败');
    }
  }, []);

  // 刷新记录
  const refreshRecords = useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 初始化时获取记录
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    recentRecords,
    favoriteRecords,
    loading,
    error,
    handleDelete,
    handleRename,
    handleToggleFavorite,
    refreshRecords,
  };
};
