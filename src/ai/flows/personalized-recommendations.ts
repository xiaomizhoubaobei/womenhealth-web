'use server';

/**
 * @fileOverview 基于讯飞星火 Lite 的个性化健康建议生成能力。
 *
 * - generatePersonalizedRecommendations - 根据用户数据生成个性化建议。
 * - PersonalizedRecommendationsInput - 输入类型。
 * - PersonalizedRecommendationsOutput - 输出类型。
 *
 * 模型接入：讯飞星火 Lite（wss://spark-api.xf-yun.com/v1.1/chat，domain=lite）
 * 接口文档：https://www.xfyun.cn/doc/spark/Web.html
 */

import {composePrompt, sparkChat} from '@/ai/spark/client';
import {parseJsonFromText} from '@/ai/spark/json';

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

/** 单条建议的字符上限，防止模型输出过长的段落挤爆界面。 */
const MAX_DESCRIPTION_CHARS = 400;

/** 建议条数上限。 */
const MAX_RECOMMENDATIONS = 6;

/** 模型输出必须遵守的 JSON 结构说明。 */
const OUTPUT_CONTRACT = `严格只输出一个 JSON 对象，不要输出任何解释文字或 Markdown 代码块，结构如下：
{"recommendations": [{"type": "建议类型，如 生活方式 / 饮食 / 就医咨询", "description": "具体建议内容"}]}
recommendations 数组包含 3 到 6 条建议，每条 description 不超过 150 字。`;

/**
 * 校验模型返回的 JSON 结构。
 *
 * @param value - 解析后的 JSON。
 * @returns 返回错误描述字符串表示不合法，返回 null 表示合法。
 */
function validateOutput(value: unknown): string | null {
    if (typeof value !== 'object' || value === null) {
        return '顶层必须是对象';
    }

    const recommendations = (value as Record<string, unknown>).recommendations;
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return 'recommendations 必须是非空数组';
    }

    for (const [index, item] of recommendations.entries()) {
        if (typeof item !== 'object' || item === null) {
            return `recommendations[${index}] 必须是对象`;
        }

        const record = item as Record<string, unknown>;
        if (typeof record.type !== 'string' || record.type.trim() === '') {
            return `recommendations[${index}].type 必须是非空字符串`;
        }
        if (typeof record.description !== 'string' || record.description.trim() === '') {
            return `recommendations[${index}].description 必须是非空字符串`;
        }
    }

    return null;
}

/**
 * 规范化模型输出：裁剪条数与长度，避免超长内容直接渲染。
 *
 * @param output - 通过结构校验的模型输出。
 * @returns 规范化后的输出。
 */
function normalizeOutput(
    output: PersonalizedRecommendationsOutput
): PersonalizedRecommendationsOutput {
    return {
        recommendations: output.recommendations
            .slice(0, MAX_RECOMMENDATIONS)
            .map(item => ({
                type: item.type.trim(),
                description: item.description.trim().slice(0, MAX_DESCRIPTION_CHARS),
            })),
    };
}

/**
 * 根据追踪数据生成个性化健康建议。
 *
 * @param input - 周期、生育、怀孕与症状分析数据。
 * @returns 个性化建议列表。
 * @throws 当星火配置缺失、调用失败或模型输出无法解析时抛出错误。
 */
export async function generatePersonalizedRecommendations(
    input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
    const instruction = `你是一位专注于女性健康的健康管理助手。
请根据用户追踪的周期、生育体征、怀孕情况与症状分析数据，给出务实、可执行的个性化建议，
例如生活方式调整、饮食与运动建议，或提示在何种情况下应当咨询医生。
重要约束：
- 建议必须基于用户实际数据，避免空泛套话；
- 不提供药物处方或明确诊断；必要时建议就医；
- 语言使用简体中文，温和、专业、易于执行。
${OUTPUT_CONTRACT}`;

    const userContent = `周期数据：${input.cycleData}
生育数据：${input.fertilityData}
怀孕数据：${input.pregnancyData?.trim() ? input.pregnancyData : '（不适用）'}
症状分析：${input.symptomAnalysis}`;

    const raw = await sparkChat([
        {role: 'user', content: composePrompt(instruction, userContent)},
    ]);

    return normalizeOutput(
        parseJsonFromText<PersonalizedRecommendationsOutput>(raw, validateOutput)
    );
}
