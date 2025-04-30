import { TableStructure, TableTuple } from '@/types/dify';
import { Parser } from 'node-sql-parser';
import { TableData, SQLQueryResult } from '@/types/sqlExecutor';

// 导入辅助函数
import {
  evaluateWhereClause,
  evaluateExpression,
  validatePrimaryKey,
  validateForeignKeys,
  executeJoins,
  executeGroupBy,
  executeOrderBy,
  isAggregateFunction
} from '@/lib';

/**
 * SQL查询引擎
 *
 * 该类提供了内存中的SQL查询执行功能，支持基本的SQL操作，包括：
 * - SELECT查询
 * - INSERT插入
 * - UPDATE更新
 * - DELETE删除
 * - CREATE TABLE创建表
 * - DROP TABLE删除表
 */
export class SQLQueryEngine {
  /** 存储所有表数据的Map */
  private tables: Map<string, TableData>;

  /** SQL解析器 */
  private parser: Parser;

  /**
   * 创建SQLQueryEngine实例
   * @param tableStructures 表结构定义数组
   * @param tuples 表数据数组
   */
  constructor(tableStructures: TableStructure[], tuples: TableTuple[]) {
    this.tables = new Map();
    this.parser = new Parser();
    tableStructures.forEach((structure, index) => {
      this.tables.set(structure.tableName, {
        structure,
        data: [...(tuples[index]?.tupleData || [])]
      });
    });
  }

  /**
   * 执行SQL查询
   * @param sql SQL查询语句
   * @returns 查询结果
   */
  executeQuery(sql: string): SQLQueryResult {
    try {
      if (!sql.trim()) {
        return {
          success: false,
          message: 'SQL语句不能为空'
        };
      }

      // 检查SQL语句是否以分号结尾
      if (!sql.trim().endsWith(';')) {
        return {
          success: false,
          message: 'SQL语句必须以分号(;)结尾'
        };
      }

      // 解析SQL命令
      let ast;
      try {
        ast = this.parser.astify(sql);
        if (!ast || typeof ast !== 'object') {
          return {
            success: false,
            message: '无效的SQL语句'
          };
        }
      } catch (parseError) {
        console.error('SQL解析错误:', parseError);
        return {
          success: false,
          message: '无效的SQL语句：语法错误'
        };
      }

      // 处理数组形式的AST（多条语句）
      let stmt = Array.isArray(ast) ? ast[0] : ast;
      const type = (stmt as any).type || 
                  ((stmt as any).statement && (stmt as any).statement[0]?.type) ||
                  (stmt as any).ast_type;

      if (!type) {
        return {
          success: false,
          message: '无法识别的SQL语句类型'
        };
      }

      const upperType = type.toUpperCase();
      switch (upperType) {
        case 'SELECT':
          return this.executeSelect(stmt);
        case 'INSERT':
          return this.executeInsert(stmt);
        case 'UPDATE':
          return this.executeUpdate(stmt);
        case 'DELETE':
          return this.executeDelete(stmt);
        case 'CREATE':
          return this.executeCreate(stmt);
        case 'DROP':
          return this.executeDrop(stmt);
        default:
          return {
            success: false,
            message: `不支持的SQL操作: ${type}`
          };
      }
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '查询执行失败'
      };
    }
  }

  /**
   * 执行SELECT查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeSelect(ast: any): SQLQueryResult {
    console.log('SELECT AST:', JSON.stringify(ast, null, 2));

    const selectAst = Array.isArray(ast) ? ast[0] : ast;

    // 获取基础表数据
    const tableName = selectAst.from?.[0]?.table;
    if (!tableName) {
      throw new Error('无效的SELECT语句：缺少表名');
    }

    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    let result = [...table.data];

    // 处理JOIN
    if (selectAst.join) {
      result = executeJoins(result, selectAst.join, this.getTable.bind(this));
    }

    // 处理WHERE子句
    if (selectAst.where) {
      result = result.filter(row => evaluateWhereClause(row, selectAst.where));
    }

    // 检查是否包含聚合函数
    const hasAggregates = selectAst.columns.some((col: any) => 
      isAggregateFunction(col.expr)
    );

    // 处理GROUP BY
    if (selectAst.groupby || hasAggregates) {
      const groupByColumns = selectAst.groupby?.map((item: any) => item.column) || [];
      result = executeGroupBy(result, groupByColumns, selectAst.columns);

      // 处理HAVING子句
      if (selectAst.having) {
        result = result.filter(row => evaluateWhereClause(row, selectAst.having));
      }
    } else {
      // 普通列选择
      let selectedColumns;
      if (selectAst.columns === '*' ||
          (selectAst.columns[0]?.expr?.type === 'column_ref' &&
           selectAst.columns[0]?.expr?.column === '*')) {
        selectedColumns = result.length > 0 ? Object.keys(result[0]) : [];
      } else {
        selectedColumns = selectAst.columns.map((col: any) =>
          col.expr?.column || col.expr?.value || col.name
        );
      }

      result = result.map(row => {
        const resultRow: any = {};
        selectedColumns.forEach((col: string) => {
          resultRow[col] = row[col];
        });
        return resultRow;
      });
    }

    // 处理ORDER BY
    if (selectAst.orderby) {
      result = executeOrderBy(result, selectAst.orderby);
    }

    // 处理LIMIT和OFFSET
    if (selectAst.limit) {
      const limit = Number(selectAst.limit.value);
      const offset = selectAst.limit.offset ? Number(selectAst.limit.offset.value) : 0;
      result = result.slice(offset, offset + limit);
    }

    return {
      success: true,
      data: result
    };
  }

  /**
   * 执行INSERT查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeInsert(ast: any): SQLQueryResult {
    const tableName = ast.table;
    const table = this.getTable(tableName);

    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    const newRow: any = {};
    ast.columns.forEach((col: string, index: number) => {
      newRow[col] = ast.values[index];
    });

    // 验证主键约束
    validatePrimaryKey(table, newRow);

    // 验证外键约束
    validateForeignKeys(table, newRow, this.getTable.bind(this));

    table.data.push(newRow);

    return {
      success: true,
      message: '插入成功'
    };
  }

  /**
   * 执行UPDATE查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeUpdate(ast: any): SQLQueryResult {
    const tableName = ast.table;
    const table = this.getTable(tableName);

    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    let updatedCount = 0;
    table.data = table.data.map(row => {
      if (evaluateWhereClause(row, ast.where)) {
        updatedCount++;
        const newRow = { ...row };
        ast.set.forEach((set: any) => {
          newRow[set.column] = evaluateExpression(set.value);
        });
        // 验证约束
        validatePrimaryKey(table, newRow);
        validateForeignKeys(table, newRow, this.getTable.bind(this));
        return newRow;
      }
      return row;
    });

    return {
      success: true,
      message: `更新了 ${updatedCount} 行`
    };
  }

  /**
   * 执行DELETE查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeDelete(ast: any): SQLQueryResult {
    const tableName = ast.table;
    const table = this.getTable(tableName);

    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    const originalLength = table.data.length;
    table.data = table.data.filter(row => !evaluateWhereClause(row, ast.where));

    return {
      success: true,
      message: `删除了 ${originalLength - table.data.length} 行`
    };
  }

  /**
   * 执行CREATE查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeCreate(ast: any): SQLQueryResult {
    if (ast.tableType === 'TABLE') {
      const tableName = ast.name;
      if (this.tables.has(tableName)) {
        throw new Error(`表 ${tableName} 已存在`);
      }

      const structure: TableStructure = {
        tableName,
        columns: ast.columns.map((col: any) => ({
          name: col.name,
          type: col.dataType,
          isPrimary: col.constraints?.includes('PRIMARY KEY'),
          // 添加其他约束信息
        }))
      };

      this.tables.set(tableName, {
        structure,
        data: []
      });

      return {
        success: true,
        message: `表 ${tableName} 创建成功`
      };
    }
    throw new Error('仅支持CREATE TABLE操作');
  }

  /**
   * 执行DROP查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeDrop(ast: any): SQLQueryResult {
    if (ast.tableType === 'TABLE') {
      const tableName = ast.name;
      if (!this.tables.has(tableName)) {
        throw new Error(`表 ${tableName} 不存在`);
      }

      this.tables.delete(tableName);
      return {
        success: true,
        message: `表 ${tableName} 删除成功`
      };
    }
    throw new Error('仅支持DROP TABLE操作');
  }

  /**
   * 获取表数据
   * @param tableName 表名
   * @returns 表数据或undefined
   */
  private getTable(tableName: string): TableData | undefined {
    const table = this.tables.get(tableName);
    console.log('Getting table:', tableName, 'Found:', !!table); // 添加调试日志
    return table;
  }


}
