// 教程Quiz数据定义
import { Quiz } from "@/types/ERDiagramTypes/quiz";
import { ERDiagramData } from "@/types/ERDiagramTypes/erDiagram";

// 教程Quiz的固定ID前缀，用于识别教程数据
export const TUTORIAL_QUIZ_ID_PREFIX = "tutorial-quiz-";

// 我们在创建quiz的时候增加 tutorialID的可选属性, 然后在补充教程的函数中将下面的id赋值给tutorialID
// 最后, 我们在context中的add方法中检查是否存在 tutorialID, 如果存在,就将其赋值给id (因为智能体不给出id); 否则使用UUID

// 初级教程：学生选课系统
const beginnerQuiz: Omit<Quiz, "createdAt" | "updatedAt"> = {
  id: `${TUTORIAL_QUIZ_ID_PREFIX}beginner`,
  name: "初级教程：学生选课系统",
  description:
    "设计一个简单的学生选课系统的ER图。系统需要管理学生信息和课程信息，学生可以选修多门课程，每门课程也可以被多个学生选修。\n\n要求包含的实体：\n1. 学生(Student)：学号、姓名、年龄\n2. 课程(Course)：课程号、课程名、学分\n\n要求包含的关系：\n1. 选修关系：学生选修课程，记录成绩",
  referenceAnswer: {
    entities: [
      {
        id: "student-entity",
        name: "学生",
        attributes: [
          {
            id: "attr-student-id",
            name: "学号",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-student-name", name: "姓名", dataType: "VARCHAR(50)" },
          { id: "attr-student-age", name: "年龄", dataType: "INT" },
        ],
        position: { x: 100, y: 100 },
      },
      {
        id: "course-entity",
        name: "课程",
        attributes: [
          {
            id: "attr-course-id",
            name: "课程号",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-course-name", name: "课程名", dataType: "VARCHAR(100)" },
          { id: "attr-course-credits", name: "学分", dataType: "INT" },
        ],
        position: { x: 400, y: 100 },
      },
    ],
    relationships: [
      {
        id: "enrollment-relationship",
        name: "选修",
        connections: [
          { entityId: "student-entity", cardinality: "0..*" },
          { entityId: "course-entity", cardinality: "0..*" },
        ],
        attributes: [
          { id: "attr-grade", name: "成绩", dataType: "DECIMAL(5,2)" },
        ],
        position: { x: 250, y: 100 },
      },
    ],
  } as ERDiagramData,
};

// 中级教程：图书管理系统
const intermediateQuiz: Omit<Quiz, "createdAt" | "updatedAt"> = {
  id: `${TUTORIAL_QUIZ_ID_PREFIX}intermediate`,
  name: "中级教程：图书管理系统",
  description:
    "设计一个图书管理系统的ER图。系统需要管理图书、作者、读者和借阅信息。\n\n要求包含的实体：\n1. 图书(Book)：ISBN、书名、出版年份、价格\n2. 作者(Author)：作者ID、姓名、国籍\n3. 读者(Reader)：读者证号、姓名、电话\n\n要求包含的关系：\n1. 著作关系：作者写作图书（一对多）\n2. 借阅关系：读者借阅图书，记录借阅日期和归还日期",
  referenceAnswer: {
    entities: [
      {
        id: "book-entity",
        name: "图书",
        attributes: [
          {
            id: "attr-book-isbn",
            name: "ISBN",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-book-title", name: "书名", dataType: "VARCHAR(200)" },
          { id: "attr-book-year", name: "出版年份", dataType: "INT" },
          { id: "attr-book-price", name: "价格", dataType: "DECIMAL(8,2)" },
        ],
        position: { x: 250, y: 100 },
      },
      {
        id: "author-entity",
        name: "作者",
        attributes: [
          {
            id: "attr-author-id",
            name: "作者ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-author-name", name: "姓名", dataType: "VARCHAR(50)" },
          { id: "attr-author-country", name: "国籍", dataType: "VARCHAR(50)" },
        ],
        position: { x: 100, y: 250 },
      },
      {
        id: "reader-entity",
        name: "读者",
        attributes: [
          {
            id: "attr-reader-id",
            name: "读者证号",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-reader-name", name: "姓名", dataType: "VARCHAR(50)" },
          { id: "attr-reader-phone", name: "电话", dataType: "VARCHAR(20)" },
        ],
        position: { x: 400, y: 250 },
      },
    ],
    relationships: [
      {
        id: "authorship-relationship",
        name: "著作",
        connections: [
          { entityId: "author-entity", cardinality: "1..1" },
          { entityId: "book-entity", cardinality: "0..*" },
        ],
        attributes: [],
        position: { x: 175, y: 175 },
      },
      {
        id: "borrowing-relationship",
        name: "借阅",
        connections: [
          { entityId: "reader-entity", cardinality: "0..*" },
          { entityId: "book-entity", cardinality: "0..*" },
        ],
        attributes: [
          { id: "attr-borrow-date", name: "借阅日期", dataType: "DATE" },
          { id: "attr-return-date", name: "归还日期", dataType: "DATE" },
        ],
        position: { x: 325, y: 175 },
      },
    ],
  } as ERDiagramData,
};

// 高级教程：电商订单系统
const advancedQuiz: Omit<Quiz, "createdAt" | "updatedAt"> = {
  id: `${TUTORIAL_QUIZ_ID_PREFIX}advanced`,
  name: "高级教程：电商订单系统",
  description:
    "设计一个复杂的电商订单系统ER图。系统包含用户、商品、订单、商家等多个实体和复杂关系。\n\n要求包含的实体：\n1. 用户(User)：用户ID、用户名、邮箱、注册时间\n2. 商品(Product)：商品ID、商品名、价格、库存\n3. 订单(Order)：订单ID、订单时间、总金额、状态\n4. 商家(Merchant)：商家ID、商家名、联系方式\n5. 地址(Address)：地址ID、省份、城市、详细地址\n\n要求包含的关系：\n1. 用户拥有地址（一对多）\n2. 商家销售商品（一对多）\n3. 用户下订单（一对多）\n4. 订单包含商品（多对多，记录数量和单价）\n5. 订单配送到地址（多对一）",
  referenceAnswer: {
    entities: [
      {
        id: "user-entity",
        name: "用户",
        attributes: [
          {
            id: "attr-user-id",
            name: "用户ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-user-name", name: "用户名", dataType: "VARCHAR(50)" },
          { id: "attr-user-email", name: "邮箱", dataType: "VARCHAR(100)" },
          { id: "attr-user-regtime", name: "注册时间", dataType: "DATETIME" },
        ],
        position: { x: 100, y: 100 },
      },
      {
        id: "product-entity",
        name: "商品",
        attributes: [
          {
            id: "attr-product-id",
            name: "商品ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-product-name", name: "商品名", dataType: "VARCHAR(200)" },
          { id: "attr-product-price", name: "价格", dataType: "DECIMAL(10,2)" },
          { id: "attr-product-stock", name: "库存", dataType: "INT" },
        ],
        position: { x: 500, y: 100 },
      },
      {
        id: "order-entity",
        name: "订单",
        attributes: [
          {
            id: "attr-order-id",
            name: "订单ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          { id: "attr-order-time", name: "订单时间", dataType: "DATETIME" },
          {
            id: "attr-order-amount",
            name: "总金额",
            dataType: "DECIMAL(12,2)",
          },
          { id: "attr-order-status", name: "状态", dataType: "VARCHAR(20)" },
        ],
        position: { x: 300, y: 250 },
      },
      {
        id: "merchant-entity",
        name: "商家",
        attributes: [
          {
            id: "attr-merchant-id",
            name: "商家ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          {
            id: "attr-merchant-name",
            name: "商家名",
            dataType: "VARCHAR(100)",
          },
          {
            id: "attr-merchant-contact",
            name: "联系方式",
            dataType: "VARCHAR(100)",
          },
        ],
        position: { x: 500, y: 300 },
      },
      {
        id: "address-entity",
        name: "地址",
        attributes: [
          {
            id: "attr-address-id",
            name: "地址ID",
            isPrimaryKey: true,
            dataType: "VARCHAR(20)",
          },
          {
            id: "attr-address-province",
            name: "省份",
            dataType: "VARCHAR(50)",
          },
          { id: "attr-address-city", name: "城市", dataType: "VARCHAR(50)" },
          {
            id: "attr-address-detail",
            name: "详细地址",
            dataType: "VARCHAR(200)",
          },
        ],
        position: { x: 100, y: 300 },
      },
    ],
    relationships: [
      {
        id: "user-address-relationship",
        name: "拥有",
        connections: [
          { entityId: "user-entity", cardinality: "1..1" },
          { entityId: "address-entity", cardinality: "0..*" },
        ],
        attributes: [],
        position: { x: 100, y: 200 },
      },
      {
        id: "merchant-product-relationship",
        name: "销售",
        connections: [
          { entityId: "merchant-entity", cardinality: "1..1" },
          { entityId: "product-entity", cardinality: "0..*" },
        ],
        attributes: [],
        position: { x: 500, y: 200 },
      },
      {
        id: "user-order-relationship",
        name: "下单",
        connections: [
          { entityId: "user-entity", cardinality: "1..1" },
          { entityId: "order-entity", cardinality: "0..*" },
        ],
        attributes: [],
        position: { x: 200, y: 175 },
      },
      {
        id: "order-product-relationship",
        name: "包含",
        connections: [
          { entityId: "order-entity", cardinality: "0..*" },
          { entityId: "product-entity", cardinality: "0..*" },
        ],
        attributes: [
          { id: "attr-quantity", name: "数量", dataType: "INT" },
          { id: "attr-unit-price", name: "单价", dataType: "DECIMAL(10,2)" },
        ],
        position: { x: 400, y: 175 },
      },
      {
        id: "order-address-relationship",
        name: "配送到",
        connections: [
          { entityId: "order-entity", cardinality: "0..*" },
          { entityId: "address-entity", cardinality: "1..1" },
        ],
        attributes: [],
        position: { x: 200, y: 275 },
      },
    ],
  } as ERDiagramData,
};

// 导出所有教程Quiz数据
export const tutorialQuizzes: Array<Omit<Quiz, "createdAt" | "updatedAt">> = [
  beginnerQuiz,
  intermediateQuiz,
  advancedQuiz,
];

// 检查是否为教程Quiz的工具函数
export const isTutorialQuiz = (quizId: string): boolean => {
  return quizId.startsWith(TUTORIAL_QUIZ_ID_PREFIX);
};

// 获取所有教程Quiz ID的工具函数
export const getTutorialQuizIds = (): string[] => {
  return tutorialQuizzes.map((quiz) => quiz.id);
};
