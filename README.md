<h1 align="center">
  <a href="https://chat-sql-hazel.vercel.app/" target="_blank">
    <img src="./chat-sql/public/assets/navLogo.png" width="300" alt="ChatSQL">
  </a>
</h1>

[English](./README_EN.md) | 简体中文

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3.0-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18.2.0-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <a href="https://deepwiki.com/ffy6511/chatSQL"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</p>
<p align="center" style="font-size: 1.2em; margin: 20px 0;">
  <a href="https://chat-sql-hazel.vercel.app/" target="_blank" style="font-size: 1.2em; font-weight: bold;">Website</a>
</p>
<img src="./chat-sql/public/assets/demo.png">

C𝐡𝐚𝐭𝐒𝐐𝐋 是一个交互式的数据库系统学习平台，通过智能体设计与工作流编排，协同前端xyflow等组件库的二次开发与深度适配，帮助用户从入门到精通 SQL 查询、ER图结构设计与B+树操作理解.

## 项目核心模块介绍

C𝐡𝐚𝐭𝐒𝐐𝐋 由以下核心模块组成：

- **SQL编程实践模块**：供用户练习SQL查询，提供dify生成与预制课程两方面来源的练习
- **ER图设计模块**：提供ER图建模工具、ER图建模问题生成与智能体测评反馈
- **B+树操作模块**：实现B+树操作可视化
- **ChatBot模块**：基于专业知识库的通用问答，辅助数据库系统课程的学习

### SQL编程实践模块

#### 功能设计

<img src="./chat-sql/public/assets/design-SQL.png">

- 🤖 **智能体生成练习**：提供两种方式的习题来源

  - 通过预设的教程, 循序渐进地练习 `select`, `join`, 聚合操作与嵌套子查询等知识点.
  - 与dify工作流交互, 输入难度,标签与描述自动生成 SQL 练习题.
- 📊 **数据库结构可视化**：直观展示表关系和字段信息, 外检约束等信息一目了然;
- ⌨️ **Monaco编辑器与schema的补全整合**：

  - 支持sql语法高亮和悬浮的语法提示
  - 针对当前schema信息提供 `tab`的自动补全
- 📝 **即时结果验证**：实时验证查询结果

  - 支持将查询结果与期望结果进行比较, 评价查询结果是否正确.

#### 运行效果

<img src="./chat-sql/public/assets/ret-SQL.png">

### ER图设计模块

#### 功能设计

<img src="./chat-sql/public/assets/design-ER.png">

#### 运行效果

<img src="./chat-sql/public/assets/ret-ER.png">

### B+树操作模块

#### 功能设计

<img src="./chat-sql/public/assets/design-B+.png">

#### 运行效果

<img src="./chat-sql/public/assets/ret-B+.png">

### ChatBot模块

#### 功能设计

<img src="./chat-sql/public/assets/design-chat.png">

#### 运行效果

<img src="./chat-sql/public/assets/ret-chat.png">

## 未来计划

### 苏格拉底式对话智能体

<img src="./chat-sql/public/assets/future-chat.png">

## 🛠 技术栈

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Ant%20Design-0170FE?style=for-the-badge&logo=antdesign&logoColor=white" alt="Ant Design" />
  <img src="https://img.shields.io/badge/Material--UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" alt="Material-UI" />
  <img src="https://img.shields.io/badge/Monaco%20Editor-DD1100?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/XY%20Flow-22C55E?style=for-the-badge&logo=diagram&logoColor=white" alt="XY Flow" />
</p>
<img src="./chat-sql/public/assets/framework.png">

- **框架**: [Next.js](https://nextjs.org/)
- **UI 组件**:
  - [Ant Design](https://ant.design/)
  - [Material-UI](https://mui.com/)
- **编辑器**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **流程图**:
  - [XY Flow](https://reactflow.dev/) (@xyflow/react)
- **AI 集成**: [Dify.ai](https://dify.ai/) && [阿里云百炼](https://bailian.console.aliyun.com/?utm_content=se_1021228063&gclid=CjwKCAjw49vEBhAVEiwADnMbbN8YRdE4pNrz9txN0_KcUqiOuUc9aPSgyMDqlti1KVOPf5-o-yL1jBoC3usQAvD_BwE#/home)
- **类型检查**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 快速开始

> **TODO**：提供百炼平台端的智能体/工作流设计文件 or 迁移到dify

### 前置要求

- Node.js 18.0 或更高版本
- npm 包管理器
- Dify.ai 账号和 API 密钥

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/ffy6511/chatSQL.git
cd chatSQL/chat-sql
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
touch .env
```

编辑 `.env` 文件并添加你的 Dify API 密钥：

```
NEXT_PUBLIC_DIFY_API_KEY=your_api_key_here
```

4. 启动开发服务器

```bash
npm run dev
```

5. 更新git日志: 如果您希望更新自己的"更新日志"界面, 请执行

```bash
npm run generate-git
```

### Dify 工作流配置

1. 在 [Dify 平台](https://dify.ai) 创建新应用（选择工作流）
2. 导入工作流配置：
   - 从项目中下载 `public/chatSQL.yml` 文件
   - 在 Dify 平台中导入该配置文件
   - <img src="./chat-sql/public/assets/dify.png" alt="导入工作流" width="80%" />
3. 获取 API 密钥并在个人设置中配置（工作流默认使用 Gemini，可根据需要修改）

## 🤝 贡献

欢迎提交 Pull Request 和 Issue！

## 📄 许可证

[MIT License](./LICENSE)
