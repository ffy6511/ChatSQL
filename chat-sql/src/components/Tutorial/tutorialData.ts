interface TutorialData {
  title: string;
  description: string;
  problem: string[];
  hint: string;
  tags: string[];
  tableStructure: {
    tableName: string;
    columns: {
      name: string;
      type: string;
      isPrimary?: boolean;
    }[];
    foreignKeys: any[];
  }[];
  tuples: {
    tableName: string;
    tupleData: any[];
  }[];
  expected_result: {
    tableName: string;
    tupleData: any[];
  }[];
  data: {
    isBuiltIn: boolean;
    order: number;
    category: string;
  };
}

export const tutorials: TutorialData[] = [
  {
    title: "SQL基础查询教程 - SELECT语句",
    description: "SQL基础查询教程 - SELECT语句",
    problem: [
      "1. 查询用户表中所有用户的名字",
      "2. 查询用户表中的所有字段",
      "3. 查询用户表中年龄大于25岁的用户信息"
    ],
    hint: "本教程主要介绍SELECT语句的基本用法，包括列选择和WHERE条件过滤",
    tags: ["select", "where"],
    tableStructure: [
      {
        tableName: "Users",
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR(50)" },
          { name: "age", type: "INT" },
          { name: "email", type: "VARCHAR(100)" }
        ],
        foreignKeys: []
      }
    ],
    tuples: [
      {
        tableName: "Users",
        tupleData: [
          { id: 1, name: "张三", age: 25, email: "zhangsan@example.com" },
          { id: 2, name: "李四", age: 30, email: "lisi@example.com" },
          { id: 3, name: "王五", age: 22, email: "wangwu@example.com" }
        ]
      }
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Users",
        tupleData: [
          { name: "张三" },
          { name: "李四" },
          { name: "王五" }
        ]
      },
      {
        // 问题2的预期结果
        tableName: "Users",
        tupleData: [
          { id: 1, name: "张三", age: 25, email: "zhangsan@example.com" },
          { id: 2, name: "李四", age: 30, email: "lisi@example.com" },
          { id: 3, name: "王五", age: 22, email: "wangwu@example.com" }
        ]
      },
      {
        // 问题3的预期结果
        tableName: "Users",
        tupleData: [
          { id: 2, name: "李四", age: 30, email: "lisi@example.com" }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 1,
      category: "Basic"
    }
  },
  // ... 其他教程
];
