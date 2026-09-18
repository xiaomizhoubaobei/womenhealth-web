import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

/**
 * 全局默认元信息。
 *
 * title.template 让子页面（如首页 page.tsx 的 generateMetadata）自动拼出
 * 「页面标题 | LuminCore」，避免每页手写站点名。
 */
export const metadata: Metadata = {
    title: {
        default: 'LuminCore',
        template: '%s | LuminCore',
    },
    description: '一款全面的女性生殖健康和保健追踪器。',
};

/**
 * 根布局组件，为整个应用提供基本结构和样式。
 * @param {object} props - 组件属性。
 * @param {React.ReactNode} props.children - 要渲染的子组件。
 * @returns {JSX.Element} 根布局元素。
 */
export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {/* 该规则面向 Pages Router 的 '单页加载' 问题；App Router 根布局中此处为全局字体，属推荐用法 */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
        {children}
        <Toaster />
        </body>
        </html>
    );
}
