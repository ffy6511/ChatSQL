'use client'

import { useState, useEffect, useCallback } from 'react';
import { 
  getAllProblems, 
  deleteProblem, 
  toggleFavorite, 
  renameProblem, 
  LLMProblem 
} from '@/services/codingStorage';
import { message } from 'antd';

export const useCodingRecords = () => {
  const [records, setRecords] = useState<LLMProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有记录
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const problems = await getAllProblems();
      // 按创建时间排序，最新的在前面
      problems.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setRecords(problems);
    } catch (err) {
      setError('加载历史记录失败');
      message.error('加载历史记录失败');
      console.error('加载历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除记录
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteProblem(id);
      message.success('删除成功');
      // 更新本地状态
      setRecords(prev => prev.filter(record => record.id !== id));
    } catch (err) {
      message.error('删除失败');
      console.error('删除失败:', err);
    }
  }, []);

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (id: number) => {
    try {
      await toggleFavorite(id);
      // 更新本地状态
      setRecords(prev => prev.map(record => {
        if (record.id === id) {
          return { ...record, isFavorite: !record.isFavorite };
        }
        return record;
      }));
    } catch (err) {
      message.error('更新收藏状态失败');
      console.error('更新收藏状态失败:', err);
    }
  }, []);

  // 重命名记录
  const handleRename = useCallback(async (id: number, newTitle: string) => {
    try {
      await renameProblem(id, newTitle);
      message.success('重命名成功');
      // 更新本地状态
      setRecords(prev => prev.map(record => {
        if (record.id === id) {
          return { ...record, title: newTitle };
        }
        return record;
      }));
    } catch (err) {
      message.error('重命名失败');
      console.error('重命名失败:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    records,
    loading,
    error,
    recentRecords: records.filter(r => !r.isFavorite),
    favoriteRecords: records.filter(r => r.isFavorite),
    handleDelete,
    handleToggleFavorite,
    handleRename,
    refreshRecords: loadRecords
  };
};
