/**
 * SQL执行器类型定义
 *
 * 该文件定义了SQL执行器使用的类型。
 */

import { TableStructure as DifyTableStructure } from "./dify";

/**
 * 扩展列定义，添加外键引用
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary: boolean;
  foreignKeyRefs?: ForeignKeyRef[];
}

/**
 * 扩展表结构定义
 */
export interface TableStructure extends Omit<DifyTableStructure, "columns"> {
  columns: ColumnDefinition[];
}

/**
 * 表数据接口
 * 包含表结构和表数据
 */
export interface TableData {
  structure: TableStructure;
  data: any[];
}

/**
 * SQL查询结果接口
 */
export interface SQLQueryResult {
  success: boolean;
  data?: any[];
  message?: string;
  columns?: string[]; // 添加列名数组属性
}

/**
 * 外键引用接口
 */
export interface ForeignKeyRef {
  tableName: string;
  columnName: string;
}
