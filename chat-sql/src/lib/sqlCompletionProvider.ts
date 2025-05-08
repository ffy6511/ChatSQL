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
    documentation: 'Select data columns.  \nSyntax: SELECT column1, column2, ... FROM table WHERE condition;  \nExample: SELECT id, name FROM users WHERE age > 18;'
  },
  {
    label: 'FROM',
    documentation: 'Specify the table to query.  \nSyntax: SELECT column FROM table;  \nExample: SELECT * FROM products;'
  },
  {
    label: 'WHERE',
    documentation: 'Add filtering conditions.  \nSyntax: SELECT column FROM table WHERE condition;  \nExample: SELECT * FROM orders WHERE order_date > "2023-01-01";'
  },
  {
    label: 'JOIN',
    documentation: 'Join two tables.  \nSyntax: SELECT * FROM table1 JOIN table2 ON table1.column = table2.column;  \nExample: SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'LEFT JOIN',
    documentation: 'Left join, preserves all rows from the left table.  \nSyntax: SELECT * FROM table1 LEFT JOIN table2 ON table1.column = table2.column;  \nExample: SELECT * FROM customers LEFT JOIN orders ON customers.id = orders.customer_id;'
  },
  {
    label: 'RIGHT JOIN',
    documentation: 'Right join, preserves all rows from the right table.  \nSyntax: SELECT * FROM table1 RIGHT JOIN table2 ON table1.column = table2.column;  \nExample: SELECT * FROM orders RIGHT JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'INNER JOIN',
    documentation: 'Inner join, returns only matching rows from both tables.  \nSyntax: SELECT * FROM table1 INNER JOIN table2 ON table1.column = table2.column;  \nExample: SELECT * FROM orders INNER JOIN customers ON orders.customer_id = customers.id;'
  },
  {
    label: 'GROUP BY',
    documentation: 'Group by specified columns.  \nSyntax: SELECT column, aggregate_function() FROM table GROUP BY column;  \nExample: SELECT department, COUNT(*) FROM employees GROUP BY department;'
  },
  {
    label: 'HAVING',
    documentation: 'Filter grouped results.  \nSyntax: SELECT column, aggregate_function() FROM table GROUP BY column HAVING condition;  \nExample: SELECT department, COUNT(\*) FROM employees GROUP BY department HAVING COUNT(\*) > 5;'
  },
  {
    label: 'ORDER BY',
    documentation: 'Sort results.  \nSyntax: SELECT column FROM table ORDER BY column [ASC|DESC];  \nExample: SELECT * FROM products ORDER BY price DESC;'
  },
  {
    label: 'LIMIT',
    documentation: 'Limit the number of returned results.  \nSyntax: SELECT column FROM table LIMIT count [OFFSET offset];  \nExample: SELECT * FROM products LIMIT 10 OFFSET 20;'
  },
  {
    label: 'INSERT INTO',
    documentation: 'Insert data into a table.  \nSyntax: INSERT INTO table (column1, column2, ...) VALUES (value1, value2, ...);  \nExample: INSERT INTO users (name, email) VALUES ("John", "john@example.com");'
  },
  {
    label: 'VALUES',
    documentation: 'Specify values to insert.  \nSyntax: INSERT INTO table (column1, column2) VALUES (value1, value2);  \nExample: INSERT INTO products (name, price) VALUES ("Phone", 1999);'
  },
  {
    label: 'UPDATE',
    documentation: 'Update data in a table.  \nSyntax: UPDATE table SET column1 = value1, column2 = value2 WHERE condition;  \nExample: UPDATE users SET status = "active" WHERE id = 5;'
  },
  {
    label: 'SET',
    documentation: 'Specify columns and values to update in an UPDATE statement.  \nSyntax: UPDATE table SET column = new_value WHERE condition;  \nExample: UPDATE products SET price = 1888, stock = 100 WHERE id = 10;'
  },
  {
    label: 'DELETE FROM',
    documentation: 'Delete data from a table.  \nSyntax: DELETE FROM table WHERE condition;  \nExample: DELETE FROM users WHERE last_login < "2022-01-01";'
  },
  {
    label: 'CREATE TABLE',
    documentation: 'Create a new table.  \nSyntax: CREATE TABLE table (column1 type1, column2 type2, ...);  \nExample: CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));'
  },
  {
    label: 'DROP TABLE',
    documentation: 'Delete a table.  \nSyntax: DROP TABLE table;  \nExample: DROP TABLE old_logs;'
  },
  {
    label: 'ALTER TABLE',
    documentation: 'Modify table structure.  \nSyntax: ALTER TABLE table ADD|DROP|MODIFY column [type];  \nExample: ALTER TABLE users ADD COLUMN birth_date DATE;'
  },
  {
    label: 'ADD COLUMN',
    documentation: 'Add a new column to a table.  \nSyntax: ALTER TABLE table ADD COLUMN column type [constraint];  \nExample: ALTER TABLE products ADD COLUMN discount DECIMAL(5,2);'
  },
  {
    label: 'DROP COLUMN',
    documentation: 'Remove a column from a table.  \nSyntax: ALTER TABLE table DROP COLUMN column;  \nExample: ALTER TABLE users DROP COLUMN unused_field;'
  },
  {
    label: 'AND',
    documentation: 'Logical AND operator, combines multiple conditions.  \nSyntax: WHERE condition1 AND condition2;  \nExample: SELECT * FROM products WHERE price > 100 AND stock > 0;'
  },
  {
    label: 'OR',
    documentation: 'Logical OR operator, combines multiple conditions.  \nSyntax: WHERE condition1 OR condition2;  \nExample: SELECT * FROM users WHERE role = "admin" OR role = "manager";'
  },
  {
    label: 'NOT',
    documentation: 'Logical NOT operator, negates a condition.  \nSyntax: WHERE NOT condition;  \nExample: SELECT * FROM products WHERE NOT category = "discontinued";'
  },
  {
    label: 'IN',
    documentation: 'Check if a value is in a specified set.  \nSyntax: WHERE column IN (value1, value2, ...);  \nExample: SELECT * FROM products WHERE category IN ("electronics", "appliances", "digital");'
  },
  {
    label: 'BETWEEN',
    documentation: 'Check if a value is within a specified range.  \nSyntax: WHERE column BETWEEN value1 AND value2;  \nExample: SELECT * FROM orders WHERE order_date BETWEEN "2023-01-01" AND "2023-12-31";'
  },
  {
    label: 'LIKE',
    documentation: 'Pattern matching. % represents any number of characters, _ represents a single character.  \nSyntax: WHERE column LIKE pattern;  \nExample: SELECT * FROM products WHERE name LIKE "%phone%";'
  },
  {
    label: 'IS NULL',
    documentation: 'Check if a value is NULL.  \nSyntax: WHERE column IS NULL;  \nExample: SELECT * FROM users WHERE phone IS NULL;'
  },
  {
    label: 'IS NOT NULL',
    documentation: 'Check if a value is not NULL.  \nSyntax: WHERE column IS NOT NULL;  \nExample: SELECT * FROM users WHERE email IS NOT NULL;'
  },
  {
    label: 'COUNT',
    documentation: 'Count rows.  \nSyntax: SELECT COUNT(column) FROM table;  \nExample: SELECT COUNT(*) FROM orders WHERE status = "completed";'
  },
  {
    label: 'SUM',
    documentation: 'Calculate sum.  \nSyntax: SELECT SUM(column) FROM table;  \nExample: SELECT SUM(amount) FROM orders WHERE order_date > "2023-01-01";'
  },
  {
    label: 'AVG',
    documentation: 'Calculate average.  \nSyntax: SELECT AVG(column) FROM table;  \nExample: SELECT AVG(price) FROM products WHERE category = "electronics";'
  },
  {
    label: 'MAX',
    documentation: 'Find maximum value.  \nSyntax: SELECT MAX(column) FROM table;  \nExample: SELECT MAX(price) FROM products;'
  },
  {
    label: 'MIN',
    documentation: 'Find minimum value.  \nSyntax: SELECT MIN(column) FROM table;  \nExample: SELECT MIN(order_date) FROM orders;'
  },
  {
    label: 'DISTINCT',
    documentation: 'Return unique values, remove duplicates.  \nSyntax: SELECT DISTINCT column FROM table;  \nExample: SELECT DISTINCT category FROM products;'
  },
  {
    label: 'AS',
    documentation: 'Specify alias for column or table.  \nSyntax: SELECT column AS alias FROM table AS table_alias;  \nExample: SELECT p.name AS product_name FROM products AS p;'
  },
  {
    label: 'UNION',
    documentation: 'Combine result sets from two queries (removes duplicates).  \nSyntax: SELECT ... UNION SELECT ...;  \nExample: SELECT name FROM customers UNION SELECT name FROM employees;'
  },
  {
    label: 'UNION ALL',
    documentation: 'Combine result sets from two queries (keeps duplicates).  \nSyntax: SELECT ... UNION ALL SELECT ...;  \nExample: SELECT product_id FROM orders_2022 UNION ALL SELECT product_id FROM orders_2023;'
  },
  {
    label: 'BEGIN',
    documentation: 'Start a transaction.  \nSyntax: BEGIN;  \nTransactions allow multiple operations to be executed as a single unit, either all succeed or all fail.'
  },
  {
    label: 'COMMIT',
    documentation: 'Commit a transaction, making all changes permanent.  \nSyntax: COMMIT;  \nExample: Use COMMIT after executing multiple related INSERTs or UPDATEs to confirm these changes.'
  },
  {
    label: 'ROLLBACK',
    documentation: 'Rollback a transaction, canceling all changes.  \nSyntax: ROLLBACK;  \nExample: Use ROLLBACK when an operation in the transaction fails to undo all previous changes.'
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
      
      // 获取当前行内容，用于检测多词关键字
      const lineContent = model.getLineContent(position.lineNumber);
      const lineUntilPosition = lineContent.substring(0, position.column);
      const lineAfterPosition = lineContent.substring(position.column);
      
      // 检查是否是SQL关键字（单个词）
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
      
      // 检查是否是多词SQL关键字（如"GROUP BY"）
      // 向前查找可能的关键字开始
      for (const keyword of SQL_KEYWORDS) {
        if (keyword.label.includes(' ')) {
          const parts = keyword.label.split(' ');
          // 如果当前单词匹配多词关键字的任何部分
          if (parts.some(part => part.toUpperCase() === wordText)) {
            // 尝试在当前行查找完整的多词关键字
            const keywordPattern = new RegExp(`\\b${keyword.label.replace(/ /g, '\\s+')}\\b`, 'i');
            const match = lineContent.match(keywordPattern);
            
            if (match) {
              const startIndex = match.index || 0;
              const endIndex = startIndex + match[0].length;
              
              // 检查当前光标是否在多词关键字范围内
              const cursorPos = position.column - 1; // 转为0-based索引
              if (cursorPos >= startIndex && cursorPos <= endIndex) {
                return {
                  contents: [
                    { value: `**${keyword.label}**` },
                    { value: keyword.documentation }
                  ],
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: startIndex + 1, // 转回1-based索引
                    endColumn: endIndex + 1
                  }
                };
              }
            }
          }
        }
      }

      // 如果没有表结构，只检查关键字
      if (!tableStructures || tableStructures.length === 0) {
        return null;
      }

      // 检查是否是表名
      const table = tableStructures.find(t => t.tableName.toUpperCase() === wordText);
      if (table) {
        const columnsList = table.columns.map(col =>
          `- **${col.name}** (${col.type})${col.isPrimary ? ' [Primary Key]' : ''}`
        ).join('\n');

        return {
          contents: [
            { value: `**Table: ${table.tableName}**` },
            { value: `Contains the following columns:\n${columnsList}` }
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
              { value: `**Column: ${column.name}**` },
              { value: `Type: ${column.type}${column.isPrimary ? ' [Primary Key]' : ''}\nFrom table: ${table.tableName}` }
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
                { value: `**Column: ${column.name}**` },
                { value: `Type: ${column.type}${column.isPrimary ? ' [Primary Key]' : ''}\nFrom table: ${table.tableName}` }
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
