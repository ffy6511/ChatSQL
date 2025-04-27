'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { areResultsEqual } from '@/lib/resultComparator';
import { useLLMContext } from './LLMContext';
import { useQueryContext } from './QueryContext';
import { useEditorContext } from './EditorContext';
import { TableTuple } from '@/types/dify';

interface CompletionContextType {
  completedProblems: Set<number>;
  setCompletedProblems: React.Dispatch<React.SetStateAction<Set<number>>>;
  checkQueryResult: () => void;
  resetCompletion: () => void;
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
  
  // 移除 clearEditor 的依赖，避免循环依赖
  const resetCompletion = useCallback(() => {
    setCompletedProblems(new Set());
  }, []);

  const checkQueryResult = useCallback(() => {
    if (!queryResult || !llmResult?.data?.outputs?.expected_result) {
      return;
    }

    llmResult.data.outputs.expected_result.forEach((expected: TableTuple, index: number) => {
      if (!expected.tupleData) return;

      try {
        const isMatch = areResultsEqual(queryResult, expected.tupleData);
        if (isMatch) {
          setCompletedProblems(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
        }
      } catch (error) {
        console.error(`Error comparing results:`, error);
      }
    });
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
    }}>
      {children}
    </CompletionContext.Provider>
  );
};
