/**
 * 条件评估模块
 * 
 * 该模块提供了用于评估SQL查询条件的函数集合，包括WHERE子句、表达式和比较操作的处理。
 */

/**
 * 评估WHERE子句
 * @param row 当前数据行
 * @param where WHERE子句的AST
 * @returns 布尔值，表示该行是否满足WHERE条件
 */
export function evaluateWhereClause(row: any, where: any): boolean {
  if (!where) return true;
  // 直接调用 evaluateCondition
  return evaluateCondition(row, where);
}

/**
 * 评估条件表达式
 * @param row 当前数据行
 * @param condition 条件表达式的AST
 * @returns 布尔值，表示该条件是否为真
 */
export function evaluateCondition(row: any, condition: any): boolean {
  if (!condition) return true;
  
  console.log('Evaluating condition:', condition);
  
  // 处理逻辑运算符的特殊情况
  if (condition.operator === 'AND' || condition.operator === 'OR') {
    const leftResult = evaluateCondition(row, condition.left);
    const rightResult = evaluateCondition(row, condition.right);
    return condition.operator === 'AND' ? leftResult && rightResult : leftResult || rightResult;
  }

  // 处理二元表达式
  if (condition.type === 'binary_expr') {
    const leftValue = evaluateExpression(condition.left, row);
    const rightValue = evaluateExpression(condition.right, row);
    console.log('Binary expression values:', { 
      leftValue, 
      operator: condition.operator, 
      rightValue,
      leftExpr: condition.left,
      rightExpr: condition.right
    });
    return evaluateComparison(leftValue, condition.operator, rightValue);
  }

  throw new Error(`不支持的条件类型: ${condition.type}`);
}

/**
 * 评估比较操作
 * @param left 左侧值
 * @param operator 比较运算符
 * @param right 右侧值
 * @returns 布尔值，表示比较结果
 */
export function evaluateComparison(left: any, operator: string, right: any): boolean {
  console.log('Comparing:', { left, operator, right }); // 调试日志
  
  switch (operator.toUpperCase()) {
    case '=': return left === right;
    case '>': return left > right;
    case '<': return left < right;
    case '>=': return left >= right;
    case '<=': return left <= right;
    case '<>': 
    case '!=': return left !== right;
    case 'LIKE': return evaluateLike(left, right);
    case 'IN': return Array.isArray(right) && right.includes(left);
    case 'IS': return (left === null && right === null) || left === right;
    case 'IS NOT': return (left !== null || right !== null) && left !== right;
    default:
      console.log('Unsupported operator:', operator);
      return false;
  }
}

/**
 * 评估表达式并返回其值
 * @param expr 表达式的AST
 * @param row 当前数据行（可选）
 * @returns 表达式的值
 */
export function evaluateExpression(expr: any, row?: any): any {
  if (!expr) return null;
  
  console.log('Evaluating expression:', expr);
  
  if (expr.type === 'column_ref') {
    const value = row[expr.column];
    console.log('Column reference:', { column: expr.column, value });
    return value;
  }
  
  if (expr.type === 'string') {
    // 确保移除引号
    const value = expr.value.replace(/^['"]|['"]$/g, '');
    console.log('String value:', value);
    return value;
  }
  
  if (expr.type === 'number') {
    return Number(expr.value);
  }
  
  if (expr.type === 'bool') {
    return Boolean(expr.value);
  }
  
  if (typeof expr === 'string' || typeof expr === 'number' || typeof expr === 'boolean') {
    return expr;
  }
  
  if (expr.value !== undefined) {
    return expr.value;
  }
  
  return expr;
}

/**
 * 评估LIKE操作符
 * @param value 要比较的值
 * @param pattern LIKE模式
 * @returns 布尔值，表示是否匹配
 */
export function evaluateLike(value: string, pattern: string): boolean {
  console.log('Evaluating LIKE:', { value, pattern });

  if (typeof value !== 'string' || typeof pattern !== 'string') {
    console.log('Invalid types for LIKE:', { 
      valueType: typeof value, 
      patternType: typeof pattern,
      value,
      pattern
    });
    return false;
  }

  try {
    // 将SQL LIKE模式转换为正则表达式
    let regexPattern = pattern
      .replace(/%/g, '.*')     // % 匹配任意字符序列
      .replace(/_/g, '.');     // _ 匹配单个字符

    // 转义特殊字符，但保留已转换的 .* 和 .
    regexPattern = regexPattern
      .split('.*').map(part => 
        part.split('.').map(subPart => 
          subPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('.')
      ).join('.*');

    console.log('Converted regex pattern:', regexPattern);
    
    // 使用 RegExp 构造函数，不添加 ^ 和 $，允许部分匹配
    const regex = new RegExp(regexPattern);
    const result = regex.test(value);
    
    console.log('LIKE evaluation result:', {
      value,
      pattern,
      regexPattern,
      result
    });
    
    return result;
  } catch (error) {
    console.error('Error in LIKE evaluation:', error);
    return false;
  }
}
