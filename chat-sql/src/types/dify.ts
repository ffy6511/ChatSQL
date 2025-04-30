// Dify API 返回的数据结构
export interface DifyResponse {
  data: {
    outputs: {
      description: string;
      problem: string[];
      expected_result: any[];
      hint: string;
      tableStructure: {
        tableName: string;
        columns: any[];
        foreignKeys: any[];
      }[];
      tuples: {
        tableName: string;
        tupleData: any[];
      }[];
      tags: string[];
      isBuiltIn?: boolean;  // 新增字段，用于标识内置教程
      order?: number;       // 新增字段，用于教程排序
      category?: string;    // 新增字段，用于教程分类
    }
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

// schema渲染组件的输入要求(通过parse函数将dify的外键关系进行转换)
export interface TableStructure {
  tableName: string;
  columns: {
    name: string;
    type: string;
    isPrimary: boolean;
  }[];
  foreignKeys?: {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
  }[];
}

export interface TableTuple {
  tableName: string;
  tupleData: Record<string, any>[];
}
