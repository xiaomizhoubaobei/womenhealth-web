'use server';

/**
 * @fileOverview AI 能力的服务端入口（统一收口）。
 *
 * 分层约定：
 * - 浏览器 → `src/lib/ai-client.ts`（fetch）→ `src/app/api/ai/*`（Route Handler）
 *   → 本文件 → `src/ai/flows/*` → 星火 Lite WebSocket。
 * - 只有本层及以下允许接触 `process.env` / 密钥 / WebSocket，浏览器端完全隔离；
 * - 本文件仅做转发与错误归一化，避免路由层直接 import 各 flow 造成职责分散。
 */

import { analyzeSymptoms } from '@/ai/flows/analyze-symptoms';
import { predictFutureCycles } from '@/ai/flows/predict-future-cycles';
import { generatePersonalizedRecommendations } from '@/ai/flows/personalized-recommendations';
import type {
    AnalyzeSymptomsInput,
    AnalyzeSymptomsOutput,
    PersonalizedRecommendationsInput,
    PersonalizedRecommendationsOutput,
    PredictFutureCyclesInput,
    PredictFutureCyclesOutput,
} from '@/lib/ai-types';

/** 症状分析（服务端执行，返回强类型结果，失败时抛错由路由层归一化）。 */
export async function runSymptomAnalysis(
    input: AnalyzeSymptomsInput
): Promise<AnalyzeSymptomsOutput> {
    return analyzeSymptoms(input);
}

/** 周期预测（服务端执行）。 */
export async function runCyclePrediction(
    input: PredictFutureCyclesInput
): Promise<PredictFutureCyclesOutput> {
    return predictFutureCycles(input);
}

/** 个性化建议（服务端执行）。 */
export async function runPersonalizedRecommendations(
    input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
    return generatePersonalizedRecommendations(input);
}
