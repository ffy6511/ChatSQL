# 𝐜𝐡𝐚𝐭𝐒𝐐𝐋

English | [简体中文](./README.md)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3.0-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18.2.0-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

ChatSQL is an interactive SQL learning platform that helps users master SQL query language through AI-generated exercises.

## ✨ Features

- 🤖 AI-Generated Exercises: Automatically generates SQL exercises based on difficulty and tags
- 📊 Database Structure Visualization: Intuitively displays table relationships and field information
- ⌨️ Smart Code Editor: Supports syntax highlighting and auto-completion
- 📝 Instant Result Validation: Real-time verification of query results

## 🖥 Interface Preview

### Initialization Interface
<img src="./public/assets/initialization.png" alt="Initialization Interface" width="80%" />

### Database Structure Visualization
<img src="./public/assets/rendering.png" alt="Database Structure" width="80%" />

### SQL Editor Demo
<img src="./public/assets/edit.gif" alt="Editor Demo" width="80%" />

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

- **Framework**: Next.js 15.3.0
- **UI Components**:
  - Ant Design 5.24.6
  - Material-UI 7.0.2
- **Editor**: Monaco Editor
- **Flow Diagram**:
  - XY Flow (@xyflow/react)
  - For database table relationship visualization
  - Supports custom node and edge styles
  - Provides interactive chart operations
  - D3.js-based zooming and dragging functionality
- **AI Integration**: Dify.ai
- **Type Checking**: TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm package manager
- Dify.ai account and API key

### Installation Steps

1. Clone the repository

```bash
git clone https://github.com/ffy6511/chatSQL.git
cd chatSQL
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit the `.env.local` file and add your Dify API key:

```
NEXT_PUBLIC_DIFY_API_KEY=your_api_key_here
```

4. Start the development server

```bash
npm run dev
```

### Dify Workflow Configuration

1. Create a new application (select workflow) on [Dify platform](https://dify.ai)
2. Import workflow configuration:
   - Download the `public/chatSQL.yml` file from the project
   - Import this configuration file in the Dify platform
   - <img src="./public/assets/dify.png" alt="Import Workflow" width="80%" />
3. Get API key and configure in personal settings (workflow uses Gemini by default, can be modified as needed)

## 🤝 Contributing

Pull requests and issues are welcome!

## 📄 License

[MIT License](./LICENSE)
