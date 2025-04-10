interface Column {
    name: string;
    type: string;
    isPrimary: boolean;
    foreignKeyRefs?: { tableId: string; columnName: string }[];
  }
  
  interface Table {
    id: string;
    tableName: string;
    position: { x: number; y: number };
    columns: Column[];
    isReferenced: boolean;
  }
  
  // 输入 JSON 的类型定义
  interface InputColumn {
    name: string;
    type: string;
    isPrimary: boolean;
  }
  
  interface InputForeignKey {
    column: string;
    references: {
      table: string;
      column: string;
    };
  }
  
  interface InputTable {
    tableName: string;
    columns: InputColumn[];
    foreignKeys?: InputForeignKey[];
  }
  
  // 将 JSON 数组转换为 Table 数组的函数
  export const parseJSONToTables = (jsonTables: InputTable[]): Table[] => {
    // 创建表名到 ID 的映射
    const tableNameToId: Map<string, string> = new Map();
    const tables: Table[] = [];
  
    // 第一步：生成基本表结构并分配 ID
    jsonTables.forEach((inputTable, index) => {
      const tableId = `${index + 1}`;
      tableNameToId.set(inputTable.tableName, tableId);
  
      tables.push({
        id: tableId,
        tableName: inputTable.tableName,
        position: { x: index * 300, y: 0 }, // 简单水平排列
        columns: inputTable.columns.map((col) => ({
          name: col.name,
          type: col.type,
          isPrimary: col.isPrimary,
        })),
        isReferenced: false, // 初始设为 false，后面根据外键更新
      });
    });
  
    // 第二步：处理外键关系
    jsonTables.forEach((inputTable, index) => {
      const currentTable = tables[index];
  
      if (inputTable.foreignKeys) {
        inputTable.foreignKeys.forEach((fk) => {
          // 找到对应的列
          const column = currentTable.columns.find(
            (col) => col.name === fk.column
          );
          if (column) {
            const refTableId = tableNameToId.get(fk.references.table);
            if (refTableId) {
              // 添加外键引用
              column.foreignKeyRefs = [
                {
                  tableId: refTableId,
                  columnName: fk.references.column,
                },
              ];
  
              // 更新被引用的表的状态
              const referencedTable = tables.find((t) => t.id === refTableId);
              if (referencedTable) {
                referencedTable.isReferenced = true;
              }
            }
          }
        });
      }
    });
  
    return tables;
  };
  