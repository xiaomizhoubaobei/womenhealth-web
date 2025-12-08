import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: 'LuminCore',
    description: "一款全面的女性生殖健康和保健追踪器。",
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
            <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
        {children}
        <Toaster />
        </body>
        </html>
    );
}
