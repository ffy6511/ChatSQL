"use client";

import React, { createContext, useContext, useState } from "react";

interface EditorContextType {
  sqlEditorValue: string;
  setSqlEditorValue: (value: string) => void;
  clearEditor: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditorContext = () => {
  const ctx = useContext(EditorContext);
  if (!ctx)
    throw new Error("useEditorContext must be used within EditorProvider");
  return ctx;
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sqlEditorValue, setSqlEditorValue] = useState<string>("");

  const clearEditor = () => {
    setSqlEditorValue("");
  };

  return (
    <EditorContext.Provider
      value={{
        sqlEditorValue,
        setSqlEditorValue,
        clearEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
