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
  tableStructure: TutorialTableStructure[]; // 使用与 parseJSONToTables 输入相同的格式
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
  // 1. 基础SELECT教程
  {
    title: "SELECT基础操作",
    description: " 介绍SQL中SELECT语句的基本用法，包括列选择、条件过滤和排序。",
    problem: [
      "1. 查询所有学生的姓名和年龄",
      "2. 查询年龄大于20岁的学生的所有信息",
      "3. 查询所有学生的信息，按年龄降序排列",
    ],
    hint: " 主要介绍SELECT语句的基本用法，包括列选择、WHERE条件过滤和ORDER BY排序。",
    tags: ["select", "where", "order by"],
    tableStructure: [
      {
        tableName: "Students",
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR(50)" },
          { name: "age", type: "INT" },
          { name: "major", type: "VARCHAR(50)" },
          { name: "enrollment_date", type: "DATE" },
        ],
        foreignKeys: [],
      },
    ],
    tuples: [
      {
        tableName: "Students",
        tupleData: [
          {
            id: 1,
            name: "张三",
            age: 22,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 2,
            name: "李四",
            age: 20,
            major: "数学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 3,
            name: "王五",
            age: 23,
            major: "物理",
            enrollment_date: "2021-09-01",
          },
          {
            id: 4,
            name: "赵六",
            age: 19,
            major: "化学",
            enrollment_date: "2023-09-01",
          },
          {
            id: 5,
            name: "钱七",
            age: 21,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
        ],
      },
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Result1",
        tupleData: [
          { name: "张三", age: 22 },
          { name: "李四", age: 20 },
          { name: "王五", age: 23 },
          { name: "赵六", age: 19 },
          { name: "钱七", age: 21 },
        ],
      },
      {
        // 问题2的预期结果
        tableName: "Result2",
        tupleData: [
          {
            id: 1,
            name: "张三",
            age: 22,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 3,
            name: "王五",
            age: 23,
            major: "物理",
            enrollment_date: "2021-09-01",
          },
          {
            id: 5,
            name: "钱七",
            age: 21,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
        ],
      },
      {
        // 问题3的预期结果
        tableName: "Result3",
        tupleData: [
          {
            id: 3,
            name: "王五",
            age: 23,
            major: "物理",
            enrollment_date: "2021-09-01",
          },
          {
            id: 1,
            name: "张三",
            age: 22,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 5,
            name: "钱七",
            age: 21,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 2,
            name: "李四",
            age: 20,
            major: "数学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 4,
            name: "赵六",
            age: 19,
            major: "化学",
            enrollment_date: "2023-09-01",
          },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 1,
      category: "Basic",
    },
  },

  // 2. GROUP BY教程
  {
    title: "GROUP BY分组操作",
    description:
      " 介绍SQL中GROUP BY子句的用法，学习如何对数据进行分组和分组后的筛选。",
    problem: [
      "1. 统计每个专业的学生人数(查询专业和对应的人数, 后者用student_count重命名)",
      "2. 查询每个专业的平均年龄，并按平均年龄降序排列(专业+平均年龄, 后者用avg_age重命名)",
      "3. 查询学生人数大于1的专业及其平均年龄",
    ],
    hint: " 主要介绍GROUP BY子句的用法，结合聚合函数和HAVING子句进行分组统计和筛选。",
    tags: ["group by", "having", "aggregate", "order by"],
    tableStructure: [
      {
        tableName: "Students",
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR(50)" },
          { name: "age", type: "INT" },
          { name: "major", type: "VARCHAR(50)" },
          { name: "enrollment_date", type: "DATE" },
        ],
        foreignKeys: [],
      },
    ],
    tuples: [
      {
        tableName: "Students",
        tupleData: [
          {
            id: 1,
            name: "张三",
            age: 22,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 2,
            name: "李四",
            age: 20,
            major: "数学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 3,
            name: "王五",
            age: 23,
            major: "物理",
            enrollment_date: "2021-09-01",
          },
          {
            id: 4,
            name: "赵六",
            age: 19,
            major: "化学",
            enrollment_date: "2023-09-01",
          },
          {
            id: 5,
            name: "钱七",
            age: 21,
            major: "计算机科学",
            enrollment_date: "2022-09-01",
          },
          {
            id: 6,
            name: "孙八",
            age: 22,
            major: "数学",
            enrollment_date: "2021-09-01",
          },
        ],
      },
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Result1",
        tupleData: [
          { major: "计算机科学", student_count: 2 },
          { major: "数学", student_count: 2 },
          { major: "物理", student_count: 1 },
          { major: "化学", student_count: 1 },
        ],
      },
      {
        // 问题2的预期结果
        tableName: "Result2",
        tupleData: [
          { major: "物理", avg_age: 23 },
          { major: "计算机科学", avg_age: 21.5 },
          { major: "数学", avg_age: 21 },
          { major: "化学", avg_age: 19 },
        ],
      },
      {
        // 问题3的预期结果
        tableName: "Result3",
        tupleData: [
          { major: "计算机科学", student_count: 2, avg_age: 21.5 },
          { major: "数学", student_count: 2, avg_age: 21 },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 2,
      category: "Medium​",
    },
  },

  // 3. 聚合函数教程
  {
    title: "聚合函数操作",
    description:
      " 介绍SQL中常用的聚合函数，如COUNT、SUM、AVG、MAX和MIN等，学习如何进行数据汇总和统计分析。",
    problem: [
      "1. 计算所有课程的平均分数、最高分数和最低分数",
      "2. 统计每个学生的总分数和平均分数",
      "3. 查找每个课程类型的平均分数，并只显示平均分数大于80分的课程类型",
    ],
    hint: " 主要介绍聚合函数的用法，包括COUNT、SUM、AVG、MAX、MIN等，结合GROUP BY和HAVING子句进行分组统计和筛选。",
    tags: [
      "aggregate",
      "count",
      "sum",
      "avg",
      "max",
      "min",
      "group by",
      "having",
    ],
    tableStructure: [
      {
        tableName: "Students",
        columns: [
          { name: "student_id", type: "INT", isPrimary: true },
          { name: "student_name", type: "VARCHAR(50)" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "Courses",
        columns: [
          { name: "course_id", type: "INT", isPrimary: true },
          { name: "course_name", type: "VARCHAR(50)" },
          { name: "course_type", type: "VARCHAR(20)" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "Scores",
        columns: [
          { name: "score_id", type: "INT", isPrimary: true },
          { name: "student_id", type: "INT" },
          { name: "course_id", type: "INT" },
          { name: "score", type: "DECIMAL(5,2)" },
        ],
        foreignKeys: [
          {
            fromTable: "Scores",
            fromColumn: "student_id",
            toTable: "Students",
            toColumn: "student_id",
          },
          {
            fromTable: "Scores",
            fromColumn: "course_id",
            toTable: "Courses",
            toColumn: "course_id",
          },
        ],
      },
    ],
    tuples: [
      {
        tableName: "Students",
        tupleData: [
          { student_id: 1, student_name: "张三" },
          { student_id: 2, student_name: "李四" },
          { student_id: 3, student_name: "王五" },
        ],
      },
      {
        tableName: "Courses",
        tupleData: [
          { course_id: 1, course_name: "数据库原理", course_type: "专业课" },
          { course_id: 2, course_name: "操作系统", course_type: "专业课" },
          { course_id: 3, course_name: "高等数学", course_type: "基础课" },
          { course_id: 4, course_name: "英语", course_type: "公共课" },
        ],
      },
      {
        tableName: "Scores",
        tupleData: [
          { score_id: 1, student_id: 1, course_id: 1, score: 85.5 },
          { score_id: 2, student_id: 1, course_id: 2, score: 78.0 },
          { score_id: 3, student_id: 1, course_id: 3, score: 90.5 },
          { score_id: 4, student_id: 1, course_id: 4, score: 85.0 },
          { score_id: 5, student_id: 2, course_id: 1, score: 92.0 },
          { score_id: 6, student_id: 2, course_id: 2, score: 83.5 },
          { score_id: 7, student_id: 2, course_id: 3, score: 75.0 },
          { score_id: 8, student_id: 2, course_id: 4, score: 88.5 },
          { score_id: 9, student_id: 3, course_id: 1, score: 76.0 },
          { score_id: 10, student_id: 3, course_id: 2, score: 85.0 },
          { score_id: 11, student_id: 3, course_id: 3, score: 82.5 },
          { score_id: 12, student_id: 3, course_id: 4, score: 79.0 },
        ],
      },
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Result1",
        tupleData: [{ avg_score: 83.375, max_score: 92.0, min_score: 75.0 }],
      },
      {
        // 问题2的预期结果
        tableName: "Result2",
        tupleData: [
          { student_name: "张三", total_score: 339.0, avg_score: 84.75 },
          { student_name: "李四", total_score: 339.0, avg_score: 84.75 },
          { student_name: "王五", total_score: 322.5, avg_score: 80.625 },
        ],
      },
      {
        // 问题3的预期结果
        tableName: "Result3",
        tupleData: [
          { course_type: "专业课", avg_score: 83.33 },
          { course_type: "公共课", avg_score: 84.17 },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 3,
      category: "Medium​",
    },
  },

  // 4. JOIN操作教程
  {
    title: "JOIN表连接操作",
    description:
      " 介绍SQL中的JOIN操作，学习如何连接多个表进行查询，包括INNER JOIN、LEFT JOIN等不同类型的连接。",
    problem: [
      "1. 查询所有学生的成绩信息，包括学生姓名、课程名称和分数",
      "2. 查询所有学生的信息及其选修的课程数量，包括没有选修课程的学生",
      "3. 查询每个课程的平均分数，显示课程名称、课程类型和平均分数，按平均分数降序排列",
    ],
    hint: " 主要介绍JOIN操作的用法，包括INNER JOIN和LEFT JOIN等不同类型的连接，结合聚合函数和GROUP BY子句进行多表查询和统计。",
    tags: ["join", "inner join", "left join", "group by", "aggregate"],
    tableStructure: [
      {
        tableName: "Students",
        columns: [
          { name: "student_id", type: "INT", isPrimary: true },
          { name: "student_name", type: "VARCHAR(50)" },
          { name: "gender", type: "VARCHAR(10)" },
          { name: "admission_year", type: "INT" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "Courses",
        columns: [
          { name: "course_id", type: "INT", isPrimary: true },
          { name: "course_name", type: "VARCHAR(50)" },
          { name: "course_type", type: "VARCHAR(20)" },
          { name: "credit", type: "INT" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "Enrollments",
        columns: [
          { name: "enrollment_id", type: "INT", isPrimary: true },
          { name: "student_id", type: "INT" },
          { name: "course_id", type: "INT" },
          { name: "score", type: "DECIMAL(5,2)" },
          { name: "semester", type: "VARCHAR(20)" },
        ],
        foreignKeys: [
          {
            fromTable: "Enrollments",
            fromColumn: "student_id",
            toTable: "Students",
            toColumn: "student_id",
          },
          {
            fromTable: "Enrollments",
            fromColumn: "course_id",
            toTable: "Courses",
            toColumn: "course_id",
          },
        ],
      },
    ],
    tuples: [
      {
        tableName: "Students",
        tupleData: [
          {
            student_id: 1,
            student_name: "张三",
            gender: "男",
            admission_year: 2021,
          },
          {
            student_id: 2,
            student_name: "李四",
            gender: "女",
            admission_year: 2022,
          },
          {
            student_id: 3,
            student_name: "王五",
            gender: "男",
            admission_year: 2021,
          },
          {
            student_id: 4,
            student_name: "赵六",
            gender: "女",
            admission_year: 2022,
          },
          {
            student_id: 5,
            student_name: "钱七",
            gender: "男",
            admission_year: 2023,
          },
        ],
      },
      {
        tableName: "Courses",
        tupleData: [
          {
            course_id: 1,
            course_name: "数据库原理",
            course_type: "专业课",
            credit: 4,
          },
          {
            course_id: 2,
            course_name: "操作系统",
            course_type: "专业课",
            credit: 4,
          },
          {
            course_id: 3,
            course_name: "高等数学",
            course_type: "基础课",
            credit: 5,
          },
          {
            course_id: 4,
            course_name: "英语",
            course_type: "公共课",
            credit: 3,
          },
          {
            course_id: 5,
            course_name: "计算机网络",
            course_type: "专业课",
            credit: 4,
          },
        ],
      },
      {
        tableName: "Enrollments",
        tupleData: [
          {
            enrollment_id: 1,
            student_id: 1,
            course_id: 1,
            score: 85.5,
            semester: "2023春季",
          },
          {
            enrollment_id: 2,
            student_id: 1,
            course_id: 2,
            score: 78.0,
            semester: "2023春季",
          },
          {
            enrollment_id: 3,
            student_id: 1,
            course_id: 3,
            score: 90.5,
            semester: "2022秋季",
          },
          {
            enrollment_id: 4,
            student_id: 2,
            course_id: 1,
            score: 92.0,
            semester: "2023春季",
          },
          {
            enrollment_id: 5,
            student_id: 2,
            course_id: 3,
            score: 75.0,
            semester: "2022秋季",
          },
          {
            enrollment_id: 6,
            student_id: 3,
            course_id: 2,
            score: 85.0,
            semester: "2023春季",
          },
          {
            enrollment_id: 7,
            student_id: 3,
            course_id: 4,
            score: 79.0,
            semester: "2022秋季",
          },
          {
            enrollment_id: 8,
            student_id: 4,
            course_id: 1,
            score: 88.0,
            semester: "2023春季",
          },
          {
            enrollment_id: 9,
            student_id: 4,
            course_id: 5,
            score: 94.5,
            semester: "2023春季",
          },
        ],
      },
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Result1",
        tupleData: [
          { student_name: "张三", course_name: "数据库原理", score: 85.5 },
          { student_name: "张三", course_name: "操作系统", score: 78.0 },
          { student_name: "张三", course_name: "高等数学", score: 90.5 },
          { student_name: "李四", course_name: "数据库原理", score: 92.0 },
          { student_name: "李四", course_name: "高等数学", score: 75.0 },
          { student_name: "王五", course_name: "操作系统", score: 85.0 },
          { student_name: "王五", course_name: "英语", score: 79.0 },
          { student_name: "赵六", course_name: "数据库原理", score: 88.0 },
          { student_name: "赵六", course_name: "计算机网络", score: 94.5 },
        ],
      },
      {
        // 问题2的预期结果
        tableName: "Result2",
        tupleData: [
          { student_name: "张三", course_count: 3 },
          { student_name: "李四", course_count: 2 },
          { student_name: "王五", course_count: 2 },
          { student_name: "赵六", course_count: 2 },
          { student_name: "钱七", course_count: 0 },
        ],
      },
      {
        // 问题3的预期结果
        tableName: "Result3",
        tupleData: [
          { course_name: "计算机网络", course_type: "专业课", avg_score: 94.5 },
          { course_name: "数据库原理", course_type: "专业课", avg_score: 88.5 },
          { course_name: "高等数学", course_type: "基础课", avg_score: 82.75 },
          { course_name: "操作系统", course_type: "专业课", avg_score: 81.5 },
          { course_name: "英语", course_type: "公共课", avg_score: 79.0 },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 4,
      category: "Medium​",
    },
  },

  // 5. 嵌套子查询教程
  {
    title: "嵌套子查询操作",
    description:
      " 介绍SQL中的嵌套子查询，学习如何在一个查询中嵌套另一个查询，实现更复杂的数据筛选和分析。",
    problem: [
      "1. 查询成绩高于平均分的所有学生记录，显示学生姓名、课程名称和分数",
      "2. 查询选修课程数量最多的学生信息",
      "3. 查询每个系中平均成绩最高的学生，显示系名、学生姓名和平均成绩",
    ],
    hint: " 主要介绍嵌套子查询的用法，包括在WHERE子句、FROM子句和SELECT子句中使用子查询，实现复杂的数据筛选和分析。",
    tags: ["subquery", "nested query", "where", "from", "select", "aggregate"],
    tableStructure: [
      {
        tableName: "Departments",
        columns: [
          { name: "department_id", type: "INT", isPrimary: true },
          { name: "department_name", type: "VARCHAR(50)" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "Students",
        columns: [
          { name: "student_id", type: "INT", isPrimary: true },
          { name: "student_name", type: "VARCHAR(50)" },
          { name: "department_id", type: "INT" },
        ],
        foreignKeys: [
          {
            fromTable: "Students",
            fromColumn: "department_id",
            toTable: "Departments",
            toColumn: "department_id",
          },
        ],
      },
      {
        tableName: "Courses",
        columns: [
          { name: "course_id", type: "INT", isPrimary: true },
          { name: "course_name", type: "VARCHAR(50)" },
          { name: "department_id", type: "INT" },
        ],
        foreignKeys: [
          {
            fromTable: "Courses",
            fromColumn: "department_id",
            toTable: "Departments",
            toColumn: "department_id",
          },
        ],
      },
      {
        tableName: "Enrollments",
        columns: [
          { name: "enrollment_id", type: "INT", isPrimary: true },
          { name: "student_id", type: "INT" },
          { name: "course_id", type: "INT" },
          { name: "score", type: "DECIMAL(5,2)" },
        ],
        foreignKeys: [
          {
            fromTable: "Enrollments",
            fromColumn: "student_id",
            toTable: "Students",
            toColumn: "student_id",
          },
          {
            fromTable: "Enrollments",
            fromColumn: "course_id",
            toTable: "Courses",
            toColumn: "course_id",
          },
        ],
      },
    ],
    tuples: [
      {
        tableName: "Departments",
        tupleData: [
          { department_id: 1, department_name: "计算机系" },
          { department_id: 2, department_name: "数学系" },
          { department_id: 3, department_name: "物理系" },
        ],
      },
      {
        tableName: "Students",
        tupleData: [
          { student_id: 1, student_name: "张三", department_id: 1 },
          { student_id: 2, student_name: "李四", department_id: 1 },
          { student_id: 3, student_name: "王五", department_id: 2 },
          { student_id: 4, student_name: "赵六", department_id: 2 },
          { student_id: 5, student_name: "钱七", department_id: 3 },
          { student_id: 6, student_name: "孙八", department_id: 3 },
        ],
      },
      {
        tableName: "Courses",
        tupleData: [
          { course_id: 1, course_name: "数据库", department_id: 1 },
          { course_id: 2, course_name: "算法", department_id: 1 },
          { course_id: 3, course_name: "高等数学", department_id: 2 },
          { course_id: 4, course_name: "线性代数", department_id: 2 },
          { course_id: 5, course_name: "量子力学", department_id: 3 },
          { course_id: 6, course_name: "热力学", department_id: 3 },
        ],
      },
      {
        tableName: "Enrollments",
        tupleData: [
          { enrollment_id: 1, student_id: 1, course_id: 1, score: 92.0 },
          { enrollment_id: 2, student_id: 1, course_id: 2, score: 85.0 },
          { enrollment_id: 3, student_id: 1, course_id: 3, score: 78.0 },
          { enrollment_id: 4, student_id: 2, course_id: 1, score: 88.0 },
          { enrollment_id: 5, student_id: 2, course_id: 2, score: 90.0 },
          { enrollment_id: 6, student_id: 3, course_id: 3, score: 95.0 },
          { enrollment_id: 7, student_id: 3, course_id: 4, score: 89.0 },
          { enrollment_id: 8, student_id: 4, course_id: 3, score: 82.0 },
          { enrollment_id: 9, student_id: 4, course_id: 4, score: 78.0 },
          { enrollment_id: 10, student_id: 5, course_id: 5, score: 94.0 },
          { enrollment_id: 11, student_id: 5, course_id: 6, score: 85.0 },
          { enrollment_id: 12, student_id: 6, course_id: 5, score: 80.0 },
        ],
      },
    ],
    expected_result: [
      {
        // 问题1的预期结果
        tableName: "Result1",
        tupleData: [
          { student_name: "张三", course_name: "数据库", score: 92.0 },
          { student_name: "李四", course_name: "算法", score: 90.0 },
          { student_name: "王五", course_name: "高等数学", score: 95.0 },
          { student_name: "王五", course_name: "线性代数", score: 89.0 },
          { student_name: "钱七", course_name: "量子力学", score: 94.0 },
        ],
      },
      {
        // 问题2的预期结果
        tableName: "Result2",
        tupleData: [
          {
            student_id: 1,
            student_name: "张三",
            department_id: 1,
            course_count: 3,
          },
        ],
      },
      {
        // 问题3的预期结果
        tableName: "Result3",
        tupleData: [
          {
            department_name: "计算机系",
            student_name: "李四",
            avg_score: 89.0,
          },
          { department_name: "数学系", student_name: "王五", avg_score: 86.5 },
          { department_name: "物理系", student_name: "钱七", avg_score: 87.0 },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 5,
      category: "Advanced",
    },
  },

  // 添加大学数据库教程
  {
    title: "数据库查询",
    description:
      "这是Database System Concepts(Seventh Edition)的Schema diagram for the university database. 为zjuer的DB课程所准备, 部分字段根据教学PPT的定义更改, 与官网不完全一致.",
    problem: ["请在此处发挥您的想象力~"],
    hint: "这是一个标准的大学数据库模式，包含多个相互关联的表，可以用于练习从基础到高级的SQL查询。",
    tags: ["select", "where", "join"],
    tableStructure: [
      {
        tableName: "classroom",
        columns: [
          { name: "building", type: "VARCHAR(15)", isPrimary: true },
          { name: "room_number", type: "VARCHAR(7)", isPrimary: true },
          { name: "capacity", type: "NUMERIC(4,0)" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "department",
        columns: [
          { name: "dept_name", type: "VARCHAR(20)", isPrimary: true },
          { name: "building", type: "VARCHAR(15)" },
          { name: "budget", type: "NUMERIC(12,2)" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "course",
        columns: [
          { name: "course_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "title", type: "VARCHAR(50)" },
          { name: "dept_name", type: "VARCHAR(20)" },
          { name: "credits", type: "NUMERIC(2,0)" },
        ],
        foreignKeys: [
          {
            fromTable: "course",
            fromColumn: "dept_name",
            toTable: "department",
            toColumn: "dept_name",
          },
        ],
      },
      {
        tableName: "instructor",
        columns: [
          { name: "ID", type: "VARCHAR(5)", isPrimary: true },
          { name: "name", type: "VARCHAR(20)" },
          { name: "dept_name", type: "VARCHAR(20)" },
          { name: "salary", type: "NUMERIC(8,2)" },
        ],
        foreignKeys: [
          {
            fromTable: "instructor",
            fromColumn: "dept_name",
            toTable: "department",
            toColumn: "dept_name",
          },
        ],
      },
      {
        tableName: "section",
        columns: [
          { name: "course_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "sec_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "semester", type: "VARCHAR(6)", isPrimary: true },
          { name: "year", type: "NUMERIC(4,0)", isPrimary: true },
          { name: "building", type: "VARCHAR(15)" },
          { name: "room_number", type: "VARCHAR(7)" },
          { name: "time_slot_id", type: "VARCHAR(4)" },
        ],
        foreignKeys: [
          {
            fromTable: "section",
            fromColumn: "course_id",
            toTable: "course",
            toColumn: "course_id",
          },
          {
            fromTable: "section",
            fromColumn: "building",
            toTable: "classroom",
            toColumn: "building",
          },
          {
            fromTable: "section",
            fromColumn: "room_number",
            toTable: "classroom",
            toColumn: "room_number",
          },
          {
            fromTable: "section",
            fromColumn: "time_slot_id",
            toTable: "time_slot",
            toColumn: "time_slot_id",
          },
        ],
      },
      {
        tableName: "teaches",
        columns: [
          { name: "ID", type: "VARCHAR(5)", isPrimary: true },
          { name: "course_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "sec_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "semester", type: "VARCHAR(6)", isPrimary: true },
          { name: "year", type: "NUMERIC(4,0)", isPrimary: true },
        ],
        foreignKeys: [
          {
            fromTable: "teaches",
            fromColumn: "ID",
            toTable: "instructor",
            toColumn: "ID",
          },
          {
            fromTable: "teaches",
            fromColumn: "course_id",
            toTable: "section",
            toColumn: "course_id",
          },
          {
            fromTable: "teaches",
            fromColumn: "sec_id",
            toTable: "section",
            toColumn: "sec_id",
          },
          {
            fromTable: "teaches",
            fromColumn: "semester",
            toTable: "section",
            toColumn: "semester",
          },
          {
            fromTable: "teaches",
            fromColumn: "year",
            toTable: "section",
            toColumn: "year",
          },
        ],
      },
      {
        tableName: "student",
        columns: [
          { name: "ID", type: "VARCHAR(5)", isPrimary: true },
          { name: "name", type: "VARCHAR(20)" },
          { name: "dept_name", type: "VARCHAR(20)" },
          { name: "tot_cred", type: "NUMERIC(3,0)" },
        ],
        foreignKeys: [
          {
            fromTable: "student",
            fromColumn: "dept_name",
            toTable: "department",
            toColumn: "dept_name",
          },
        ],
      },
      {
        tableName: "takes",
        columns: [
          { name: "ID", type: "VARCHAR(5)", isPrimary: true },
          { name: "course_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "sec_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "semester", type: "VARCHAR(6)", isPrimary: true },
          { name: "year", type: "NUMERIC(4,0)", isPrimary: true },
          { name: "grade", type: "VARCHAR(2)" },
        ],
        foreignKeys: [
          {
            fromTable: "takes",
            fromColumn: "ID",
            toTable: "student",
            toColumn: "ID",
          },
          {
            fromTable: "takes",
            fromColumn: "course_id",
            toTable: "section",
            toColumn: "course_id",
          },
          {
            fromTable: "takes",
            fromColumn: "sec_id",
            toTable: "section",
            toColumn: "sec_id",
          },
          {
            fromTable: "takes",
            fromColumn: "semester",
            toTable: "section",
            toColumn: "semester",
          },
          {
            fromTable: "takes",
            fromColumn: "year",
            toTable: "section",
            toColumn: "year",
          },
        ],
      },
      {
        tableName: "advisor",
        columns: [
          { name: "s_ID", type: "VARCHAR(5)", isPrimary: true },
          { name: "i_ID", type: "VARCHAR(5)" },
        ],
        foreignKeys: [
          {
            fromTable: "advisor",
            fromColumn: "i_ID",
            toTable: "instructor",
            toColumn: "ID",
          },
          {
            fromTable: "advisor",
            fromColumn: "s_ID",
            toTable: "student",
            toColumn: "ID",
          },
        ],
      },
      {
        tableName: "time_slot",
        columns: [
          { name: "time_slot_id", type: "VARCHAR(4)", isPrimary: true },
          { name: "day", type: "VARCHAR(1)", isPrimary: true },
          { name: "start_time", type: "TIME", isPrimary: true },
          { name: "end_time", type: "TIME" },
        ],
        foreignKeys: [],
      },
      {
        tableName: "prereq",
        columns: [
          { name: "course_id", type: "VARCHAR(8)", isPrimary: true },
          { name: "prereq_id", type: "VARCHAR(8)", isPrimary: true },
        ],
        foreignKeys: [
          {
            fromTable: "prereq",
            fromColumn: "course_id",
            toTable: "course",
            toColumn: "course_id",
          },
          {
            fromTable: "prereq",
            fromColumn: "prereq_id",
            toTable: "course",
            toColumn: "course_id",
          },
        ],
      },
    ],
    tuples: [
      {
        tableName: "classroom",
        tupleData: [
          { building: "Packard", room_number: "101", capacity: 500 },
          { building: "Painter", room_number: "514", capacity: 10 },
          { building: "Taylor", room_number: "3128", capacity: 70 },
          { building: "Watson", room_number: "100", capacity: 30 },
          { building: "Watson", room_number: "120", capacity: 50 },
        ],
      },
      {
        tableName: "department",
        tupleData: [
          { dept_name: "Biology", building: "Watson", budget: 90000.0 },
          { dept_name: "Comp. Sci.", building: "Taylor", budget: 100000.0 },
          { dept_name: "Elec. Eng.", building: "Taylor", budget: 85000.0 },
          { dept_name: "Finance", building: "Painter", budget: 120000.0 },
          { dept_name: "Physics", building: "Watson", budget: 70000.0 },
        ],
      },
      {
        tableName: "course",
        tupleData: [
          {
            course_id: "BIO-101",
            title: "Intro. to Biology",
            dept_name: "Biology",
            credits: 4,
          },
          {
            course_id: "CS-101",
            title: "Intro. to Computer Science",
            dept_name: "Comp. Sci.",
            credits: 4,
          },
          {
            course_id: "CS-347",
            title: "Database System Concepts",
            dept_name: "Comp. Sci.",
            credits: 3,
          },
          {
            course_id: "EE-181",
            title: "Intro. to Digital Systems",
            dept_name: "Elec. Eng.",
            credits: 3,
          },
          {
            course_id: "PHY-101",
            title: "Physical Principles",
            dept_name: "Physics",
            credits: 4,
          },
        ],
      },
      {
        tableName: "instructor",
        tupleData: [
          {
            ID: "10101",
            name: "张三",
            dept_name: "Comp. Sci.",
            salary: 65000.0,
          },
          { ID: "12121", name: "李四", dept_name: "Finance", salary: 90000.0 },
          {
            ID: "15151",
            name: "王五",
            dept_name: "Comp. Sci.",
            salary: 75000.0,
          },
          { ID: "22222", name: "赵六", dept_name: "Physics", salary: 95000.0 },
          {
            ID: "32343",
            name: "钱七",
            dept_name: "Elec. Eng.",
            salary: 80000.0,
          },
        ],
      },
      {
        tableName: "section",
        tupleData: [
          {
            course_id: "BIO-101",
            sec_id: "1",
            semester: "Summer",
            year: 2017,
            building: "Painter",
            room_number: "514",
            time_slot_id: "B",
          },
          {
            course_id: "CS-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            building: "Packard",
            room_number: "101",
            time_slot_id: "H",
          },
          {
            course_id: "CS-347",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            building: "Taylor",
            room_number: "3128",
            time_slot_id: "A",
          },
          {
            course_id: "EE-181",
            sec_id: "1",
            semester: "Spring",
            year: 2017,
            building: "Taylor",
            room_number: "3128",
            time_slot_id: "C",
          },
          {
            course_id: "PHY-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            building: "Watson",
            room_number: "100",
            time_slot_id: "A",
          },
        ],
      },
      {
        tableName: "teaches",
        tupleData: [
          {
            ID: "10101",
            course_id: "CS-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
          },
          {
            ID: "10101",
            course_id: "CS-347",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
          },
          {
            ID: "12121",
            course_id: "FIN-201",
            sec_id: "1",
            semester: "Spring",
            year: 2018,
          },
          {
            ID: "15151",
            course_id: "CS-101",
            sec_id: "1",
            semester: "Spring",
            year: 2018,
          },
          {
            ID: "22222",
            course_id: "PHY-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
          },
        ],
      },
      {
        tableName: "student",
        tupleData: [
          {
            ID: "00128",
            name: "张小明",
            dept_name: "Comp. Sci.",
            tot_cred: 102,
          },
          {
            ID: "12345",
            name: "李小红",
            dept_name: "Comp. Sci.",
            tot_cred: 32,
          },
          { ID: "19991", name: "王小刚", dept_name: "Physics", tot_cred: 68 },
          { ID: "23121", name: "赵小丽", dept_name: "Finance", tot_cred: 80 },
          { ID: "44553", name: "钱小强", dept_name: "Biology", tot_cred: 46 },
        ],
      },
      {
        tableName: "takes",
        tupleData: [
          {
            ID: "00128",
            course_id: "CS-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            grade: "A",
          },
          {
            ID: "00128",
            course_id: "CS-347",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            grade: "A-",
          },
          {
            ID: "12345",
            course_id: "CS-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            grade: "C",
          },
          {
            ID: "19991",
            course_id: "PHY-101",
            sec_id: "1",
            semester: "Fall",
            year: 2017,
            grade: "B+",
          },
          {
            ID: "23121",
            course_id: "FIN-201",
            sec_id: "1",
            semester: "Spring",
            year: 2018,
            grade: "C+",
          },
        ],
      },
      {
        tableName: "advisor",
        tupleData: [
          { s_ID: "00128", i_ID: "10101" },
          { s_ID: "12345", i_ID: "10101" },
          { s_ID: "19991", i_ID: "22222" },
          { s_ID: "23121", i_ID: "12121" },
          { s_ID: "44553", i_ID: "10101" },
        ],
      },
      {
        tableName: "time_slot",
        tupleData: [
          {
            time_slot_id: "A",
            day: "M",
            start_time: "08:00:00",
            end_time: "08:50:00",
          },
          {
            time_slot_id: "A",
            day: "W",
            start_time: "08:00:00",
            end_time: "08:50:00",
          },
          {
            time_slot_id: "B",
            day: "M",
            start_time: "09:00:00",
            end_time: "09:50:00",
          },
          {
            time_slot_id: "C",
            day: "M",
            start_time: "11:00:00",
            end_time: "11:50:00",
          },
          {
            time_slot_id: "H",
            day: "F",
            start_time: "10:00:00",
            end_time: "10:50:00",
          },
        ],
      },
      {
        tableName: "prereq",
        tupleData: [
          { course_id: "BIO-301", prereq_id: "BIO-101" },
          { course_id: "CS-190", prereq_id: "CS-101" },
          { course_id: "CS-347", prereq_id: "CS-101" },
          { course_id: "EE-181", prereq_id: "PHY-101" },
        ],
      },
    ],
    expected_result: [
      {
        tableName: "Result",
        tupleData: [
          {
            ID: "10101",
            name: "张三",
            dept_name: "Comp. Sci.",
            salary: 65000.0,
          },
          {
            ID: "15151",
            name: "王五",
            dept_name: "Comp. Sci.",
            salary: 75000.0,
          },
        ],
      },
    ],
    data: {
      isBuiltIn: true,
      order: 0,
      category: "Textbook",
    },
  },
];
