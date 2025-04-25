/**
 * SQL编辑器自动补全提供器
 *
 * 该模块提供了基于当前表结构生成SQL自动补全建议的功能
 */

import { TableStructure } from '@/types/dify';

/**
 * SQL关键字列表，包含详细的用法说明
 */
const SQL_KEYWORDS = [
  {
    label: 'SELECT',
    documentation: '选择数据列。\n语法: SELECT 列名1, 列名2, ... FROM 表名 WHERE 条件;\n例如: SELECT id, name FROM users WHERE age > 18;'
  },
  {
    label: 'FROM',
    documentation: '指定查询的数据表。\n语法: SELECT 列名 FROM 表名;\n例如: SELECT * FROM products;'
  },
  {
    label: 'WHERE',
    documentation: '添加筛选条件。\n语法: SELECT 列名 FROM 表名 WHERE 条件;\n例如: SELECT * FROM orders WHERE order_date > "2023-01-01";'
  },
  {
    label: 'JOIN',
    documentation: '连接两个表。\n语法: SELECT * FROM 表1 JOIN 表2 ON 表1.列名 = 表2.列名;\n例如: SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'LEFT JOIN',
    documentation: '左连接，保留左表所有行。\n语法: SELECT * FROM 表1 LEFT JOIN 表2 ON 表1.列名 = 表2.列名;\n例如: SELECT * FROM customers LEFT JOIN orders ON customers.id = orders.customer_id;'
  },
  {
    label: 'RIGHT JOIN',
    documentation: '右连接，保留右表所有行。\n语法: SELECT * FROM 表1 RIGHT JOIN 表2 ON 表1.列名 = 表2.列名;\n例如: SELECT * FROM orders RIGHT JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'INNER JOIN',
    documentation: '内连接，只返回两表匹配的行。\n语法: SELECT * FROM 表1 INNER JOIN 表2 ON 表1.列名 = 表2.列名;\n例如: SELECT * FROM orders INNER JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'GROUP BY',
    documentation: '按指定列分组。\n语法: SELECT 列名, 聚合函数() FROM 表名 GROUP BY 列名;\n例如: SELECT department, COUNT(*) FROM employees GROUP BY department;'
  },
  {
    label: 'HAVING',
    documentation: '对分组结果进行筛选。\n语法: SELECT 列名, 聚合函数() FROM 表名 GROUP BY 列名 HAVING 条件;\n例如: SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5;'
  },
  {
    label: 'ORDER BY',
    documentation: '对结果进行排序。\n语法: SELECT 列名 FROM 表名 ORDER BY 列名 [ASC|DESC];\n例如: SELECT * FROM products ORDER BY price DESC;'
  },
  {
    label: 'LIMIT',
    documentation: '限制返回结果的数量。\n语法: SELECT 列名 FROM 表名 LIMIT 数量 [OFFSET 偏移量];\n例如: SELECT * FROM products LIMIT 10 OFFSET 20;'
  },
  {
    label: 'INSERT INTO',
    documentation: '向表中插入数据。\n语法: INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);\n例如: INSERT INTO users (name, email) VALUES ("张三", "zhangsan@example.com");'
  },
  {
    label: 'VALUES',
    documentation: '指定要插入的值。\n语法: INSERT INTO 表名 (列1, 列2) VALUES (值1, 值2);\n例如: INSERT INTO products (name, price) VALUES ("手机", 1999);'
  },
  {
    label: 'UPDATE',
    documentation: '更新表中的数据。\n语法: UPDATE 表名 SET 列1 = 值1, 列2 = 值2 WHERE 条件;\n例如: UPDATE users SET status = "active" WHERE id = 5;'
  },
  {
    label: 'SET',
    documentation: '在UPDATE语句中指定要更新的列和值。\n语法: UPDATE 表名 SET 列名 = 新值 WHERE 条件;\n例如: UPDATE products SET price = 1888, stock = 100 WHERE id = 10;'
  },
  {
    label: 'DELETE FROM',
    documentation: '删除表中的数据。\n语法: DELETE FROM 表名 WHERE 条件;\n例如: DELETE FROM users WHERE last_login < "2022-01-01";'
  },
  {
    label: 'CREATE TABLE',
    documentation: '创建新表。\n语法: CREATE TABLE 表名 (列名1 类型1, 列名2 类型2, ...);\n例如: CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));'
  },
  {
    label: 'DROP TABLE',
    documentation: '删除表。\n语法: DROP TABLE 表名;\n例如: DROP TABLE old_logs;'
  },
  {
    label: 'ALTER TABLE',
    documentation: '修改表结构。\n语法: ALTER TABLE 表名 ADD|DROP|MODIFY 列名 [类型];\n例如: ALTER TABLE users ADD COLUMN birth_date DATE;'
  },
  {
    label: 'ADD COLUMN',
    documentation: '向表中添加新列。\n语法: ALTER TABLE 表名 ADD COLUMN 列名 类型 [约束];\n例如: ALTER TABLE products ADD COLUMN discount DECIMAL(5,2);'
  },
  {
    label: 'DROP COLUMN',
    documentation: '从表中删除列。\n语法: ALTER TABLE 表名 DROP COLUMN 列名;\n例如: ALTER TABLE users DROP COLUMN unused_field;'
  },
  {
    label: 'AND',
    documentation: '逻辑与运算符，用于组合多个条件。\n语法: WHERE 条件1 AND 条件2;\n例如: SELECT * FROM products WHERE price > 100 AND stock > 0;'
  },
  {
    label: 'OR',
    documentation: '逻辑或运算符，用于组合多个条件。\n语法: WHERE 条件1 OR 条件2;\n例如: SELECT * FROM users WHERE role = "admin" OR role = "manager";'
  },
  {
    label: 'NOT',
    documentation: '逻辑非运算符，用于否定条件。\n语法: WHERE NOT 条件;\n例如: SELECT * FROM products WHERE NOT category = "discontinued";'
  },
  {
    label: 'IN',
    documentation: '检查值是否在指定集合中。\n语法: WHERE 列名 IN (值1, 值2, ...);\n例如: SELECT * FROM products WHERE category IN ("电子", "家电", "数码");'
  },
  {
    label: 'BETWEEN',
    documentation: '检查值是否在指定范围内。\n语法: WHERE 列名 BETWEEN 值1 AND 值2;\n例如: SELECT * FROM orders WHERE order_date BETWEEN "2023-01-01" AND "2023-12-31";'
  },
  {
    label: 'LIKE',
    documentation: '模式匹配。% 表示任意多个字符，_ 表示单个字符。\n语法: WHERE 列名 LIKE 模式;\n例如: SELECT * FROM products WHERE name LIKE "%手机%";'
  },
  {
    label: 'IS NULL',
    documentation: '检查值是否为NULL。\n语法: WHERE 列名 IS NULL;\n例如: SELECT * FROM users WHERE phone IS NULL;'
  },
  {
    label: 'IS NOT NULL',
    documentation: '检查值是否不为NULL。\n语法: WHERE 列名 IS NOT NULL;\n例如: SELECT * FROM users WHERE email IS NOT NULL;'
  },
  {
    label: 'COUNT',
    documentation: '计算行数。\n语法: SELECT COUNT(列名) FROM 表名;\n例如: SELECT COUNT(*) FROM orders WHERE status = "completed";'
  },
  {
    label: 'SUM',
    documentation: '计算总和。\n语法: SELECT SUM(列名) FROM 表名;\n例如: SELECT SUM(amount) FROM orders WHERE order_date > "2023-01-01";'
  },
  {
    label: 'AVG',
    documentation: '计算平均值。\n语法: SELECT AVG(列名) FROM 表名;\n例如: SELECT AVG(price) FROM products WHERE category = "电子";'
  },
  {
    label: 'MAX',
    documentation: '找出最大值。\n语法: SELECT MAX(列名) FROM 表名;\n例如: SELECT MAX(price) FROM products;'
  },
  {
    label: 'MIN',
    documentation: '找出最小值。\n语法: SELECT MIN(列名) FROM 表名;\n例如: SELECT MIN(order_date) FROM orders;'
  },
  {
    label: 'DISTINCT',
    documentation: '返回唯一值，去除重复。\n语法: SELECT DISTINCT 列名 FROM 表名;\n例如: SELECT DISTINCT category FROM products;'
  },
  {
    label: 'AS',
    documentation: '为列或表指定别名。\n语法: SELECT 列名 AS 别名 FROM 表名 AS 表别名;\n例如: SELECT p.name AS product_name FROM products AS p;'
  },
  {
    label: 'UNION',
    documentation: '合并两个查询的结果集（去重）。\n语法: SELECT ... UNION SELECT ...;\n例如: SELECT name FROM customers UNION SELECT name FROM employees;'
  },
  {
    label: 'UNION ALL',
    documentation: '合并两个查询的结果集（不去重）。\n语法: SELECT ... UNION ALL SELECT ...;\n例如: SELECT product_id FROM orders_2022 UNION ALL SELECT product_id FROM orders_2023;'
  },
  {
    label: 'BEGIN',
    documentation: '开始一个事务。\n语法: BEGIN;\n事务允许将多个操作作为一个单元执行，要么全部成功，要么全部失败。'
  },
  {
    label: 'COMMIT',
    documentation: '提交事务，使事务中的所有更改永久生效。\n语法: COMMIT;\n例如: 在执行多个相关的INSERT或UPDATE后使用COMMIT确认这些更改。'
  },
  {
    label: 'ROLLBACK',
    documentation: '回滚事务，取消事务中的所有更改。\n语法: ROLLBACK;\n例如: 当事务中的某个操作失败时，使用ROLLBACK撤销之前的所有更改。'
  },
];

/**
 * 生成唯一的建议项ID
 * @param type 建议项类型
 * @param label 建议项标签
 * @returns 唯一ID
 */
function createSuggestionId(type: string, label: string): string {
  return `${type}:${label.toUpperCase()}`; // 使用大写形式确保不区分大小写
}

/**
 * 检查是否为SQL关键字
 * @param label 标签
 * @returns 是否为SQL关键字
 */
function isSQLKeyword(label: string): boolean {
  return SQL_KEYWORDS.some(keyword =>
    keyword.label.toUpperCase() === label.toUpperCase()
  );
}

/**
 * 创建一个唯一的自动补全提供器
 * 该提供器会过滤掉重复的候选项，并确保SQL关键字、表名和列名按照合理的顺序排列
 * @param monaco Monaco编辑器实例
 * @param tableStructures 表结构数组
 * @returns 自动补全提供器
 */
/**
 * 创建SQL悬停提示提供器
 * 当用户将鼠标悬停在SQL关键字、表名或列名上时，显示相关文档
 * @param monaco Monaco编辑器实例
 * @param tableStructures 表结构数组
 * @returns 悬停提示提供器
 */
export function createSQLHoverProvider(monaco: any, tableStructures: TableStructure[] | undefined) {
  return {
    provideHover: (model: any, position: any) => {
      // 获取当前光标所在的单词
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const wordText = word.word.toUpperCase();

      // 检查是否是SQL关键字
      const keyword = SQL_KEYWORDS.find(k => k.label.toUpperCase() === wordText);
      if (keyword) {
        return {
          contents: [
            { value: `**${keyword.label}**` },
            { value: keyword.documentation }
          ],
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          }
        };
      }

      // 如果没有表结构，只检查关键字
      if (!tableStructures || tableStructures.length === 0) {
        return null;
      }

      // 检查是否是表名
      const table = tableStructures.find(t => t.tableName.toUpperCase() === wordText);
      if (table) {
        const columnsList = table.columns.map(col =>
          `- **${col.name}** (${col.type})${col.isPrimary ? ' [主键]' : ''}`
        ).join('\n');

        return {
          contents: [
            { value: `**表: ${table.tableName}**` },
            { value: `包含以下列:\n${columnsList}` }
          ],
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          }
        };
      }

      // 检查是否是列名（不带表名前缀）
      for (const table of tableStructures) {
        const column = table.columns.find(col => col.name.toUpperCase() === wordText);
        if (column) {
          return {
            contents: [
              { value: `**列: ${column.name}**` },
              { value: `类型: ${column.type}${column.isPrimary ? ' [主键]' : ''}\n来自表: ${table.tableName}` }
            ],
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            }
          };
        }
      }

      // 检查是否是带表名前缀的列名（如 table.column）
      const lineContent = model.getLineContent(position.lineNumber);
      const dotMatch = lineContent.substring(0, position.column).match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)$/);
      if (dotMatch) {
        const tableName = dotMatch[1];
        const columnName = dotMatch[2];

        const table = tableStructures.find(t => t.tableName.toUpperCase() === tableName.toUpperCase());
        if (table) {
          const column = table.columns.find(col => col.name.toUpperCase() === columnName.toUpperCase());
          if (column) {
            return {
              contents: [
                { value: `**列: ${column.name}**` },
                { value: `类型: ${column.type}${column.isPrimary ? ' [主键]' : ''}\n来自表: ${table.tableName}` }
              ],
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn - tableName.length - 1,
                endColumn: word.endColumn
              }
            };
          }
        }
      }

      return null;
    }
  };
}

/**
 * 创建一个唯一的自动补全提供器
 * 该提供器会过滤掉重复的候选项，并确保SQL关键字、表名和列名按照合理的顺序排列
 * @param monaco Monaco编辑器实例
 * @param tableStructures 表结构数组
 * @returns 自动补全提供器
 */
export function createSQLCompletionProvider(monaco: any, tableStructures: TableStructure[] | undefined) {
  // 创建一个集合，用于跟踪已经添加的标签，避免重复
  const addedLabels = new Set<string>();

  return {
    // 定义触发自动补全的字符
    triggerCharacters: [' ', '.', ',', '(', '=', '>', '<', '!', '*'],

    provideCompletionItems: (model: any, position: any) => {
      // 清空已添加标签集合
      addedLabels.clear();

      // 使用Map来存储建议项，确保唯一性
      const suggestionsMap = new Map<string, any>();

      // 获取当前行的文本，用于上下文感知的补全
      const lineContent = model.getLineContent(position.lineNumber);
      const wordUntilPosition = model.getWordUntilPosition(position);
      // 获取光标前的文本，用于判断上下文
      const textBefore = lineContent.substring(0, wordUntilPosition.startColumn - 1);

      // 添加SQL关键字
      for (const keyword of SQL_KEYWORDS) {
        // 检查是否已经添加过这个标签
        if (addedLabels.has(keyword.label.toUpperCase())) {
          continue;
        }

        const id = createSuggestionId('keyword', keyword.label);
        suggestionsMap.set(id, {
          label: keyword.label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword.label,
          documentation: keyword.documentation,
          sortText: '0' + keyword.label, // 确保关键字排在前面
          // 添加范围信息，帮助编辑器更好地处理补全
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordUntilPosition.startColumn,
            endColumn: wordUntilPosition.endColumn
          }
        });

        // 记录已添加的标签
        addedLabels.add(keyword.label.toUpperCase());
      }

      // 如果没有表结构，只返回关键字
      if (!tableStructures || tableStructures.length === 0) {
        return { suggestions: Array.from(suggestionsMap.values()) };
      }

      // 判断是否在FROM子句后面，用于决定是否优先显示表名
      const isAfterFrom = /\bFROM\s+$/i.test(textBefore);
      // 判断是否在表名后面的点号后面，用于决定是否只显示该表的列
      const tableNameMatch = textBefore.match(/\b([A-Za-z0-9_]+)\.\s*$/);
      const currentTableName = tableNameMatch ? tableNameMatch[1] : null;

      // 添加表名
      for (const table of tableStructures) {
        // 检查是否已经添加过这个表名
        if (addedLabels.has(`TABLE:${table.tableName.toUpperCase()}`)) {
          continue;
        }

        const tableId = createSuggestionId('table', table.tableName);
        suggestionsMap.set(tableId, {
          label: table.tableName,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: table.tableName,
          documentation: `表: ${table.tableName}`,
          sortText: isAfterFrom ? '0' + table.tableName : '1' + table.tableName, // 如果在FROM后面，表名优先级提高
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordUntilPosition.startColumn,
            endColumn: wordUntilPosition.endColumn
          }
        });

        // 记录已添加的表名
        addedLabels.add(`TABLE:${table.tableName.toUpperCase()}`);

        // 收集所有列名，以便后续去重
        const columnSet = new Set<string>();

        // 如果在特定表名后面的点号后面，只显示该表的列
        if (currentTableName && table.tableName.toUpperCase() !== currentTableName.toUpperCase()) {
          continue;
        }

        // 添加列名（带表名前缀）
        for (const column of table.columns) {
          // 如果已经添加过这个带表名的列，则跳过
          const qualifiedColumnKey = `${table.tableName}.${column.name}`.toUpperCase();
          if (addedLabels.has(`QUALIFIED_COLUMN:${qualifiedColumnKey}`)) {
            continue;
          }

          // 完整列名（带表名）
          const qualifiedColumnId = createSuggestionId('qualified_column', `${table.tableName}.${column.name}`);
          suggestionsMap.set(qualifiedColumnId, {
            label: `${table.tableName}.${column.name}`,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: `${table.tableName}.${column.name}`,
            documentation: `表: ${table.tableName}, 列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}`,
            sortText: '2' + table.tableName + '.' + column.name, // 带表名的列排在表名后面
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: wordUntilPosition.endColumn
            }
          });

          // 记录已添加的带表名的列
          addedLabels.add(`QUALIFIED_COLUMN:${qualifiedColumnKey}`);

          // 记录列名，用于后续添加不重复的单独列名
          columnSet.add(column.name);
        }

        // 如果在表名后面的点号后面，不显示单独的列名
        if (currentTableName) {
          continue;
        }

        // 添加单独的列名（不带表名前缀）
        for (const columnName of columnSet) {
          // 跳过与SQL关键字同名的列名，避免重复
          if (isSQLKeyword(columnName)) {
            continue;
          }

          // 如果已经添加过这个列名，则跳过
          if (addedLabels.has(`COLUMN:${columnName.toUpperCase()}`)) {
            continue;
          }

          // 查找该列名在当前表中的完整信息
          const column = table.columns.find(col => col.name === columnName);
          if (column) {
            const columnId = createSuggestionId('column', columnName);

            // 如果已经存在这个列名，则合并文档信息
            if (suggestionsMap.has(columnId)) {
              const existingSuggestion = suggestionsMap.get(columnId);
              existingSuggestion.documentation += `\n也来自表: ${table.tableName}`;
            } else {
              suggestionsMap.set(columnId, {
                label: columnName,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: columnName,
                documentation: `列: ${columnName}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}, 来自表: ${table.tableName}`,
                sortText: '3' + columnName, // 单独的列名排在最后
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
            }

            // 记录已添加的列名
            addedLabels.add(`COLUMN:${columnName.toUpperCase()}`);
          }
        }
      }

      return { suggestions: Array.from(suggestionsMap.values()) };
    }
  };
}
