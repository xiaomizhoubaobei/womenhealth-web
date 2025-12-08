'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCyclePrediction } from '@/app/actions';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PredictFutureCyclesOutput } from '@/ai/flows/predict-future-cycles';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { zhCN } from 'date-fns/locale';

const formSchema = z.object({
    cycleLength: z.coerce.number().min(10).max(100),
    periodLength: z.coerce.number().min(1).max(20),
    lastPeriodStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: '无效的日期格式',
    }),
    numberOfCycles: z.coerce.number().min(1).max(12),
});

/**
 * 周期预测选项卡组件，允许用户输入周期数据并获取 AI 预测。
 * @returns {JSX.Element} 周期预测选项卡组件。
 */
export function CyclePredictionTab() {
    const [prediction, setPrediction] = useState<PredictFutureCyclesOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cycleLength: 28,
            periodLength: 5,
            lastPeriodStartDate: new Date().toISOString().split('T')[0],
            numberOfCycles: 3,
        },
    });

    /**
     * 提交表单以获取周期预测。
     * @param {z.infer<typeof formSchema>} values - 表单值。
     */
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setPrediction(null);
        const result = await getCyclePrediction(values);
        setIsLoading(false);

        if (result.success && result.data) {
            setPrediction(result.data);
            toast({
                title: '预测准备就绪！',
                description: '您未来的周期已预测完毕。',
            });
        } else {
            toast({
                variant: 'destructive',
                title: '预测失败',
                description: result.error,
            });
        }
    }

    /**
     * 格式化日期字符串。
     * @param {string} dateString - ISO 格式的日期字符串。
     * @returns {string} 格式化后的日期字符串。
     */
    const formatDate = (dateString: string) => {
        return format(parseISO(dateString), 'PPP', { locale: zhCN });
    };


    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>预测您未来的周期</CardTitle>
                    <CardDescription>
                        输入您的周期详情，以获取由人工智能驱动的未来几个周期的预测。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="cycleLength"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>平均周期长度（天）</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="例如, 28" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="periodLength"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>平均经期长度（天）</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="例如, 5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastPeriodStartDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>上次经期开始日期</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="numberOfCycles"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>要预测的周期数</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="例如, 3" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                预测周期
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>您的预测</CardTitle>
                    <CardDescription>
                        这里是您未来周期的预测日期。
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    {isLoading && (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    )}
                    {!isLoading && !prediction && (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <p>您的预测将显示在这里。</p>
                        </div>
                    )}
                    {prediction && (
                        <div className="space-y-4">
                            {prediction.predictedCycles.map((cycle, index) => (
                                <Card key={index} className="bg-background/50">
                                    <CardHeader>
                                        <CardTitle>周期 {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <p>
                                            <strong>预测经期:</strong>{' '}
                                            {formatDate(cycle.startDate)} -{' '}
                                            {formatDate(cycle.endDate)}
                                        </p>
                                        <p className="font-bold text-primary">
                                            <strong>预测排卵期:</strong>{' '}
                                            {formatDate(cycle.ovulationDate)}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
