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
    ? values.map(row => row[columnName])
    : values;

  return fn(columnValues);
}

export function isAggregateFunction(expr: any): boolean {
  return expr?.type === 'aggr_func' && expr?.name in aggregateFunctions;
}