

<h1 align="center">
  <a href="https://chat-sql-hazel.vercel.app/" target="_blank">
    <img src="./chat-sql/public/assets/navLogo.png" width="300" alt="ChatSQL">
  </a>
</h1>



English | [简体中文](./README.md)

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

C𝐡𝐚𝐭𝐒𝐐𝐋 is an interactive database system learning platform that helps users master SQL queries, ER diagram design, and B+ tree operations from beginner to advanced levels through intelligent agent design and workflow orchestration, combined with secondary development and deep adaptation of frontend components like xyflow.

## Core Module Introduction

C𝐡𝐚𝐭𝐒𝐐𝐋 consists of the following core modules:

- **SQL Programming Practice Module**: Provides users with SQL query practice, offering exercises from both Dify-generated and preset course sources
- **ER Diagram Design Module**: Provides ER diagram modeling tools, ER diagram modeling problem generation, and intelligent agent evaluation feedback
- **B+ Tree Operation Module**: Implements B+ tree operation visualization
- **ChatBot Module**: General Q&A based on professional knowledge base, assisting in database system course learning

### SQL Programming Practice Module

#### Feature Design

<img src="./chat-sql/public/assets/design-SQL.png">

- 🤖 **AI-Generated Exercises**: Provides two sources of practice problems

  - Through preset tutorials, progressively practice `select`, `join`, aggregation operations, and nested subqueries.
  - Interact with Dify workflow to automatically generate SQL exercises by inputting difficulty, tags, and descriptions.
- 📊 **Database Structure Visualization**: Intuitively displays table relationships and field information, with foreign key constraints clearly visible
- ⌨️ **Monaco Editor with Schema Integration**:

  - Supports SQL syntax highlighting and hover syntax tips
  - Provides `tab` auto-completion based on current schema information
- 📝 **Instant Result Validation**: Real-time verification of query results

  - Supports comparing query results with expected results to evaluate query correctness

#### Runtime Results

<img src="./chat-sql/public/assets/ret-SQL.png">

### ER Diagram Design Module

#### Feature Design

<img src="./chat-sql/public/assets/design-ER.png">

#### Runtime Results

<img src="./chat-sql/public/assets/ret-ER.png">

### B+ Tree Operation Module

#### Feature Design

<img src="./chat-sql/public/assets/design-B+.png">

#### Runtime Results

<img src="./chat-sql/public/assets/ret-B+.png">

### ChatBot Module

#### Feature Design

<img src="./chat-sql/public/assets/design-chat.png">

#### Runtime Results

<img src="./chat-sql/public/assets/ret-chat.png">

## Future Plans

### Socratic Dialogue Agent

<img src="./chat-sql/public/assets/future-chat.png">

## 🛠 Tech Stack

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

- **Framework**: [Next.js](https://nextjs.org/)
- **UI Components**:
  - [Ant Design](https://ant.design/)
  - [Material-UI](https://mui.com/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Flow Diagram**:
  - [XY Flow](https://reactflow.dev/) (@xyflow/react)
- **AI Integration**: [Dify.ai](https://dify.ai/) && [Alibaba Cloud Bailian](https://bailian.console.aliyun.com/?utm_content=se_1021228063&gclid=CjwKCAjw49vEBhAVEiwADnMbbN8YRdE4pNrz9txN0_KcUqiOuUc9aPSgyMDqlti1KVOPf5-o-yL1jBoC3usQAvD_BwE#/home)
- **Type Checking**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Quick Start

> **TODO**: Provide intelligent agent/workflow design files for Bailian platform or migrate to Dify

### Prerequisites

- Node.js 18.0 or higher
- npm package manager
- Dify.ai account and API key

### Installation Steps

1. Clone the repository

```bash
git clone https://github.com/ffy6511/chatSQL.git
cd chatSQL/chat-sql
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
touch .env
```

Edit the `.env` file and add your Dify API key:

```
NEXT_PUBLIC_DIFY_API_KEY=your_api_key_here
```

4. Start the development server

```bash
npm run dev
```

5. Update the git log: If you wish to update your own "changelog" interface, please execute

```bash
npm run generate-git
```

### Dify Workflow Configuration

1. Create a new application (select workflow) on [Dify platform](https://dify.ai)
2. Import workflow configuration:
   - Download the `public/chatSQL.yml` file from the project
   - Import this configuration file in the Dify platform
   - <img src="./chat-sql/public/assets/dify.png" alt="Import Workflow" width="80%" />
3. Get API key and configure in personal settings (workflow uses Gemini by default, can be modified as needed)

## 🤝 Contributing

Pull requests and issues are welcome!

## 📄 License

[MIT License](./LICENSE)
