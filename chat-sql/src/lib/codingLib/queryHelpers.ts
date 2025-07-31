/**
 * 查询辅助模块
 */

import { evaluateCondition } from './conditionEvaluator';
import { executeAggregateFunction as executeAggregate } from './aggregateFunctions';
import { TableData } from '@/types/CodingTypes/sqlExecutor';

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
  groupBy: any[], 
  columns: any[]
): any[] {
  console.log('executeGroupBy - 输入数据:', data.length, '行');
  console.log('executeGroupBy - groupBy:', groupBy);
  console.log('executeGroupBy - columns:', columns.map(c => c.as || (c.expr.column || c.expr.name)));
  
  if (data.length === 0) return [];
  
  // 打印第一行数据的键，帮助调试
  console.log('第一行数据的键:', Object.keys(data[0]));
  
  // 确保 groupBy 是数组
  const groupByColumns = Array.isArray(groupBy) ? groupBy : [groupBy].filter(Boolean);
  const groups = new Map();
  
  // 分组
  for (const row of data) {
    // 使用所有 GROUP BY 列的值作为键
    const keyParts = [];
    
    for (const col of groupByColumns) {
      let value = null;
      
      // 处理不同类型的列引用
      if (typeof col === 'string') {
        // 如果是字符串形式的列名
        if (col.includes('.')) {
          // 带表别名的列名 (例如 "table.column")
          const [tableName, columnName] = col.split('.');
          const fullColumnName = `${tableName}.${columnName}`;
          
          // 1. 先尝试完整的表别名.列名形式
          if (row[fullColumnName] !== undefined) {
            value = row[fullColumnName];
          } else {
            // 2. 尝试查找任何表别名下的该列名
            const matchingKey = Object.keys(row).find(k => 
              k.endsWith(`.${columnName}`)
            );
            if (matchingKey) {
              value = row[matchingKey];
            } else {
              // 3. 最后尝试不带表别名的列名
              value = row[columnName];
            }
          }
        } else {
          // 不带表别名的列名
          const columnName = col;
          
          // 1. 先尝试不带表别名的列名
          if (row[columnName] !== undefined) {
            value = row[columnName];
          } else {
            // 2. 尝试查找任何表别名下的该列名
            const matchingKey = Object.keys(row).find(k => 
              k.endsWith(`.${columnName}`)
            );
            if (matchingKey) {
              value = row[matchingKey];
            }
          }
        }
      } else if (col && col.type === 'column_ref') {
        // 如果是对象形式的列引用
        const columnName = col.column;
        const tableName = col.table || '';
        const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
        
        // 1. 先尝试完整的表别名.列名形式
        if (row[fullColumnName] !== undefined) {
          value = row[fullColumnName];
        } else if (row[columnName] !== undefined) {
          // 2. 再尝试不带表别名的列名
          value = row[columnName];
        } else {
          // 3. 最后尝试查找任何表别名下的该列名
          const matchingKey = Object.keys(row).find(k => 
            k.endsWith(`.${columnName}`)
          );
          if (matchingKey) {
            value = row[matchingKey];
          }
        }
      }
      
      keyParts.push(value === undefined ? 'null' : String(value));
    }
    
    const key = keyParts.join('|');
    console.log(`行的分组键: ${key}`);
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }

  console.log('分组数量:', groups.size);
  for (const [key, rows] of groups.entries()) {
    console.log(`分组 ${key}: ${rows.length} 行`);
  }

  // 处理聚合
  return Array.from(groups.entries()).map(([key, rows]) => {
    const groupRow: any = {};
    
    // 保留分组列
    for (const col of groupByColumns) {
      let columnName, tableName;
      
      if (typeof col === 'string') {
        if (col.includes('.')) {
          [tableName, columnName] = col.split('.');
        } else {
          columnName = col;
          tableName = '';
        }
      } else if (col && col.type === 'column_ref') {
        columnName = col.column;
        tableName = col.table || '';
      } else {
        continue; // 跳过不支持的列类型
      }
      
      const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
      let value;
      
      // 1. 先尝试完整的表别名.列名形式
      if (rows[0][fullColumnName] !== undefined) {
        value = rows[0][fullColumnName];
        groupRow[columnName] = value; // 使用不带表别名的列名作为输出
      } else if (rows[0][columnName] !== undefined) {
        // 2. 再尝试不带表别名的列名
        value = rows[0][columnName];
        groupRow[columnName] = value;
      } else {
        // 3. 最后尝试查找任何表别名下的该列名
        const matchingKey = Object.keys(rows[0]).find(k => 
          k.endsWith(`.${columnName}`)
        );
        if (matchingKey) {
          value = rows[0][matchingKey];
          groupRow[columnName] = value; // 使用不带表别名的列名作为输出
        }
      }
    }

    // 处理每个选择的列
    for (const col of columns) {
      if (col.expr.type === 'aggr_func') {
        const { name, args } = col.expr;
        const alias = col.as || `${name}(${args.expr.column || '*'})`;
        
        // 处理不同类型的聚合函数参数
        if (args.expr.type === 'column_ref') {
          const columnName = args.expr.column;
          const tableName = args.expr.table || '';
          
          // 提取该列的所有值
          const values = rows.map((r: { [x: string]: any; }) => {
            const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
            
            // 1. 先尝试完整的表别名.列名形式
            if (r[fullColumnName] !== undefined) {
              return r[fullColumnName];
            } 
            // 2. 再尝试不带表别名的列名
            else if (r[columnName] !== undefined) {
              return r[columnName];
            }
            // 3. 最后尝试查找任何表别名下的该列名
            else {
              const matchingKey = Object.keys(r).find(k => 
                k.endsWith(`.${columnName}`)
              );
              if (matchingKey) {
                return r[matchingKey];
              }
              return null;
            }
          }).filter((v: null) => v != null);
          
          console.log(`聚合函数 ${name}(${columnName}) 的值:`, values);
          
          // 执行聚合函数
          if (name.toUpperCase() === 'COUNT') {
            groupRow[alias] = values.length;
          } else {
            groupRow[alias] = executeAggregate(name, values);
          }
        } else if (args.expr.type === 'star') {
          // 处理 COUNT(*) 等情况
          if (name.toUpperCase() === 'COUNT') {
            groupRow[alias] = rows.length;
          }
        }
      } else if (col.expr.type === 'column_ref') {
        // 普通列引用，已在保留分组列步骤中处理
        const columnName = col.expr.column;
        const alias = col.as || columnName;
        
        // 如果该列不是分组列，则使用第一行的值
        if (!groupRow.hasOwnProperty(columnName)) {
          const tableName = col.expr.table || '';
          const fullColumnName = tableName ? `${tableName}.${columnName}` : columnName;
          
          // 1. 先尝试完整的表别名.列名形式
          if (rows[0][fullColumnName] !== undefined) {
            groupRow[alias] = rows[0][fullColumnName];
          } 
          // 2. 再尝试不带表别名的列名
          else if (rows[0][columnName] !== undefined) {
            groupRow[alias] = rows[0][columnName];
          }
          // 3. 最后尝试查找任何表别名下的该列名
          else {
            const matchingKey = Object.keys(rows[0]).find(k => 
              k.endsWith(`.${columnName}`)
            );
            if (matchingKey) {
              groupRow[alias] = rows[0][matchingKey];
            }
          }
        }
      }
    }
    
    console.log('生成的分组行:', groupRow);
    return groupRow;
  });
}

/**
 * 执行ORDER BY操作
 */
export function executeOrderBy(data: any[], orderBy: any[]): any[] {
  console.log('executeOrderBy - 输入数据:', data.length, '行');
  console.log('executeOrderBy - orderBy:', orderBy);
  
  if (data.length === 0) return [];
  
  // 打印第一行数据的键，帮助调试
  console.log('第一行数据的键:', Object.keys(data[0]));
  
  return [...data].sort((a, b) => {
    for (const order of orderBy) {
      console.log('处理ORDER BY项:', order);
      
      // 获取排序列名
      let column;
      const expr = order.expr;
      
      // 处理不同类型的表达式
      if (expr.type === 'column_ref') {
        // 普通列引用
        if (expr.column && typeof expr.column === 'string') {
          column = expr.column.includes('.') ? 
            expr.column.split('.')[1] : expr.column;
        } else {
          console.warn('无效的列引用:', expr);
          continue;
        }
      } else if (expr.type === 'aggr_func') {
        // 聚合函数
        const funcName = expr.name;
        let argColumn = '*';
        
        if (expr.args && expr.args.expr) {
          if (expr.args.expr.type === 'column_ref') {
            argColumn = expr.args.expr.column;
          } else if (expr.args.expr.type === 'star') {
            argColumn = '*';
          }
        }
        
        column = `${funcName}(${argColumn})`;
      } else {
        console.warn('不支持的ORDER BY表达式类型:', expr.type);
        continue;
      }
      
      console.log('解析的排序列名:', column);
      
      // 确定排序方向
      const direction = order.type?.toUpperCase() || 'ASC';
      console.log('排序方向:', direction);
      
      // 获取值进行比较
      const aVal = a[column];
      const bVal = b[column];
      
      console.log('比较值:', { aVal, bVal });
      
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
