'use server';

/**
 * @fileOverview 基于讯飞星火 Lite 的未来月经周期与排卵日期预测。
 *
 * - predictFutureCycles - 预测未来的月经周期和排卵日期。
 * - PredictFutureCyclesInput - 输入类型。
 * - PredictFutureCyclesOutput - 输出类型。
 *
 * 模型接入：讯飞星火 Lite（wss://spark-api.xf-yun.com/v1.1/chat，domain=lite）
 * 接口文档：https://www.xfyun.cn/doc/spark/Web.html
 */

import {composePrompt, sparkChat} from '@/ai/spark/client';
import {parseJsonFromText} from '@/ai/spark/json';
import type {
    PredictFutureCyclesInput,
    PredictFutureCyclesOutput,
} from '@/lib/ai-types';

/** YYYY-MM-DD 日期格式校验。 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 模型输出必须遵守的 JSON 结构说明。 */
const OUTPUT_CONTRACT = `严格只输出一个 JSON 对象，不要输出任何解释文字或 Markdown 代码块，结构如下：
{"predictedCycles": [{"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "ovulationDate": "YYYY-MM-DD"}]}
其中 predictedCycles 数组长度必须等于要求的预测周期数，日期必须是 YYYY-MM-DD 格式的纯字符串。`;

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

    const predicted = (value as Record<string, unknown>).predictedCycles;
    if (!Array.isArray(predicted) || predicted.length === 0) {
        return 'predictedCycles 必须是非空数组';
    }

    for (const [index, item] of predicted.entries()) {
        if (typeof item !== 'object' || item === null) {
            return `predictedCycles[${index}] 必须是对象`;
        }

        const cycle = item as Record<string, unknown>;
        for (const field of ['startDate', 'endDate', 'ovulationDate'] as const) {
            const fieldValue = cycle[field];
            if (typeof fieldValue !== 'string' || !DATE_PATTERN.test(fieldValue)) {
                return `predictedCycles[${index}].${field} 必须是 YYYY-MM-DD 格式字符串`;
            }
        }
    }

    return null;
}

/**
 * 预测未来的月经周期与排卵日期。
 *
 * @param input - 周期长度、经期长度、预测数量与上次经期开始日期。
 * @returns 预测结果。
 * @throws 当星火配置缺失、调用失败或模型输出无法解析时抛出错误。
 */
export async function predictFutureCycles(
    input: PredictFutureCyclesInput
): Promise<PredictFutureCyclesOutput> {
    const instruction = `你是一位专注于女性生殖健康的助手，擅长根据历史周期数据推算未来的周期安排。
计算规则参考：
- 下一个周期开始日期 = 上一个周期开始日期 + 典型周期长度；
- 周期结束日期 = 周期开始日期 + 经期长度 - 1 天；
- 排卵日通常出现在下次月经来潮前约 14 天，即「周期开始日期 + 周期长度 - 14 天」。
请严格按照上述规则推算，确保日期链条连续且格式正确。
${OUTPUT_CONTRACT}`;

    const userContent = `这是用户的数据：
- 典型周期长度：${input.cycleLength} 天
- 典型经期长度：${input.periodLength} 天
- 上次经期开始日期：${input.lastPeriodStartDate}
- 需要预测的未来周期数：${input.numberOfCycles}`;

    const raw = await sparkChat([
        {role: 'user', content: composePrompt(instruction, userContent)},
    ]);

    return parseJsonFromText<PredictFutureCyclesOutput>(raw, validateOutput);
}
