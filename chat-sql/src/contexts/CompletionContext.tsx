'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { areResultsEqual } from '@/lib/resultComparator';
import { useLLMContext } from './LLMContext';
import { useQueryContext } from './QueryContext';
import { useEditorContext } from './EditorContext';
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
          messageApi.success(`🎉 恭喜！您已完成所有问题！`);
        } else {
          messageApi.success(`✅ 问题 ${problemIndex + 1} 完成！进度: ${result.record.progress}/${result.record.totalProblems}`);
        }
      }
    } catch (error) {
      console.error('更新进度失败:', error);
      messageApi.error('更新进度失败');
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

  // 只在问题ID变化时重置完成状态
  useEffect(() => {
    if (currentProblemId !== null) {
      resetCompletion();
    }
  }, [currentProblemId, resetCompletion]);

  return (
    <CompletionContext.Provider value={{
      completedProblems,
      setCompletedProblems,
      checkQueryResult,
      resetCompletion,
      updateProgress,
    }}>
      {contextHolder}
      {children}
    </CompletionContext.Provider>
  );
};
