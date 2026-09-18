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
- **AI 功能**: [讯飞星火认知大模型 Lite](https://www.xfyun.cn/doc/spark/Web.html)（WebSocket 流式接口）
- **图标**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## 🛠️ 如何开始

这是一个 Firebase Studio 项目，您可以在开发环境中与应用进行交互和修改。

1.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    应用将在 http://localhost:9002 上运行。

2.  **配置讯飞星火密钥**:

    AI 功能依赖讯飞开放平台的应用凭证，请先在 [控制台](https://console.xfyun.cn/services/bm35) 创建应用并领取 Lite 模型免费额度，
    然后通过环境变量注入（**严禁写入代码仓库**）：

    ```bash
    export SPARK_APP_ID="你的 AppID"
    export SPARK_API_KEY="你的 APIKey"
    export SPARK_API_SECRET="你的 APISecret"
    ```

    本地开发可写入项目根目录的 `.env.local`（已被 `.gitignore` 忽略）。

    自检鉴权与连通性：

    ```bash
    npm run browser:check
    ```

3.  **构建项目**:
    ```bash
    npm run build
    ```

## 📁 项目结构

- `src/app/`: Next.js 应用的主要页面和路由。
- `src/components/`: 应用中使用的 React 组件。
  - `src/components/ui/`: ShadCN UI 自动生成的组件。
- `src/ai/`: 所有与 AI 能力相关的文件。
  - `src/ai/spark/`: 讯飞星火 Lite 接入层（`auth.ts` 鉴权签名、`client.ts` WebSocket 调用、`json.ts` 结构化输出解析）。
  - `src/ai/flows/`: 应用中的核心 AI 能力（症状分析、周期预测、个性化建议）。
- `scripts/browser-check.js`: 星火鉴权与 WebSocket 连通性自检脚本。
- `src/lib/`: 工具函数、类型定义和静态数据。