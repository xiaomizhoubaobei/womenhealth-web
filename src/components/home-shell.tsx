import { Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 首页页头（Server Component）。
 *
 * 抽成独立组件，便于 page.tsx 与 loading.tsx 复用同一套静态骨架，
 * 保证流式渲染时「页头先出、内容后补」的视觉连续。
 * @returns {JSX.Element} 首页页头。
 */
export function HomeHeader() {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <Droplets className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-2xl font-bold text-foreground">
                LuminCore
            </h1>
        </header>
    );
}

/**
 * 首页内容骨架（Server Component）。
 *
 * 作为 Suspense fallback 使用，在交互岛屿就绪前占位，减少首屏空白与布局抖动（CLS）。
 * @returns {JSX.Element} 内容骨架。
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-4" aria-hidden="true">
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
    );
}
