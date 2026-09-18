/**
 * @fileOverview 讯飞星火 Lite 大模型的 Node.js 调用客户端（WebSocket 流式接口）。
 *
 * 接口文档：https://www.xfyun.cn/doc/spark/Web.html
 * 鉴权文档：https://www.xfyun.cn/doc/spark/general_url_authentication.html
 *
 * 设计要点：
 * - 星火 WebSocket 接口为「一次问答一次连接」的短链接模式，因此每次调用都新建连接；
 * - 服务端以流式分片返回，最后一片的 `header.status === 2` 表示结束；
 * - 鉴权失败 / 超时会优先重试一次（重新签名握手，避免 300s 时间偏差导致的 401）；
 * - 本模块只在服务端运行（`'use server'` 的 action 内），不依赖浏览器 WebSocket。
 */

import {config as loadDotenv} from 'dotenv';
// 必须先引入运行时补丁（设置 WS_NO_BUFFER_UTIL），再引入 ws，详见 runtime.ts 注释。
import './runtime';
import WebSocket from 'ws';
import {
    SPARK_LITE_DOMAIN,
    SPARK_LITE_MAX_TOKENS_LIMIT,
    SPARK_STATUS_LAST,
    getSparkConfig,
    getSparkWssUrl,
    type SparkConfig,
} from './config';
import {buildSparkAuthUrl} from './auth';
import {logger} from '@/lib/logger';

// 本地开发时从 .env 读取密钥；平台部署时由环境变量 / 密钥仓库注入。
loadDotenv();

/** 对话角色，取值与星火接口一致。 */
export type SparkRole = 'system' | 'user' | 'assistant';

/**
 * 发送给星火的对话消息。
 */
export interface SparkMessage {
    /** 角色：system 仅用于设置对话背景（Lite 版本不保证支持，建议由服务端拼接进 user 内容）。 */
    role: SparkRole;
    /** 消息正文。 */
    content: string;
}

/**
 * 单次调用的可选参数。
 */
export interface SparkChatOptions {
    /** 核采样阈值，取值范围 (0, 1]，默认 0.5。 */
    temperature?: number;
    /** 回答的最大 tokens 数，Lite 版本取值范围 [1, 4096]，默认 2048。 */
    maxTokens?: number;
    /** 单次请求整体超时时间（毫秒），默认 60s。 */
    timeoutMs?: number;
    /** 鉴权失败 / 网络异常时的额外重试次数，默认 1 次。 */
    retries?: number;
}

/** 默认单次请求超时（毫秒）。 */
const DEFAULT_TIMEOUT_MS = 60_000;

/** 默认重试次数：仅针对鉴权、超时、网络类可恢复错误。 */
const DEFAULT_RETRIES = 1;

/** 单条消息内容长度上限（字符），超出直接报错，避免无谓消耗 token。 */
const MAX_MESSAGE_CHARS = 8000;

/**
 * 星火返回的错误响应结构。
 */
interface SparkErrorPayload {
    header?: {
        code?: number;
        message?: string;
        sid?: string;
        status?: number;
    };
}

/**
 * 星火返回的流式数据分片结构。
 */
interface SparkChunkPayload extends SparkErrorPayload {
    payload?: {
        choices?: {
            status?: number;
            seq?: number;
            text?: Array<{content?: string; role?: string; index?: number}>;
        };
    };
}

/**
 * 判断错误是否属于「可重试」类型。
 *
 * 鉴权类问题（时间偏差导致的签名失效）与网络/超时问题可以通过重新握手修复；
 * 参数类、内容审核类错误重试无意义，直接失败。
 *
 * @param error - 捕获到的异常。
 * @returns 是否应该重试。
 */
function isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message;
    const retryableKeywords = [
        '鉴权',
        '授权',
        '401',
        '超时',
        '网络',
        'socket hang up',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        // 星火错误码
        '10009', // 和引擎建立连接失败
        '10010', // 与后端引擎通信异常
        '10110', // 服务忙 / 并发不足
        '10222', // 引擎网络异常
        '11202', // 秒级流控
        '11203', // 并发流控
    ];

    return retryableKeywords.some(keyword => message.includes(keyword));
}

/**
 * 组装星火请求体。
 *
 * @param config - 星火配置。
 * @param messages - 对话消息列表。
 * @param options - 调用参数。
 * @returns 可直接 JSON.stringify 的请求体。
 */
function buildRequestBody(
    config: SparkConfig,
    messages: SparkMessage[],
    options: SparkChatOptions
): Record<string, unknown> {
    const maxTokens = Math.min(
        Math.max(options.maxTokens ?? 2048, 1),
        SPARK_LITE_MAX_TOKENS_LIMIT
    );

    return {
        header: {
            app_id: config.appId,
            // uid 为可选的用户标识，服务端仅用于后续扩展与排障，此处固定短标识。
            uid: 'womenhealth-web',
        },
        parameter: {
            chat: {
                domain: SPARK_LITE_DOMAIN,
                temperature: options.temperature ?? 0.5,
                max_tokens: maxTokens,
            },
        },
        payload: {
            message: {
                // 星火要求 text 数组内的 content 累计 token 不超过模型上下文上限。
                text: messages.map(message => ({
                    role: message.role,
                    content: message.content,
                })),
            },
        },
    };
}

/**
 * 发起一次流式对话请求，并在服务端返回全部内容后 resolve。
 *
 * @param messages - 对话消息列表（最后一条必须是 user）。
 * @param options - 调用参数。
 * @returns 模型回复的完整文本。
 * @throws 当配置缺失、鉴权失败、服务端返回错误码或超时时抛出错误。
 */
export async function sparkChat(
    messages: SparkMessage[],
    options: SparkChatOptions = {}
): Promise<string> {
    if (messages.length === 0) {
        throw new Error('星火调用失败：messages 不能为空。');
    }

    const overlong = messages.find(message => message.content.length > MAX_MESSAGE_CHARS);
    if (overlong) {
        throw new Error(
            `星火调用失败：单条消息长度超过 ${MAX_MESSAGE_CHARS} 字符，请精简输入后重试。`
        );
    }

    const config = getSparkConfig();
    const retries = options.retries ?? DEFAULT_RETRIES;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await sparkChatOnce(config, messages, options);
        } catch (error) {
            lastError = error;

            if (attempt >= retries || !isRetryableError(error)) {
                break;
            }

            // 指数退避：1s / 2s，给鉴权时间偏差与服务端瞬时故障留出恢复窗口。
            const backoffMs = 1000 * 2 ** attempt;
            logger.warn(
                `[spark] 第 ${attempt + 1} 次调用失败，${backoffMs}ms 后重试：`,
                error instanceof Error ? error.message : error
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error(`星火调用失败：${String(lastError)}`);
}

/**
 * 执行单次星火 WebSocket 对话（不含重试逻辑）。
 *
 * @param config - 星火配置。
 * @param messages - 对话消息列表。
 * @param options - 调用参数。
 * @returns 模型回复的完整文本。
 */
function sparkChatOnce(
    config: SparkConfig,
    messages: SparkMessage[],
    options: SparkChatOptions
): Promise<string> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise<string>((resolve, reject) => {
        let settled = false;
        let answer = '';
        let sid = '';

        // 每次调用重新签名握手：星火为短链接模式，且签名的 date 有效期仅 300s。
        const authUrl = buildSparkAuthUrl(config, getSparkWssUrl());
        const socket = new WebSocket(authUrl);

        /**
         * 统一收口：确保 resolve / reject 只生效一次，并释放连接与定时器。
         */
        const finish = (error: Error | null) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            try {
                socket.close();
            } catch {
                // 连接可能已关闭，忽略关闭异常。
            }
            if (error) {
                reject(error);
            } else {
                resolve(answer);
            }
        };

        const timer = setTimeout(() => {
            finish(new Error(`星火调用超时（${timeoutMs}ms），sid=${sid || 'unknown'}`));
        }, timeoutMs);

        socket.on('open', () => {
            try {
                socket.send(JSON.stringify(buildRequestBody(config, messages, options)));
            } catch (error) {
                finish(new Error(`星火请求体序列化失败：${String(error)}`));
            }
        });

        socket.on('message', (raw: WebSocket.RawData) => {
            let chunk: SparkChunkPayload;

            try {
                chunk = JSON.parse(raw.toString()) as SparkChunkPayload;
            } catch {
                finish(new Error('星火返回非 JSON 响应，无法解析。'));
                return;
            }

            const header = chunk.header ?? {};
            sid = header.sid ?? sid;

            if (header.code !== 0) {
                // 服务端显式返回错误码，附带 code / message / sid 便于排障。
                finish(
                    new Error(
                        `星火返回错误：code=${header.code}, message=${header.message}, sid=${sid}`
                    )
                );
                return;
            }

            const textList = chunk.payload?.choices?.text ?? [];
            for (const item of textList) {
                if (item.content) {
                    answer += item.content;
                }
            }

            if (header.status === SPARK_STATUS_LAST) {
                finish(null);
            }
        });

        socket.on('error', (error: Error) => {
            finish(new Error(`星火 WebSocket 连接异常：${error.message}`));
        });

        socket.on('close', () => {
            // 服务端主动断开但未发出最终分片时，视为异常结束。
            finish(new Error(`星火连接提前关闭，sid=${sid || 'unknown'}`));
        });
    });
}

/**
 * 拼接对话式提示词，供 Lite 版本使用。
 *
 * Lite 版本对 system 角色支持有限，因此统一把系统指令放在 user 内容首部，
 * 既保证指令生效，又避免 `10049 system 消息位置错误`。
 *
 * @param systemInstruction - 系统指令（角色设定 / 输出要求）。
 * @param userContent - 用户内容。
 * @returns 合并后的单条 user 消息内容。
 */
export function composePrompt(systemInstruction: string, userContent: string): string {
    return `${systemInstruction.trim()}\n\n${userContent.trim()}`;
}
