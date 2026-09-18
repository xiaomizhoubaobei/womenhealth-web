/**
 * @fileOverview 客户端 AI 调用层（浏览器侧唯一入口）。
 *
 * 设计约定（与 Genkit 时代的「服务端 + 客户端」模式一致）：
 * - 客户端**不直接**调用模型服务商，只 `fetch` 本站的服务端接口；
 * - 讯飞星火的 AppID / APIKey / APISecret 只存在于服务端环境变量，
 *   浏览器包里不含任何认证信息；
 * - 本文件会被客户端组件引入，因此**禁止** import 任何服务端模块。
 */

import {
    AI_API_PATHS,
    type AiApiResponse,
    type AnalyzeSymptomsInput,
    type AnalyzeSymptomsOutput,
    type PersonalizedRecommendationsInput,
    type PersonalizedRecommendationsOutput,
    type PredictFutureCyclesInput,
    type PredictFutureCyclesOutput,
} from '@/lib/ai-types';

import { logger } from '@/lib/logger';

/** 单次请求超时（毫秒）。星火侧本身约 60s 超时，这里留出少量余量。 */
const REQUEST_TIMEOUT_MS = 90_000;

/** 网络异常时的统一友好提示（不影响原有时序与返回结构）。 */
const NETWORK_ERROR_MESSAGE = '网络异常，无法连接服务端，请稍后重试。';
/** 请求超时提示。 */
const TIMEOUT_MESSAGE = '请求超时，请稍后重试。';

/**
 * 统一的服务端 AI 接口调用。
 *
 * @param path - 服务端接口路径（取自 `AI_API_PATHS`）。
 * @param payload - 请求体。
 * @returns 与原先 Server Action 完全一致的 `{success, data|error}` 结构。
 */
async function requestAi<TInput, TOutput>(
    path: string,
    payload: TInput
): Promise<AiApiResponse<TOutput>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        // 服务端始终返回 JSON；解析失败时给出明确提示，避免静默吞错。
        let body: unknown;
        try {
            body = await response.json();
        } catch {
            return { success: false, error: `服务端返回异常响应（HTTP ${response.status}）。` };
        }

        const result = body as AiApiResponse<TOutput>;
        if (result && typeof result === 'object' && 'success' in result) {
            return result;
        }

        return { success: false, error: `服务端返回结构异常（HTTP ${response.status}）。` };
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return { success: false, error: TIMEOUT_MESSAGE };
        }
        logger.error('[ai-client] 请求服务端 AI 接口失败：', error);
        return { success: false, error: NETWORK_ERROR_MESSAGE };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * 获取症状分析结果。
 *
 * @param input - 症状描述与可选周期数据。
 * @returns 分析结果或错误信息。
 */
export function requestSymptomAnalysis(
    input: AnalyzeSymptomsInput
): Promise<AiApiResponse<AnalyzeSymptomsOutput>> {
    return requestAi<AnalyzeSymptomsInput, AnalyzeSymptomsOutput>(
        AI_API_PATHS['symptom-analysis'],
        input
    );
}

/**
 * 获取周期预测结果。
 *
 * @param input - 周期长度、经期长度、预测数量与上次经期开始日期。
 * @returns 预测结果或错误信息。
 */
export function requestCyclePrediction(
    input: PredictFutureCyclesInput
): Promise<AiApiResponse<PredictFutureCyclesOutput>> {
    return requestAi<PredictFutureCyclesInput, PredictFutureCyclesOutput>(
        AI_API_PATHS['cycle-prediction'],
        input
    );
}

/**
 * 获取个性化健康建议。
 *
 * @param input - 周期 / 生育 / 症状等数据。
 * @returns 建议结果或错误信息。
 */
export function requestPersonalizedRecommendations(
    input: PersonalizedRecommendationsInput
): Promise<AiApiResponse<PersonalizedRecommendationsOutput>> {
    return requestAi<PersonalizedRecommendationsInput, PersonalizedRecommendationsOutput>(
        AI_API_PATHS.recommendations,
        input
    );
}
