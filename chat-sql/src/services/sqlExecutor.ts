import { TableStructure, TableTuple } from '@/types/dify';
import { Parser } from 'node-sql-parser';

interface TableData {
  structure: TableStructure;
  data: any[];
}

export class SQLQueryEngine {
  private tables: Map<string, TableData>;
  private transactionData: Map<string, TableData> | null = null;
  private parser: Parser;

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

  executeQuery(sql: string): { success: boolean; data?: any[]; message?: string } {
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
        return this.beginTransaction();
      } else if (upperSql === 'COMMIT') {
        return this.commitTransaction();
      } else if (upperSql === 'ROLLBACK') {
        return this.rollbackTransaction();
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
      const type = stmt.type || // 有些语句类型直接在type字段
                  (stmt.statement && stmt.statement[0]?.type) || // 某些复杂语句在statement数组中
                  stmt.ast_type || // 某些版本使用ast_type
                  (stmt.keyword && stmt.keyword.toUpperCase()); // 某些语句使用keyword字段

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

  private executeSelect(ast: any) {
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
      result = result.filter(row => this.evaluateWhereClause(row, selectAst.where));
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

  private executeInsert(ast: any) {
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
    this.validatePrimaryKey(table, newRow);

    // 验证外键约束
    this.validateForeignKeys(table, newRow);

    table.data.push(newRow);

    return {
      success: true,
      message: '插入成功'
    };
  }

  private executeUpdate(ast: any) {
    const tableName = ast.table;
    const table = this.getTable(tableName);

    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    let updatedCount = 0;
    table.data = table.data.map(row => {
      if (this.evaluateWhereClause(row, ast.where)) {
        updatedCount++;
        const newRow = { ...row };
        ast.set.forEach((set: any) => {
          newRow[set.column] = this.evaluateExpression(set.value);
        });
        // 验证约束
        this.validatePrimaryKey(table, newRow);
        this.validateForeignKeys(table, newRow);
        return newRow;
      }
      return row;
    });

    return {
      success: true,
      message: `更新了 ${updatedCount} 行`
    };
  }

  private executeDelete(ast: any) {
    const tableName = ast.table;
    const table = this.getTable(tableName);

    if (!table) {
      throw new Error(`表 ${tableName} 不存在`);
    }

    const originalLength = table.data.length;
    table.data = table.data.filter(row => !this.evaluateWhereClause(row, ast.where));

    return {
      success: true,
      message: `删除了 ${originalLength - table.data.length} 行`
    };
  }

  private executeCreate(ast: any) {
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

  private executeDrop(ast: any) {
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

  // 事务支持
  private beginTransaction() {
    if (this.transactionData) {
      throw new Error('事务已经开始');
    }
    this.transactionData = new Map(
      Array.from(this.tables.entries()).map(([name, table]) => [
        name,
        {
          structure: { ...table.structure },
          data: [...table.data]
        }
      ])
    );
    return { success: true, message: '事务开始' };
  }

  private commitTransaction() {
    if (!this.transactionData) {
      throw new Error('没有活动的事务');
    }
    this.transactionData = null;
    return { success: true, message: '事务提交成功' };
  }

  private rollbackTransaction() {
    if (!this.transactionData) {
      throw new Error('没有活动的事务');
    }
    this.tables = new Map(this.transactionData);
    this.transactionData = null;
    return { success: true, message: '事务回滚成功' };
  }

  // 辅助方法
  private getTable(tableName: string): TableData | undefined {
    const table = this.transactionData?.get(tableName) || this.tables.get(tableName);
    console.log('Getting table:', tableName, 'Found:', !!table); // 添加调试日志
    return table;
  }

  private evaluateWhereClause(row: any, where: any): boolean {
    if (!where) return true;
    // 直接调用 evaluateCondition
    return this.evaluateCondition(row, where);
  }

  private evaluateCondition(row: any, condition: any): boolean {
    if (!condition) return true;
    
    console.log('Evaluating condition:', condition); // 调试日志
    
    // 处理逻辑运算符的特殊情况
    if (condition.operator === 'AND' || condition.operator === 'OR') {
      const leftResult = this.evaluateCondition(row, condition.left);
      const rightResult = this.evaluateCondition(row, condition.right);
      return condition.operator === 'AND' ? leftResult && rightResult : leftResult || rightResult;
    }

    // 处理二元表达式
    if (condition.type === 'binary_expr') {
      const leftValue = this.evaluateExpression(condition.left, row);
      const rightValue = this.evaluateExpression(condition.right, row);
      console.log('Binary expression values:', { leftValue, operator: condition.operator, rightValue });
      return this.evaluateComparison(leftValue, condition.operator, rightValue);
    }

    throw new Error(`不支持的条件类型: ${condition.type}`);
  }

  private evaluateComparison(left: any, operator: string, right: any): boolean {
    console.log('Comparing:', { left, operator, right }); // 调试日志
    
    switch (operator.toUpperCase()) {
      case '=': return left === right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '<>': 
      case '!=': return left !== right;
      case 'LIKE': return this.evaluateLike(left, right);
      case 'IN': return Array.isArray(right) && right.includes(left);
      case 'IS': return (left === null && right === null) || left === right;
      case 'IS NOT': return (left !== null || right !== null) && left !== right;
      default:
        console.log('Unsupported operator:', operator);
    }
  }

  private evaluateExpression(expr: any, row?: any): any {
    if (!expr) return null;
    
    console.log('Evaluating expression:', expr); // 调试日志
    
    if (expr.type === 'column_ref') {
      const value = row[expr.column];
      console.log('Column reference:', { column: expr.column, value });
      return value;
    }
    
    if (expr.type === 'number') {
      return Number(expr.value);
    }
    
    if (expr.type === 'string') {
      return String(expr.value);
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

  private validatePrimaryKey(table: TableData, row: any) {
    const primaryKeys = table.structure.columns
      .filter(col => col.isPrimary)
      .map(col => col.name);

    if (primaryKeys.length === 0) return;

    const existingRow = table.data.find(existing =>
      primaryKeys.every(key => existing[key] === row[key])
    );

    if (existingRow) {
      throw new Error('违反主键约束');
    }
  }

  private validateForeignKeys(table: TableData, row: any) {
    // 实现外键约束验证
    table.structure.columns.forEach(column => {
      if (column.foreignKeyRefs) {
        column.foreignKeyRefs.forEach(ref => {
          const refTable = this.getTable(ref.tableName);
          if (!refTable) {
            throw new Error(`引用的表 ${ref.tableName} 不存在`);
          }

          const value = row[column.name];
          const exists = refTable.data.some(refRow => 
            refRow[ref.columnName] === value
          );

          if (!exists) {
            throw new Error(`违反外键约束: ${column.name}`);
          }
        });
      }
    });
  }

  private executeJoins(baseData: any[], joins: any[]): any[] {
    let result = [...baseData];
    
    for (const join of joins) {
      const joinTable = this.getTable(join.table);
      if (!joinTable) {
        throw new Error(`Join表 ${join.table} 不存在`);
      }

      result = result.flatMap(leftRow => {
        return joinTable.data
          .filter(rightRow => 
            this.evaluateCondition({ ...leftRow, ...rightRow }, join.on))
          .map(rightRow => ({
            ...leftRow,
            ...rightRow
          }));
      });
    }
    
    return result;
  }

  private executeGroupBy(data: any[], groupBy: string[], having?: any): any[] {
    const groups = new Map();
    
    // 分组
    for (const row of data) {
      const key = groupBy.map(col => row[col]).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(row);
    }

    // 处理聚合
    const result = Array.from(groups.entries()).map(([key, rows]) => {
      const groupRow: any = {};
      
      // 保留分组列
      groupBy.forEach(col => {
        groupRow[col] = rows[0][col];
      });

      // TODO: 实现聚合函数 (COUNT, SUM, AVG, etc.)
      
      return groupRow;
    });

    // 处理HAVING子句
    if (having) {
      return result.filter(row => this.evaluateCondition(row, having));
    }

    return result;
  }

  private executeOrderBy(data: any[], orderBy: any[]): any[] {
    return [...data].sort((a, b) => {
      for (const order of orderBy) {
        const column = order.column;
        const direction = order.direction.toUpperCase();
        
        if (a[column] < b[column]) {
          return direction === 'ASC' ? -1 : 1;
        }
        if (a[column] > b[column]) {
          return direction === 'ASC' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  private evaluateLike(value: string, pattern: string): boolean {
    if (typeof value !== 'string' || typeof pattern !== 'string') {
      return false;
    }
    // 将SQL LIKE模式转换为正则表达式
    const regexPattern = pattern
      .replace(/%/g, '.*')
      .replace(/_/g, '.')
      .replace(/[\[\]\(\)\{\}\^\$\+\*\?\|\\]/g, '\\$&');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(value);
  }
}
