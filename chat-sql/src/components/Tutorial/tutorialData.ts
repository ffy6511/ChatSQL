interface TutorialTableStructure {
  tableName: string;
  columns: {
    name: string;
    type: string;
    isPrimary?: boolean;
  }[];
  foreignKeys: {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
  }[];
}

interface TutorialData {
  title: string;
  description: string;
  problem: string[];
  hint: string;
  tags: string[];
  tableStructure: TutorialTableStructure[];  // 使用与 parseJSONToTables 输入相同的格式
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
  // select的基础教程
  {
    title: "SELECT语句",
    description: "SELECT语句",
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

  // 第二个教程：JOIN操作
  {
    title: "表连接操作",
    description: "在一个电商系统中，存在用户表(Users)、订单表(Orders)和商品表(Products)。这些表通过外键关联，形成了完整的订单信息。",
    problem: [
      "1. 查询所有用户的姓名及其订单总数，包括没有订单的用户（使用LEFT JOIN）",
      "2. 查询订单金额超过1000元的订单信息，包括用户姓名、商品名称和订单金额",
      "3. 查询每个用户购买过的所有商品名称（用户姓名、商品名称），按用户姓名和商品名称排序"
    ],
    hint: "本教程主要介绍不同类型的JOIN操作（LEFT JOIN, INNER JOIN）以及多表连接查询",
    tags: ["join", "left join", "inner join", "order by"],
    tableStructure: [
      {
        tableName: "Users",
        columns: [
          { name: "user_id", type: "INT", isPrimary: true },
          { name: "user_name", type: "VARCHAR(50)" },
          { name: "email", type: "VARCHAR(100)" }
        ],
        foreignKeys: []
      },
      {
        tableName: "Orders",
        columns: [
          { name: "order_id", type: "INT", isPrimary: true },
          { name: "user_id", type: "INT" },
          { name: "product_id", type: "INT" },
          { name: "amount", type: "DECIMAL(10,2)" },
          { name: "order_date", type: "DATE" }
        ],
        foreignKeys: [
          {
            fromTable: "Orders",
            fromColumn: "user_id",
            toTable: "Users",
            toColumn: "user_id"
          },
          {
            fromTable: "Orders",
            fromColumn: "product_id",
            toTable: "Products",
            toColumn: "product_id"
          }
        ]
      },
      {
        tableName: "Products",
        columns: [
          { name: "product_id", type: "INT", isPrimary: true },
          { name: "product_name", type: "VARCHAR(100)" },
          { name: "price", type: "DECIMAL(10,2)" }
        ],
        foreignKeys: []
      }
    ],
    tuples: [
      {
        tableName: "Users",
        tupleData: [
          { user_id: 1, user_name: "张三", email: "zhang@example.com" },
          { user_id: 2, user_name: "李四", email: "li@example.com" },
          { user_id: 3, user_name: "王五", email: "wang@example.com" },
          { user_id: 4, user_name: "赵六", email: "zhao@example.com" }
        ]
      },
      {
        tableName: "Products",
        tupleData: [
          { product_id: 1, product_name: "笔记本电脑", price: 6999.00 },
          { product_id: 2, product_name: "智能手机", price: 3999.00 },
          { product_id: 3, product_name: "耳机", price: 999.00 }
        ]
      },
      {
        tableName: "Orders",
        tupleData: [
          { order_id: 1, user_id: 1, product_id: 1, amount: 6999.00, order_date: "2024-01-01" },
          { order_id: 2, user_id: 1, product_id: 3, amount: 999.00, order_date: "2024-01-02" },
          { order_id: 3, user_id: 2, product_id: 2, amount: 3999.00, order_date: "2024-01-03" },
          { order_id: 4, user_id: 3, product_id: 1, amount: 6999.00, order_date: "2024-01-04" }
        ]
      }
    ],
    expected_result: [
      {
        tableName: "Result1",
        tupleData: [
          { user_name: "张三", order_count: 2 },
          { user_name: "李四", order_count: 1 },
          { user_name: "王五", order_count: 1 },
          { user_name: "赵六", order_count: 0 }
        ]
      },
      {
        tableName: "Result2",
        tupleData: [
          { user_name: "张三", product_name: "笔记本电脑", amount: 6999.00 },
          { user_name: "王五", product_name: "笔记本电脑", amount: 6999.00 }
        ]
      },
      {
        tableName: "Result3",
        tupleData: [
          { user_name: "张三", product_name: "笔记本电脑" },
          { user_name: "张三", product_name: "耳机" },
          { user_name: "李四", product_name: "智能手机" },
          { user_name: "王五", product_name: "笔记本电脑" }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 2,
      category: "Basic"
    }
  },

  // 第三个教程：聚合操作
  {
    title: "聚合函数操作",
    description: "在一个销售系统中，存在销售员表(Salespeople)和销售记录表(Sales)。通过这些数据来分析销售业绩。",
    problem: [
      "1. 统计每个销售员的总销售额和销售笔数，并按总销售额降序排列",
      "2. 查询平均单笔销售额超过1000元的销售员信息，包括姓名、平均销售额和销售笔数",
      "3. 统计每个销售员每个月的销售总额，显示销售员姓名、年月和销售总额，按年月和销售员姓名排序"
    ],
    hint: "本教程主要介绍聚合函数(COUNT, SUM, AVG)以及GROUP BY、HAVING的使用",
    tags: ["aggregate", "group by", "having", "order by"],
    tableStructure: [
      {
        tableName: "Salespeople",
        columns: [
          { name: "salesperson_id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR(50)" },
          { name: "department", type: "VARCHAR(50)" }
        ],
        foreignKeys: []
      },
      {
        tableName: "Sales",
        columns: [
          { name: "sale_id", type: "INT", isPrimary: true },
          { name: "salesperson_id", type: "INT" },
          { name: "amount", type: "DECIMAL(10,2)" },
          { name: "sale_date", type: "DATE" }
        ],
        foreignKeys: [
          {
            fromTable: "Sales",
            fromColumn: "salesperson_id",
            toTable: "Salespeople",
            toColumn: "salesperson_id"
          }
        ]
      }
    ],
    tuples: [
      {
        tableName: "Salespeople",
        tupleData: [
          { salesperson_id: 1, name: "张三", department: "电子产品" },
          { salesperson_id: 2, name: "李四", department: "家居用品" },
          { salesperson_id: 3, name: "王五", department: "电子产品" }
        ]
      },
      {
        tableName: "Sales",
        tupleData: [
          { sale_id: 1, salesperson_id: 1, amount: 2000.00, sale_date: "2024-01-15" },
          { sale_id: 2, salesperson_id: 1, amount: 1500.00, sale_date: "2024-01-20" },
          { sale_id: 3, salesperson_id: 1, amount: 3000.00, sale_date: "2024-02-10" },
          { sale_id: 4, salesperson_id: 2, amount: 800.00, sale_date: "2024-01-15" },
          { sale_id: 5, salesperson_id: 2, amount: 900.00, sale_date: "2024-02-15" },
          { sale_id: 6, salesperson_id: 3, amount: 1800.00, sale_date: "2024-01-25" },
          { sale_id: 7, salesperson_id: 3, amount: 2200.00, sale_date: "2024-02-05" }
        ]
      }
    ],
    expected_result: [
      {
        tableName: "Result1",
        tupleData: [
          { name: "张三", total_sales: 6500.00, sales_count: 3 },
          { name: "王五", total_sales: 4000.00, sales_count: 2 },
          { name: "李四", total_sales: 1700.00, sales_count: 2 }
        ]
      },
      {
        tableName: "Result2",
        tupleData: [
          { name: "张三", avg_amount: 2166.67, sales_count: 3 },
          { name: "王五", avg_amount: 2000.00, sales_count: 2 }
        ]
      },
      {
        tableName: "Result3",
        tupleData: [
          { name: "张三", year_month: "2024-01", total_sales: 3500.00 },
          { name: "张三", year_month: "2024-02", total_sales: 3000.00 },
          { name: "李四", year_month: "2024-01", total_sales: 800.00 },
          { name: "李四", year_month: "2024-02", total_sales: 900.00 },
          { name: "王五", year_month: "2024-01", total_sales: 1800.00 },
          { name: "王五", year_month: "2024-02", total_sales: 2200.00 }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 3,
      category: "Basic"
    }
  }
];
