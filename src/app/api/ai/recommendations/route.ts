/**
 * @fileOverview 个性化建议服务端接口：POST /api/ai/recommendations
 *
 * 请求体：{ cycleData: string; fertilityData: string; pregnancyData?: string; symptomAnalysis: string }
 * 响应体：{ success: true, data: PersonalizedRecommendationsOutput } | { success: false, error: string }
 */

import { NextResponse } from 'next/server';
import { handleAiRequest, readJsonBody } from '@/app/api/ai/_utils';
import { runPersonalizedRecommendations } from '@/ai/service';
import type {
    PersonalizedRecommendationsInput,
    PersonalizedRecommendationsOutput,
} from '@/lib/ai-types';

/** 需要 `ws` 与 `node:crypto`，固定使用 Node.js 运行时。 */
export const runtime = 'nodejs';

/**
 * 处理个性化建议请求。
 *
 * @param request - 入站请求。
 * @returns 统一结构的 JSON 响应。
 */
export async function POST(request: Request): Promise<NextResponse> {
    let input: PersonalizedRecommendationsInput;
    try {
        input = await readJsonBody<PersonalizedRecommendationsInput>(request);
    } catch (error) {
        const message = error instanceof Error ? error.message : '请求体解析失败。';
        return NextResponse.json({ success: false, error: message });
    }

    // cycleData / fertilityData 为模型判断的主要依据，二者至少要有其一的合法字符串。
    const hasText = (value: unknown): value is string =>
        typeof value === 'string' && value.trim() !== '';

    if (!hasText(input.cycleData) && !hasText(input.fertilityData)) {
        return NextResponse.json({ success: false, error: '请至少提供周期数据或生育数据。' });
    }

    return handleAiRequest<PersonalizedRecommendationsOutput>(
        () => runPersonalizedRecommendations(input),
        '获取个性化建议失败，请稍后重试。'
    );
}
