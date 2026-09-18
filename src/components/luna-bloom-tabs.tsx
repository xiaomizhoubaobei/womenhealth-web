'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, HeartPulse, Baby, BrainCircuit, Sparkles } from 'lucide-react';
import { type CycleLog, type FertilityLog } from '@/lib/types';

import { DashboardTab } from '@/components/dashboard-tab';
import { CyclePredictionTab } from '@/components/cycle-prediction-tab';
import { SymptomAnalysisTab } from '@/components/symptom-analysis-tab';
import { PregnancyTab } from '@/components/pregnancy-tab';
import { RecommendationsTab } from '@/components/recommendations-tab';

/**
 * 仪錶盘交互岛屿（Client Component）。
 *
 * 只保留「真正需要状态」的部分：标签页切换，以及被多个标签共享的周期 / 生育日志。
 * 静态外框下沉在服务端组件 LunaBloomDashboard 中渲染，从而首屏 HTML 由 SSR 直出。
 * @returns {JSX.Element} 标签页交互岛屿。
 */
export function LunaBloomTabs() {
    // 跨标签共享的日志状态（DashboardTab 写入、RecommendationsTab 读取）
    const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
    const [fertilityLogs, setFertilityLogs] = useState<FertilityLog[]>([]);

    /**
     * 添加一个新的周期日志。
     * @param {CycleLog} log - 要添加的周期日志。
     */
    const addCycleLog = (log: CycleLog) => {
        setCycleLogs((prev) => [...prev, log]);
    };

    /**
     * 添加一个新的生育日志，如果当天已有日志则更新（同日合并）。
     * @param {FertilityLog} log - 要添加或更新的生育日志。
     */
    const addFertilityLog = (log: FertilityLog) => {
        setFertilityLogs((prev) => {
            const existingIndex = prev.findIndex(
                (l) => l.date.toDateString() === log.date.toDateString()
            );
            if (existingIndex > -1) {
                const updatedLogs = [...prev];
                updatedLogs[existingIndex] = { ...updatedLogs[existingIndex], ...log };
                return updatedLogs;
            }
            return [...prev, log];
        });
    };

    return (
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="dashboard">
                    <Calendar className="mr-2" />
                    仪表盘
                </TabsTrigger>
                <TabsTrigger value="prediction">
                    <HeartPulse className="mr-2" />
                    周期预测
                </TabsTrigger>
                <TabsTrigger value="symptoms">
                    <BrainCircuit className="mr-2" />
                    AI症状分析
                </TabsTrigger>
                <TabsTrigger value="pregnancy">
                    <Baby className="mr-2" />
                    怀孕追踪
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                    <Sparkles className="mr-2" />
                    个性化推荐
                </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
                <DashboardTab
                    cycleLogs={cycleLogs}
                    fertilityLogs={fertilityLogs}
                    addCycleLog={addCycleLog}
                    addFertilityLog={addFertilityLog}
                />
            </TabsContent>
            <TabsContent value="prediction">
                <CyclePredictionTab />
            </TabsContent>
            <TabsContent value="symptoms">
                <SymptomAnalysisTab />
            </TabsContent>
            <TabsContent value="pregnancy">
                <PregnancyTab />
            </TabsContent>
            <TabsContent value="recommendations">
                <RecommendationsTab
                    cycleLogs={cycleLogs}
                    fertilityLogs={fertilityLogs}
                />
            </TabsContent>
        </Tabs>
    );
}
