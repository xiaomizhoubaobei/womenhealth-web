'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type {
    CycleLog,
    FertilityLog,
    FlowIntensity,
    Symptom,
    CervicalMucus,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { zhCN } from 'date-fns/locale';

/**
 * @typedef {object} DashboardTabProps
 * @property {CycleLog[]} cycleLogs - 周期日志数组。
 * @property {FertilityLog[]} fertilityLogs - 生育日志数组。
 * @property {(log: CycleLog) => void} addCycleLog - 添加周期日志的函数。
 * @property {(log: FertilityLog) => void} addFertilityLog - 添加生育日志的函数。
 */
interface DashboardTabProps {
    cycleLogs: CycleLog[];
    fertilityLogs: FertilityLog[];
    addCycleLog: (log: CycleLog) => void;
    addFertilityLog: (log: FertilityLog) => void;
}

const symptoms: { id: Symptom; label: string }[] = [
    { id: 'cramps', label: '痛经' },
    { id: 'bloating', label: '腹胀' },
    { id: 'headache', label: '头痛' },
    { id: 'fatigue', label: '疲劳' },
    { id: 'mood_swings', label: '情绪波动' },
    { id: 'acne', label: '粉刺' },
];

/**
 * 仪表盘选项卡组件，用于记录周期和生育数据。
 * @param {DashboardTabProps} props - 组件属性。
 * @returns {JSX.Element} 仪表盘选项卡组件。
 */
export function DashboardTab({
                                 cycleLogs,
                                 fertilityLogs,
                                 addCycleLog,
                                 addFertilityLog,
                             }: DashboardTabProps) {
    const { toast } = useToast();
    const [periodDates, setPeriodDates] = useState<DateRange | undefined>();
    const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>('medium');
    const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);

    const [fertilityDate, setFertilityDate] = useState<Date>(new Date());
    const [bbt, setBbt] = useState<string>('');
    const [cervicalMucus, setCervicalMucus] = useState<CervicalMucus>();

    /**
     * 格式化日期对象。
     * @param {Date} date - 要格式化的日期。
     * @returns {string} 格式化后的日期字符串。
     */
    const formatDate = (date: Date) => {
        return format(date, 'PPP', { locale: zhCN });
    };

    /**
     * 处理记录经期操作。
     */
    const handleLogPeriod = () => {
        if (periodDates?.from && periodDates?.to) {
            addCycleLog({
                id: new Date().toISOString(),
                startDate: periodDates.from,
                endDate: periodDates.to,
                flowIntensity,
                symptoms: selectedSymptoms,
            });
            toast({
                title: '经期已记录',
                description: `您从 ${formatDate(periodDates.from)} 到 ${formatDate(periodDates.to)} 的经期已保存。`,
            });
            setPeriodDates(undefined);
            setSelectedSymptoms([]);
        } else {
            toast({
                variant: 'destructive',
                title: '日期不完整',
                description: '请选择您经期的开始和结束日期。',
            });
        }
    };

    /**
     * 处理记录生育迹象操作。
     */
    const handleLogFertility = () => {
        if (bbt || cervicalMucus) {
            const log: FertilityLog = {
                id: new Date().toISOString(),
                date: fertilityDate,
            };
            if (bbt) log.bbt = parseFloat(bbt);
            if (cervicalMucus) log.cervicalMucus = cervicalMucus;

            addFertilityLog(log);
            toast({
                title: '生育迹象已记录',
                description: `您在 ${formatDate(fertilityDate)} 的迹象已保存。`,
            });
            setBbt('');
            setCervicalMucus(undefined);
        } else {
            toast({
                variant: 'destructive',
                title: '无数据',
                description: '请输入至少一个生育迹象以进行记录。',
            });
        }
    };

    const modifiers = {
        period: cycleLogs.map((log) => ({ from: log.startDate, to: log.endDate })),
    };

    const modifiersStyles = {
        period: {
            backgroundColor: 'var(--colors-accent)',
            color: 'var(--colors-accent-foreground)',
            borderRadius: '0.5rem',
        },
    };

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>记录您的周期</CardTitle>
                    <CardDescription>
                        选择您的经期并记录相关症状和流量。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Calendar
                        locale={zhCN}
                        mode="range"
                        selected={periodDates}
                        onSelect={setPeriodDates}
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles as any}
                        className="rounded-md border"
                    />
                    <div className="space-y-2">
                        <Label>流量强度</Label>
                        <Select
                            onValueChange={(value: FlowIntensity) => setFlowIntensity(value)}
                            defaultValue="medium"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择流量强度" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spotting">点滴出血</SelectItem>
                                <SelectItem value="light">少量</SelectItem>
                                <SelectItem value="medium">中等</SelectItem>
                                <SelectItem value="heavy">大量</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>症状</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {symptoms.map((symptom) => (
                                <div key={symptom.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={symptom.id}
                                        onCheckedChange={(checked) => {
                                            setSelectedSymptoms((prev) =>
                                                checked
                                                    ? [...prev, symptom.id]
                                                    : prev.filter((s) => s !== symptom.id)
                                            );
                                        }}
                                    />
                                    <label
                                        htmlFor={symptom.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {symptom.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleLogPeriod} className="w-full">
                        记录经期
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>追踪生育迹象</CardTitle>
                    <CardDescription>
                        记录您的基础体温（BBT）和宫颈粘液。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>日期</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={'outline'} className="w-full justify-start">
                                    {formatDate(fertilityDate)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    locale={zhCN}
                                    mode="single"
                                    selected={fertilityDate}
                                    onSelect={(date) => date && setFertilityDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bbt">基础体温 (°F)</Label>
                        <Input
                            id="bbt"
                            type="number"
                            placeholder="例如, 97.6"
                            value={bbt}
                            onChange={(e) => setBbt(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>宫颈粘液</Label>
                        <Select
                            onValueChange={(value: CervicalMucus) => setCervicalMucus(value)}
                            value={cervicalMucus}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择粘液质量" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dry">干燥</SelectItem>
                                <SelectItem value="sticky">粘稠</SelectItem>
                                <SelectItem value="creamy">乳状</SelectItem>
                                <SelectItem value="egg_white">蛋清状</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleLogFertility} className="w-full">
                        记录生育迹象
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
