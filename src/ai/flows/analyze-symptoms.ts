'use server';

/**
 * @fileOverview 基于讯飞星火 Lite 的症状分析能力。
 *
 * - analyzeSymptoms - 分析用户记录的症状，识别潜在模式并给出个性化见解。
 * - AnalyzeSymptomsInput - 输入类型。
 * - AnalyzeSymptomsOutput - 输出类型。
 *
 * 模型接入：讯飞星火 Lite（wss://spark-api.xf-yun.com/v1.1/chat，domain=lite）
 * 接口文档：https://www.xfyun.cn/doc/spark/Web.html
 */

import {composePrompt, sparkChat} from '@/ai/spark/client';
import {parseJsonFromText} from '@/ai/spark/json';

/**
 * 症状分析输入（放宽为可选字段，避免调用方传 undefined 时被 zod 拒绝）。
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

/** 模型输出必须遵守的 JSON 结构说明。 */
const OUTPUT_CONTRACT = `严格只输出一个 JSON 对象，不要输出任何解释文字或 Markdown 代码块，结构如下：
{"analysis": "对症状和潜在健康问题的分析", "recommendations": "基于分析给出的个性化建议"}`;

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

    const record = value as Record<string, unknown>;
    if (typeof record.analysis !== 'string' || record.analysis.trim() === '') {
        return '缺少非空的 analysis 字段';
    }
    if (typeof record.recommendations !== 'string' || record.recommendations.trim() === '') {
        return '缺少非空的 recommendations 字段';
    }

    return null;
}

/**
 * 分析症状并给出个性化建议。
 *
 * @param input - 症状与可选的周期数据。
 * @returns 分析文本与建议文本。
 * @throws 当星火配置缺失、调用失败或模型输出无法解析时抛出错误。
 */
export async function analyzeSymptoms(
    input: AnalyzeSymptomsInput
): Promise<AnalyzeSymptomsOutput> {
    const instruction = `你是一位专注于女性生殖健康的健康科普助手。
请分析用户描述的症状（以及可选的周期数据），识别潜在的模式与需要注意的健康问题，并给出个性化的生活方式建议。
重要约束：
- 你不是医生，必须明确提醒用户这不构成医疗诊断，若症状严重或持续请及时就医。
- 语言使用简体中文，客观、温和、易于理解。
${OUTPUT_CONTRACT}`;

    const userContent = `症状描述：${input.symptoms}
周期数据：${input.cycleData?.trim() ? input.cycleData : '（未提供）'}`;

    const raw = await sparkChat([
        {role: 'user', content: composePrompt(instruction, userContent)},
    ]);

    return parseJsonFromText<AnalyzeSymptomsOutput>(raw, validateOutput);
}
