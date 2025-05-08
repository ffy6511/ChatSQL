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
  },



  // 聚合函数测试教程
  {
    title: "简单聚合测试",
    description: "一个销售记录表，测试基本的聚合函数",
    problem: [
      "计算每个部门的销售总额"
    ],
    hint: "使用GROUP BY和SUM函数",
    tags: ["aggregate", "group by"],
    tableStructure: [
      {
        tableName: "Sales",
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "department", type: "VARCHAR(50)" },
          { name: "amount", type: "DECIMAL(10,2)" }
        ],
        foreignKeys: []
      }
    ],
    tuples: [
      {
        tableName: "Sales",
        tupleData: [
          { id: 1, department: "电子", amount: 1000.00 },
          { id: 2, department: "服装", amount: 500.00 },
          { id: 3, department: "电子", amount: 1500.00 },
          { id: 4, department: "服装", amount: 800.00 }
        ]
      }
    ],
    expected_result: [
      {
        tableName: "Result",
        tupleData: [
          { department: "电子", total_amount: 2500.00 },
          { department: "服装", total_amount: 1300.00 }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 5,
      category: "Test"
    }
  },

  // JOIN操作进阶
  {
    title: "JOIN操作进阶",
    description: "在一个电商系统中，存在客户表(Customers)、订单表(Orders)和产品表(Products)。通过JOIN操作可以关联这些表，获取完整的业务信息。",
    problem: [
      "1. 查询所有客户及其订单数量，包括没有订单的客户（使用LEFT JOIN和COUNT）",
      "2. 查询订单金额超过1000元的订单信息，显示客户姓名、产品名称和订单金额",
      "3. 查询每个客户购买的所有产品信息，显示客户姓名、产品名称和购买日期，按客户姓名和购买日期排序"
    ],
    hint: "本教程主要介绍JOIN操作的不同类型和用法。参考SQL：\n1. SELECT c.customer_name, COUNT(o.order_id) AS order_count FROM Customers c LEFT JOIN Orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.customer_name;\n2. SELECT c.customer_name, p.product_name, o.amount FROM Orders o JOIN Customers c ON o.customer_id = c.customer_id JOIN Products p ON o.product_id = p.product_id WHERE o.amount > 1000;\n3. SELECT c.customer_name, p.product_name, o.order_date FROM Customers c JOIN Orders o ON c.customer_id = o.customer_id JOIN Products p ON o.product_id = p.product_id ORDER BY c.customer_name, o.order_date;",
    tags: ["join", "left join", "inner join", "group by", "order by", "count"],
    tableStructure: [
      {
        tableName: "Customers",
        columns: [
          { name: "customer_id", type: "INT", isPrimary: true },
          { name: "customer_name", type: "VARCHAR(50)" },
          { name: "email", type: "VARCHAR(100)" },
          { name: "city", type: "VARCHAR(50)" }
        ],
        foreignKeys: []
      },
      {
        tableName: "Products",
        columns: [
          { name: "product_id", type: "INT", isPrimary: true },
          { name: "product_name", type: "VARCHAR(100)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "category", type: "VARCHAR(50)" }
        ],
        foreignKeys: []
      },
      {
        tableName: "Orders",
        columns: [
          { name: "order_id", type: "INT", isPrimary: true },
          { name: "customer_id", type: "INT" },
          { name: "product_id", type: "INT" },
          { name: "amount", type: "DECIMAL(10,2)" },
          { name: "order_date", type: "DATE" }
        ],
        foreignKeys: [
          {
            fromTable: "Orders",
            fromColumn: "customer_id",
            toTable: "Customers",
            toColumn: "customer_id"
          },
          {
            fromTable: "Orders",
            fromColumn: "product_id",
            toTable: "Products",
            toColumn: "product_id"
          }
        ]
      }
    ],
    tuples: [
      {
        tableName: "Customers",
        tupleData: [
          { customer_id: 1, customer_name: "张三", email: "zhang@example.com", city: "北京" },
          { customer_id: 2, customer_name: "李四", email: "li@example.com", city: "上海" },
          { customer_id: 3, customer_name: "王五", email: "wang@example.com", city: "广州" },
          { customer_id: 4, customer_name: "赵六", email: "zhao@example.com", city: "深圳" }
        ]
      },
      {
        tableName: "Products",
        tupleData: [
          { product_id: 1, product_name: "笔记本电脑", price: 6999.00, category: "电子产品" },
          { product_id: 2, product_name: "智能手机", price: 3999.00, category: "电子产品" },
          { product_id: 3, product_name: "耳机", price: 999.00, category: "配件" },
          { product_id: 4, product_name: "显示器", price: 1499.00, category: "电子产品" }
        ]
      },
      {
        tableName: "Orders",
        tupleData: [
          { order_id: 1, customer_id: 1, product_id: 1, amount: 6999.00, order_date: "2024-01-15" },
          { order_id: 2, customer_id: 1, product_id: 3, amount: 999.00, order_date: "2024-01-20" },
          { order_id: 3, customer_id: 2, product_id: 2, amount: 3999.00, order_date: "2024-02-05" },
          { order_id: 4, customer_id: 3, product_id: 1, amount: 6999.00, order_date: "2024-02-10" },
          { order_id: 5, customer_id: 3, product_id: 4, amount: 1499.00, order_date: "2024-02-15" }
        ]
      }
    ],
    expected_result: [
      {
        tableName: "Result1",
        tupleData: [
          { customer_name: "张三", order_count: 2 },
          { customer_name: "李四", order_count: 1 },
          { customer_name: "王五", order_count: 2 },
          { customer_name: "赵六", order_count: 0 }
        ]
      },
      {
        tableName: "Result2",
        tupleData: [
          { customer_name: "张三", product_name: "笔记本电脑", amount: 6999.00 },
          { customer_name: "李四", product_name: "智能手机", amount: 3999.00 },
          { customer_name: "王五", product_name: "笔记本电脑", amount: 6999.00 },
          { customer_name: "王五", product_name: "显示器", amount: 1499.00 }
        ]
      },
      {
        tableName: "Result3",
        tupleData: [
          { customer_name: "张三", product_name: "笔记本电脑", order_date: "2024-01-15" },
          { customer_name: "张三", product_name: "耳机", order_date: "2024-01-20" },
          { customer_name: "李四", product_name: "智能手机", order_date: "2024-02-05" },
          { customer_name: "王五", product_name: "笔记本电脑", order_date: "2024-02-10" },
          { customer_name: "王五", product_name: "显示器", order_date: "2024-02-15" }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 6,
      category: "Intermediate"
    }
  },

  // 添加嵌套子查询教程
  {
    title: "嵌套子查询操作",
    description: "在一个销售管理系统中，存在产品表(Products)和销售记录表(Sales)。通过嵌套子查询可以实现更复杂的数据分析。",
    problem: [
      "1. 查询所有销售记录，但只显示产品价格高于平均价格的产品的销售记录（使用子查询计算平均价格）",
      "2. 查询每个部门中销售额最高的销售员信息，包括销售员姓名、部门和销售总额（使用嵌套子查询和GROUP BY）"
    ],
    hint: "本教程主要介绍嵌套子查询的使用。参考SQL：\n1. SELECT s.* FROM Sales s JOIN Products p ON s.product_id = p.product_id WHERE p.price > (SELECT AVG(price) FROM Products);\n2. SELECT s1.salesperson_id, s1.name, s1.department, t.total_sales FROM Salespeople s1 JOIN (SELECT department, MAX(total) as max_sales FROM (SELECT s.salesperson_id, s.department, SUM(sa.amount) as total FROM Salespeople s JOIN Sales sa ON s.salesperson_id = sa.salesperson_id GROUP BY s.salesperson_id, s.department) as sales_totals GROUP BY department) t2 ON s1.department = t2.department JOIN (SELECT salesperson_id, SUM(amount) as total_sales FROM Sales GROUP BY salesperson_id) t ON s1.salesperson_id = t.salesperson_id AND t.total_sales = t2.max_sales;",
    tags: ["subquery", "nested query", "join", "group by", "aggregate"],
    tableStructure: [
      {
        tableName: "Products",
        columns: [
          { name: "product_id", type: "INT", isPrimary: true },
          { name: "product_name", type: "VARCHAR(100)" },
          { name: "price", type: "DECIMAL(10,2)" },
          { name: "category", type: "VARCHAR(50)" }
        ],
        foreignKeys: []
      },
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
          { name: "product_id", type: "INT" },
          { name: "amount", type: "DECIMAL(10,2)" },
          { name: "sale_date", type: "DATE" }
        ],
        foreignKeys: [
          {
            fromTable: "Sales",
            fromColumn: "product_id",
            toTable: "Products",
            toColumn: "product_id"
          },
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
        tableName: "Products",
        tupleData: [
          { product_id: 1, product_name: "笔记本电脑", price: 6999.00, category: "电子产品" },
          { product_id: 2, product_name: "智能手机", price: 3999.00, category: "电子产品" },
          { product_id: 3, product_name: "耳机", price: 999.00, category: "配件" },
          { product_id: 4, product_name: "显示器", price: 1499.00, category: "电子产品" },
          { product_id: 5, product_name: "键盘", price: 299.00, category: "配件" }
        ]
      },
      {
        tableName: "Salespeople",
        tupleData: [
          { salesperson_id: 1, name: "张三", department: "电子产品" },
          { salesperson_id: 2, name: "李四", department: "配件" },
          { salesperson_id: 3, name: "王五", department: "电子产品" },
          { salesperson_id: 4, name: "赵六", department: "配件" }
        ]
      },
      {
        tableName: "Sales",
        tupleData: [
          { sale_id: 1, salesperson_id: 1, product_id: 1, amount: 6999.00, sale_date: "2024-01-15" },
          { sale_id: 2, salesperson_id: 1, product_id: 2, amount: 3999.00, sale_date: "2024-01-20" },
          { sale_id: 3, salesperson_id: 2, product_id: 3, amount: 999.00, sale_date: "2024-02-05" },
          { sale_id: 4, salesperson_id: 2, product_id: 5, amount: 299.00, sale_date: "2024-02-10" },
          { sale_id: 5, salesperson_id: 3, product_id: 1, amount: 6999.00, sale_date: "2024-01-25" },
          { sale_id: 6, salesperson_id: 3, product_id: 4, amount: 1499.00, sale_date: "2024-02-15" },
          { sale_id: 7, salesperson_id: 4, product_id: 3, amount: 999.00, sale_date: "2024-01-10" },
          { sale_id: 8, salesperson_id: 4, product_id: 5, amount: 299.00, sale_date: "2024-01-30" }
        ]
      }
    ],
    expected_result: [
      {
        tableName: "Result1",
        tupleData: [
          { sale_id: 1, salesperson_id: 1, product_id: 1, amount: 6999.00, sale_date: "2024-01-15" },
          { sale_id: 2, salesperson_id: 1, product_id: 2, amount: 3999.00, sale_date: "2024-01-20" },
          { sale_id: 5, salesperson_id: 3, product_id: 1, amount: 6999.00, sale_date: "2024-01-25" }
        ]
      },
      {
        tableName: "Result2",
        tupleData: [
          { salesperson_id: 1, name: "张三", department: "电子产品", total_sales: 10998.00 },
          { salesperson_id: 2, name: "李四", department: "配件", total_sales: 1298.00 }
        ]
      }
    ],
    data: {
      isBuiltIn: true,
      order: 7,
      category: "Advanced"
    }
  }
];
