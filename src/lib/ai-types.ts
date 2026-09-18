/**
 * @fileOverview AI 能力的输入 / 输出类型与客户端 API 共用定义。
 *
 * 为什么单独抽出这个文件：
 * - `src/ai/**` 属于服务端模块（其文件带 `'use server'`，并直接引用 `ws`、
 *   `node:crypto`、`process.env` 等 Node 能力），**禁止**被客户端组件直接 import；
 * - 但客户端组件需要拿到同一套类型、以及统一的请求路径常量；
 * - 因此把「纯类型 + 纯常量」集中在本文件，客户端与服务端共用，保证单一事实来源，
 *   既避免类型漂移，也不会把任何服务端实现（以及认证信息）带进浏览器产物。
 */

/**
 * 症状分析输入。
 */
export interface AnalyzeSymptomsInput {
    /** 所经历症状的详细描述。 */
    symptoms: string;
    /** 可选：关于用户周期的数据，如平均长度或任何不规则性。 */
    cycleData?: string;
}

/**
 * 症状分析输出。
 */
export interface AnalyzeSymptomsOutput {
    /** 对症状和潜在健康问题的分析。 */
    analysis: string;
    /** 基于症状分析的个性化见解和建议。 */
    recommendations: string;
}

/**
 * 周期预测输入。
 */
export interface PredictFutureCyclesInput {
    /** 月经周期的典型长度（天）。 */
    cycleLength: number;
    /** 经期的典型长度（天）。 */
    periodLength: number;
    /** 要预测的未来周期数。 */
    numberOfCycles: number;
    /** 上次月经开始的日期 (YYYY-MM-DD)。 */
    lastPeriodStartDate: string;
}

/**
 * 单个预测出的周期。
 */
export interface PredictedCycle {
    /** 预测的周期开始日期 (YYYY-MM-DD)。 */
    startDate: string;
    /** 预测的周期结束日期 (YYYY-MM-DD)。 */
    endDate: string;
    /** 预测的周期排卵日期 (YYYY-MM-DD)。 */
    ovulationDate: string;
}

/**
 * 周期预测输出。
 */
export interface PredictFutureCyclesOutput {
    /** 预测出的周期列表。 */
    predictedCycles: PredictedCycle[];
}

/**
 * 个性化建议输入。
 */
export interface PersonalizedRecommendationsInput {
    /** 月经周期数据，包括经期日期、流量强度和症状。 */
    cycleData: string;
    /** 生育迹象数据，如基础体温和宫颈粘液观察。 */
    fertilityData: string;
    /** 怀孕相关数据，如果适用。 */
    pregnancyData?: string;
    /** 症状分析数据，提供对潜在健康问题的见解。 */
    symptomAnalysis: string;
}

/**
 * 单条建议。
 */
export interface RecommendationItem {
    /** 建议类型（生活方式、咨询等）。 */
    type: string;
    /** 建议的详细描述。 */
    description: string;
}

/**
 * 个性化建议输出。
 */
export interface PersonalizedRecommendationsOutput {
    /** 个性化健康建议列表。 */
    recommendations: RecommendationItem[];
}

/**
 * 三种 AI 能力的标识。
 */
export type AiCapability = 'symptom-analysis' | 'cycle-prediction' | 'recommendations';

/**
 * 客户端请求的服务端 AI 接口路径。
 *
 * 客户端只认识这些路径；讯飞凭证、WebSocket 握手、签名逻辑全部留在服务端，
 * 浏览器端永远拿不到任何密钥。
 */
export const AI_API_PATHS: Record<AiCapability, string> = {
    'symptom-analysis': '/api/ai/symptom-analysis',
    'cycle-prediction': '/api/ai/cycle-prediction',
    recommendations: '/api/ai/recommendations',
};

/**
 * 服务端 AI 接口的统一响应结构。
 *
 * @template T - 业务数据类型。
 */
export type AiApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };
