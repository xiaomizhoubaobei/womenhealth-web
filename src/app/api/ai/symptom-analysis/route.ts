/**
 * @fileOverview 症状分析服务端接口：POST /api/ai/symptom-analysis
 *
 * 客户端（浏览器）只把用户输入发到这里，讯飞凭证与 WebSocket 调用全部在本 Route 内完成，
 * 认证信息不出服务端。
 *
 * 请求体：{ symptoms: string; cycleData?: string }
 * 响应体：{ success: true, data: AnalyzeSymptomsOutput } | { success: false, error: string }
 */

import { NextResponse } from 'next/server';
import { handleAiRequest, readJsonBody } from '@/app/api/ai/_utils';
import { runSymptomAnalysis } from '@/ai/service';
import type { AnalyzeSymptomsInput, AnalyzeSymptomsOutput } from '@/lib/ai-types';

/** 路由必须运行在 Node.js 运行时：需要 `ws` 与 `node:crypto`，Edge 运行时不可用。 */
export const runtime = 'nodejs';

/**
 * 处理症状分析请求。
 *
 * @param request - 入站请求。
 * @returns 统一结构的 JSON 响应。
 */
export async function POST(request: Request): Promise<NextResponse> {
    let input: AnalyzeSymptomsInput;
    try {
        input = await readJsonBody<AnalyzeSymptomsInput>(request);
    } catch (error) {
        const message = error instanceof Error ? error.message : '请求体解析失败。';
        return NextResponse.json({ success: false, error: message });
    }

    // 基础校验：症状描述必填，避免无意义调用模型。
    if (typeof input.symptoms !== 'string' || input.symptoms.trim() === '') {
        return NextResponse.json({ success: false, error: '请填写症状描述。' });
    }

    return handleAiRequest<AnalyzeSymptomsOutput>(
        () => runSymptomAnalysis(input),
        '症状分析失败，请稍后重试。'
    );
}
