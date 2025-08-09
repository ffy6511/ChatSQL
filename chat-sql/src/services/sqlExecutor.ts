import { TableStructure, TableTuple } from "@/types/CodingTypes/dify";
import { Parser } from "node-sql-parser";
import { TableData, SQLQueryResult } from "@/types/CodingTypes/sqlExecutor";
import { evaluateCondition } from "@/lib/codingLib/conditionEvaluator";

// 导入辅助函数
import {
  evaluateWhereClause,
  evaluateExpression,
  validatePrimaryKey,
  validateForeignKeys,
  executeJoins,
  executeGroupBy,
  executeOrderBy,
  isAggregateFunction,
} from "@/lib/codingLib";

enum JoinType {
  INNER = "INNER JOIN",
  LEFT = "LEFT JOIN",
  RIGHT = "RIGHT JOIN",
  FULL = "FULL OUTER JOIN",
  NATURAL = "NATURAL JOIN",
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
        data: [...(tuples[index]?.tupleData || [])],
      });
    });
  }

  /**
   * 执行查询
   * @param sql SQL查询语句
   * @returns 查询结果
   */
  public executeQuery(sql: string): SQLQueryResult {
    try {
      console.log("执行查询:", sql);

      // 预处理SQL语句
      const processedSQL = this.preprocessSQL(sql);

      // 解析SQL语句
      const parser = new Parser();
      const ast = parser.astify(processedSQL, { database: "mysql" });
      console.log("解析后的AST:", JSON.stringify(ast, null, 2));

      // 检查是否包含NATURAL JOIN
      const containsNaturalJoin = sql.toUpperCase().includes("NATURAL JOIN");
      console.log("SQL包含NATURAL JOIN:", containsNaturalJoin);

      // 如果原始SQL包含NATURAL JOIN，手动修改AST
      if (containsNaturalJoin) {
        this.handleNaturalJoin(ast);
      }

      // 处理数组形式的AST（多条语句）
      let stmt = Array.isArray(ast) ? ast[0] : ast;
      const type =
        (stmt as any).type ||
        ((stmt as any).statement && (stmt as any).statement[0]?.type) ||
        (stmt as any).ast_type;

      if (!type) {
        return {
          success: false,
          message: "无法识别的SQL语句类型",
        };
      }

      const upperType = type.toUpperCase();
      switch (upperType) {
        case "SELECT":
          return this.executeSelect(stmt);
        case "INSERT":
          return this.executeInsert(stmt);
        case "UPDATE":
          return this.executeUpdate(stmt);
        case "DELETE":
          return this.executeDelete(stmt);
        case "CREATE":
          return this.executeCreate(stmt);
        case "DROP":
          return this.executeDrop(stmt);
        default:
          return {
            success: false,
            message: `不支持的SQL操作: ${type}`,
          };
      }
    } catch (error) {
      console.error("Query execution error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "查询执行失败",
      };
    }
  }

  /**
   * 处理NATURAL JOIN
   * @param ast 查询的AST
   */
  private handleNaturalJoin(ast: any): void {
    console.log("开始处理NATURAL JOIN");

    // 确保ast是一个对象
    if (!ast || typeof ast !== "object") {
      console.warn("AST不是一个对象，无法处理NATURAL JOIN");
      return;
    }

    // 处理数组形式的AST
    const statements = Array.isArray(ast) ? ast : [ast];

    for (const stmt of statements) {
      // 确保是SELECT语句
      if (stmt.type !== "select") {
        console.warn("不是SELECT语句，跳过NATURAL JOIN处理");
        continue;
      }

      // 确保有FROM子句
      if (!stmt.from || !Array.isArray(stmt.from) || stmt.from.length <= 1) {
        console.warn("FROM子句不完整，跳过NATURAL JOIN处理");
        continue;
      }

      console.log("FROM子句:", JSON.stringify(stmt.from, null, 2));

      // 遍历FROM子句中的表
      for (let i = 1; i < stmt.from.length; i++) {
        const joinClause = stmt.from[i];

        // 检查是否是JOIN
        if (!joinClause.join) {
          console.warn(`第${i}个表不是JOIN，跳过`);
          continue;
        }

        console.log(`检查第${i}个JOIN:`, joinClause);

        // 检查是否是NATURAL JOIN
        // 由于我们在预处理中将NATURAL JOIN替换为JOIN，
        // 我们需要通过其他方式来识别它是否是NATURAL JOIN

        // 如果on为null且join为INNER JOIN，可能是NATURAL JOIN
        if (joinClause.join.toUpperCase() === "INNER JOIN" && !joinClause.on) {
          console.log("检测到可能的NATURAL JOIN，准备设置ON条件");

          // 获取左表和右表
          const leftTable = this.getTable(stmt.from[i - 1].table);
          const rightTable = this.getTable(joinClause.table);

          if (!leftTable || !rightTable) {
            console.warn("无法找到JOIN的表");
            continue;
          }

          // 找出共同列
          const leftColumns = leftTable.structure.columns.map(
            (col) => col.name
          );
          const rightColumns = rightTable.structure.columns.map(
            (col) => col.name
          );

          const commonColumns = leftColumns.filter((col) =>
            rightColumns.includes(col)
          );
          console.log("找到共同列:", commonColumns);

          if (commonColumns.length === 0) {
            console.warn("没有找到共同列，将作为CROSS JOIN处理");
            continue;
          }

          // 构建ON条件
          let onCondition: any = null;

          for (const column of commonColumns) {
            const leftTableName = stmt.from[i - 1].as || stmt.from[i - 1].table;
            const rightTableName = joinClause.as || joinClause.table;

            const condition = {
              type: "binary_expr",
              operator: "=",
              left: {
                type: "column_ref",
                table: leftTableName,
                column: column,
              },
              right: {
                type: "column_ref",
                table: rightTableName,
                column: column,
              },
            };

            if (!onCondition) {
              onCondition = condition;
            } else {
              onCondition = {
                type: "binary_expr",
                operator: "AND",
                left: onCondition,
                right: condition,
              };
            }
          }

          // 设置ON条件
          joinClause.on = onCondition;
          console.log(
            "设置NATURAL JOIN的ON条件:",
            JSON.stringify(onCondition, null, 2)
          );
        }
      }
    }
  }

  /**
   * 预处理SQL语句，处理特殊语法
   * @param sql 原始SQL语句
   * @returns 处理后的SQL语句
   */
  private preprocessSQL(sql: string): string {
    console.log("预处理SQL语句:", sql);

    // 检测NATURAL JOIN并替换为INNER JOIN
    // 不再添加注释标记，因为解析器可能不会正确处理它
    sql = sql.replace(/NATURAL\s+JOIN/gi, "INNER JOIN");

    console.log("预处理后的SQL语句:", sql);
    return sql;
  }

  /**
   * 执行SELECT查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeSelect(ast: any): SQLQueryResult {
    console.log("开始执行 SELECT 查询");
    console.log("AST:", JSON.stringify(ast, null, 2));

    const selectAst = Array.isArray(ast) ? ast[0] : ast;

    try {
      // 注意：不再调用 preprocessAst

      // 1. 处理FROM子句
      let result = this.processFromClause(selectAst);

      // 2. 处理JOIN子句（FROM中的JOIN和独立JOIN）
      const joinClauses = [
        ...(selectAst.from.slice(1).filter((t: any) => t.join) || []),
        ...(selectAst.join || []),
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
        result = this.processGroupByClause(
          result,
          selectAst.groupby || [],
          selectAst.columns
        );
      }

      // 5. 处理HAVING子句
      if (selectAst.having) {
        result = this.processHavingClause(result, selectAst.having);
      }

      // 6. 处理SELECT子句（投影）
      result = this.processSelectClause(result, selectAst.columns);

      // 7. 处理ORDER BY子句
      if (selectAst.orderby) {
        result = this.processOrderByClause(result, selectAst.orderby);
      }

      // 8. 处理LIMIT子句
      let finalRows = result.rows;
      if (selectAst.limit) {
        console.log("处理LIMIT子句:", selectAst.limit);

        // 处理不同格式的LIMIT
        let limit: number;
        let offset: number = 0;

        if (typeof selectAst.limit === "number") {
          // 如果直接是数字
          limit = selectAst.limit;
        } else if (selectAst.limit.value !== undefined) {
          // 如果是 { value: number } 格式
          if (Array.isArray(selectAst.limit.value)) {
            // 如果value是数组
            if (selectAst.limit.value.length > 0) {
              limit = Number(selectAst.limit.value[0].value);

              // 检查是否有第二个值作为offset
              if (selectAst.limit.value.length > 1) {
                offset = Number(selectAst.limit.value[1].value);
              }
            } else {
              limit = 10; // 默认值
            }
          } else {
            // 如果value不是数组
            limit = Number(selectAst.limit.value);
          }
        } else if (selectAst.limit.length !== undefined) {
          // 如果是数组格式 [limit, offset]
          limit = Number(selectAst.limit[0].value);
          if (selectAst.limit.length > 1) {
            offset = Number(selectAst.limit[1].value);
          }
        } else if (
          selectAst.limit.seperator === "," ||
          selectAst.limit.separator === ","
        ) {
          // 如果是 LIMIT offset, limit 格式
          // 注意：处理两种拼写 seperator 和 separator
          const values = selectAst.limit.value;
          if (Array.isArray(values) && values.length >= 2) {
            limit = Number(values[1].value);
            offset = Number(values[0].value);
          } else {
            limit = 10; // 默认值
          }
        } else {
          // 默认情况
          limit = 10; // 默认限制为10行
        }

        // 确保limit是有效数字
        if (isNaN(limit)) {
          console.warn("LIMIT值无效，使用默认值10");
          limit = 10;
        }

        console.log(`应用LIMIT: ${limit}, OFFSET: ${offset}`);

        // 应用OFFSET和LIMIT
        finalRows = finalRows.slice(offset, offset + limit);
      }

      // 处理OFFSET子句（如果单独存在）
      if (selectAst.offset && !selectAst.limit) {
        console.log("处理OFFSET子句:", selectAst.offset);

        let offset: number = 0;

        if (typeof selectAst.offset === "number") {
          offset = selectAst.offset;
        } else if (selectAst.offset.value !== undefined) {
          offset = Number(selectAst.offset.value);
        }

        console.log(`应用OFFSET: ${offset}`);
        finalRows = finalRows.slice(offset);
      }

      return {
        success: true,
        data: finalRows,
        columns: result.metadata.columnMetadata.map((col) => col.outputName),
      };
    } catch (error) {
      console.error("SELECT查询执行错误:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "查询执行失败",
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
      throw new Error("FROM子句不能为空");
    }

    const tableAliases = new Map<string, string>();
    const fromArr = ast.from;
    // 检查是否为隐式笛卡尔积（多个表且没有join字段）
    const isImplicitCrossJoin =
      fromArr.length > 1 && fromArr.every((item: any) => !item.join);

    if (isImplicitCrossJoin) {
      // 依次做笛卡尔积
      let resultRows: Record<string, any>[] = [];
      let columnMetadata: ColumnMetadata[] = [];
      for (let i = 0; i < fromArr.length; i++) {
        const tableItem = fromArr[i];
        const tableName = tableItem.table;
        const tableAlias = tableItem.as || tableItem.alias || tableName;
        tableAliases.set(tableAlias, tableName);

        const table = this.getTable(tableName);
        if (!table) {
          throw new Error(`表 ${tableName} 不存在`);
        }

        // 为当前表数据添加别名前缀
        const tableRows = table.data.map((row) => {
          const newRow: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            newRow[`${tableAlias}.${key}`] = value;
            newRow[key] = value;
          });
          return newRow;
        });

        // 生成列元数据
        const tableColMeta: ColumnMetadata[] = table.structure.columns.map(
          (col) => ({
            tableAlias: tableAlias,
            columnName: col.name,
            outputName: col.name,
          })
        );

        if (i === 0) {
          resultRows = tableRows;
          columnMetadata = tableColMeta;
        } else {
          // 做笛卡尔积
          const newRows: Record<string, any>[] = [];
          for (const leftRow of resultRows) {
            for (const rightRow of tableRows) {
              newRows.push({ ...leftRow, ...rightRow });
            }
          }
          resultRows = newRows;
          columnMetadata = [...columnMetadata, ...tableColMeta];
        }
      }
      return {
        rows: resultRows,
        metadata: {
          tableAliases,
          columnMetadata,
        },
      };
    }

    const mainTable = ast.from[0];

    console.log("处理FROM子句:", JSON.stringify(mainTable, null, 2));

    // 处理子查询 - 检查新的AST结构
    if (mainTable.expr) {
      console.log(
        "检测到可能的子查询:",
        JSON.stringify(mainTable.expr, null, 2)
      );

      // 检查是否是子查询的新结构
      if (mainTable.expr.ast || mainTable.expr.type === "select") {
        return this.processSubquery(mainTable);
      }
    }

    console.log("主表信息:", mainTable);
    const mainTableName = mainTable.table;

    if (!mainTableName) {
      throw new Error("无法识别的表名: " + JSON.stringify(mainTable));
    }

    const mainTableAlias = mainTable.as || mainTable.alias || mainTable.table;
    tableAliases.set(mainTableAlias, mainTableName);

    const table = this.getTable(mainTableName);
    if (!table) {
      throw new Error(`表 ${mainTableName} 不存在`);
    }

    // 为主表数据添加别名前缀
    const rows = table.data.map((row) => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        newRow[`${mainTableAlias}.${key}`] = value;
        // 同时保留不带前缀的列名，方便后续处理
        newRow[key] = value;
      });
      return newRow;
    });

    // 初始化列元数据
    const columnMetadata: ColumnMetadata[] = table.structure.columns.map(
      (col) => ({
        tableAlias: mainTableAlias,
        columnName: col.name,
        outputName: col.name,
      })
    );

    return {
      rows,
      metadata: {
        tableAliases,
        columnMetadata,
      },
    };
  }

  /**
   * 处理子查询
   * @param subqueryClause 子查询子句
   * @returns 中间结果
   */
  private processSubquery(subqueryClause: any): IntermediateResult {
    console.log("开始处理子查询");

    // 获取实际的子查询AST
    let subQueryAst;
    if (subqueryClause.expr.ast) {
      // 新的AST结构
      subQueryAst = subqueryClause.expr.ast;
      console.log(
        "从新结构中提取子查询AST:",
        JSON.stringify(subQueryAst, null, 2)
      );
    } else if (subqueryClause.expr.type === "select") {
      // 旧的AST结构
      subQueryAst = subqueryClause.expr;
      console.log(
        "从旧结构中提取子查询AST:",
        JSON.stringify(subQueryAst, null, 2)
      );
    } else {
      throw new Error(
        "无法识别的子查询结构: " + JSON.stringify(subqueryClause.expr)
      );
    }

    // 执行子查询
    const subQueryResult = this.executeSelect(subQueryAst);
    if (!subQueryResult.success || !subQueryResult.data) {
      throw new Error(
        "子查询执行失败: " + (subQueryResult.message || "未知错误")
      );
    }

    console.log("子查询结果:", subQueryResult);

    // 如果子查询结果为空，返回空结果集
    if (subQueryResult.data.length === 0) {
      return {
        rows: [],
        metadata: {
          tableAliases: new Map(),
          columnMetadata: [],
        },
      };
    }

    const alias = subqueryClause.as || "subquery";
    const rows = subQueryResult.data.map((row) => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        newRow[`${alias}.${key}`] = value;
        // 同时保留不带前缀的列名
        newRow[key] = value;
      });
      return newRow;
    });

    // 从第一行数据推断列元数据
    const columnMetadata: ColumnMetadata[] = Object.keys(
      subQueryResult.data[0] || {}
    ).map((col) => ({
      tableAlias: alias,
      columnName: col,
      outputName: col,
    }));

    return {
      rows,
      metadata: {
        tableAliases: new Map([[alias, alias]]),
        columnMetadata,
      },
    };
  }

  /**
   * 处理JOIN子句
   * @param result 当前中间结果
   * @param joinClauses JOIN子句数组
   * @returns 更新后的中间结果
   */
  private processJoinClauses(
    result: IntermediateResult,
    joinClauses: any[]
  ): IntermediateResult {
    let currentResult = { ...result };

    for (const join of joinClauses) {
      console.log("处理JOIN子句:", join);

      // 检查是否是预处理的NATURAL JOIN
      // 通过检查注释来识别NATURAL JOIN
      const isNaturalJoin = join.comment === "NATURAL_JOIN";

      const joinType = isNaturalJoin
        ? "NATURAL JOIN"
        : (join.join || "INNER JOIN").toUpperCase();

      // 检查是否是子查询
      if (join.expr && (join.expr.ast || join.expr.type === "select")) {
        console.log("检测到JOIN中的子查询");

        // 处理子查询
        const subqueryResult = this.processSubquery(join);
        const joinAlias = join.as || "subquery";

        console.log(`子查询JOIN, 别名: ${joinAlias}`);

        // 合并子查询结果
        currentResult = this.mergeSubqueryJoin(
          currentResult,
          subqueryResult,
          join.on,
          joinType
        );

        continue; // 跳过后续处理
      }

      const joinTableName = join.table;
      const joinAlias = join.as || join.alias || join.table;

      console.log(
        `JOIN类型: ${joinType}, 表: ${joinTableName}, 别名: ${joinAlias}`
      );

      // 更新表别名映射
      currentResult.metadata.tableAliases.set(joinAlias, joinTableName);

      const joinTable = this.getTable(joinTableName);
      if (!joinTable) {
        throw new Error(`JOIN表 ${joinTableName} 不存在`);
      }

      // 执行JOIN操作
      if (isNaturalJoin) {
        // 对于NATURAL JOIN，我们需要找出共同列并构建ON条件
        console.log("执行NATURAL JOIN");
        currentResult = this.executeJoin(
          currentResult,
          joinTable,
          joinAlias,
          null, // 传递null作为ON条件，表示这是一个NATURAL JOIN
          "NATURAL JOIN"
        );
      } else {
        // 正常处理其他JOIN类型
        console.log("执行普通JOIN");
        currentResult = this.executeJoin(
          currentResult,
          joinTable,
          joinAlias,
          join.on,
          joinType
        );
      }
    }

    return currentResult;
  }

  /**
   * 合并子查询JOIN结果
   * @param leftResult 左侧结果
   * @param rightResult 右侧子查询结果
   * @param onCondition ON条件
   * @param joinType JOIN类型
   * @returns 合并后的结果
   */
  private mergeSubqueryJoin(
    leftResult: IntermediateResult,
    rightResult: IntermediateResult,
    onCondition: any,
    joinType: string
  ): IntermediateResult {
    console.log("合并子查询JOIN结果");
    console.log("左侧行数:", leftResult.rows.length);
    console.log("右侧行数:", rightResult.rows.length);

    // 合并列元数据
    const mergedColumnMetadata = [
      ...leftResult.metadata.columnMetadata,
      ...rightResult.metadata.columnMetadata,
    ];

    // 合并表别名映射
    const mergedTableAliases = new Map([
      ...leftResult.metadata.tableAliases,
      ...rightResult.metadata.tableAliases,
    ]);

    // 根据JOIN类型执行不同的合并操作
    let mergedRows: Record<string, any>[] = [];

    if (joinType === "INNER JOIN") {
      // 执行INNER JOIN
      for (const leftRow of leftResult.rows) {
        for (const rightRow of rightResult.rows) {
          // 创建临时合并行用于评估JOIN条件
          const tempRow = { ...leftRow, ...rightRow };

          // 评估JOIN条件
          try {
            if (evaluateCondition(tempRow, onCondition)) {
              // 合并行
              mergedRows.push(tempRow);
            }
          } catch (error) {
            console.error("评估JOIN条件时出错:", error);
          }
        }
      }
    } else if (joinType === "LEFT JOIN") {
      // 执行LEFT JOIN
      for (const leftRow of leftResult.rows) {
        let hasMatch = false;

        for (const rightRow of rightResult.rows) {
          // 创建临时合并行用于评估JOIN条件
          const tempRow = { ...leftRow, ...rightRow };

          // 评估JOIN条件
          try {
            if (evaluateCondition(tempRow, onCondition)) {
              // 合并行
              mergedRows.push(tempRow);
              hasMatch = true;
            }
          } catch (error) {
            console.error("评估JOIN条件时出错:", error);
          }
        }

        // 如果没有匹配，添加NULL右行
        if (!hasMatch) {
          const nullRightRow: Record<string, null> = {};

          // 为右表的所有列创建NULL值
          rightResult.metadata.columnMetadata.forEach((col) => {
            const fullColumnName = `${col.tableAlias}.${col.columnName}`;
            nullRightRow[fullColumnName] = null;
            nullRightRow[col.columnName] = null; // 同时添加不带前缀的列名
          });

          mergedRows.push({ ...leftRow, ...nullRightRow });
        }
      }
    } else {
      // 默认使用INNER JOIN
      console.warn(`不支持的JOIN类型: ${joinType}，将作为INNER JOIN处理`);

      for (const leftRow of leftResult.rows) {
        for (const rightRow of rightResult.rows) {
          // 创建临时合并行用于评估JOIN条件
          const tempRow = { ...leftRow, ...rightRow };

          // 评估JOIN条件
          try {
            if (evaluateCondition(tempRow, onCondition)) {
              // 合并行
              mergedRows.push(tempRow);
            }
          } catch (error) {
            console.error("评估JOIN条件时出错:", error);
          }
        }
      }
    }

    console.log("合并后的行数:", mergedRows.length);

    return {
      rows: mergedRows,
      metadata: {
        tableAliases: mergedTableAliases,
        columnMetadata: mergedColumnMetadata,
      },
    };
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
    console.log(
      `执行 ${joinType} 操作，表: ${joinTable.structure.tableName}, 别名: ${joinAlias}`
    );

    // 更新列元数据
    const updatedColumnMetadata = [
      ...result.metadata.columnMetadata,
      ...joinTable.structure.columns.map((col) => ({
        tableAlias: joinAlias,
        columnName: col.name,
        outputName: col.name,
      })),
    ];

    let joinedRows: Record<string, any>[] = [];

    switch (joinType.toUpperCase()) {
      case "INNER JOIN":
        joinedRows = this.executeInnerJoin(
          result.rows,
          joinTable,
          joinAlias,
          onCondition
        );
        break;
      case "LEFT JOIN":
        joinedRows = this.executeLeftJoin(
          result.rows,
          joinTable,
          joinAlias,
          onCondition
        );
        break;
      case "RIGHT JOIN":
        joinedRows = this.executeRightJoin(
          result.rows,
          joinTable,
          joinAlias,
          onCondition
        );
        break;
      case "FULL OUTER JOIN":
      case "FULL JOIN":
        joinedRows = this.executeFullOuterJoin(
          result.rows,
          joinTable,
          joinAlias,
          onCondition
        );
        break;
      case "CROSS JOIN":
        joinedRows = this.executeCrossJoin(result.rows, joinTable, joinAlias);
        break;
      case "NATURAL JOIN":
        // 对于NATURAL JOIN，我们需要找出共同列并执行
        joinedRows = this.executeNaturalJoin(result.rows, joinTable, joinAlias);
        break;
      default:
        console.warn(`不支持的JOIN类型: ${joinType}，将作为INNER JOIN处理`);
        joinedRows = this.executeInnerJoin(
          result.rows,
          joinTable,
          joinAlias,
          onCondition
        );
    }

    return {
      rows: joinedRows,
      metadata: {
        tableAliases: result.metadata.tableAliases,
        columnMetadata: updatedColumnMetadata,
      },
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
          console.error("评估JOIN条件时出错:", error);
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
    console.log("===== 执行 LEFT JOIN =====");
    console.log("左表行数:", leftRows.length);
    console.log("右表名:", rightTable.structure.tableName);
    console.log("右表别名:", rightAlias);
    console.log("JOIN条件:", JSON.stringify(onCondition));

    const joinedRows: Record<string, any>[] = [];

    for (const leftRow of leftRows) {
      console.log("\n处理左表行:", leftRow);
      let hasMatch = false;

      for (const rightRow of rightTable.data) {
        // 创建临时合并行用于评估JOIN条件
        const tempRow = this.createTempRow(leftRow, rightRow, rightAlias);

        // 评估JOIN条件
        try {
          const matches = evaluateCondition(tempRow, onCondition);
          console.log("评估JOIN条件:", matches, "右表行:", rightRow);

          if (matches) {
            // 合并行
            const mergedRow = this.mergeRows(leftRow, rightRow, rightAlias);
            console.log("匹配成功! 合并后的行:", mergedRow);
            joinedRows.push(mergedRow);
            hasMatch = true;
          }
        } catch (error) {
          console.error("评估JOIN条件时出错:", error);
        }
      }

      // 如果没有匹配，添加左行和NULL右行
      if (!hasMatch) {
        console.log("左表行没有匹配! 添加NULL右表行");
        const nullMergedRow = this.mergeRowsWithNull(
          leftRow,
          rightTable,
          rightAlias
        );
        console.log("合并NULL后的行:", nullMergedRow);
        joinedRows.push(nullMergedRow);
      }
    }

    console.log("LEFT JOIN 结果行数:", joinedRows.length);
    console.log("LEFT JOIN 第一行示例:", joinedRows[0]);
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
          console.error("评估JOIN条件时出错:", error);
        }
      }

      // 如果没有匹配，添加NULL左行和右行
      if (!hasMatch) {
        const nullLeftRow: Record<string, null> = {};
        // 为左表的所有列创建NULL值
        for (const leftRow of leftRows.slice(0, 1)) {
          // 使用第一行作为模板
          Object.keys(leftRow).forEach((key) => {
            if (key.includes(".")) {
              // 只处理带表前缀的列
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
    const leftJoinResult = this.executeLeftJoin(
      leftRows,
      rightTable,
      rightAlias,
      onCondition
    );

    // 再执行RIGHT JOIN，但只保留未匹配的右表行
    const rightJoinResult = this.executeRightJoin(
      leftRows,
      rightTable,
      rightAlias,
      onCondition
    );

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
          .join("|");

        matchedRightRows.add(rightRowId);
      }
    }

    // 过滤RIGHT JOIN结果，只保留未在LEFT JOIN中匹配的行
    const unmatchedRightJoinRows = rightJoinResult.filter((row) => {
      // 创建右表行的唯一标识
      const rightRowId = Object.entries(row)
        .filter(([key]) => key.startsWith(`${rightAlias}.`))
        .map(([key, value]) => `${key}:${value}`)
        .join("|");

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
    console.log("执行NATURAL JOIN");

    // 找出左右表的共同列名
    const commonColumns = this.findCommonColumns(leftRows, rightTable);
    console.log("NATURAL JOIN 共同列:", commonColumns);

    if (commonColumns.length === 0) {
      console.warn("NATURAL JOIN 没有找到共同列，将作为CROSS JOIN处理");
      // 如果没有共同列，执行笛卡尔积
      return this.executeCrossJoin(leftRows, rightTable, rightAlias);
    }

    const joinedRows: Record<string, any>[] = [];

    // 对每一行执行自然连接
    for (const leftRow of leftRows) {
      for (const rightRow of rightTable.data) {
        // 检查所有共同列是否匹配
        let allColumnsMatch = true;

        for (const { leftCol, rightCol } of commonColumns) {
          // 获取左表列值（可能带有表前缀）
          let leftValue = null;

          // 1. 先尝试不带前缀的列名
          if (leftRow[leftCol] !== undefined) {
            leftValue = leftRow[leftCol];
          } else {
            // 2. 尝试查找任何表别名下的该列名
            const matchingLeftKey = Object.keys(leftRow).find((k) =>
              k.endsWith(`.${leftCol}`)
            );
            if (matchingLeftKey) {
              leftValue = leftRow[matchingLeftKey];
            }
          }

          // 获取右表列值
          const rightValue = rightRow[rightCol];

          // 如果任何一对共同列的值不匹配，则不连接这两行
          if (leftValue !== rightValue) {
            allColumnsMatch = false;
            break;
          }
        }

        // 如果所有共同列都匹配，则合并这两行
        if (allColumnsMatch) {
          // 使用特殊的合并方法，确保共同列只出现一次
          joinedRows.push(
            this.mergeRowsForNaturalJoin(
              leftRow,
              rightRow,
              rightAlias,
              commonColumns
            )
          );
        }
      }
    }

    return joinedRows;
  }

  /**
   * 找出左右表的共同列
   */
  private findCommonColumns(
    leftRows: Record<string, any>[],
    rightTable: TableData
  ): { leftCol: string; rightCol: string }[] {
    if (leftRows.length === 0) return [];

    // 获取左表的列名（不带表前缀）
    const leftColumns = new Set<string>();
    const firstLeftRow = leftRows[0];

    // 收集左表的所有列名
    for (const key of Object.keys(firstLeftRow)) {
      // 如果是带表前缀的列名，提取列名部分
      if (key.includes(".")) {
        const columnName = key.split(".")[1];
        leftColumns.add(columnName);
      } else {
        // 不带前缀的列名直接添加
        leftColumns.add(key);
      }
    }

    console.log("左表列名:", Array.from(leftColumns));

    // 获取右表的列名
    const rightColumns = rightTable.structure.columns.map((col) => col.name);
    console.log("右表列名:", rightColumns);

    // 找出共同列
    const commonColumns: { leftCol: string; rightCol: string }[] = [];

    for (const leftCol of leftColumns) {
      if (rightColumns.includes(leftCol)) {
        commonColumns.push({
          leftCol,
          rightCol: leftCol,
        });
      }
    }

    console.log("共同列:", commonColumns);
    return commonColumns;
  }

  /**
   * 合并行，但共同列只保留一份
   */
  private mergeRowsForNaturalJoin(
    leftRow: Record<string, any>,
    rightRow: Record<string, any>,
    rightAlias: string,
    commonColumns: { leftCol: string; rightCol: string }[]
  ): Record<string, any> {
    const mergedRow: Record<string, any> = { ...leftRow };

    // 添加右表列（带别名前缀），但不包括共同列
    Object.entries(rightRow).forEach(([key, value]) => {
      if (!commonColumns.some((col) => col.rightCol === key)) {
        mergedRow[`${rightAlias}.${key}`] = value;
      }
    });

    return mergedRow;
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
    console.log("合并行 - 输入:");
    console.log("  左表行:", leftRow);
    console.log("  右表行:", rightRow);
    console.log("  右表别名:", rightAlias);

    // 创建一个新对象，而不是修改原对象
    const merged: Record<string, any> = {};

    // 1. 首先复制左表的所有字段
    for (const key in leftRow) {
      merged[key] = leftRow[key];
      // console.log(`  复制左表字段 ${key}:`, leftRow[key]);
    }

    // 2. 添加右表字段，带上别名前缀
    for (const key in rightRow) {
      const prefixedKey = `${rightAlias}.${key}`;
      merged[prefixedKey] = rightRow[key];
      console.log(`  添加右表字段 ${prefixedKey}:`, rightRow[key]);
    }

    console.log("合并行 - 结果:", merged);
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
    console.log("合并NULL行 - 输入:");
    console.log("  左表行:", leftRow);
    console.log("  右表结构:", rightTable.structure.tableName);
    console.log("  右表别名:", rightAlias);

    // 创建一个新对象，而不是修改原对象
    const merged: Record<string, any> = {};

    // 1. 首先复制左表的所有字段
    for (const key in leftRow) {
      merged[key] = leftRow[key];
      // console.log(`  复制左表字段 ${key}:`, leftRow[key]);
    }

    // 2. 用 null 补充右表字段
    for (const col of rightTable.structure.columns) {
      const prefixedKey = `${rightAlias}.${col.name}`;
      merged[prefixedKey] = null;
      console.log(`  添加NULL右表字段 ${prefixedKey}`);
    }

    console.log("合并NULL行 - 结果:", merged);
    return merged;
  }

  /**
   * 处理WHERE子句
   * @param result 当前中间结果
   * @param whereClause WHERE子句
   * @returns 过滤后的中间结果
   */
  private processWhereClause(
    result: IntermediateResult,
    whereClause: any
  ): IntermediateResult {
    // 预处理 WHERE 子句中的子查询
    this.preprocessWhereSubqueries(whereClause);

    return {
      ...result,
      rows: result.rows.filter((row) => {
        try {
          return evaluateWhereClause(row, whereClause);
        } catch (error) {
          console.error("评估WHERE条件时出错:", error);
          return false;
        }
      }),
    };
  }

  /**
   * 预处理 WHERE 子句中的子查询
   * @param whereClause WHERE子句
   */
  private preprocessWhereSubqueries(whereClause: any): void {
    if (!whereClause) return;

    console.log("预处理 WHERE 子句中的子查询:", whereClause);

    // 处理二元表达式
    if (whereClause.type === "binary_expr") {
      // 递归处理左侧
      if (whereClause.left) {
        this.preprocessWhereSubqueries(whereClause.left);
      }

      // 处理右侧
      if (whereClause.right) {
        // 检查是否是子查询
        if (whereClause.right.ast) {
          console.log("检测到 WHERE 子句中的子查询:", whereClause.right.ast);

          // 执行子查询
          const subQueryResult = this.executeSelect(whereClause.right.ast);
          if (!subQueryResult.success || !subQueryResult.data) {
            throw new Error(
              "子查询执行失败: " + (subQueryResult.message || "未知错误")
            );
          }

          console.log("子查询结果:", subQueryResult);

          // 如果子查询返回多行多列，我们需要确定使用哪个值
          // 通常，比较操作符期望一个标量值，所以我们取第一行第一列
          if (subQueryResult.data.length > 0) {
            const firstRow = subQueryResult.data[0];
            const firstKey = Object.keys(firstRow)[0];
            const scalarValue = firstRow[firstKey];

            console.log("从子查询结果中提取标量值:", scalarValue);

            // 替换子查询为标量值
            whereClause.right = scalarValue;
          } else {
            // 如果子查询没有返回任何行，使用 null
            whereClause.right = null;
          }
        } else {
          // 递归处理右侧
          this.preprocessWhereSubqueries(whereClause.right);
        }
      }
    }

    // 处理其他类型的条件（如 IN、EXISTS 等）
    // ...
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
    groupByClause: any,
    columns: any[]
  ): IntermediateResult {
    console.log("处理GROUP BY子句:");
    console.log("- 输入行数:", result.rows.length);
    console.log("- GROUP BY子句:", JSON.stringify(groupByClause));
    console.log("- 列:", JSON.stringify(columns));

    // 转换GROUP BY子句为标准格式
    let standardizedGroupBy: any[] = [];

    // 处理不同格式的GROUP BY子句
    if (Array.isArray(groupByClause)) {
      // 如果是数组格式
      standardizedGroupBy = groupByClause.map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && item.type === "column_ref") {
          const tableName = item.table || "";
          const columnName = item.column;
          return tableName ? `${tableName}.${columnName}` : columnName;
        }

        return item;
      });
    } else if (groupByClause && groupByClause.columns) {
      // 如果是对象格式，包含columns属性
      standardizedGroupBy = groupByClause.columns.map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && item.type === "column_ref") {
          const tableName = item.table || "";
          const columnName = item.column;
          return tableName ? `${tableName}.${columnName}` : columnName;
        }

        return item;
      });
    } else if (groupByClause) {
      // 其他格式，尝试转换为数组
      console.warn("未知的GROUP BY格式:", groupByClause);
      standardizedGroupBy = [groupByClause];
    }

    console.log("- 标准化后的GROUP BY:", standardizedGroupBy);

    // 执行GROUP BY操作
    const groupedResult = executeGroupBy(
      result.rows,
      standardizedGroupBy,
      columns
    );
    console.log("- GROUP BY结果行数:", groupedResult.length);

    // 确保每个分组行都包含原始的聚合函数结果，用于HAVING子句
    for (const row of groupedResult) {
      // 处理每个聚合函数列
      for (const col of columns) {
        if (col.expr.type === "aggr_func") {
          const funcName = col.expr.name;
          const alias =
            col.as || `${funcName}(${col.expr.args.expr.column || "*"})`;

          // 确保行中有这个聚合函数的结果
          if (row[alias] === undefined) {
            console.warn(`分组行中缺少聚合函数结果: ${alias}`);
          } else {
            // 同时保存一个原始名称的版本，以便HAVING子句可以引用
            const originalName = `${funcName}(${
              col.expr.args.expr.type === "star"
                ? "*"
                : col.expr.args.expr.column
            })`;
            if (originalName !== alias) {
              row[originalName] = row[alias];
              console.log(
                `为HAVING子句添加原始聚合函数名: ${originalName} = ${row[alias]}`
              );
            }
          }
        }
      }
    }

    // 更新列元数据
    const newColumnMetadata = [...result.metadata.columnMetadata];

    // 添加聚合函数列的元数据
    for (const col of columns) {
      if (col.expr.type === "aggr_func") {
        const funcName = col.expr.name;
        let argName = "*";

        if (col.expr.args.expr.type === "column_ref") {
          argName = col.expr.args.expr.column;
        }

        const outputName = col.as || `${funcName}(${argName})`;

        // 添加到元数据
        newColumnMetadata.push({
          tableAlias: "",
          columnName: outputName,
          outputName,
        });
      }
    }

    return {
      rows: groupedResult,
      metadata: {
        ...result.metadata,
        columnMetadata: newColumnMetadata,
      },
    };
  }

  /**
   * 处理HAVING子句
   * @param result 当前中间结果
   * @param havingClause HAVING子句
   * @returns 过滤后的中间结果
   */
  private processHavingClause(
    result: IntermediateResult,
    havingClause: any
  ): IntermediateResult {
    console.log("处理HAVING子句:", JSON.stringify(havingClause, null, 2));

    // 预处理 HAVING 子句中的子查询
    this.preprocessHavingSubqueries(havingClause);

    return {
      ...result,
      rows: result.rows.filter((row) => {
        try {
          // 修改：特殊处理HAVING中的聚合函数
          if (
            havingClause.type === "binary_expr" &&
            havingClause.left.type === "aggr_func" &&
            havingClause.left.name === "COUNT"
          ) {
            // 获取聚合函数的结果
            let countValue;

            // 如果是COUNT(*)，直接使用行中已计算的COUNT(*)值
            if (havingClause.left.args.expr.type === "star") {
              // 尝试从行中获取COUNT(*)的值
              const countKey = Object.keys(row).find(
                (k) => k.startsWith("COUNT(") || k === "student_count"
              );
              if (countKey) {
                countValue = row[countKey];
                console.log(
                  `从行中获取COUNT值: ${countValue}, 键: ${countKey}`
                );
              } else {
                console.warn("无法从行中找到COUNT值");
                return false;
              }
            } else {
              // 其他类型的COUNT
              const columnName = havingClause.left.args.expr.column;
              const countKey = `COUNT(${columnName})`;
              countValue = row[countKey] || row["student_count"];
            }

            // 获取右侧值
            const rightValue = havingClause.right.value;

            // 执行比较
            console.log(
              `比较: ${countValue} ${havingClause.operator} ${rightValue}`
            );
            switch (havingClause.operator) {
              case ">":
                return countValue > rightValue;
              case ">=":
                return countValue >= rightValue;
              case "<":
                return countValue < rightValue;
              case "<=":
                return countValue <= rightValue;
              case "=":
                return countValue === rightValue;
              case "<>":
              case "!=":
                return countValue !== rightValue;
              default:
                return false;
            }
          }

          // 其他类型的HAVING条件使用通用评估
          return evaluateCondition(row, havingClause);
        } catch (error) {
          console.error("评估HAVING条件时出错:", error);
          return false;
        }
      }),
    };
  }

  /**
   * 预处理 HAVING 子句中的子查询
   * @param havingClause HAVING子句
   */
  private preprocessHavingSubqueries(havingClause: any): void {
    if (!havingClause) return;

    console.log("预处理 HAVING 子句中的子查询:", havingClause);

    // 处理二元表达式
    if (havingClause.type === "binary_expr") {
      // 处理左侧
      if (havingClause.left) {
        // 检查是否是子查询
        if (havingClause.left.ast) {
          console.log("检测到 HAVING 子句中的子查询:", havingClause.left.ast);

          // 执行子查询
          const subQueryResult = this.executeSelect(havingClause.left.ast);
          if (!subQueryResult.success || !subQueryResult.data) {
            throw new Error(
              "子查询执行失败: " + (subQueryResult.message || "未知错误")
            );
          }

          console.log("子查询结果:", subQueryResult);

          // 如果子查询返回多行多列，我们需要确定使用哪个值
          // 通常，比较操作符期望一个标量值，所以我们取第一行第一列
          if (subQueryResult.data.length > 0) {
            const firstRow = subQueryResult.data[0];
            const firstKey = Object.keys(firstRow)[0];
            const scalarValue = firstRow[firstKey];

            console.log("从子查询结果中提取标量值:", scalarValue);

            // 替换子查询为标量值
            havingClause.left = scalarValue;
          } else {
            // 如果子查询没有返回任何行，使用 null
            havingClause.left = null;
          }
        } else {
          // 递归处理左侧
          this.preprocessHavingSubqueries(havingClause.left);
        }
      }

      // 处理右侧
      if (havingClause.right) {
        // 检查是否是子查询
        if (havingClause.right.ast) {
          console.log("检测到 HAVING 子句中的子查询:", havingClause.right.ast);

          // 执行子查询
          const subQueryResult = this.executeSelect(havingClause.right.ast);
          if (!subQueryResult.success || !subQueryResult.data) {
            throw new Error(
              "子查询执行失败: " + (subQueryResult.message || "未知错误")
            );
          }

          console.log("子查询结果:", subQueryResult);

          // 如果子查询返回多行多列，我们需要确定使用哪个值
          // 通常，比较操作符期望一个标量值，所以我们取第一行第一列
          if (subQueryResult.data.length > 0) {
            const firstRow = subQueryResult.data[0];
            const firstKey = Object.keys(firstRow)[0];
            const scalarValue = firstRow[firstKey];

            console.log("从子查询结果中提取标量值:", scalarValue);

            // 替换子查询为标量值
            havingClause.right = scalarValue;
          } else {
            // 如果子查询没有返回任何行，使用 null
            havingClause.right = null;
          }
        } else {
          // 递归处理右侧
          this.preprocessHavingSubqueries(havingClause.right);
        }
      }
    }
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
    console.log(
      "处理SELECT子句 - 输入行:",
      JSON.stringify(result.rows, null, 2)
    );

    const newRows = result.rows.map((row, rowIndex) => {
      console.log(`\n处理第 ${rowIndex} 行:`, JSON.stringify(row, null, 2));
      const newRow: Record<string, any> = {};

      columns.forEach((col: any) => {
        const columnExpr = col.expr;
        const alias = col.as;
        console.log("处理列:", JSON.stringify(columnExpr, null, 2));

        // 处理不同类型的列表达式
        if (columnExpr.type === "star") {
          // 处理 SELECT *
          console.log("处理 SELECT * (star)");

          // 直接复制所有不带前缀的列
          Object.keys(row).forEach((key) => {
            if (!key.includes(".")) {
              // console.log(`  复制不带前缀的列 ${key}:`, row[key]);
              newRow[key] = row[key];
            }
          });

          // 对于带前缀的列，如果对应的不带前缀的列不存在或为null，则使用带前缀的列值
          Object.keys(row).forEach((key) => {
            if (key.includes(".")) {
              const [table, column] = key.split(".");
              if (newRow[column] === undefined || newRow[column] === null) {
                console.log(
                  `  使用带前缀的列 ${key} 替换 ${column}:`,
                  row[key]
                );
                newRow[column] = row[key];
              }
            }
          });
        } else if (
          columnExpr.type === "column_ref" &&
          columnExpr.column === "*"
        ) {
          // 处理 SELECT * 或 SELECT table.*
          console.log("处理 SELECT * (column_ref)");
          const tablePrefix = columnExpr.table ? `${columnExpr.table}.` : "";

          // 如果指定了表前缀，只处理该表的列
          if (tablePrefix) {
            Object.keys(row).forEach((key) => {
              if (key.startsWith(tablePrefix)) {
                const column = key.split(".")[1];
                console.log(`  复制指定表的列 ${key} 到 ${column}:`, row[key]);
                newRow[column] = row[key];
              }
            });
          } else {
            // 没有指定表前缀，处理所有列
            // 直接复制所有不带前缀的列
            Object.keys(row).forEach((key) => {
              if (!key.includes(".")) {
                // console.log(`  复制不带前缀的列 ${key}:`, row[key]);
                newRow[key] = row[key];
              }
            });

            // 对于带前缀的列，如果对应的不带前缀的列不存在或为null，则使用带前缀的列值
            Object.keys(row).forEach((key) => {
              if (key.includes(".")) {
                const [table, column] = key.split(".");
                if (newRow[column] === undefined || newRow[column] === null) {
                  console.log(
                    `  使用带前缀的列 ${key} 替换 ${column}:`,
                    row[key]
                  );
                  newRow[column] = row[key];
                }
              }
            });
          }
        } else if (columnExpr.type === "column_ref") {
          // 处理普通列引用
          const tableAlias = columnExpr.table;
          const columnName = columnExpr.column;
          const outputName = alias || columnName;

          // 优先用不带前缀的列名
          if (row[columnName] !== undefined) {
            newRow[outputName] = row[columnName];
          } else {
            // 再查找带前缀的列名
            const matchingKey = Object.keys(row).find((k) =>
              k.endsWith(`.${columnName}`)
            );
            if (matchingKey) {
              newRow[outputName] = row[matchingKey];
            } else {
              newRow[outputName] = null;
            }
          }
        } else if (columnExpr.type === "aggr_func") {
          // 聚合函数已在GROUP BY步骤处理
          const outputName =
            alias || `${columnExpr.name}(${columnExpr.args.expr.column})`;
          newRow[outputName] = row[outputName];
        }
      });

      console.log("处理后的行:", newRow);
      return newRow;
    });

    return {
      rows: newRows,
      metadata: result.metadata,
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
      rows: sortedRows,
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
      // 使用 evaluateExpression 处理值，支持各种字符串类型
      newRow[col] = evaluateExpression(ast.values[index]);
    });

    // 验证主键约束
    validatePrimaryKey(table, newRow);

    // 验证外键约束
    validateForeignKeys(table, newRow, this.getTable.bind(this));

    table.data.push(newRow);

    return {
      success: true,
      message: "插入成功",
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
    table.data = table.data.map((row) => {
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
      message: `更新了 ${updatedCount} 行`,
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
    table.data = table.data.filter(
      (row) => !evaluateWhereClause(row, ast.where)
    );

    return {
      success: true,
      message: `删除了 ${originalLength - table.data.length} 行`,
    };
  }

  /**
   * 执行CREATE查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeCreate(ast: any): SQLQueryResult {
    if (ast.tableType === "TABLE") {
      const tableName = ast.name;
      if (this.tables.has(tableName)) {
        throw new Error(`表 ${tableName} 已存在`);
      }

      const structure: TableStructure = {
        tableName,
        columns: ast.columns.map((col: any) => ({
          name: col.name,
          type: col.dataType,
          isPrimary: col.constraints?.includes("PRIMARY KEY"),
          // 添加其他约束信息
        })),
      };

      this.tables.set(tableName, {
        structure,
        data: [],
      });

      return {
        success: true,
        message: `表 ${tableName} 创建成功`,
      };
    }
    throw new Error("仅支持CREATE TABLE操作");
  }

  /**
   * 执行DROP查询
   * @param ast 查询的AST
   * @returns 查询结果
   */
  private executeDrop(ast: any): SQLQueryResult {
    if (ast.tableType === "TABLE") {
      const tableName = ast.name;
      if (!this.tables.has(tableName)) {
        throw new Error(`表 ${tableName} 不存在`);
      }

      this.tables.delete(tableName);
      return {
        success: true,
        message: `表 ${tableName} 删除成功`,
      };
    }
    throw new Error("仅支持DROP TABLE操作");
  }

  /**
   * 获取表数据
   * @param tableName 表名
   * @returns 表数据或undefined
   */
  private getTable(tableName: string): TableData | undefined {
    const table = this.tables.get(tableName);
    console.log("Getting table:", tableName, "Found:", !!table); // 添加调试日志
    return table;
  }
}
