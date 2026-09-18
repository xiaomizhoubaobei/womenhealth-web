/**
 * @fileOverview `/api/ai/*` 路由的公共工具。
 *
 * 职责：
 * - 解析并校验请求体（防止把非法结构透传到模型层）；
 * - 统一错误归一化：密钥缺失给出可操作提示，其余错误收敛为友好文案并保留服务端日志。
 *
 * 注意：本文件只在 Node.js 运行时（Route Handler）使用，不会进入浏览器产物。
 */

import { NextResponse } from 'next/server';
import type { AiApiResponse } from '@/lib/ai-types';
import { logger } from '@/lib/logger';

/** 请求体上限（字符），防止超大 payload 直接打到模型接口。 */
const MAX_BODY_CHARS = 100_000;

/**
 * 读取并解析 JSON 请求体。
 *
 * @param request - 入站请求。
 * @returns 解析后的对象。
 * @throws 当请求体不是合法 JSON 对象时抛出。
 */
export async function readJsonBody<T extends object>(request: Request): Promise<T> {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) {
        throw new Error('请求体过大，请精简后重试。');
    }
    if (!text.trim()) {
        throw new Error('请求体不能为空。');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error('请求体必须是合法 JSON。');
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('请求体必须是 JSON 对象。');
    }

    return parsed as T;
}

/**
 * 执行 AI 服务并统一包装响应。
 *
 * 成功 → `{success: true, data}`；失败 → `{success: false, error}`。
 * 业务失败使用 200 + `success:false`，与前端既有判断逻辑保持一致（避免把业务错误当作网络错误）。
 *
 * @param task - 实际执行的服务端任务。
 * @param clientErrorMessage - 面向用户的失败提示。
 * @returns Next.js 响应。
 */
export async function handleAiRequest<T>(
    task: () => Promise<T>,
    clientErrorMessage: string
): Promise<NextResponse<AiApiResponse<T>>> {
    try {
        const data = await task();
        return NextResponse.json<AiApiResponse<T>>({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // 密钥缺失属于部署配置问题：把缺失变量名透出去，便于运维快速定位，且不包含任何密钥明文。
        if (message.includes('缺少讯飞星火配置')) {
            logger.error('[api/ai] 星火配置缺失：', message);
            return NextResponse.json<AiApiResponse<T>>({ success: false, error: message });
        }

        logger.error('[api/ai] 调用失败：', error);
        return NextResponse.json<AiApiResponse<T>>({ success: false, error: clientErrorMessage });
    }
}
