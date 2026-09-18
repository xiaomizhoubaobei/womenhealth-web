'use server';

/**
 * @fileOverview AI 相关 Server Action（对外唯一动作入口）。
 *
 * 调用链：客户端组件 → 本文件（Server Action）→ `src/ai/service.ts` → 星火 Lite。
 *
 * 为什么保留 Server Action：
 * - Server Action 由 Next.js 在**服务端**执行，浏览器只会拿到「动作引用」而非实现，
 *   因此认证信息（SPARK_APP_ID / SPARK_API_KEY / SPARK_API_SECRET）不会下发到客户端；
 * - 同时提供 REST 形态的 `/api/ai/*`（客户端调用层见 `src/lib/ai-client.ts`），
 *   两类调用方共用同一服务端实现，避免逻辑分叉。
 *
 * 注意：本文件仅供服务端组件 / 其他服务端代码使用；浏览器组件请统一走 `src/lib/ai-client.ts`。
 */

import {
    runCyclePrediction,
    runPersonalizedRecommendations,
    runSymptomAnalysis,
} from '@/ai/service';
import type {
    AnalyzeSymptomsInput,
    PersonalizedRecommendationsInput,
    PredictFutureCyclesInput,
} from '@/lib/ai-types';

/**
 * 获取周期预测。
 * @param input - 预测未来周期的输入数据。
 * @returns 包含预测结果的对象，或在出错时返回错误信息。
 */
export async function getCyclePrediction(input: PredictFutureCyclesInput) {
    try {
        const result = await runCyclePrediction(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('[actions] 获取周期预测失败：', error);
        return { success: false, error: '获取周期预测失败。' };
    }
}

/**
 * 获取症状分析。
 * @param input - 分析症状的输入数据。
 * @returns 包含分析结果的对象，或在出错时返回错误信息。
 */
export async function getSymptomAnalysis(input: AnalyzeSymptomsInput) {
    try {
        const result = await runSymptomAnalysis(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('[actions] 获取症状分析失败：', error);
        return { success: false, error: '获取症状分析失败。' };
    }
}

/**
 * 获取个性化建议。
 * @param input - 生成个性化建议的输入数据。
 * @returns 包含建议结果的对象，或在出错时返回错误信息。
 */
export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput) {
    try {
        const result = await runPersonalizedRecommendations(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('[actions] 获取个性化建议失败：', error);
        return { success: false, error: '获取个性化建议失败。' };
    }
}
