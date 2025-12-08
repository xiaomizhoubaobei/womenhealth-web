import { LunaBloomDashboard } from '@/components/luna-bloom-dashboard';
import { Droplets } from 'lucide-react';

/**
 * 应用的主页组件。
 * @returns {JSX.Element} 主页元素。
 */
export default function Home() {
    return (
        <div className="min-h-screen w-full bg-background">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <Droplets className="h-6 w-6 text-primary" />
                <h1 className="font-headline text-2xl font-bold text-foreground">
                    LuminCore
                </h1>
            </header>
            <main className="flex flex-1 flex-col p-4 md:p-6">
                <LunaBloomDashboard />
            </main>
        </div>
    );
}
