// LLMContext.tsx
'use client'

import React, { createContext, useContext, useState } from 'react';

interface LLMContextType {
  showLLMWindow: boolean;
  setShowLLMWindow: (v: boolean) => void;
  llmResult: any;
  setLLMResult: (v: any) => void;
}

const LLMContext = createContext<LLMContextType | null>(null);

export const useLLMContext = () => {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error('useLLMContext must be used within LLMProvider');
  return ctx;
};

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLLMWindow, setShowLLMWindow] = useState(true);
  const [llmResult, setLLMResult] = useState<any>(null);

  return (
    <LLMContext.Provider value={{ showLLMWindow, setShowLLMWindow, llmResult, setLLMResult }}>
      {children}
    </LLMContext.Provider>
  );
};
