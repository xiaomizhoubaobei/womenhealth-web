'use server';

import { analyzeSymptoms, AnalyzeSymptomsInput } from "@/ai/flows/analyze-symptoms";
import { generatePersonalizedRecommendations, PersonalizedRecommendationsInput } from "@/ai/flows/personalized-recommendations";
import { predictFutureCycles, PredictFutureCyclesInput } from "@/ai/flows/predict-future-cycles";

/**
 * 获取周期预测。
 * @param input - 预测未来周期的输入数据。
 * @returns 包含预测结果的对象，或在出错时返回错误信息。
 */
export async function getCyclePrediction(input: PredictFutureCyclesInput) {
    try {
        const result = await predictFutureCycles(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
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
        const result = await analyzeSymptoms(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
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
        const result = await generatePersonalizedRecommendations(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: '获取个性化建议失败。' };
    }
}
