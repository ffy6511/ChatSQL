// ER图数据结构类型定义

// 实体属性接口
export interface ERAttribute {
  id: string;
  name: string;
  isPrimaryKey?: boolean;
  dataType?: string;
  isRequired?: boolean;
  description?: string;
}

// 实体接口
export interface EREntity {
  id: string;
  name: string;
  attributes: ERAttribute[];
  description?: string;
  position?: {
    x: number;
    y: number;
  };
}

// 关系连接接口
export interface ERConnection {
  entityId: string;
  // 使用 (min, max) 表示法，其中 '*' 代表 '多'
  cardinality: '0..1' | '1..1' | '0..*' | '1..*';
  role?: string;
}

// 关系接口
export interface ERRelationship {
  id: string;
  name: string;
  connections: ERConnection[];
  attributes?: ERAttribute[]; // 关系也可以有属性
  description?: string;
  position?: {
    x: number;
    y: number;
  };
}

// ER图完整数据结构
export interface ERDiagramData {
  entities: EREntity[];
  relationships: ERRelationship[];
  metadata?: {
    title?: string;
    description?: string;
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// 示例数据
export const sampleERData: ERDiagramData = {
  entities: [
    {
      id: "ent_student",
      name: "学生",
      description: "学生实体，包含学生的基本信息",
      attributes: [
        { 
          id: "attr_stud_id", 
          name: "学号", 
          isPrimaryKey: true, 
          dataType: "VARCHAR(20)",
          isRequired: true,
          description: "学生的唯一标识符"
        },
        { 
          id: "attr_stud_name", 
          name: "姓名", 
          dataType: "VARCHAR(50)",
          isRequired: true,
          description: "学生的真实姓名"
        },
        { 
          id: "attr_stud_age", 
          name: "年龄", 
          dataType: "INT",
          description: "学生的年龄"
        },
        { 
          id: "attr_stud_major", 
          name: "专业", 
          dataType: "VARCHAR(100)",
          description: "学生所学专业"
        }
      ]
    },
    {
      id: "ent_course",
      name: "课程",
      description: "课程实体，包含课程的基本信息",
      attributes: [
        { 
          id: "attr_course_id", 
          name: "课程号", 
          isPrimaryKey: true,
          dataType: "VARCHAR(20)",
          isRequired: true,
          description: "课程的唯一标识符"
        },
        { 
          id: "attr_course_name", 
          name: "课程名称", 
          dataType: "VARCHAR(100)",
          isRequired: true,
          description: "课程的名称"
        },
        { 
          id: "attr_course_credits", 
          name: "学分", 
          dataType: "INT",
          description: "课程的学分数"
        },
        { 
          id: "attr_course_hours", 
          name: "学时", 
          dataType: "INT",
          description: "课程的总学时"
        }
      ]
    },
    {
      id: "ent_teacher",
      name: "教师",
      description: "教师实体，包含教师的基本信息",
      attributes: [
        { 
          id: "attr_teacher_id", 
          name: "教师号", 
          isPrimaryKey: true,
          dataType: "VARCHAR(20)",
          isRequired: true,
          description: "教师的唯一标识符"
        },
        { 
          id: "attr_teacher_name", 
          name: "姓名", 
          dataType: "VARCHAR(50)",
          isRequired: true,
          description: "教师的真实姓名"
        },
        { 
          id: "attr_teacher_title", 
          name: "职称", 
          dataType: "VARCHAR(50)",
          description: "教师的职称"
        },
        { 
          id: "attr_teacher_dept", 
          name: "所属院系", 
          dataType: "VARCHAR(100)",
          description: "教师所属的院系"
        }
      ]
    }
  ],
  relationships: [
    {
      id: "rel_selects",
      name: "选修",
      description: "学生选修课程的关系",
      connections: [
        {
          entityId: "ent_student",
          cardinality: "0..*",
          role: "选修者"
        },
        {
          entityId: "ent_course",
          cardinality: "0..*",
          role: "被选修课程"
        }
      ],
      attributes: [
        {
          id: "attr_select_grade",
          name: "成绩",
          dataType: "DECIMAL(5,2)",
          description: "学生选修课程的成绩"
        },
        {
          id: "attr_select_semester",
          name: "学期",
          dataType: "VARCHAR(20)",
          description: "选修的学期"
        }
      ]
    },
    {
      id: "rel_teaches",
      name: "授课",
      description: "教师授课的关系",
      connections: [
        {
          entityId: "ent_teacher",
          cardinality: "0..1",
          role: "授课教师"
        },
        {
          entityId: "ent_course",
          cardinality: "1..*",
          role: "授课课程"
        }
      ],
      attributes: [
        {
          id: "attr_teach_semester",
          name: "授课学期",
          dataType: "VARCHAR(20)",
          description: "教师授课的学期"
        },
        {
          id: "attr_teach_classroom",
          name: "教室",
          dataType: "VARCHAR(50)",
          description: "授课教室"
        }
      ]
    }
  ],
  metadata: {
    title: "学生选课系统ER图",
    description: "展示学生、课程、教师之间关系的实体关系图",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// 员工部门示例数据，展示参与约束
export const employeeDepartmentERData: ERDiagramData = {
  entities: [
    {
      id: "ent_department",
      name: "部门",
      description: "公司的部门信息",
      attributes: [
        {
          id: "attr_dept_id",
          name: "部门编号",
          isPrimaryKey: true,
          dataType: "VARCHAR(10)",
          isRequired: true,
          description: "部门的唯一标识符"
        },
        {
          id: "attr_dept_name",
          name: "部门名称",
          dataType: "VARCHAR(50)",
          isRequired: true,
          description: "部门的名称"
        },
        {
          id: "attr_dept_location",
          name: "部门位置",
          dataType: "VARCHAR(100)",
          description: "部门所在位置"
        }
      ]
    },
    {
      id: "ent_employee",
      name: "员工",
      description: "公司的员工信息",
      attributes: [
        {
          id: "attr_emp_id",
          name: "员工编号",
          isPrimaryKey: true,
          dataType: "VARCHAR(10)",
          isRequired: true,
          description: "员工的唯一标识符"
        },
        {
          id: "attr_emp_name",
          name: "员工姓名",
          dataType: "VARCHAR(50)",
          isRequired: true,
          description: "员工的姓名"
        },
        {
          id: "attr_emp_salary",
          name: "薪资",
          dataType: "DECIMAL(10,2)",
          description: "员工的薪资"
        },
        {
          id: "attr_dept_id_fk",
          name: "部门编号",
          dataType: "VARCHAR(10)",
          isRequired: true,
          description: "员工所属部门"
        }
      ]
    },
    {
      id: "ent_project",
      name: "项目",
      description: "公司的项目信息",
      attributes: [
        {
          id: "attr_proj_id",
          name: "项目编号",
          isPrimaryKey: true,
          dataType: "VARCHAR(10)",
          isRequired: true,
          description: "项目的唯一标识符"
        },
        {
          id: "attr_proj_name",
          name: "项目名称",
          dataType: "VARCHAR(100)",
          isRequired: true,
          description: "项目的名称"
        },
        {
          id: "attr_proj_budget",
          name: "项目预算",
          dataType: "DECIMAL(12,2)",
          description: "项目的预算"
        }
      ]
    }
  ],
  relationships: [
    {
      id: "rel_belongs_to",
      name: "属于",
      description: "员工属于部门的关系",
      connections: [
        {
          entityId: "ent_employee",
          cardinality: "1..*",
          role: "部门员工"
        },
        {
          entityId: "ent_department",
          cardinality: "0..1",
          role: "所属部门"
        }
      ]
    },
    {
      id: "rel_works_on",
      name: "参与",
      description: "员工参与项目的关系",
      connections: [
        {
          entityId: "ent_employee",
          cardinality: "0..*",
          role: "项目成员"
        },
        {
          entityId: "ent_project",
          cardinality: "1..*",
          role: "参与项目"
        }
      ],
      attributes: [
        {
          id: "attr_hours",
          name: "工作小时",
          dataType: "DECIMAL(5,2)",
          description: "员工在项目上的工作小时数"
        },
        {
          id: "attr_start_date",
          name: "开始日期",
          dataType: "DATE",
          description: "员工开始参与项目的日期"
        }
      ]
    }
  ],
  metadata: {
    title: "员工部门项目ER图",
    description: "展示员工、部门、项目之间关系的实体关系图，包含完全参与和部分参与约束",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};
