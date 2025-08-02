"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// 选择状态接口
export interface SelectionState {
  selectedCodingId: number | null; // 主页面使用数字ID（recordsIndexDB）
  selectedERId: string | null; // ER图使用字符串ID（erDiagramStorage）
  selectedBplusId: string | null; // B+树使用字符串ID（historyStorage）
}

// Context类型定义
interface SelectionContextType {
  selectionState: SelectionState;
  setSelectedCodingId: (id: number | null) => void;
  setSelectedERId: (id: string | null) => void;
  setSelectedBplusId: (id: string | null) => void;
  clearAllSelections: () => void;
}

// 默认状态
const defaultSelectionState: SelectionState = {
  selectedCodingId: null,
  selectedERId: null,
  selectedBplusId: null,
};

// 创建Context
const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined,
);

// LocalStorage键名
const STORAGE_KEYS = {
  CODING_ID: "selectedCodingId",
  ER_ID: "selectedERId",
  BPLUS_ID: "selectedBplusId",
} as const;

// Provider组件
interface SelectionProviderProps {
  children: ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
}) => {
  const [selectionState, setSelectionState] = useState<SelectionState>(
    defaultSelectionState,
  );

  // 从LocalStorage加载状态
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCodingId = localStorage.getItem(STORAGE_KEYS.CODING_ID);
      const savedERId = localStorage.getItem(STORAGE_KEYS.ER_ID);
      const savedBplusId = localStorage.getItem(STORAGE_KEYS.BPLUS_ID);

      setSelectionState({
        selectedCodingId: savedCodingId ? parseInt(savedCodingId, 10) : null,
        selectedERId: savedERId || null,
        selectedBplusId: savedBplusId || null,
      });
    }
  }, []);

  // 设置编码选择ID
  const setSelectedCodingId = (id: number | null) => {
    setSelectionState((prev) => ({ ...prev, selectedCodingId: id }));
    if (typeof window !== "undefined") {
      if (id !== null) {
        localStorage.setItem(STORAGE_KEYS.CODING_ID, id.toString());
      } else {
        localStorage.removeItem(STORAGE_KEYS.CODING_ID);
      }
    }
  };

  // 设置ER图选择ID
  const setSelectedERId = (id: string | null) => {
    setSelectionState((prev) => ({ ...prev, selectedERId: id }));
    if (typeof window !== "undefined") {
      if (id !== null) {
        localStorage.setItem(STORAGE_KEYS.ER_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ER_ID);
      }
    }
  };

  // 设置B+树选择ID
  const setSelectedBplusId = (id: string | null) => {
    setSelectionState((prev) => ({ ...prev, selectedBplusId: id }));
    if (typeof window !== "undefined") {
      if (id !== null) {
        localStorage.setItem(STORAGE_KEYS.BPLUS_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.BPLUS_ID);
      }
    }
  };

  // 清除所有选择
  const clearAllSelections = () => {
    setSelectionState(defaultSelectionState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CODING_ID);
      localStorage.removeItem(STORAGE_KEYS.ER_ID);
      localStorage.removeItem(STORAGE_KEYS.BPLUS_ID);
    }
  };

  const contextValue: SelectionContextType = {
    selectionState,
    setSelectedCodingId,
    setSelectedERId,
    setSelectedBplusId,
    clearAllSelections,
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
};

// Hook for using the context
export const useSelection = (): SelectionContextType => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
};
