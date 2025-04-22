'use client'

import React, { createContext, useContext, useState } from 'react';

interface QueryContextType {
  queryResult: any[] | null;
  setQueryResult: (result: any[] | null) => void;
}

const QueryContext = createContext<QueryContextType | null>(null);

export const useQueryContext = () => {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQueryContext must be used within QueryProvider');
  return ctx;
};

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryResult, setQueryResult] = useState<any[] | null>(null);

  return (
    <QueryContext.Provider value={{
      queryResult,
      setQueryResult,
    }}>
      {children}
    </QueryContext.Provider>
  );
};