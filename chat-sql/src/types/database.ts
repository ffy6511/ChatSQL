export interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  foreignKeyRefs?: { tableId: string; columnName: string }[];
}

export interface Table {
  id: string;
  tableName: string;
  position: { x: number; y: number };
  columns: Column[];
  isReferenced: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  label?: string;
  markerEnd?: any;
  style?: any;
}

// 输入 JSON 的类型定义
export interface InputColumn {
  name: string;
  type: string;
  isPrimary: boolean;
}

export interface InputForeignKey {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface InputTable {
  tableName: string;
  columns: InputColumn[];
  foreignKeys?: InputForeignKey[];
}
