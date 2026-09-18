/**
 * @fileOverview 讯飞星火 WebSocket 接口的通用 URL 鉴权实现。
 *
 * 鉴权流程严格遵循官方文档：
 * https://www.xfyun.cn/doc/spark/general_url_authentication.html
 *
 * 核心步骤：
 * 1. 生成 RFC1123 格式的 date（服务端允许 300s 时间偏差）；
 * 2. 拼接签名原文 tmp：`host: {host}\ndate: {date}\nGET {path} HTTP/1.1`；
 * 3. 用 APISecret 对 tmp 做 HMAC-SHA256，再 base64 得到 signature；
 * 4. 组装 `api_key="...", algorithm="hmac-sha256", headers="host date request-line", signature="..."`；
 * 5. 对第 4 步结果整体再 base64，得到最终 authorization；
 * 6. 将 authorization、date、host 作为查询参数拼到 wss 地址上。
 */

import {createHmac} from 'crypto';
import type {SparkConfig} from './config';

/**
 * 将 Date 转换为 RFC1123 / HTTP-date 格式（例如 `Fri, 05 May 2023 10:43:39 GMT`）。
 *
 * 说明：JS 原生 `toUTCString()` 会输出 `Fri, 05 May 2023 10:43:39 GMT`，
 * 与 Python `wsgiref.handlers.format_date_time` 的输出完全一致，可直接复用；
 * 但本函数显式补齐两位数的日（`05` 而非 `5`），以规避不同 Node 实现的差异。
 *
 * @param date - 待格式化的时间。
 * @returns RFC1123 格式的日期字符串。
 */
export function formatRfc1123Date(date: Date): string {
    const toUtc = date.toUTCString();
    // toUTCString 在部分运行时会输出 `Fri, 5 May 2023 ...`，此处统一补齐为两位日。
    return /^\w{3}, \d{2} /.test(toUtc)
        ? toUtc
        : toUtc.replace(/^(\w{3}, )(\d) /, '$10$2 ');
}

/**
 * 生成讯飞星火 WebSocket 握手地址（含鉴权参数）。
 *
 * @param config - 星火配置（需要 apiKey / apiSecret）。
 * @param wssUrl - 目标 wss 地址，例如 `wss://spark-api.xf-yun.com/v1.1/chat`。
 * @param now - 可选，签名使用的时间，默认取当前时间（便于单元测试注入）。
 * @returns 带 authorizated 查询参数的完整握手地址。
 * @throws 当 wssUrl 不是合法的 ws/wss 地址时抛出错误。
 */
export function buildSparkAuthUrl(
    config: Pick<SparkConfig, 'apiKey' | 'apiSecret'>,
    wssUrl: string,
    now: Date = new Date()
): string {
    const parsed = new URL(wssUrl);

    if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:') {
        throw new Error(`星火请求地址协议不合法：${wssUrl}`);
    }

    const host = parsed.host;
    const path = parsed.pathname;
    const date = formatRfc1123Date(now);

    // 步骤 2：按官方文档拼接签名原文，顺序与换行符必须完全一致。
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

    // 步骤 3：HMAC-SHA256(APISecret, tmp) → base64。
    const signature = createHmac('sha256', config.apiSecret)
        .update(signatureOrigin, 'utf8')
        .digest('base64');

    // 步骤 4：组装 authorization 原文。
    const authorizationOrigin =
        `api_key="${config.apiKey}", algorithm="hmac-sha256", ` +
        `headers="host date request-line", signature="${signature}"`;

    // 步骤 5：整体 base64（鉴权串可能含非 ASCII 之外的多字节字符，按 UTF-8 处理）。
    const authorization = Buffer.from(authorizationOrigin, 'utf8').toString('base64');

    // 步骤 6：拼装最终握手地址，查询参数必须 URL 编码。
    const query = new URLSearchParams({
        authorization,
        date,
        host,
    });

    parsed.search = query.toString();
    return parsed.toString();
}
