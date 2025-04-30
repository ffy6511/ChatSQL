/**
 * 查询辅助模块
 */

import { evaluateCondition } from './conditionEvaluator';
import { executeAggregateFunction } from './aggregateFunctions';
import { TableData } from '../types/sqlExecutor';

/**
 * 执行JOIN操作
 */
export function executeJoins(
  baseData: any[], 
  joins: any[], 
  getTable: (tableName: string) => TableData | undefined
): any[] {
  let result = [...baseData];
  
  for (const join of joins) {
    const joinTable = getTable(join.table);
    if (!joinTable) {
      throw new Error(`Join表 ${join.table} 不存在`);
    }

    result = result.flatMap(leftRow => {
      return joinTable.data
        .filter(rightRow => 
          evaluateCondition({ ...leftRow, ...rightRow }, join.on))
        .map(rightRow => ({
          ...leftRow,
          ...rightRow
        }));
    });
  }
  
  return result;
}

/**
 * 执行GROUP BY操作
 */
export function executeGroupBy(
  data: any[], 
  groupBy: string[], 
  columns: any[]
): any[] {
  const groups = new Map();
  
  // 分组
  for (const row of data) {
    const key = groupBy.map(col => row[col]).join('|');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  // 处理聚合
  return Array.from(groups.entries()).map(([key, rows]) => {
    const groupRow: any = {};
    
    // 保留分组列
    groupBy.forEach(col => {
      groupRow[col] = rows[0][col];
    });

    // 处理每个选择的列
    columns.forEach(col => {
      if (col.expr.type === 'aggr_func') {
        const { name, args } = col.expr;
        const columnName = args.expr.column;
        const alias = col.as || `${name}(${columnName})`;
        groupRow[alias] = executeAggregateFunction(name, rows, columnName);
      } else {
        // 非聚合列，使用第一行的值
        const columnName = col.expr.column;
        groupRow[columnName] = rows[0][columnName];
      }
    });
    
    return groupRow;
  });
}

/**
 * 执行ORDER BY操作
 */
export function executeOrderBy(data: any[], orderBy: any[]): any[] {
  return [...data].sort((a, b) => {
    for (const order of orderBy) {
      const column = order.expr.column;
      const direction = order.type.toUpperCase();
      
      const aVal = a[column];
      const bVal = b[column];
      
      // 处理 null 值
      if (aVal === null && bVal === null) continue;
      if (aVal === null) return direction === 'ASC' ? -1 : 1;
      if (bVal === null) return direction === 'ASC' ? 1 : -1;
      
      if (aVal < bVal) {
        return direction === 'ASC' ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === 'ASC' ? 1 : -1;
      }
    }
    return 0;
  });
}
