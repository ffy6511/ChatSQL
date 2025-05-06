/**
 * 查询辅助模块
 */

import { evaluateCondition } from './conditionEvaluator';
import { executeAggregateFunction as executeAggregate } from './aggregateFunctions';
import { TableData } from '../types/sqlExecutor';

/**
 * 执行JOIN操作
 */
export function executeJoins(
  baseData: any[],
  joins: any[],
  getTable: (tableName: string) => TableData | undefined,
  tableAliases: Map<string, string>
): any[] {
  let result = [...baseData];
  console.log('executeJoins - 初始数据:', result);
  console.log('executeJoins - joins:', joins);
  console.log('executeJoins - tableAliases:', Object.fromEntries(tableAliases));
  
  for (const join of joins) {
    console.log('处理JOIN:', join);
    const joinTable = getTable(join.table);
    if (!joinTable) {
      throw new Error(`Join表 ${join.table} 不存在`);
    }

    // 确定JOIN类型
    const joinType = join.type ? join.type.toUpperCase() : 'INNER JOIN';
    const isLeftJoin = joinType === 'LEFT JOIN';
    const isRightJoin = joinType === 'RIGHT JOIN';
    const isFullJoin = joinType === 'FULL JOIN';
    
    const joinAlias = join.as || join.alias || join.table;
    console.log(`JOIN表别名: ${joinAlias}, 类型: ${joinType}`);
    console.log('JOIN条件:', join.on);

    // 处理不同类型的JOIN
    if (isRightJoin || isFullJoin) {
      // 右连接和全连接需要特殊处理
      console.log('暂不支持RIGHT JOIN或FULL JOIN，将作为INNER JOIN处理');
    }

    result = result.flatMap(leftRow => {
      console.log('处理左表行:', leftRow);
      const matches = joinTable.data
        .filter(rightRow => {
          // 创建一个临时对象，包含两个表的所有列（带别名）
          const tempRow = { ...leftRow };
          Object.entries(rightRow).forEach(([key, value]) => {
            tempRow[`${joinAlias}.${key}`] = value;
          });
          console.log('评估JOIN条件的临时行:', tempRow);
          
          // 处理JOIN条件
          let matches = false;
          try {
            matches = evaluateCondition(tempRow, join.on);
          } catch (error) {
            console.error('评估JOIN条件时出错:', error);
            console.log('问题行:', tempRow);
            console.log('JOIN条件:', join.on);
          }
          console.log('JOIN条件评估结果:', matches);
          return matches;
        });
      
      console.log(`找到 ${matches.length} 个匹配行`);
      
      if (isLeftJoin && matches.length === 0) {
        // LEFT JOIN 且没有匹配，保留左表行，右表列为NULL
        const nullRow: Record<string, null> = {};
        joinTable.structure.columns.forEach(col => {
          nullRow[`${joinAlias}.${col.name}`] = null;
        });
        return [{ ...leftRow, ...nullRow }];
      } else if (matches.length === 0) {
        // INNER JOIN 且没有匹配，不返回任何行
        return [];
      }
      
      // 返回所有匹配行
      return matches.map(rightRow => {
        const mergedRow = { ...leftRow };
        Object.entries(rightRow).forEach(([key, value]) => {
          mergedRow[`${joinAlias}.${key}`] = value;
        });
        console.log('合并后的行:', mergedRow);
        return mergedRow;
      });
    });
  }
  
  console.log('executeJoins - 最终结果:', result);
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
  // 确保 groupBy 是数组
  const groupByColumns = Array.isArray(groupBy) ? groupBy : [];
  const groups = new Map();
  
  // 分组
  for (const row of data) {
    // 使用所有 GROUP BY 列的值作为键
    const key = groupByColumns.map(col => {
      // 处理带表别名的列名
      const columnName = col.includes('.') ? col.split('.')[1] : col;
      const value = row[columnName];
      return value === undefined ? null : value;
    }).join('|');
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  // 处理聚合
  return Array.from(groups.entries()).map(([key, rows]) => {
    const groupRow: any = {};
    
    // 保留分组列
    groupByColumns.forEach(col => {
      const columnName = col.includes('.') ? col.split('.')[1] : col;
      const tableName = col.includes('.') ? col.split('.')[0] : '';
      const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
      groupRow[fullColumnName] = rows[0][columnName];
    });

    // 处理每个选择的列
    columns.forEach(col => {
      if (col.expr.type === 'aggr_func') {
        const { name, args } = col.expr;
        const columnName = args.expr.column;
        // 处理带表别名的列名
        const actualColumnName = columnName.includes('.') ? 
          columnName.split('.')[1] : columnName;
        const alias = col.as || `${name}(${columnName})`;
        
        // 特殊处理 COUNT 函数
        if (name.toUpperCase() === 'COUNT') {
          if (rows.length === 0) {
            groupRow[alias] = 0;
          } else {
            const values = rows.map((r: Record<string, any>) => r[actualColumnName])
                              .filter((v: any): v is NonNullable<any> => v != null);
            groupRow[alias] = values.length;
          }
        } else {
          groupRow[alias] = executeAggregate(name, rows, actualColumnName);
        }
      } else if (col.expr.type === 'column_ref') {
        const columnName = col.expr.column;
        const tableName = col.expr.table;
        const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
        const actualColumnName = columnName.includes('.') ? 
          columnName.split('.')[1] : columnName;
        groupRow[fullColumnName] = rows[0][actualColumnName];
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
      const columnExpr = order.expr;
      // 处理带表别名的列名
      const column = columnExpr.column.includes('.') ? 
        columnExpr.column.split('.')[1] : columnExpr.column;
      const direction = order.type?.toUpperCase() || 'ASC';
      
      const aVal = a[column];
      const bVal = b[column];
      
      // 处理 null 值
      if (aVal === null && bVal === null) continue;
      if (aVal === null) return direction === 'ASC' ? -1 : 1;
      if (bVal === null) return direction === 'ASC' ? 1 : -1;
      
      // 根据数据类型进行比较
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal !== bVal) {
          return direction === 'ASC' ? aVal - bVal : bVal - aVal;
        }
      } else {
        const comparison = String(aVal).localeCompare(String(bVal));
        if (comparison !== 0) {
          return direction === 'ASC' ? comparison : -comparison;
        }
      }
    }
    return 0;
  });
}

// 本地的 executeAggregateFunction 定义已被删除，使用导入的函数
