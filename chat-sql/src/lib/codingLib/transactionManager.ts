/**
 * 事务管理模块
 * 
 * 该模块提供了用于管理SQL事务的函数集合，包括开始、提交和回滚事务。
 */

import { TableData } from '@/types/CodingTypes/sqlExecutor';

/**
 * 开始事务
 * @param tables 当前表集合
 * @param transactionData 当前事务数据（如果存在）
 * @returns 事务操作结果和新的事务数据
 */
export function beginTransaction(
  tables: Map<string, TableData>,
  transactionData: Map<string, TableData> | null
): { 
  result: { success: boolean; message: string },
  newTransactionData: Map<string, TableData>
} {
  if (transactionData) {
    throw new Error('事务已经开始');
  }
  
  // 创建事务数据的深拷贝
  const newTransactionData = new Map(
    Array.from(tables.entries()).map(([name, table]) => [
      name,
      {
        structure: { ...table.structure },
        data: [...table.data]
      }
    ])
  );
  
  return { 
    result: { success: true, message: '事务开始' },
    newTransactionData
  };
}

/**
 * 提交事务
 * @param transactionData 当前事务数据
 * @returns 事务操作结果
 */
export function commitTransaction(
  transactionData: Map<string, TableData> | null
): { success: boolean; message: string } {
  if (!transactionData) {
    throw new Error('没有活动的事务');
  }
  
  return { success: true, message: '事务提交成功' };
}

/**
 * 回滚事务
 * @param transactionData 当前事务数据
 * @returns 事务操作结果和回滚后的表数据
 */
export function rollbackTransaction(
  transactionData: Map<string, TableData> | null
): { 
  result: { success: boolean; message: string },
  tables: Map<string, TableData> | null
} {
  if (!transactionData) {
    throw new Error('没有活动的事务');
  }
  
  return {
    result: { success: true, message: '事务回滚成功' },
    tables: new Map(transactionData)
  };
}
