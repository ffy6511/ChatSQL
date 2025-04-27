/**
 * 查询辅助模块
 * 
 * 该模块提供了用于处理复杂SQL查询操作的函数集合，如JOIN、GROUP BY和ORDER BY。
 */

import { evaluateCondition } from './conditionEvaluator';
import { TableData } from '../types/sqlExecutor';

/**
 * 执行JOIN操作
 * @param baseData 基础数据集
 * @param joins JOIN操作的AST
 * @param getTable 获取表的函数
 * @returns 连接后的数据集
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
 * @param data 数据集
 * @param groupBy 分组列
 * @param columns 选择的列
 * @param having HAVING子句（可选）
 * @returns 分组后的数据集
 */
export function executeGroupBy(data: any[], groupBy: string[], columns: any[], having?: any): any[] {
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
  const result = Array.from(groups.entries()).map(([key, rows]) => {
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
        
        switch (name.toUpperCase()) {
          case 'COUNT':
            groupRow[alias] = rows.length;
            break;
          case 'SUM':
            groupRow[alias] = rows.reduce((sum: number, row: Record<string, any>) => sum + (Number(row[columnName]) || 0), 0);
            break;
          case 'AVG':
            groupRow[alias] = rows.reduce((sum: number, row: Record<string, any>) => sum + (Number(row[columnName]) || 0), 0) / rows.length;
            break;
          case 'MAX':
            groupRow[alias] = Math.max(...rows.map((row: Record<string, any>) => Number(row[columnName]) || 0));
            break;
          case 'MIN':
            groupRow[alias] = Math.min(...rows.map((row: Record<string, any>) => Number(row[columnName]) || 0));
            break;
          default:
            throw new Error(`不支持的聚合函数: ${name}`);
        }
      } else {
        // 非聚合列，使用第一行的值
        const columnName = col.expr.column;
        groupRow[columnName] = rows[0][columnName];
      }
    });
    
    return groupRow;
  });

  // 处理HAVING子句
  if (having) {
    return result.filter(row => evaluateCondition(row, having));
  }

  return result;
}

/**
 * 执行ORDER BY操作
 * @param data 数据集
 * @param orderBy ORDER BY子句的AST
 * @returns 排序后的数据集
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
