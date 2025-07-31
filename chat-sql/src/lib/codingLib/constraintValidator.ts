/**
 * 约束验证模块
 * 
 * 该模块提供了用于验证数据库约束（如主键、外键）的函数集合。
 */

import { TableData } from '@/types/CodingTypes/sqlExecutor';

/**
 * 验证主键约束
 * @param table 表数据
 * @param row 要验证的数据行
 * @throws 如果违反主键约束，则抛出错误
 */
export function validatePrimaryKey(table: TableData, row: any): void {
  const primaryKeys = table.structure.columns
    .filter(col => col.isPrimary)
    .map(col => col.name);

  if (primaryKeys.length === 0) return;

  const existingRow = table.data.find(existing =>
    primaryKeys.every(key => existing[key] === row[key])
  );

  if (existingRow) {
    throw new Error('违反主键约束');
  }
}

/**
 * 验证外键约束
 * @param table 表数据
 * @param row 要验证的数据行
 * @param getTable 获取表的函数
 * @throws 如果违反外键约束，则抛出错误
 */
export function validateForeignKeys(
  table: TableData, 
  row: any, 
  getTable: (tableName: string) => TableData | undefined
): void {
  // 实现外键约束验证
  table.structure.columns.forEach(column => {
    if (column.foreignKeyRefs) {
      column.foreignKeyRefs.forEach(ref => {
        const refTable = getTable(ref.tableName);
        if (!refTable) {
          throw new Error(`引用的表 ${ref.tableName} 不存在`);
        }

        const value = row[column.name];
        const exists = refTable.data.some(refRow => 
          refRow[ref.columnName] === value
        );

        if (!exists) {
          throw new Error(`违反外键约束: ${column.name}`);
        }
      });
    }
  });
}
