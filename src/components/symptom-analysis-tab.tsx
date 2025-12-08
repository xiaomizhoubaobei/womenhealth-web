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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getSymptomAnalysis } from '@/app/actions';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    symptoms: z.string().min(10, {
        message: '请至少用10个字符描述您的症状。',
    }),
    cycleData: z.string().optional(),
});

/**
 * 症状分析选项卡组件，允许用户输入症状以获取 AI 分析。
 * @returns {JSX.Element} 症状分析选项卡组件。
 */
export function SymptomAnalysisTab() {
    const [analysis, setAnalysis] = useState<AnalyzeSymptomsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            symptoms: '',
            cycleData: '',
        },
    });

    /**
     * 提交表单以进行症状分析。
     * @param {z.infer<typeof formSchema>} values - 表单值。
     */
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setAnalysis(null);
        const result = await getSymptomAnalysis(values);
        setIsLoading(false);

        if (result.success && result.data) {
            setAnalysis(result.data);
            toast({
                title: '分析完成！',
                description: '您的症状分析已准备就绪。',
            });
        } else {
            toast({
                variant: 'destructive',
                title: '分析失败',
                description: result.error,
            });
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>AI 症状分析</CardTitle>
                    <CardDescription>
                        描述您的症状，我们的人工智能将提供见解和潜在模式。这不是医疗建议。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="symptoms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>描述您的症状</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="例如，我左侧一直有剧烈的绞痛，并且过去3天异常疲劳..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cycleData"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>可选：周期信息</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="例如，我的周期通常是30天，但这个月是35天。我的经血量比平时多。"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                分析我的症状
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>AI 分析</CardTitle>
                        <CardDescription>
                            基于您的输入的潜在模式和健康考虑。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {isLoading && (
                            <div className="flex h-full min-h-[100px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!isLoading && !analysis && (
                            <div className="flex h-full min-h-[100px] items-center justify-center text-muted-foreground">
                                <p>您的分析将显示在这里。</p>
                            </div>
                        )}
                        {analysis && (
                            <p className="text-sm whitespace-pre-wrap">{analysis.analysis}</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>AI 建议</CardTitle>
                        <CardDescription>
                            基于分析的个性化建议。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {isLoading && (
                            <div className="flex h-full min-h-[100px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!isLoading && !analysis && (
                            <div className="flex h-full min-h-[100px] items-center justify-center text-muted-foreground">
                                <p>建议将显示在这里。</p>
                            </div>
                        )}
                        {analysis && (
                            <p className="text-sm whitespace-pre-wrap">{analysis.recommendations}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
