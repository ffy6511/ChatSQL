# 𝐜𝐡𝐚𝐭𝐒𝐐𝐋

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


ChatSQL 是一个交互式 SQL 学习平台，通过人工智能技术生成个性化的 SQL 练习题，帮助用户从入门到精通 SQL 查询语言。平台结合了直观的数据库可视化工具、智能代码编辑器和即时反馈系统，为用户提供沉浸式学习体验。无论您是 SQL 初学者还是希望提升查询技能的开发者，ChatSQL 都能根据您的水平定制适合的学习内容，让 SQL 学习变得更加高效和有趣。

## ✨ 特性

- 🤖 AI 生成练习：提供两种方式的习题来源
  - 通过预设的教程, 循序渐进地练习`select`, `join`, 聚合操作与嵌套子查询等知识点.
  - 与dify工作流交互, 输入难度,标签与描述自动生成 SQL 练习题.

- 📊 数据库结构可视化：直观展示表关系和字段信息, 外检约束等信息一目了然;
- ⌨️ Monaco编辑器与schema的补全整合：
  - 支持sql语法高亮和悬浮的语法提示
  - 针对当前schema信息提供`tab`的自动补全

- 📝 即时结果验证：实时验证查询结果
  - 由构建于前端的sql引擎0延迟地处理sql查询结果.
  - 支持将查询结果与期望结果进行比较, 评价查询结果是否正确.




## 🖥 界面预览

### 初始化界面

![](https://my-blog-img-1358266118.cos.ap-guangzhou.myqcloud.com/undefined20250508164908220.png?imageSlim)

- 点击侧边栏中的“初始化教程”, 可以同预设的数据库表结构进行交互;
- 点击侧边栏中的“帮助”, 可以查看基本的操作演示.

### 数据库结构可视化

![](https://my-blog-img-1358266118.cos.ap-guangzhou.myqcloud.com/undefined20250508165221364.png?imageSlim)

- 默认显示数据库结构的可视化视图;
- 可在左下角切换元组视图.

### SQL 编辑器演示

<img src="./chat-sql/public/assets/edit.gif" alt="编辑器演示" width="80%" />

对应快捷键:

- `command+enter` : 执行查询
- `command+j`: 检测查询结果是否匹配;
- `command+k`: 搜索历史记录.

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

- **框架**: [Next.js](https://nextjs.org/) 15.3.0
- **UI 组件**:
  - [Ant Design](https://ant.design/) 5.24.6
  - [Material-UI](https://mui.com/) 7.0.2
- **编辑器**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **流程图**:
  - [XY Flow](https://reactflow.dev/) (@xyflow/react)
  - 用于数据库表关系可视化
  - 支持自定义节点和边的样式
  - 提供图表交互操作
  - 基于 D3.js 的缩放和拖拽功能
- **AI 集成**: [Dify.ai](https://dify.ai/)
- **类型检查**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 快速开始

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
