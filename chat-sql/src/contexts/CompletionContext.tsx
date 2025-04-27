'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { areResultsEqual } from '@/lib/resultComparator';
import { useLLMContext } from './LLMContext';
import { useQueryContext } from './QueryContext';

interface CompletionContextType {
  completedProblems: Set<number>;
  setCompletedProblems: React.Dispatch<React.SetStateAction<Set<number>>>;
  checkQueryResult: () => void;
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
  const { llmResult } = useLLMContext();
  const { queryResult } = useQueryContext(); // 添加这行，使用 QueryContext

  const checkQueryResult = useCallback(() => {
    console.log('[CompletionProvider] Checking results:', {
      queryResult,
      expectedResults: llmResult?.data?.outputs?.expected_result
    });

    if (!queryResult || !llmResult?.data?.outputs?.expected_result) {
      console.log('[CompletionProvider] Missing query result or expected results');
      return;
    }

    llmResult.data.outputs.expected_result.forEach((expected: TableTuple, index: number) => {
      if (!expected.tupleData) {
        console.log(`[CompletionProvider] Invalid expected result at index ${index}`);
        return;
      }

      try {
        const isMatch = areResultsEqual(queryResult, expected.tupleData);
        console.log(`[CompletionProvider] Comparison result for index ${index}:`, isMatch);
        
        if (isMatch) {
          setCompletedProblems(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
        }
      } catch (error) {
        console.error(`[CompletionProvider] Error comparing results:`, error);
      }
    });
  }, [queryResult, llmResult]); // 依赖项更新

  // 当 queryResult 变化时自动触发比较
  useEffect(() => {
    if (queryResult) {
      checkQueryResult();
    }
  }, [queryResult, checkQueryResult]);

  return (
    <CompletionContext.Provider value={{
      completedProblems,
      setCompletedProblems,
      checkQueryResult,
    }}>
      {children}
    </CompletionContext.Provider>
  );
};
