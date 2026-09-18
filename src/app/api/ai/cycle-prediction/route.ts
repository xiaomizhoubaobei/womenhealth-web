/**
 * @fileOverview 周期预测服务端接口：POST /api/ai/cycle-prediction
 *
 * 请求体：{ cycleLength: number; periodLength: number; numberOfCycles: number; lastPeriodStartDate: string }
 * 响应体：{ success: true, data: PredictFutureCyclesOutput } | { success: false, error: string }
 */

import { NextResponse } from 'next/server';
import { handleAiRequest, readJsonBody } from '@/app/api/ai/_utils';
import { runCyclePrediction } from '@/ai/service';
import type { PredictFutureCyclesInput, PredictFutureCyclesOutput } from '@/lib/ai-types';

/** 需要 `ws` 与 `node:crypto`，固定使用 Node.js 运行时。 */
export const runtime = 'nodejs';

/** YYYY-MM-DD 日期格式校验。 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 处理周期预测请求。
 *
 * @param request - 入站请求。
 * @returns 统一结构的 JSON 响应。
 */
export async function POST(request: Request): Promise<NextResponse> {
    let input: PredictFutureCyclesInput;
    try {
        input = await readJsonBody<PredictFutureCyclesInput>(request);
    } catch (error) {
        const message = error instanceof Error ? error.message : '请求体解析失败。';
        return NextResponse.json({ success: false, error: message });
    }

    // 服务端二次校验：前端表单校验可被绕过，这里必须兜底。
    const isPositiveInt = (value: unknown): value is number =>
        typeof value === 'number' && Number.isInteger(value) && value > 0;

    if (!isPositiveInt(input.cycleLength) || !isPositiveInt(input.periodLength)) {
        return NextResponse.json({ success: false, error: '周期长度与经期长度必须为正整数。' });
    }
    if (!isPositiveInt(input.numberOfCycles) || input.numberOfCycles > 12) {
        return NextResponse.json({ success: false, error: '预测周期数必须为 1-12 之间的整数。' });
    }
    if (typeof input.lastPeriodStartDate !== 'string' || !DATE_PATTERN.test(input.lastPeriodStartDate)) {
        return NextResponse.json({ success: false, error: '上次经期开始日期格式应为 YYYY-MM-DD。' });
    }

    return handleAiRequest<PredictFutureCyclesOutput>(
        () => runCyclePrediction(input),
        '获取周期预测失败，请稍后重试。'
    );
}
