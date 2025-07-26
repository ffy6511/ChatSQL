'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { areResultsEqual } from '@/lib/resultComparator';
import { useLLMContext } from './LLMContext';
import { useQueryContext } from './QueryContext';
import { TableTuple } from '@/types/dify';
import { ProgressService } from '@/services/progressService';
import { isTutorialRecord } from '@/utils/progressUtils';
import { message } from 'antd';

interface CompletionContextType {
  completedProblems: Set<number>;
  setCompletedProblems: React.Dispatch<React.SetStateAction<Set<number>>>;
  checkQueryResult: () => boolean;
  resetCompletion: () => void;
  updateProgress: (problemIndex: number) => Promise<void>;
  loadCompletionState: (recordId: number) => Promise<void>;
  clearAllProgress: () => Promise<void>;
}

const CompletionContext = createContext<CompletionContextType | null>(null);

export const useCompletionContext = () => {
  const context = useContext(CompletionContext);
  if (!context) {
    throw new Error('useCompletionContext must be used within CompletionProvider');
  }
  return context;
};

export const CompletionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const { llmResult, currentProblemId } = useLLMContext();
  const { queryResult } = useQueryContext();
  const [messageApi, contextHolder] = message.useMessage();
  
  // 移除 clearEditor 的依赖，避免循环依赖
  const resetCompletion = useCallback(() => {
    setCompletedProblems(new Set());
  }, []);

  // 加载记录的完成状态
  const loadCompletionState = useCallback(async (recordId: number) => {
    try {
      const completedProblemsArray = await ProgressService.getCompletedProblems(recordId);
      const completedSet = new Set<number>();

      completedProblemsArray.forEach((isCompleted, index) => {
        if (isCompleted) {
          completedSet.add(index);
        }
      });

      setCompletedProblems(completedSet);
    } catch (error) {
      console.error('加载完成状态失败:', error);
      // 如果加载失败，重置为空状态
      setCompletedProblems(new Set());
    }
  }, []);

  // 更新教程进度
  const updateProgress = useCallback(async (problemIndex: number) => {
    if (!currentProblemId) return;

    try {
      // 获取当前记录并检查是否为教程
      const { getProblemById } = await import('@/services/recordsIndexDB');
      const record = await getProblemById(currentProblemId);

      if (!record || !isTutorialRecord(record)) {
        return; // 非教程记录不更新进度
      }

      const result = await ProgressService.updateProgress(currentProblemId, problemIndex);

      if (result.isNewCompletion) {
        const { statusInfo } = result;

        // 显示进度更新反馈
        if (statusInfo.status === 'COMPLETED') {
          messageApi.success(`您已完成所有问题！`);
        } else {
          messageApi.success(`问题 ${problemIndex + 1} 完成！进度: ${result.record.progress}/${result.record.totalProblems}`);
        }

        // 触发历史记录列表刷新（通过 LLMContext 的 refreshRecords）
        // 这里我们需要通知父组件刷新记录列表
        window.dispatchEvent(new CustomEvent('recordsUpdated'));
      }
    } catch (error) {
      console.error('更新进度失败:', error);
      messageApi.error('更新进度失败');
    }
  }, [currentProblemId, messageApi]);

  // 清除所有进度
  const clearAllProgress = useCallback(async () => {
    if (!currentProblemId) return;

    try {
      // 获取当前记录并检查是否为教程
      const { getProblemById } = await import('@/services/recordsIndexDB');
      const record = await getProblemById(currentProblemId);

      if (!record || !isTutorialRecord(record)) {
        return; // 非教程记录不清除进度
      }

      await ProgressService.clearAllProgress(currentProblemId);

      // 重置本地状态
      setCompletedProblems(new Set());

      // 显示成功消息
      messageApi.success('已清除所有进度');

      // 触发历史记录列表刷新
      window.dispatchEvent(new CustomEvent('recordsUpdated'));
    } catch (error) {
      console.error('清除进度失败:', error);
      messageApi.error('清除进度失败');
    }
  }, [currentProblemId, messageApi]);

  const checkQueryResult = useCallback(() => {
    if (!queryResult || !llmResult?.data?.outputs?.expected_result) {
      return false;
    }

    let isAnyMatch = false;

    llmResult.data.outputs.expected_result.forEach((expected: TableTuple, index: number) => {
      if (!expected.tupleData) return;

      try {
        const isMatch = areResultsEqual(queryResult, expected.tupleData);
        if (isMatch) {
          isAnyMatch = true;
          setCompletedProblems(prev => {
            const newSet = new Set(prev);
            const wasAlreadyCompleted = newSet.has(index);
            newSet.add(index);

            // 如果是新完成的问题，更新进度
            if (!wasAlreadyCompleted) {
              updateProgress(index);
            }

            return newSet;
          });
        }
      } catch (error) {
        console.error(`Error comparing results:`, error);
      }
    });
    
    return isAnyMatch;
  }, [queryResult, llmResult]);

  // 当问题ID变化时，加载对应的完成状态
  useEffect(() => {
    if (currentProblemId !== null) {
      loadCompletionState(currentProblemId);
    } else {
      resetCompletion();
    }
  }, [currentProblemId, loadCompletionState, resetCompletion]);

  return (
    <CompletionContext.Provider value={{
      completedProblems,
      setCompletedProblems,
      checkQueryResult,
      resetCompletion,
      updateProgress,
      loadCompletionState,
      clearAllProgress,
    }}>
      {contextHolder}
      {children}
    </CompletionContext.Provider>
  );
};
