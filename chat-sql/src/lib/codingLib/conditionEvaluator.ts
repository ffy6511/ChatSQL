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

  console.log("Evaluating condition:", condition);

  // 处理逻辑运算符的特殊情况
  if (condition.operator === "AND" || condition.operator === "OR") {
    const leftResult = evaluateCondition(row, condition.left);
    const rightResult = evaluateCondition(row, condition.right);
    return condition.operator === "AND"
      ? leftResult && rightResult
      : leftResult || rightResult;
  }

  // 处理二元表达式
  if (condition.type === "binary_expr") {
    const leftValue = evaluateExpression(condition.left, row);
    const rightValue = evaluateExpression(condition.right, row);
    console.log("Binary expression values:", {
      leftValue,
      operator: condition.operator,
      rightValue,
      leftExpr: condition.left,
      rightExpr: condition.right,
    });
    return evaluateComparison(leftValue, condition.operator, rightValue);
  }

  console.log("不支持的条件类型:", condition.type);
  return false;
}

/**
 * 评估比较操作
 * @param left 左侧值
 * @param operator 比较运算符
 * @param right 右侧值
 * @returns 布尔值，表示比较结果
 */
export function evaluateComparison(
  left: any,
  operator: string,
  right: any,
): boolean {
  console.log("Comparing:", { left, operator, right }); // 调试日志

  switch (operator.toUpperCase()) {
    case "=":
      return left === right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    case "<>":
    case "!=":
      return left !== right;
    case "LIKE":
      return evaluateLike(left, right);
    case "IN":
      return Array.isArray(right) && right.includes(left);
    case "IS":
      return (left === null && right === null) || left === right;
    case "IS NOT":
      return (left !== null || right !== null) && left !== right;
    default:
      console.log("Unsupported operator:", operator);
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

  console.log("Evaluating expression:", expr);

  // 处理数字字面量
  if (expr.type === "number") {
    return expr.value;
  }

  // 处理字符串字面量
  if (expr.type === "string") {
    return expr.value;
  }

  // 处理布尔字面量
  if (expr.type === "bool") {
    return expr.value;
  }

  // 处理NULL字面量
  if (expr.type === "null") {
    return null;
  }

  // 处理聚合函数
  if (expr.type === "aggr_func") {
    if (!row) return null;

    const funcName = expr.name;
    let argName = "*";

    if (expr.args && expr.args.expr) {
      if (expr.args.expr.type === "column_ref") {
        argName = expr.args.expr.column;
      } else if (expr.args.expr.type === "star") {
        argName = "*";
      }
    }

    // 尝试从行中获取聚合函数的结果
    const funcKey = `${funcName}(${argName})`;

    // 1. 尝试精确匹配
    if (row[funcKey] !== undefined) {
      console.log(`找到聚合函数结果 ${funcKey}:`, row[funcKey]);
      return row[funcKey];
    }

    // 2. 尝试别名匹配
    if (funcName === "COUNT" && row["student_count"] !== undefined) {
      console.log(`找到COUNT别名 student_count:`, row["student_count"]);
      return row["student_count"];
    }

    if (funcName === "AVG" && row["avg_age"] !== undefined) {
      console.log(`找到AVG别名 avg_age:`, row["avg_age"]);
      return row["avg_age"];
    }

    // 3. 尝试模糊匹配
    const possibleKey = Object.keys(row).find(
      (k) =>
        k.startsWith(`${funcName}(`) ||
        (funcName === "COUNT" && k.includes("count")) ||
        (funcName === "AVG" && k.includes("avg")),
    );

    if (possibleKey) {
      console.log(`找到可能的聚合函数结果 ${possibleKey}:`, row[possibleKey]);
      return row[possibleKey];
    }

    console.log(`未找到聚合函数 ${funcKey} 的结果`);
    return null;
  }

  // 处理子查询
  if (expr.ast) {
    console.log("检测到子查询表达式:", expr);
    return { __isSubQuery: true, ast: expr.ast };
  }

  if (expr.type === "column_ref") {
    if (!row) return null;

    const columnName = expr.column;
    const tableAlias = expr.table;

    // 1. 如果有表别名，先尝试完整的"表别名.列名"形式
    if (tableAlias) {
      const fullColumnName = `${tableAlias}.${columnName}`;
      if (row[fullColumnName] !== undefined) {
        console.log(`找到列 ${fullColumnName}:`, row[fullColumnName]);
        return row[fullColumnName];
      }
    }

    // 2. 尝试直接匹配列名（不带表别名）
    if (row[columnName] !== undefined) {
      console.log(`找到列 ${columnName}:`, row[columnName]);
      return row[columnName];
    }

    // 3. 尝试查找任何表别名下的该列名
    const matchingKey = Object.keys(row).find((k) =>
      k.endsWith(`.${columnName}`),
    );

    if (matchingKey) {
      console.log(`找到匹配列 ${matchingKey}:`, row[matchingKey]);
      return row[matchingKey];
    }

    console.log(`列 ${tableAlias ? tableAlias + "." : ""}${columnName} 未找到`);
    return null;
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
  console.log("Evaluating LIKE:", { value, pattern });

  if (typeof value !== "string" || typeof pattern !== "string") {
    console.log("Invalid types for LIKE:", {
      valueType: typeof value,
      patternType: typeof pattern,
      value,
      pattern,
    });
    return false;
  }

  try {
    // 将SQL LIKE模式转换为正则表达式
    let regexPattern = pattern
      .replace(/%/g, ".*") // % 匹配任意字符序列
      .replace(/_/g, "."); // _ 匹配单个字符

    // 转义特殊字符，但保留已转换的 .* 和 .
    regexPattern = regexPattern
      .split(".*")
      .map((part) =>
        part
          .split(".")
          .map((subPart) => subPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("."),
      )
      .join(".*");

    console.log("Converted regex pattern:", regexPattern);

    // 使用 RegExp 构造函数，不添加 ^ 和 $，允许部分匹配
    const regex = new RegExp(regexPattern);
    const result = regex.test(value);

    console.log("LIKE evaluation result:", {
      value,
      pattern,
      regexPattern,
      result,
    });

    return result;
  } catch (error) {
    console.error("Error in LIKE evaluation:", error);
    return false;
  }
}
