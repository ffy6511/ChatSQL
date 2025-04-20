// Dify API 返回的数据结构
export interface DifyResponse {
  data: {
    outputs: ProblemOutput;
  }
}

// dify返回的问题输出
export interface ProblemOutput {
  description: string;
  problem: string[];
  tags: string[];
  tableStructure?: TableStructure[];
  tuples?: TableTuple[];
  expected_result?: TableTuple[];
  hint?: string;
}

export interface TableStructure {
  tableName: string;
  columns: {
    name: string;
    type: string;
    isPrimary: boolean;
  }[];
  foreignKeys?: {
    column: string;
    references: {
      table: string;
      column: string;
    };
  }[];
}

export interface TableTuple {
  tableName: string;
  tupleData: Record<string, any>[];
}