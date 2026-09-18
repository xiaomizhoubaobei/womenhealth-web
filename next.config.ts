import type {NextConfig} from 'next';

/**
 * 全局安全响应头。
 *
 * 背景：线上（腾讯 EdgeOne + Next.js）响应中曾暴露大量指纹型头部，
 * 如 `x-powered-by: Next.js`、`server: TencentEdgeOne`、`x-fc-request-id`、
 * `x-nextjs-cache` / `x-nextjs-prerender` / `x-nextjs-stale-time` 等内部标识。
 *
 * 处理策略分三层（本文件只负责能在这里收敛的部分）：
 * 1. **可由 Next.js 收敛**：`x-powered-by` 用 `poweredByHeader: false` 关闭；
 * 2. **CDN / 边缘平台生成**：`server`、`eo-*`、`nel`、`report-to`、`alt-svc` 等
 *    由 EdgeOne 注入，Next.js 无法删除，需在边缘/网关侧配置脱敏（见 README）；
 * 3. **业务自证头**：本文件通过 headers() 显式补齐安全头，避免「没配就等于没有」。
 *
 * 注意：Next.js 出于性能与回源缓存一致性考虑不提供 `hiddenHeaders` 之类的删除开关，
 * 因此第 2 类头部只能从平台侧收敛，不要试图在应用层「假装」已删除。
 */
const securityHeaders = [
  // 禁止浏览器自行嗅探 MIME 类型，降低「正常文件被当作脚本执行」的风险
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  // 跨域引用时只发送来源，避免把完整路径与查询串泄露给第三方
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  // 本站不需要被第三方 iframe 嵌套，同时保留同源嵌套能力
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
  // 关闭未使用的浏览器能力（本项目为纯 Web 应用，不需要麦克风/摄像头/定位）
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()'},
];

const nextConfig: NextConfig = {
  /**
   * 关闭 `X-Powered-By: Next.js` 响应头。
   *
   * 该头部会直接告诉攻击者「本站用 Next.js」，便于其按框架已知问题定向探测，
   * 属于零成本的指纹收敛项，故默认关闭。
   */
  poweredByHeader: false,

  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  /**
   * 为所有路由补齐安全响应头。
   *
   * 范围限定为 `/:path*`（含页面与 `/api/ai/*` 接口），保证 API 响应同样带上防护头。
   * @returns 应用到全部路径的头部规则。
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
