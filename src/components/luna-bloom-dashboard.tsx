'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar,
    HeartPulse,
    Baby,
    BrainCircuit,
    Sparkles,
} from 'lucide-react';
import { type CycleLog, type FertilityLog } from '@/lib/types';

import { DashboardTab } from '@/components/dashboard-tab';
import { CyclePredictionTab } from '@/components/cycle-prediction-tab';
import { SymptomAnalysisTab } from '@/components/symptom-analysis-tab';
import { PregnancyTab } from '@/components/pregnancy-tab';
import { RecommendationsTab } from '@/components/recommendations-tab';

/**
 * 主仪表盘组件，集成了多个功能选项卡。
 * @returns {JSX.Element} 主仪表盘组件。
 */
export function LunaBloomDashboard() {
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
     * 添加一个新的生育日志，如果当天已有日志则更新。
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
