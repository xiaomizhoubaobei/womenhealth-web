import { LunaBloomTabs } from '@/components/luna-bloom-tabs';

/**
 * 主仪表盘组件（Server Component）。
 *
 * 只负责服务端静态外框：标题与描述由 SSR 直接产出，便于 SEO 与首屏。
 * 真正需要状态的交互部分下沉到客户端岛屿 LunaBloomTabs，
 * 避免整棵组件树因 'use client' 退化为纯客户端渲染。
 * @returns {JSX.Element} 主仪表盘组件。
 */
export function LunaBloomDashboard() {
    return (
        <section className="space-y-4">
            <div className="space-y-1">
                <h2 className="font-headline text-lg font-semibold text-foreground">
                    您的健康中心
                </h2>
                <p className="text-sm text-muted-foreground">
                    记录周期、追踪生育迹象，并获得 AI 驱动的个性化建议。
                </p>
            </div>
            <LunaBloomTabs />
        </section>
    );
}
