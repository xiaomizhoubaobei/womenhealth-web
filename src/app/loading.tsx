import { DashboardSkeleton, HomeHeader } from '@/components/home-shell';

/**
 * 首页路由级加载态。
 *
 * 与 page.tsx 内层 Suspense 互补：进入首页时先给出与最终布局一致的骨架，
 * 待服务端内容就绪后再替换，减少空白与布局抖动。
 * @returns {JSX.Element} 首页加载骨架。
 */
export default function Loading() {
    return (
        <div className="min-h-screen w-full bg-background">
            <HomeHeader />
            <main className="flex flex-1 flex-col p-4 md:p-6">
                <DashboardSkeleton />
            </main>
        </div>
    );
}
