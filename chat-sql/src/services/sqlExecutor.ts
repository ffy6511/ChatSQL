import { TableStructure, TableTuple } from '@/types/dify';
import { Parser } from 'node-sql-parser';
import { TableData, SQLQueryResult } from '@/types/sqlExecutor';

// 导入辅助函数
import {
  evaluateWhereClause,
  evaluateExpression,
  validatePrimaryKey,
  validateForeignKeys,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
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
 * - 事务支持（BEGIN/COMMIT/ROLLBACK）
 */
export class SQLQueryEngine {
  /** 存储所有表数据的Map */
  private tables: Map<string, TableData>;

  /** 事务数据，当事务活动时保存原始数据的副本 */
  private transactionData: Map<string, TableData> | null = null;

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

      console.log('Executing SQL:', sql);
      // 修改调试输出方式
      console.log('Tables content:', {
        size: this.tables.size,
        keys: Array.from(this.tables.keys()),
        tables: Array.from(this.tables.entries())
      });

      // 特殊处理事务相关的命令
      const upperSql = sql.trim().toUpperCase();
      if (upperSql === 'BEGIN') {
        const { result, newTransactionData } = beginTransaction(this.tables, this.transactionData);
        this.transactionData = newTransactionData;
        return result;
      } else if (upperSql === 'COMMIT') {
        const result = commitTransaction(this.transactionData);
        this.transactionData = null;
        return result;
      } else if (upperSql === 'ROLLBACK') {
        const { result, tables } = rollbackTransaction(this.transactionData);
        if (tables) this.tables = tables;
        this.transactionData = null;
        return result;
      }

      // 解析其他SQL命令
      const ast = this.parser.astify(sql);
      if (!ast || typeof ast !== 'object') {
        throw new Error('无效的SQL语句');
      }

      console.log('AST:', JSON.stringify(ast, null, 2)); // 调试用

      // 处理数组形式的AST（多条语句）
      let stmt = Array.isArray(ast) ? ast[0] : ast;

      // node-sql-parser 的 AST 结构中类型可能在不同位置
      // 使用类型断言来避免 TypeScript 类型错误
      const type = (stmt as any).type || // 有些语句类型直接在type字段
                  ((stmt as any).statement && (stmt as any).statement[0]?.type) || // 某些复杂语句在statement数组中
                  (stmt as any).ast_type || // 某些版本使用ast_type
                  ((stmt as any).keyword && (stmt as any).keyword.toUpperCase()); // 某些语句使用keyword字段

      if (!type) {
        console.error('AST structure:', stmt); // 调试用
        throw new Error('无法识别的SQL语句类型');
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
          throw new Error(`不支持的SQL操作: ${type}`);
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

    // 处理数组形式的AST
    const selectAst = Array.isArray(ast) ? ast[0] : ast;

    const tableName = selectAst.from?.[0]?.table;
    if (!tableName) {
      throw new Error('无效的SELECT语句：缺少表名');
    }

    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    let result = [...table.data];

    // 处理WHERE子句
    if (selectAst.where) {
      result = result.filter(row => evaluateWhereClause(row, selectAst.where));
    }

    // 处理列选择
    let selectedColumns;
    if (selectAst.columns === '*' ||
        (selectAst.columns[0]?.expr?.type === 'column_ref' &&
         selectAst.columns[0]?.expr?.column === '*')) {
      selectedColumns = table.data.length > 0 ? Object.keys(table.data[0]) : [];
    } else {
      selectedColumns = selectAst.columns.map((col: any) =>
        col.expr?.column || col.expr?.value || col.name
      );
    }

    const resultData = result.map(row => {
      const resultRow: any = {};
      selectedColumns.forEach((col: string) => {
        resultRow[col] = row[col];
      });
      return resultRow;
    });

    console.log('Query result data:', resultData); // 添加结果日志

    return {
      success: true,
      data: resultData
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
    const table = this.transactionData?.get(tableName) || this.tables.get(tableName);
    console.log('Getting table:', tableName, 'Found:', !!table); // 添加调试日志
    return table;
  }


}
