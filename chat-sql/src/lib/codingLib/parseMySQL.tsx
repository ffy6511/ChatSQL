// 用于解析JSON格式的表结构, 为可视化组件提供输入
import {  InputTable, Table } from '@/types/CodingTypes/database';

  // 将 JSON 数组转换为 Table 数组的函数
  export const parseJSONToTables = (jsonTables: InputTable[]): Table[] => {
    const tableNameToId: Map<string, string> = new Map();
    const tables: Table[] = [];

    // 第一步：建立表名到ID的映射
    jsonTables.forEach((inputTable, index) => {
      const tableId = `table-${index}`;
      tableNameToId.set(inputTable.tableName, tableId);
    });

    // 第二步：创建基本表结构
    jsonTables.forEach((inputTable, index) => {
      const tableId = tableNameToId.get(inputTable.tableName)!;
      
      tables.push({
        id: tableId,
        tableName: inputTable.tableName,
        position: { x: index * 350, y: 100 },
        columns: inputTable.columns.map((col) => ({
          name: col.name,
          type: col.type,
          isPrimary: col.isPrimary,
          foreignKeyRefs: undefined  // 初始化为 undefined
        })),
        isReferenced: false
      });
    });

    // 第三步：处理外键关系
    jsonTables.forEach((inputTable) => {
      if (inputTable.foreignKeys) {
        inputTable.foreignKeys.forEach((fk) => {
          const sourceTableId = tableNameToId.get(fk.fromTable);
          const targetTableId = tableNameToId.get(fk.toTable);
          
          if (sourceTableId && targetTableId) {
            // 找到源表和源列
            const sourceTable = tables.find(t => t.id === sourceTableId);
            if (sourceTable) {
              const sourceColumn = sourceTable.columns.find(c => c.name === fk.fromColumn);
              if (sourceColumn) {
                // 设置外键引用
                sourceColumn.foreignKeyRefs = [{
                  tableId: targetTableId,  // 使用 tableId 而不是 tableName
                  columnName: fk.toColumn
                }];
              }
            }

            // 标记目标表为被引用
            const targetTable = tables.find(t => t.id === targetTableId);
            if (targetTable) {
              targetTable.isReferenced = true;
            }
          }
        });
      }
    });

    return tables;
  };
  
