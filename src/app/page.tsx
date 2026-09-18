import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LunaBloomDashboard } from '@/components/luna-bloom-dashboard';
import { DashboardSkeleton, HomeHeader } from '@/components/home-shell';

/**
 * 首页 SEO 元信息。
 *
 * 与 SSR 配套：只有页面在服务端渲染出真实内容，这些元信息才能真正被搜索引擎消费。
 * metadataBase 让 OG / Twitter 卡片中的相对图片地址能解析为绝对 URL。
 * @returns {Promise<Metadata>} 首页元信息。
 */
export async function generateMetadata(): Promise<Metadata> {
    const title = '女性生殖健康追踪';
    const description =
        '一款全面的女性生殖健康和保健追踪器：记录经期与生育迹象、预测未来周期、分析症状，并获取 AI 个性化建议。';

    return {
        metadataBase: new URL(
            process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lumin-core.web.app'
        ),
        title,
        description,
        keywords: [
            '女性健康',
            '经期追踪',
            '周期预测',
            '生育健康',
            '症状分析',
            '健康记录',
        ],
        applicationName: 'LuminCore',
        alternates: {
            canonical: '/',
        },
        openGraph: {
            type: 'website',
            locale: 'zh_CN',
            url: '/',
            siteName: 'LuminCore',
            title,
            description,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

/**
 * 应用的主页组件（Server Component）。
 *
 * 页头等静态骨架由服务端直出；交互岛屿通过 Suspense 流式补齐。
 * @returns {JSX.Element} 主页元素。
 */
export default function Home() {
    return (
        <div className="min-h-screen w-full bg-background">
            <HomeHeader />
            <main className="flex flex-1 flex-col p-4 md:p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                    <LunaBloomDashboard />
                </Suspense>
            </main>
        </div>
    );
}
