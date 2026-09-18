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
  - **调用模式**: 服务端 / 客户端分离 —— 浏览器**不持有任何密钥**，只请求本站服务端接口；密钥与 WebSocket 握手全部在服务端完成（详见下文「AI 调用链路」）。
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

## 🔐 AI 调用链路（服务端持有认证信息）

浏览器**永远拿不到** `SPARK_APP_ID` / `SPARK_API_KEY` / `SPARK_API_SECRET`：

```
客户端组件（'use client'）
  └─ src/lib/ai-client.ts        fetch POST（只发业务数据）
       └─ src/app/api/ai/*       Route Handler（运行时 nodejs），服务端读取密钥
            └─ src/ai/service.ts 服务端 AI 入口
                 └─ src/ai/flows/* 提示词构建 + 输出校验
                      └─ src/ai/spark/{auth,client} HMAC 签名 + WebSocket 调用
                           └─ 讯飞星火 Lite
```

约定与要点：

- **客户端只认路径**：`/api/ai/symptom-analysis`、`/api/ai/cycle-prediction`、`/api/ai/recommendations`。
- **接口结构统一**：成功 `{success:true, data}`，失败 `{success:false, error}`（业务失败返回 HTTP 200，前端判定逻辑与改造前一致）。
- **服务端二次校验**：请求体结构、必填字段、日期格式、周期数范围等在后端兜底，前端表单校验不可信。
- **类型单一来源**：前后端共用 `src/lib/ai-types.ts`；`src/ai/**` 属服务端模块（`'use server'` + `ws` + `node:crypto`），**禁止**被客户端组件 import。
- **Server Action 亦可用**：`src/app/actions.ts` 保留为服务端调用入口（与服务端接口共用 `src/ai/service.ts`），供服务端组件等场景使用。
- 自检：`npm run build` 后 `grep -rl 'SPARK_API_SECRET\|spark-api.xf-yun.com' .next/static` 应为 **0 命中**。

> 运行时补丁：Next 打包会把 `ws` 的可选原生加速依赖 `bufferutil` 替换为空模块，导致发送掩码帧报
> `TypeError: b.mask is not a function`。`src/ai/spark/runtime.ts` 会在加载 `ws` 前设置
> `WS_NO_BUFFER_UTIL=1`，让 `ws` 走纯 JS 实现规避该问题，无需任何额外环境变量。

## 🛡️ 响应头与指纹收敛

线上响应头存在分层归属，**优化前请先确认某项由谁生成**，避免在应用层做无效功：

| 头部 | 生成方 | 状态 |
| --- | --- | --- |
| `x-powered-by: Next.js` | Next.js | ✅ 已在 `next.config.ts` 用 `poweredByHeader: false` 关闭 |
| `x-content-type-options` / `referrer-policy` / `x-frame-options` / `permissions-policy` | 本项目（`headers()`） | ✅ 已在 `next.config.ts` 显式补齐 |
| `server: TencentEdgeOne`、`eo-log-uuid`、`eo-cache-status`、`nel`、`report-to`、`alt-svc` | 腾讯 EdgeOne（边缘平台注入） | ⚠️ **Next.js 无法删除**，需在 EdgeOne 控制台的「响应头管理」自定义删除/改写 |
| `x-fc-request-id` | 云函数（FC）运行时注入 | ⚠️ 同上，属平台侧，需在边缘/网关收敛 |
| `x-nextjs-cache` / `x-nextjs-prerender` / `x-nextjs-stale-time` / `etag` | Next.js 运行时 | ⚠️ 框架自带、无删除开关；其值（HIT / prerender / stale-time）本身即「是否静态页面」的提示 |

自检方式（本地生产构建）：

```bash
npm run build && npm run start
curl -sI http://127.0.0.1:9002/ | grep -i 'x-powered-by'   # 应无输出
curl -sI http://127.0.0.1:9002/ | grep -iE 'x-content-type-options|referrer-policy|x-frame-options|permissions-policy'  # 应四项齐全
```

> 结论：**应用层能做的收敛已全部落地**（关闭 `X-Powered-By` + 补齐安全头）；
> `server` / `eo-*` / `x-fc-request-id` 等属边缘平台注入，须在 EdgeOne 侧配置，应用代码无法消除。

## 📁 项目结构

- `src/app/`: Next.js 应用的主要页面和路由。
- `src/components/`: 应用中使用的 React 组件。
  - `src/components/ui/`: ShadCN UI 自动生成的组件。
- `src/ai/`: 所有与 AI 能力相关的文件。
  - `src/ai/spark/`: 讯飞星火 Lite 接入层（`auth.ts` 鉴权签名、`client.ts` WebSocket 调用、`json.ts` 结构化输出解析）。
  - `src/ai/flows/`: 应用中的核心 AI 能力（症状分析、周期预测、个性化建议）。
  - `src/ai/service.ts`: 服务端 AI 能力统一入口（Service Action / Route Handler 共用）。
  - `src/app/api/ai/`: 服务端 AI 接口（Route Handler，Node.js 运行时），浏览器唯一可见的 AI 入口。
- `src/lib/ai-types.ts`: AI 输入 / 输出类型与接口路径常量（前后端共用的**纯类型**，无任何服务端实现）。
- `src/lib/ai-client.ts`: 客户端 AI 调用层（浏览器侧 `fetch` 封装，禁止引入服务端模块）。
- `scripts/browser-check.js`: 星火鉴权与 WebSocket 连通性自检脚本。
- `src/lib/`: 工具函数、类型定义和静态数据。