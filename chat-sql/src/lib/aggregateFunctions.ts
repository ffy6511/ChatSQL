/**
 * 聚合函数处理模块
 */

type AggregateFunction = (values: any[]) => number;

const aggregateFunctions: Record<string, AggregateFunction> = {
  COUNT: (values: any[]) => values.filter(v => v !== null && v !== undefined).length,
  SUM: (values: any[]) => values.reduce((sum, val) => sum + (Number(val) || 0), 0),
  AVG: (values: any[]) => {
    const validValues = values.filter(v => v !== null && v !== undefined);
    return validValues.length ? aggregateFunctions.SUM(validValues) / validValues.length : 0;
  },
  MAX: (values: any[]) => Math.max(...values.map(v => Number(v) || 0)),
  MIN: (values: any[]) => Math.min(...values.map(v => Number(v) || 0))
};

export function executeAggregateFunction(
  functionName: string,
  values: any[],
  columnName?: string
): number {
  const fn = aggregateFunctions[functionName.toUpperCase()];
  if (!fn) {
    throw new Error(`不支持的聚合函数: ${functionName}`);
  }

  // 如果指定了列名，先提取该列的值
  const columnValues = columnName 
    ? values.map(row => {
        // 确保能正确获取列值，即使列名带有表前缀
        const value = row[columnName];
        if (value !== undefined) {
          return value;
        }
        
        // 如果直接访问失败，尝试查找匹配的键
        // 这种情况可能发生在JOIN操作后，列名可能带有表前缀
        console.log(`聚合函数 ${functionName} 尝试查找列 ${columnName} 的值`);
        return undefined;
      }).filter(v => v !== undefined)
    : values;

  console.log(`聚合函数 ${functionName} 处理列 ${columnName}，找到 ${columnValues.length} 个有效值`);
  return fn(columnValues);
}

export function isAggregateFunction(expr: any): boolean {
  return expr?.type === 'aggr_func' && expr?.name in aggregateFunctions;
}