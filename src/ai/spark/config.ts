/**
 * @fileOverview 讯飞星火认知大模型（Spark Lite）接入配置。
 *
 * 相关文档：
 * - WebSocket 接口文档：https://www.xfyun.cn/doc/spark/Web.html
 * - WebSocket 通用鉴权：https://www.xfyun.cn/doc/spark/general_url_authentication.html
 */

/**
 * 星火 Lite 版本的 WebSocket 请求地址。
 *
 * 注意：不同模型版本对应的请求地址不同，Lite 版本固定为 v1.1/chat，
 * 且请求时 `parameter.chat.domain` 必须传 `lite`，二者需严格对应，
 * 否则服务端会返回 10404（path 与 domain 不匹配）。
 */
export const SPARK_LITE_WSS_URL = 'wss://spark-api.xf-yun.com/v1.1/chat';

/**
 * 获取星火 Lite 的 WebSocket 请求地址。
 *
 * 默认使用官方生产地址；仅在做本地联调 / 自动化测试（指向 mock 服务端）时，
 * 可通过环境变量 `SPARK_WSS_URL` 覆盖，生产环境无需设置。
 *
 * @returns 星火 Lite 的 WebSocket 请求地址。
 */
export function getSparkWssUrl(): string {
    return process.env.SPARK_WSS_URL?.trim() || SPARK_LITE_WSS_URL;
}

/** 星火 Lite 版本对应的 domain 取值。 */
export const SPARK_LITE_DOMAIN = 'lite';

/** 星火 Lite 单次请求 `max_tokens` 上限。 */
export const SPARK_LITE_MAX_TOKENS_LIMIT = 4096;

/** 星火 Lite 服务端返回的 header.status：2 表示本次回复的最后一片。 */
export const SPARK_STATUS_LAST = 2;

/** 服务端错误码：10907 表示 token 数超限（对话历史 + 问题字数过多）。 */
export const SPARK_CODE_TOKEN_LIMIT = 10907;

/**
 * 星火鉴权与调用的运行时配置。
 */
export interface SparkConfig {
    /** 应用 AppID，来自讯飞开放平台控制台。 */
    appId: string;
    /** APIKey，来自讯飞开放平台控制台。 */
    apiKey: string;
    /** APISecret，来自讯飞开放平台控制台（仅用于本地签名，禁止外泄）。 */
    apiSecret: string;
}

/**
 * 从环境变量读取星火配置。
 *
 * 密钥只允许通过环境变量 / 平台密钥仓库注入，**严禁**硬编码到代码仓库。
 *
 * @returns 星火调用配置。
 * @throws 当任一必需的环境变量缺失时抛出错误（快速失败，避免用空密钥发起无意义请求）。
 */
export function getSparkConfig(): SparkConfig {
    const appId = process.env.SPARK_APP_ID;
    const apiKey = process.env.SPARK_API_KEY;
    const apiSecret = process.env.SPARK_API_SECRET;

    const missing = [
        ['SPARK_APP_ID', appId],
        ['SPARK_API_KEY', apiKey],
        ['SPARK_API_SECRET', apiSecret],
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(
            `缺少讯飞星火配置：${missing.join('、')}。请在环境变量或平台密钥仓库中注入后重试。`
        );
    }

    return {
        appId: appId as string,
        apiKey: apiKey as string,
        apiSecret: apiSecret as string,
    };
}
