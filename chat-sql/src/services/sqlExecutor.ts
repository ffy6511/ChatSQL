import { TableStructure, TableTuple } from '@/types/dify';
import { Parser } from 'node-sql-parser';
import { TableData, SQLQueryResult } from '@/types/sqlExecutor';
import { evaluateCondition } from '@/lib/conditionEvaluator';

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

enum JoinType {
  INNER = 'INNER JOIN',
  LEFT = 'LEFT JOIN',
  RIGHT = 'RIGHT JOIN',
  FULL = 'FULL OUTER JOIN',
  NATURAL = 'NATURAL JOIN'
}

interface ColumnMetadata {
  tableAlias: string;
  columnName: string;
  outputName: string; // 别名或原始列名
}

interface IntermediateResult {
  rows: Record<string, any>[];
  metadata: {
    tableAliases: Map<string, string>;
    columnMetadata: ColumnMetadata[];
  };
}

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
    console.log('开始执行 SELECT 查询');
    console.log('AST:', JSON.stringify(ast, null, 2));
    
    const selectAst = Array.isArray(ast) ? ast[0] : ast;
    
    try {
      // 1. 处理FROM子句
      let result = this.processFromClause(selectAst);

      // 2. 处理JOIN子句（FROM中的JOIN和独立JOIN）
      const joinClauses = [
        ...(selectAst.from.slice(1).filter((t: any) => t.join) || []),
        ...(selectAst.join || [])
      ];
      
      if (joinClauses.length > 0) {
        result = this.processJoinClauses(result, joinClauses);
      }

      // 3. 处理WHERE子句
      if (selectAst.where) {
        result = this.processWhereClause(result, selectAst.where);
      }

      // 4. 处理GROUP BY和聚合
      const hasAggregates = selectAst.columns.some((col: any) => 
        isAggregateFunction(col.expr)
      );
      
      if (selectAst.groupby || hasAggregates) {
        result = this.processGroupByClause(result, selectAst.groupby || [], selectAst.columns);
      }

      // 5. 处理SELECT子句
      result = this.processSelectClause(result, selectAst.columns);

      // 6. 处理ORDER BY子句
      if (selectAst.orderby) {
        result = this.processOrderByClause(result, selectAst.orderby);
      }

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('执行SELECT查询时出错:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '查询执行失败'
      };
    }
  }

  /**
   * 处理FROM子句
   * @param ast 查询AST
   * @returns 中间结果
   */
  private processFromClause(ast: any): IntermediateResult {
    if (!ast.from || ast.from.length === 0) {
      throw new Error('FROM子句不能为空');
    }
    
    const tableAliases = new Map<string, string>();
    const mainTable = ast.from[0];
    
    // 处理子查询
    if (mainTable.expr && mainTable.expr.type === 'select') {
      return this.processSubquery(mainTable);
    }
    
    console.log('主表信息:', mainTable);
    const mainTableName = mainTable.table;
    const mainTableAlias = mainTable.as || mainTable.alias || mainTable.table;
    tableAliases.set(mainTableAlias, mainTableName);
    
    const table = this.getTable(mainTableName);
    if (!table) {
      throw new Error(`表 ${mainTableName} 不存在`);
    }
    
    // 为主表数据添加别名前缀
    const rows = table.data.map(row => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        newRow[`${mainTableAlias}.${key}`] = value;
        // 同时保留不带前缀的列名，方便后续处理
        newRow[key] = value;
      });
      return newRow;
    });
    
    // 初始化列元数据
    const columnMetadata: ColumnMetadata[] = table.structure.columns.map(col => ({
      tableAlias: mainTableAlias,
      columnName: col.name,
      outputName: col.name
    }));
    
    return {
      rows,
      metadata: {
        tableAliases,
        columnMetadata
      }
    };
  }

  /**
   * 处理子查询
   * @param subqueryClause 子查询子句
   * @returns 中间结果
   */
  private processSubquery(subqueryClause: any): IntermediateResult {
    const subQueryResult = this.executeSelect(subqueryClause.expr);
    if (!subQueryResult.success || !subQueryResult.data) {
      throw new Error('子查询执行失败');
    }
    
    const alias = subqueryClause.as || 'subquery';
    const rows = subQueryResult.data.map(row => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        newRow[`${alias}.${key}`] = value;
        // 同时保留不带前缀的列名
        newRow[key] = value;
      });
      return newRow;
    });
    
    // 从第一行数据推断列元数据
    const columnMetadata: ColumnMetadata[] = Object.keys(subQueryResult.data[0] || {}).map(col => ({
      tableAlias: alias,
      columnName: col,
      outputName: col
    }));
    
    return {
      rows,
      metadata: {
        tableAliases: new Map([[alias, alias]]),
        columnMetadata
      }
    };
  }

  /**
   * 处理JOIN子句
   * @param result 当前中间结果
   * @param joinClauses JOIN子句数组
   * @returns 更新后的中间结果
   */
  private processJoinClauses(result: IntermediateResult, joinClauses: any[]): IntermediateResult {
    let currentResult = { ...result };
    
    for (const join of joinClauses) {
      const joinType = (join.join || 'INNER JOIN').toUpperCase();
      const joinTableName = join.table;
      const joinAlias = join.as || join.alias || join.table;
      
      // 更新表别名映射
      currentResult.metadata.tableAliases.set(joinAlias, joinTableName);
      
      const joinTable = this.getTable(joinTableName);
      if (!joinTable) {
        throw new Error(`JOIN表 ${joinTableName} 不存在`);
      }
      
      // 执行JOIN操作
      currentResult = this.executeJoin(currentResult, joinTable, joinAlias, join.on, joinType);
    }
    
    return currentResult;
  }

  /**
   * 执行单个JOIN操作
   * @param result 当前中间结果
   * @param joinTable 要JOIN的表
   * @param joinAlias JOIN表的别名
   * @param onCondition ON条件
   * @param joinType JOIN类型
   * @returns 更新后的中间结果
   */
  private executeJoin(
    result: IntermediateResult, 
    joinTable: TableData, 
    joinAlias: string, 
    onCondition: any, 
    joinType: string
  ): IntermediateResult {
    console.log(`执行 ${joinType} 操作，表: ${joinTable.structure.tableName}, 别名: ${joinAlias}`);
    
    // 更新列元数据
    const updatedColumnMetadata = [
      ...result.metadata.columnMetadata,
      ...joinTable.structure.columns.map(col => ({
        tableAlias: joinAlias,
        columnName: col.name,
        outputName: col.name
      }))
    ];
    
    let joinedRows: Record<string, any>[] = [];
    
    switch (joinType) {
      case JoinType.INNER:
      case 'INNER JOIN': // 兼容字符串类型
        joinedRows = this.executeInnerJoin(result.rows, joinTable, joinAlias, onCondition);
        break;
        
      case JoinType.LEFT:
      case 'LEFT JOIN':
        joinedRows = this.executeLeftJoin(result.rows, joinTable, joinAlias, onCondition);
        break;
        
      case JoinType.RIGHT:
      case 'RIGHT JOIN':
        joinedRows = this.executeRightJoin(result.rows, joinTable, joinAlias, onCondition);
        break;
        
      case JoinType.FULL:
      case 'FULL OUTER JOIN':
        joinedRows = this.executeFullOuterJoin(result.rows, joinTable, joinAlias, onCondition);
        break;
        
      case JoinType.NATURAL:
      case 'NATURAL JOIN':
        joinedRows = this.executeNaturalJoin(result.rows, joinTable, joinAlias);
        break;
        
      default:
        console.warn(`不支持的JOIN类型: ${joinType}，将作为INNER JOIN处理`);
        joinedRows = this.executeInnerJoin(result.rows, joinTable, joinAlias, onCondition);
    }
    
    return {
      rows: joinedRows,
      metadata: {
        tableAliases: result.metadata.tableAliases,
        columnMetadata: updatedColumnMetadata
      }
    };
  }

  /**
   * 执行INNER JOIN
   */
  private executeInnerJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string, 
    onCondition: any
  ): Record<string, any>[] {
    const joinedRows: Record<string, any>[] = [];
    
    for (const leftRow of leftRows) {
      for (const rightRow of rightTable.data) {
        // 创建临时合并行用于评估JOIN条件
        const tempRow = this.createTempRow(leftRow, rightRow, rightAlias);
        
        // 评估JOIN条件
        try {
          if (evaluateCondition(tempRow, onCondition)) {
            // 合并行
            joinedRows.push(this.mergeRows(leftRow, rightRow, rightAlias));
          }
        } catch (error) {
          console.error('评估JOIN条件时出错:', error);
        }
      }
    }
    
    return joinedRows;
  }

  /**
   * 执行LEFT JOIN
   */
  private executeLeftJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string, 
    onCondition: any
  ): Record<string, any>[] {
    console.log('===== 执行 LEFT JOIN =====');
    console.log('左表行数:', leftRows.length);
    console.log('右表名:', rightTable.structure.tableName);
    console.log('右表别名:', rightAlias);
    console.log('JOIN条件:', JSON.stringify(onCondition));
    
    const joinedRows: Record<string, any>[] = [];
    
    for (const leftRow of leftRows) {
      console.log('\n处理左表行:', leftRow);
      let hasMatch = false;
      
      for (const rightRow of rightTable.data) {
        // 创建临时合并行用于评估JOIN条件
        const tempRow = this.createTempRow(leftRow, rightRow, rightAlias);
        
        // 评估JOIN条件
        try {
          const matches = evaluateCondition(tempRow, onCondition);
          console.log('评估JOIN条件:', matches, '右表行:', rightRow);
          
          if (matches) {
            // 合并行
            const mergedRow = this.mergeRows(leftRow, rightRow, rightAlias);
            console.log('匹配成功! 合并后的行:', mergedRow);
            joinedRows.push(mergedRow);
            hasMatch = true;
          }
        } catch (error) {
          console.error('评估JOIN条件时出错:', error);
        }
      }
      
      // 如果没有匹配，添加左行和NULL右行
      if (!hasMatch) {
        console.log('左表行没有匹配! 添加NULL右表行');
        const nullMergedRow = this.mergeRowsWithNull(leftRow, rightTable, rightAlias);
        console.log('合并NULL后的行:', nullMergedRow);
        joinedRows.push(nullMergedRow);
      }
    }
    
    console.log('LEFT JOIN 结果行数:', joinedRows.length);
    console.log('LEFT JOIN 第一行示例:', joinedRows[0]);
    return joinedRows;
  }

  /**
   * 执行RIGHT JOIN
   */
  private executeRightJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string, 
    onCondition: any
  ): Record<string, any>[] {
    const joinedRows: Record<string, any>[] = [];
    
    for (const rightRow of rightTable.data) {
      let hasMatch = false;
      
      for (const leftRow of leftRows) {
        // 创建临时合并行用于评估JOIN条件
        const tempRow = this.createTempRow(leftRow, rightRow, rightAlias);
        
        // 评估JOIN条件
        try {
          if (evaluateCondition(tempRow, onCondition)) {
            // 合并行
            joinedRows.push(this.mergeRows(leftRow, rightRow, rightAlias));
            hasMatch = true;
          }
        } catch (error) {
          console.error('评估JOIN条件时出错:', error);
        }
      }
      
      // 如果没有匹配，添加NULL左行和右行
      if (!hasMatch) {
        const nullLeftRow: Record<string, null> = {};
        // 为左表的所有列创建NULL值
        for (const leftRow of leftRows.slice(0, 1)) { // 使用第一行作为模板
          Object.keys(leftRow).forEach(key => {
            if (key.includes('.')) { // 只处理带表前缀的列
              nullLeftRow[key] = null;
            }
          });
        }
        
        joinedRows.push(this.mergeRows(nullLeftRow, rightRow, rightAlias));
      }
    }
    
    return joinedRows;
  }

  /**
   * 执行FULL OUTER JOIN
   */
  private executeFullOuterJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string, 
    onCondition: any
  ): Record<string, any>[] {
    // 先执行LEFT JOIN
    const leftJoinResult = this.executeLeftJoin(leftRows, rightTable, rightAlias, onCondition);
    
    // 再执行RIGHT JOIN，但只保留未匹配的右表行
    const rightJoinResult = this.executeRightJoin(leftRows, rightTable, rightAlias, onCondition);
    
    // 找出LEFT JOIN中已匹配的右表行
    const matchedRightRows = new Set<string>();
    
    for (const row of leftJoinResult) {
      // 检查是否有右表的非NULL值
      let hasRightValue = false;
      for (const key of Object.keys(row)) {
        if (key.startsWith(`${rightAlias}.`) && row[key] !== null) {
          hasRightValue = true;
          break;
        }
      }
      
      if (hasRightValue) {
        // 创建右表行的唯一标识
        const rightRowId = Object.entries(row)
          .filter(([key]) => key.startsWith(`${rightAlias}.`))
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        
        matchedRightRows.add(rightRowId);
      }
    }
    
    // 过滤RIGHT JOIN结果，只保留未在LEFT JOIN中匹配的行
    const unmatchedRightJoinRows = rightJoinResult.filter(row => {
      // 创建右表行的唯一标识
      const rightRowId = Object.entries(row)
        .filter(([key]) => key.startsWith(`${rightAlias}.`))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      
      // 检查是否有左表的非NULL值
      let hasLeftValue = false;
      for (const key of Object.keys(row)) {
        if (!key.startsWith(`${rightAlias}.`) && row[key] !== null) {
          hasLeftValue = true;
          break;
        }
      }
      
      // 只保留未匹配的右表行
      return !hasLeftValue || !matchedRightRows.has(rightRowId);
    });
    
    // 合并结果
    return [...leftJoinResult, ...unmatchedRightJoinRows];
  }

  /**
   * 执行NATURAL JOIN
   */
  private executeNaturalJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string
  ): Record<string, any>[] {
    // 找出左右表的共同列名
    const commonColumns = this.findCommonColumns(leftRows, rightTable);
    console.log('NATURAL JOIN 共同列:', commonColumns);
    
    if (commonColumns.length === 0) {
      console.warn('NATURAL JOIN 没有找到共同列，将作为CROSS JOIN处理');
      // 如果没有共同列，执行笛卡尔积
      return this.executeCrossJoin(leftRows, rightTable, rightAlias);
    }
    
    const joinedRows: Record<string, any>[] = [];
    
    for (const leftRow of leftRows) {
      for (const rightRow of rightTable.data) {
        // 检查所有共同列是否匹配
        let allMatch = true;
        for (const { leftCol, rightCol } of commonColumns) {
          if (leftRow[leftCol] !== rightRow[rightCol]) {
            allMatch = false;
            break;
          }
        }
        
        if (allMatch) {
          // 合并行，但共同列只保留一份
          const mergedRow = this.mergeRowsForNaturalJoin(leftRow, rightRow, rightAlias, commonColumns);
          joinedRows.push(mergedRow);
        }
      }
    }
    
    return joinedRows;
  }

  /**
   * 执行CROSS JOIN (笛卡尔积)
   */
  private executeCrossJoin(
    leftRows: Record<string, any>[], 
    rightTable: TableData, 
    rightAlias: string
  ): Record<string, any>[] {
    const joinedRows: Record<string, any>[] = [];
    
    for (const leftRow of leftRows) {
      for (const rightRow of rightTable.data) {
        // 直接合并行，不需要条件
        joinedRows.push(this.mergeRows(leftRow, rightRow, rightAlias));
      }
    }
    
    return joinedRows;
  }

  /**
   * 查找左右表的共同列
   */
  private findCommonColumns(
    leftRows: Record<string, any>[], 
    rightTable: TableData
  ): { leftCol: string, rightCol: string }[] {
    if (leftRows.length === 0) return [];
    
    // 获取左表的列名（不带表前缀）
    const leftColumns = new Set<string>();
    const firstLeftRow = leftRows[0];
    
    Object.keys(firstLeftRow).forEach(key => {
      if (!key.includes('.')) {
        leftColumns.add(key);
      }
    });
    
    // 获取右表的列名
    const rightColumns = rightTable.structure.columns.map(col => col.name);
    
    // 找出共同列
    return Array.from(leftColumns)
      .filter(col => rightColumns.includes(col))
      .map(col => ({ leftCol: col, rightCol: col }));
  }

  /**
   * 创建用于评估JOIN条件的临时行
   */
  private createTempRow(
    leftRow: Record<string, any>, 
    rightRow: Record<string, any>, 
    rightAlias: string
  ): Record<string, any> {
    // 创建一个新对象，而不是修改原对象
    const tempRow: Record<string, any> = {};
    
    // 1. 首先复制左表的所有字段
    for (const key in leftRow) {
      tempRow[key] = leftRow[key];
    }
    
    // 2. 添加右表字段，带上别名前缀
    for (const key in rightRow) {
      tempRow[`${rightAlias}.${key}`] = rightRow[key];
    }
    
    return tempRow;
  }

  /**
   * 合并左右表行
   */
  private mergeRows(
    leftRow: Record<string, any>, 
    rightRow: Record<string, any>, 
    rightAlias: string
  ): Record<string, any> {
    console.log('合并行 - 输入:');
    console.log('  左表行:', leftRow);
    console.log('  右表行:', rightRow);
    console.log('  右表别名:', rightAlias);
    
    // 创建一个新对象，而不是修改原对象
    const merged: Record<string, any> = {};
    
    // 1. 首先复制左表的所有字段
    for (const key in leftRow) {
      merged[key] = leftRow[key];
      console.log(`  复制左表字段 ${key}:`, leftRow[key]);
    }
    
    // 2. 添加右表字段，带上别名前缀
    for (const key in rightRow) {
      const prefixedKey = `${rightAlias}.${key}`;
      merged[prefixedKey] = rightRow[key];
      console.log(`  添加右表字段 ${prefixedKey}:`, rightRow[key]);
    }
    
    console.log('合并行 - 结果:', merged);
    return merged;
  }

  /**
   * 合并左右表行，右表列用NULL填充
   */
  private mergeRowsWithNull(
    leftRow: Record<string, any>, 
    rightTable: TableData, 
    rightAlias: string
  ): Record<string, any> {
    console.log('合并NULL行 - 输入:');
    console.log('  左表行:', leftRow);
    console.log('  右表结构:', rightTable.structure.tableName);
    console.log('  右表别名:', rightAlias);
    
    // 创建一个新对象，而不是修改原对象
    const merged: Record<string, any> = {};
    
    // 1. 首先复制左表的所有字段
    for (const key in leftRow) {
      merged[key] = leftRow[key];
      console.log(`  复制左表字段 ${key}:`, leftRow[key]);
    }
    
    // 2. 用 null 补充右表字段
    for (const col of rightTable.structure.columns) {
      const prefixedKey = `${rightAlias}.${col.name}`;
      merged[prefixedKey] = null;
      console.log(`  添加NULL右表字段 ${prefixedKey}`);
    }
    
    console.log('合并NULL行 - 结果:', merged);
    return merged;
  }

  /**
   * 合并行，但共同列只保留一份
   */
  private mergeRowsForNaturalJoin(
    leftRow: Record<string, any>, 
    rightRow: Record<string, any>, 
    rightAlias: string, 
    commonColumns: { leftCol: string, rightCol: string }[]
  ): Record<string, any> {
    const mergedRow: Record<string, any> = { ...leftRow };
    
    // 添加右表列（带别名前缀），但不包括共同列
    Object.entries(rightRow).forEach(([key, value]) => {
      if (!commonColumns.some(col => col.rightCol === key)) {
        mergedRow[`${rightAlias}.${key}`] = value;
      }
    });
    
    return mergedRow;
  }

  /**
   * 处理WHERE子句
   * @param result 当前中间结果
   * @param whereClause WHERE子句
   * @returns 过滤后的中间结果
   */
  private processWhereClause(result: IntermediateResult, whereClause: any): IntermediateResult {
    return {
      ...result,
      rows: result.rows.filter(row => {
        try {
          return evaluateWhereClause(row, whereClause);
        } catch (error) {
          console.error('评估WHERE条件时出错:', error);
          return false;
        }
      })
    };
  }

  /**
   * 处理GROUP BY和聚合
   * @param result 当前中间结果
   * @param groupByClause GROUP BY子句
   * @param columns 查询的列
   * @returns 处理后的中间结果
   */
  private processGroupByClause(
    result: IntermediateResult, 
    groupByClause: any[], 
    columns: any[]
  ): IntermediateResult {
    const groupedResult = executeGroupBy(result.rows, groupByClause, columns);
    const newColumnMetadata = columns.map(col => ({
      tableAlias: col.table || '',
      columnName: col.expr.column || col.expr.name,
      outputName: col.as || col.expr.column || col.expr.name
    }));
    
    return {
      rows: groupedResult,
      metadata: {
        ...result.metadata,
        columnMetadata: newColumnMetadata
      }
    };
  }

  /**
   * 处理SELECT子句
   * @param result 当前中间结果
   * @param columns 查询的列
   * @returns 处理后的中间结果
   */
  private processSelectClause(
    result: IntermediateResult, 
    columns: any[]
  ): IntermediateResult {
    console.log('处理SELECT子句 - 输入行:', JSON.stringify(result.rows, null, 2));
    
    const newRows = result.rows.map((row, rowIndex) => {
      console.log(`\n处理第 ${rowIndex} 行:`, JSON.stringify(row, null, 2));
      const newRow: Record<string, any> = {};
      
      columns.forEach((col: any) => {
        const columnExpr = col.expr;
        const alias = col.as;
        console.log('处理列:', JSON.stringify(columnExpr, null, 2));
        
        // 处理不同类型的列表达式
        if (columnExpr.type === 'star') {
          // 处理 SELECT *
          console.log('处理 SELECT * (star)');
          
          // 直接复制所有不带前缀的列
          Object.keys(row).forEach(key => {
            if (!key.includes('.')) {
              console.log(`  复制不带前缀的列 ${key}:`, row[key]);
              newRow[key] = row[key];
            }
          });
          
          // 对于带前缀的列，如果对应的不带前缀的列不存在或为null，则使用带前缀的列值
          Object.keys(row).forEach(key => {
            if (key.includes('.')) {
              const [table, column] = key.split('.');
              if (newRow[column] === undefined || newRow[column] === null) {
                console.log(`  使用带前缀的列 ${key} 替换 ${column}:`, row[key]);
                newRow[column] = row[key];
              }
            }
          });
          
        } else if (columnExpr.type === 'column_ref' && columnExpr.column === '*') {
          // 处理 SELECT * 或 SELECT table.*
          console.log('处理 SELECT * (column_ref)');
          const tablePrefix = columnExpr.table ? `${columnExpr.table}.` : '';
          
          // 如果指定了表前缀，只处理该表的列
          if (tablePrefix) {
            Object.keys(row).forEach(key => {
              if (key.startsWith(tablePrefix)) {
                const column = key.split('.')[1];
                console.log(`  复制指定表的列 ${key} 到 ${column}:`, row[key]);
                newRow[column] = row[key];
              }
            });
          } else {
            // 没有指定表前缀，处理所有列
            // 直接复制所有不带前缀的列
            Object.keys(row).forEach(key => {
              if (!key.includes('.')) {
                console.log(`  复制不带前缀的列 ${key}:`, row[key]);
                newRow[key] = row[key];
              }
            });
            
            // 对于带前缀的列，如果对应的不带前缀的列不存在或为null，则使用带前缀的列值
            Object.keys(row).forEach(key => {
              if (key.includes('.')) {
                const [table, column] = key.split('.');
                if (newRow[column] === undefined || newRow[column] === null) {
                  console.log(`  使用带前缀的列 ${key} 替换 ${column}:`, row[key]);
                  newRow[column] = row[key];
                }
              }
            });
          }
        } else if (columnExpr.type === 'column_ref') {
          // 处理普通列引用
          const tableAlias = columnExpr.table;
          const columnName = columnExpr.column;
          const outputName = alias || columnName;
          
          if (tableAlias) {
            // 有表别名的情况
            const fullColumnName = `${tableAlias}.${columnName}`;
            console.log(`  查找带表别名的列 ${fullColumnName}`);
            if (row[fullColumnName] !== undefined) {
              console.log(`  找到列 ${fullColumnName}:`, row[fullColumnName]);
              newRow[outputName] = row[fullColumnName];
            } else {
              console.log(`  未找到列 ${fullColumnName}, 设置为null`);
              newRow[outputName] = null;
            }
          } else {
            // 没有表别名的情况，尝试在所有列中查找匹配的列名
            console.log(`  查找不带表别名的列 ${columnName}`);
            
            // 首先尝试直接匹配不带前缀的列名
            if (row[columnName] !== undefined) {
              console.log(`  直接找到列 ${columnName}:`, row[columnName]);
              newRow[outputName] = row[columnName];
            } else {
              // 然后尝试匹配带前缀的列名
              const matchingKey = Object.keys(row).find(k => 
                k.endsWith(`.${columnName}`)
              );
              if (matchingKey) {
                console.log(`  找到匹配的带前缀列 ${matchingKey}:`, row[matchingKey]);
                newRow[outputName] = row[matchingKey];
              } else {
                console.log(`  未找到列 ${columnName}, 设置为null`);
                newRow[outputName] = null;
              }
            }
          }
        } else if (columnExpr.type === 'aggr_func') {
          // 聚合函数已在GROUP BY步骤处理
          const outputName = alias || `${columnExpr.name}(${columnExpr.args.expr.column})`;
          newRow[outputName] = row[outputName];
        }
      });
      
      console.log('处理后的行:', newRow);
      return newRow;
    });
    
    return {
      rows: newRows,
      metadata: result.metadata
    };
  }

  /**
   * 处理ORDER BY子句
   * @param result 当前中间结果
   * @param orderByClause ORDER BY子句
   * @returns 排序后的中间结果
   */
  private processOrderByClause(
    result: IntermediateResult, 
    orderByClause: any
  ): IntermediateResult {
    const sortedRows = executeOrderBy(result.rows, orderByClause);
    return {
      ...result,
      rows: sortedRows
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
