# LuminCore

LuminCore 是一款全面的女性生殖健康与保健追踪应用。它利用 AI 提供个性化的见解和预测，帮助用户更好地了解自己的身体。

## ✨ 功能

- **仪表盘**: 记录和追踪月经周期、流量强度、症状、基础体温（BBT）和宫颈粘液。
- **周期预测**: 基于您输入的数据，通过 AI 预测未来的月经周期和排卵日期。
- **AI 症状分析**: 描述您的症状，AI 将提供潜在的模式和健康分析（注意：这不是医疗建议）。
- **怀孕追踪**: 提供从第 1 周到第 40 周的怀孕进程指南和每周见解。
- **个性化推荐**: 根据您记录的周期和生育数据，AI 会生成定制化的健康和生活方式建议。

## 🚀 技术栈

- **框架**: [Next.js](https://nextjs.org/) (使用 App Router)
- **UI**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI 功能**: [Google's Genkit](https://firebase.google.com/docs/genkit)
- **图标**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## 🛠️ 如何开始

这是一个 Firebase Studio 项目，您可以在开发环境中与应用进行交互和修改。

1.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    应用将在 http://localhost:9002 上运行。

2.  **启动 Genkit**:
    要在本地测试 AI 功能，您需要启动 Genkit 开发者 UI。
    ```bash
    npm run genkit:dev
    ```
    Genkit 调试器将在 http://localhost:4000 上可用。

3.  **构建项目**:
    ```bash
    npm run build
    ```

## 📁 项目结构

- `src/app/`: Next.js 应用的主要页面和路由。
- `src/components/`: 应用中使用的 React 组件。
  - `src/components/ui/`: ShadCN UI 自动生成的组件。
- `src/ai/`: 所有与 Genkit AI 相关的文件。
  - `src/ai/flows/`: 定义了应用中的核心 AI 流程。
- `src/lib/`: 工具函数、类型定义和静态数据。