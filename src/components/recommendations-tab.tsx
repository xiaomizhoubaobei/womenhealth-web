'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CycleLog, FertilityLog } from '@/lib/types';
import { getPersonalizedRecommendations } from '@/app/actions';
import { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * @typedef {object} RecommendationsTabProps
 * @property {CycleLog[]} cycleLogs - 用户的周期日志。
 * @property {FertilityLog[]} fertilityLogs - 用户的生育日志。
 */
interface RecommendationsTabProps {
    cycleLogs: CycleLog[];
    fertilityLogs: FertilityLog[];
}

/**
 * 个性化建议选项卡组件，根据用户数据生成 AI 建议。
 * @param {RecommendationsTabProps} props - 组件属性。
 * @returns {JSX.Element} 个性化建议选项卡组件。
 */
export function RecommendationsTab({
                                       cycleLogs,
                                       fertilityLogs,
                                   }: RecommendationsTabProps) {
    const [recommendations, setRecommendations] =
        useState<PersonalizedRecommendationsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    /**
     * 处理生成个性化建议的请求。
     */
    const handleGenerateRecommendations = async () => {
        if (cycleLogs.length === 0 && fertilityLogs.length === 0) {
            toast({
                variant: 'destructive',
                title: '数据不足',
                description:
                    '请在生成建议前记录一些周期或生育数据。',
            });
            return;
        }

        setIsLoading(true);
        setRecommendations(null);

        const input = {
            cycleData: JSON.stringify(cycleLogs),
            fertilityData: JSON.stringify(fertilityLogs),
            symptomAnalysis: '无直接症状分析，但可从日志中推断。',
        };

        const result = await getPersonalizedRecommendations(input);
        setIsLoading(false);

        if (result.success && result.data) {
            setRecommendations(result.data);
            toast({
                title: '建议已准备好！',
                description: '您的个性化建议已生成。',
            });
        } else {
            toast({
                variant: 'destructive',
                title: '生成失败',
                description: result.error,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>为您量身定制</CardTitle>
                <CardDescription>
                    根据您追踪的数据获取由AI驱动的健康和生活方式建议。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleGenerateRecommendations}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        生成我的建议
                    </Button>
                </div>
                <div className="space-y-4">
                    {isLoading && (
                        <div className="flex h-full min-h-[200px] items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    )}
                    {!isLoading && !recommendations && (
                        <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed text-center">
                            <p className="text-muted-foreground">
                                生成后，您的个性化建议将显示在此处。
                            </p>
                        </div>
                    )}
                    {recommendations?.recommendations.map((rec, index) => (
                        <Card key={index} className="bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">{rec.type}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{rec.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
