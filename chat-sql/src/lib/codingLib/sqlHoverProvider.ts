/**
 * SQL编辑器悬停提示提供器
 *
 * 该模块提供了基于当前表结构生成SQL悬停提示的功能
 */

import { TableStructure } from '@/types/CodingTypes/dify';

/**
 * SQL关键字列表，包含详细的用法说明
 * 从sqlCompletionProvider.ts导入以保持一致性
 */
import { SQL_KEYWORDS } from './sqlCompletionProvider';

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
      
      // 检查是否是SQL关键字
      for (const keyword of SQL_KEYWORDS) {
        if (keyword.label.toUpperCase() === wordText) {
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
        
        // 向前查找可能的关键字开始
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