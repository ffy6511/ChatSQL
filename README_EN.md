# 𝐜𝐡𝐚𝐭𝐒𝐐𝐋

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
ChatSQL is an interactive SQL learning platform that leverages artificial intelligence to generate personalized SQL exercises, helping users master SQL query language from beginner to advanced levels. The platform combines intuitive database visualization tools, a smart code editor, and real-time feedback system to provide an immersive learning experience. Whether you're a SQL beginner or a developer looking to enhance your query skills, ChatSQL tailors learning content to your proficiency level, making SQL learning more efficient and engaging.

## ✨ Features

- 🤖 AI-Generated Exercises: Two sources of practice problems
  - Through preset tutorials, progressively practice `select`, `join`, aggregation operations, and nested subqueries.
  - Interact with Dify workflow to automatically generate SQL exercises by inputting difficulty, tags, and descriptions.

- 📊 Database Structure Visualization: Intuitively displays table relationships and field information, with foreign key constraints clearly visible.
- ⌨️ Monaco Editor with Schema Completion Integration:
  - Supports SQL syntax highlighting and hover syntax tips
  - Provides `tab` auto-completion based on current schema information

- 📝 Instant Result Validation: Real-time verification of query results
  - SQL engine built into the frontend processes query results with zero delay
  - Supports comparing query results with expected results to evaluate correctness

## 🖥 Interface Preview

### Initialization Interface
![](https://my-blog-img-1358266118.cos.ap-guangzhou.myqcloud.com/undefined20250508164908220.png?imageSlim)
- Click "Initialization Tutorial" in the sidebar to interact with the preset database structure
- Click "Help" in the sidebar to view basic operation demonstrations

### Database Structure Visualization
![](https://my-blog-img-1358266118.cos.ap-guangzhou.myqcloud.com/undefined20250508165221364.png?imageSlim)
- Database structure visualization view is displayed by default
- You can switch to tuple view in the bottom left corner

### SQL Editor Demo
<img src="./chat-sql/public/assets/edit.gif" alt="Editor Demo" width="80%" />

Corresponding shortcuts:
- `command+enter` : Execute query
- `command+j`: Check if query results match
- `command+k`: Search history records

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

- **Framework**: [Next.js](https://nextjs.org/) 15.3.0
- **UI Components**:
  - [Ant Design](https://ant.design/) 5.24.6
  - [Material-UI](https://mui.com/) 7.0.2
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Flow Diagram**:
  - [XY Flow](https://reactflow.dev/) (@xyflow/react)
  - For database table relationship visualization
  - Supports custom node and edge styles
  - Provides interactive chart operations
  - D3.js-based zooming and dragging functionality
- **AI Integration**: [Dify.ai](https://dify.ai/)
- **Type Checking**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Quick Start

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
