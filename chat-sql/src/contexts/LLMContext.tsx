// LLMContext.tsx
'use client'

import React, { createContext, useContext, useState } from 'react';
import { DifyResponse } from '@/types/CodingTypes/dify';

interface LLMContextType {
  showLLMWindow: boolean;
  setShowLLMWindow: (v: boolean) => void;
  llmResult: DifyResponse | null;
  setLLMResult: (v: DifyResponse | null) => void;
  currentProblemId: number | null;
  setCurrentProblemId: (v: number | null) => void;
  refreshRecords?: () => void;
}

const LLMContext = createContext<LLMContextType | null>(null);

export const useLLMContext = () => {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error('useLLMContext must be used within LLMProvider');
  return ctx;
};

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLLMWindow, setShowLLMWindow] = useState(true);
  const [llmResult, setLLMResult] = useState<DifyResponse | null>(null);
  const [currentProblemId, setCurrentProblemId] = useState<number | null>(null);

  const refreshRecords = () => {};

  return (
    <LLMContext.Provider value={{
      showLLMWindow,
      setShowLLMWindow,
      llmResult,
      setLLMResult,
      currentProblemId,
      setCurrentProblemId,
      refreshRecords
    }}>
      {children}
    </LLMContext.Provider>
  );
};
