/**
 * SQL编辑器自动补全提供器
 *
 * 该模块提供了基于当前表结构生成SQL自动补全建议的功能
 */

import { TableStructure } from '@/types/dify';

/**
 * SQL关键字列表，包含详细的用法说明
 */
export const SQL_KEYWORDS = [
  {
    label: 'SELECT',
    documentation: 'Select data columns.  \nSyntax: SELECT column1, column2, ... FROM table WHERE condition;  \nExample: SELECT id, name FROM users WHERE age > 18;'
  },
  // 添加NATURAL JOIN关键字
  {
    label: 'NATURAL JOIN',
    documentation: 'automatically create join conditions based on columns with the same name in both tables.  \nSyntax: SELECT * FROM table1 NATURAL JOIN table2;  \nExample: SELECT * FROM employees NATURAL JOIN departments;'
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
 * 创建唯一的建议ID
 * @param type 建议类型
 * @param label 建议标签
 * @returns 唯一ID
 */
function createSuggestionId(type: string, label: string): string {
  return `${type}:${label.toUpperCase()}`;
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
    triggerCharacters: [' ', '.', ',', '(', '=', '>', '<', '!',],

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
      
      // 检查是否是空格触发的补全
      const isSpaceTrigger = textBefore.endsWith(' ');
      
      // 判断当前SQL语句的上下文
      const isSelectStatement = /\bSELECT\b/i.test(textBefore);
      const isAfterSelect = /\bSELECT\s+$/i.test(textBefore);
      const isAfterFrom = /\bFROM\s+$/i.test(textBefore);
      const isAfterWhere = /\bWHERE\s+$/i.test(textBefore);
      const isAfterJoin = /\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|NATURAL\s+JOIN)\s+$/i.test(textBefore);
      const isAfterGroupBy = /\bGROUP\s+BY\s+$/i.test(textBefore);
      const isAfterOrderBy = /\bORDER\s+BY\s+$/i.test(textBefore);
      
      // 判断是否在表名后面的点号后面，用于决定是否只显示该表的列
      const tableNameMatch = textBefore.match(/\b([A-Za-z0-9_]+)\.\s*$/);
      const currentTableName = tableNameMatch ? tableNameMatch[1] : null;

      // 根据上下文定义相关的关键字
      const SELECT_CONTEXT_KEYWORDS = ['DISTINCT', 'AS', 'FROM', '*'];
      const FROM_CONTEXT_KEYWORDS = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'NATURAL JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT'];
      const WHERE_CONTEXT_KEYWORDS = ['AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL'];
      const JOIN_CONTEXT_KEYWORDS = ['ON', 'USING'];
      const GROUP_BY_CONTEXT_KEYWORDS = ['HAVING', 'ORDER BY', 'LIMIT'];
      const ORDER_BY_CONTEXT_KEYWORDS = ['ASC', 'DESC', 'LIMIT'];
      
      // 如果是空格触发的补全，但不在任何特定上下文中，则不提供建议
      if (isSpaceTrigger) {
        // 检查是否在特定关键字后面
        const isInSpecificContext = isAfterSelect || 
                                   isAfterFrom || 
                                   isAfterWhere || 
                                   isAfterJoin || 
                                   isAfterGroupBy || 
                                   isAfterOrderBy;
                                   
        // 检查是否在表名后面（不带点号）
        // 匹配表名后面跟着空格的情况
        const isAfterTableName = tableStructures?.some(table => {
          const tableNameRegex = new RegExp(`\\b${table.tableName}\\s+$`, 'i');
          return tableNameRegex.test(textBefore);
        }) || false;
        
        // 检查是否在列名后面
        const isAfterColumnName = tableStructures?.some(table => 
          table.columns.some(column => {
            const columnNameRegex = new RegExp(`\\b${column.name}\\s+$`, 'i');
            return columnNameRegex.test(textBefore);
          })
        ) || false;
        
        // 检查是否在SQL语句的开头（可能需要输入SELECT等关键字）
        const isAtStatementStart = /^\s*$/.test(textBefore) || 
                                  /;\s*$/.test(textBefore);
                                  
        // 如果不在任何有意义的上下文中，则不提供建议
        if (!isInSpecificContext && !isAfterTableName && !isAfterColumnName && !isAtStatementStart) {
          return { suggestions: [] };
        }
        
        // 如果在表名后面，提供适当的关键字（如WHERE, JOIN等）
        if (isAfterTableName && !isInSpecificContext) {
          // 添加适合表名后面的关键字
          for (const keyword of SQL_KEYWORDS) {
            if (FROM_CONTEXT_KEYWORDS.includes(keyword.label)) {
              const id = createSuggestionId('keyword', keyword.label);
              suggestionsMap.set(id, {
                label: keyword.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword.label,
                documentation: keyword.documentation,
                sortText: '0' + keyword.label, // 关键字排在最前面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
            }
          }
          
          // 如果有建议，直接返回
          if (suggestionsMap.size > 0) {
            return { suggestions: Array.from(suggestionsMap.values()) };
          }
        }
        
        // 如果在列名后面，提供适当的操作符和关键字
        if (isAfterColumnName && !isInSpecificContext) {
          // 添加适合列名后面的操作符和关键字
          const COLUMN_CONTEXT_KEYWORDS = ['=', '>', '<', '>=', '<=', '<>', '!=', 'IS NULL', 'IS NOT NULL', 'LIKE', 'IN', 'BETWEEN', 'ASC', 'DESC'];
          
          for (const keyword of SQL_KEYWORDS) {
            if (COLUMN_CONTEXT_KEYWORDS.includes(keyword.label)) {
              const id = createSuggestionId('keyword', keyword.label);
              suggestionsMap.set(id, {
                label: keyword.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword.label,
                documentation: keyword.documentation,
                sortText: '0' + keyword.label, // 关键字排在最前面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
            }
          }
          
          // 添加常见的聚合函数关键字
          const AGGREGATE_KEYWORDS = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'];
          for (const keyword of SQL_KEYWORDS) {
            if (AGGREGATE_KEYWORDS.includes(keyword.label)) {
              const id = createSuggestionId('keyword', keyword.label);
              suggestionsMap.set(id, {
                label: keyword.label,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: keyword.label,
                documentation: keyword.documentation,
                sortText: '1' + keyword.label, // 函数排在关键字后面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
            }
          }
          
          // 如果有建议，直接返回
          if (suggestionsMap.size > 0) {
            return { suggestions: Array.from(suggestionsMap.values()) };
          }
        }
      }

      // 如果在表名后面的点号后面，只显示该表的列
      if (currentTableName) {
        // 查找匹配的表
        const table = tableStructures?.find(t => 
          t.tableName.toUpperCase() === currentTableName.toUpperCase()
        );
        
        if (table) {
          // 添加该表的所有列
          for (const column of table.columns) {
            const columnId = createSuggestionId('column', column.name);
            suggestionsMap.set(columnId, {
              label: column.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: column.name,
              documentation: `列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}`,
              sortText: '0' + column.name, // 列名排在最前面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
          }
          
          // 直接返回列建议，不显示其他内容
          return { suggestions: Array.from(suggestionsMap.values()) };
        }
      }
      
      // 如果在FROM或JOIN后面，优先提示表名
      if (isAfterFrom || isAfterJoin) {
        // 添加所有表名
        if (tableStructures) {
          for (const table of tableStructures) {
            const tableId = createSuggestionId('table', table.tableName);
            suggestionsMap.set(tableId, {
              label: table.tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: table.tableName,
              documentation: `表: ${table.tableName}`,
              sortText: '0' + table.tableName, // 表名排在最前面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
          }
        }
        
        // 在FROM后面，只添加相关的关键字（如JOIN等）
        for (const keyword of SQL_KEYWORDS) {
          if (FROM_CONTEXT_KEYWORDS.includes(keyword.label)) {
            const id = createSuggestionId('keyword', keyword.label);
            suggestionsMap.set(id, {
              label: keyword.label,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword.label,
              documentation: keyword.documentation,
              sortText: '1' + keyword.label, // 关键字排在表名后面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
          }
        }
        
        // 如果是JOIN后面，只添加表名和ON/USING关键字
        if (isAfterJoin) {
          // 清除所有非表名和JOIN_CONTEXT_KEYWORDS的建议
          for (const [key, suggestion] of suggestionsMap.entries()) {
            if (suggestion.kind !== monaco.languages.CompletionItemKind.Class && 
                !JOIN_CONTEXT_KEYWORDS.includes(suggestion.label)) {
              suggestionsMap.delete(key);
            }
          }
        }
        
        // 如果有建议，直接返回
        if (suggestionsMap.size > 0) {
          return { suggestions: Array.from(suggestionsMap.values()) };
        }
      }
      
      // 如果在SELECT后面，优先提示列名和特定关键字
      if (isAfterSelect) {
        // 添加所有列名（如果有表结构）
        if (tableStructures) {
          for (const table of tableStructures) {
            for (const column of table.columns) {
              // 添加带表名的列
              const qualifiedColumnId = createSuggestionId('qualified_column', `${table.tableName}.${column.name}`);
              suggestionsMap.set(qualifiedColumnId, {
                label: `${table.tableName}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.tableName}.${column.name}`,
                documentation: `表: ${table.tableName}, 列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}`,
                sortText: '1' + table.tableName + '.' + column.name,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
              
              // 添加不带表名的列（确保不重复）
              if (!addedLabels.has(`COLUMN:${column.name.toUpperCase()}`)) {
                const columnId = createSuggestionId('column', column.name);
                suggestionsMap.set(columnId, {
                  label: column.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: column.name,
                  documentation: `列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}, 来自表: ${table.tableName}`,
                  sortText: '0' + column.name, // 不带表名的列排在最前面
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: wordUntilPosition.startColumn,
                    endColumn: wordUntilPosition.endColumn
                  }
                });
                addedLabels.add(`COLUMN:${column.name.toUpperCase()}`);
              }
            }
          }
        }
        
        // 添加SELECT上下文关键字
        for (const keyword of SQL_KEYWORDS) {
          if (SELECT_CONTEXT_KEYWORDS.includes(keyword.label)) {
            const id = createSuggestionId('keyword', keyword.label);
            suggestionsMap.set(id, {
              label: keyword.label,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword.label,
              documentation: keyword.documentation,
              sortText: '2' + keyword.label, // 关键字排在列名后面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
          }
        }
        
        // 如果有建议，直接返回
        if (suggestionsMap.size > 0) {
          return { suggestions: Array.from(suggestionsMap.values()) };
        }
      }
      
      // 如果在WHERE后面，优先提示列名和条件关键字
      if (isAfterWhere) {
        // 添加所有列名（如果有表结构）
        if (tableStructures) {
          for (const table of tableStructures) {
            for (const column of table.columns) {
              // 添加带表名的列
              const qualifiedColumnId = createSuggestionId('qualified_column', `${table.tableName}.${column.name}`);
              suggestionsMap.set(qualifiedColumnId, {
                label: `${table.tableName}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.tableName}.${column.name}`,
                documentation: `表: ${table.tableName}, 列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}`,
                sortText: '0' + table.tableName + '.' + column.name, // 带表名的列排在最前面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
              
              // 添加不带表名的列（确保不重复）
              if (!addedLabels.has(`COLUMN:${column.name.toUpperCase()}`)) {
                const columnId = createSuggestionId('column', column.name);
                suggestionsMap.set(columnId, {
                  label: column.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: column.name,
                  documentation: `列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}, 来自表: ${table.tableName}`,
                  sortText: '1' + column.name, // 不带表名的列排在次前面
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: wordUntilPosition.startColumn,
                    endColumn: wordUntilPosition.endColumn
                  }
                });
                addedLabels.add(`COLUMN:${column.name.toUpperCase()}`);
              }
            }
          }
        }
        
        // 添加WHERE上下文关键字
        for (const keyword of SQL_KEYWORDS) {
          if (WHERE_CONTEXT_KEYWORDS.includes(keyword.label)) {
            const id = createSuggestionId('keyword', keyword.label);
            suggestionsMap.set(id, {
              label: keyword.label,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword.label,
              documentation: keyword.documentation,
              sortText: '2' + keyword.label, // 关键字排在列名后面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
          }
        }
        
        // 如果有建议，直接返回
        if (suggestionsMap.size > 0) {
          return { suggestions: Array.from(suggestionsMap.values()) };
        }
      }
      
      // 如果没有匹配任何特定上下文，添加所有SQL关键字和表名/列名
      
      // 1. 首先添加所有SQL关键字
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

      // 2. 如果有表结构，添加表名和列名
      if (tableStructures && tableStructures.length > 0) {
        // 添加表名
        for (const table of tableStructures) {
          if (!addedLabels.has(`TABLE:${table.tableName.toUpperCase()}`)) {
            const tableId = createSuggestionId('table', table.tableName);
            suggestionsMap.set(tableId, {
              label: table.tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: table.tableName,
              documentation: `表: ${table.tableName}`,
              sortText: '1' + table.tableName, // 表名排在关键字后面
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: wordUntilPosition.startColumn,
                endColumn: wordUntilPosition.endColumn
              }
            });
            addedLabels.add(`TABLE:${table.tableName.toUpperCase()}`);
          }
          
          // 添加列名
          for (const column of table.columns) {
            // 添加带表名的列
            if (!addedLabels.has(`QUALIFIED_COLUMN:${table.tableName.toUpperCase()}.${column.name.toUpperCase()}`)) {
              const qualifiedColumnId = createSuggestionId('qualified_column', `${table.tableName}.${column.name}`);
              suggestionsMap.set(qualifiedColumnId, {
                label: `${table.tableName}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.tableName}.${column.name}`,
                documentation: `表: ${table.tableName}, 列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}`,
                sortText: '3' + table.tableName + '.' + column.name, // 带表名的列排在后面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
              addedLabels.add(`QUALIFIED_COLUMN:${table.tableName.toUpperCase()}.${column.name.toUpperCase()}`);
            }
            
            // 添加不带表名的列
            if (!addedLabels.has(`COLUMN:${column.name.toUpperCase()}`)) {
              const columnId = createSuggestionId('column', column.name);
              suggestionsMap.set(columnId, {
                label: column.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.name,
                documentation: `列: ${column.name}, 类型: ${column.type}${column.isPrimary ? ' (主键)' : ''}, 来自表: ${table.tableName}`,
                sortText: '2' + column.name, // 不带表名的列排在表名后面
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endColumn: wordUntilPosition.endColumn
                }
              });
              addedLabels.add(`COLUMN:${column.name.toUpperCase()}`);
            }
          }
        }
      }

      return { suggestions: Array.from(suggestionsMap.values()) };
    }
  };
}
