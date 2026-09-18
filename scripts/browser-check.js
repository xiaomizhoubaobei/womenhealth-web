#!/usr/bin/env node
/**
 * 本地/CI 可用的星火鉴权与 WebSocket 连通性自检脚本（无第三方依赖）。
 *
 * 作用：
 * 1. 校验 SPARK_APP_ID / SPARK_API_KEY / SPARK_API_SECRET 是否已注入；
 * 2. 按官方鉴权文档生成握手地址，并实际发起一次最小对话，验证鉴权与联网可用性。
 *
 * 用法：
 *   SPARK_APP_ID=xxx SPARK_API_KEY=xxx SPARK_API_SECRET=xxx node scripts/browser-check.js
 * 或不传参，由 .env / 环境变量提供。
 *
 * 注意：脚本不会打印任何密钥明文，仅打印鉴权串长度与握手结果。
 */

const { createHmac } = require('crypto');
const { config: loadDotenv } = require('dotenv');

loadDotenv();

const WSS_URL = 'wss://spark-api.xf-yun.com/v1.1/chat';
const DOMAIN = 'lite';

/** 生成 RFC1123 时间戳（与 Python wsgiref.format_date_time 输出一致）。 */
function rfc1123(date) {
  const utc = date.toUTCString();
  return /^\w{3}, \d{2} /.test(utc) ? utc : utc.replace(/^(\w{3}, )(\d) /, '$10$2 ');
}

/** 按官方文档生成鉴权握手地址。 */
function buildAuthUrl({ apiKey, apiSecret }) {
  const parsed = new URL(WSS_URL);
  const date = rfc1123(new Date());
  const signatureOrigin = `host: ${parsed.host}\ndate: ${date}\nGET ${parsed.pathname} HTTP/1.1`;
  const signature = createHmac('sha256', apiSecret).update(signatureOrigin, 'utf8').digest('base64');
  const authorizationOrigin =
    `api_key="${apiKey}", algorithm="hmac-sha256", ` +
    `headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin, 'utf8').toString('base64');
  parsed.search = new URLSearchParams({ authorization, date, host: parsed.host }).toString();
  return parsed.toString();
}

async function main() {
  const appId = process.env.SPARK_APP_ID;
  const apiKey = process.env.SPARK_API_KEY;
  const apiSecret = process.env.SPARK_API_SECRET;

  const missing = [['SPARK_APP_ID', appId], ['SPARK_API_KEY', apiKey], ['SPARK_API_SECRET', apiSecret]]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error(`[spark-check] 缺少配置：${missing.join('、')}（跳过联网自检）`);
    process.exit(2);
  }

  console.log('[spark-check] 配置齐全，开始生成鉴权地址');
  const url = buildAuthUrl({ apiKey, apiSecret });
  console.log(`[spark-check] 握手地址已生成，authorization 长度=${new URL(url).searchParams.get('authorization').length}`);

  let WebSocket;
  try {
    WebSocket = require('ws');
  } catch {
    console.error('[spark-check] 未安装 ws 依赖，请先执行依赖安装');
    process.exit(1);
  }

  const socket = new WebSocket(url);
  let answer = '';
  const timer = setTimeout(() => {
    console.error('[spark-check] 30s 内未收到完整回复，判定超时');
    socket.terminate();
    process.exit(1);
  }, 30000);

  socket.on('open', () => {
    socket.send(JSON.stringify({
      header: { app_id: appId, uid: 'womenhealth-web-check' },
      parameter: { chat: { domain: DOMAIN, temperature: 0.1, max_tokens: 64 } },
      payload: { message: { text: [{ role: 'user', content: '请只回复两个字：正常' }] } },
    }));
  });

  socket.on('message', (raw) => {
    const data = JSON.parse(raw.toString());
    if (data.header.code !== 0) {
      console.error(`[spark-check] 服务端返回错误：code=${data.header.code}, message=${data.header.message}`);
      clearTimeout(timer);
      socket.close();
      process.exit(1);
    }
    for (const item of data.payload?.choices?.text ?? []) {
      if (item.content) answer += item.content;
    }
    if (data.header.status === 2) {
      clearTimeout(timer);
      console.log(`[spark-check] 鉴权与调用成功，模型回复：${answer.trim()}`);
      socket.close();
      process.exit(0);
    }
  });

  socket.on('error', (error) => {
    console.error(`[spark-check] WebSocket 异常：${error.message}`);
    clearTimeout(timer);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(`[spark-check] 自检失败：${error.message}`);
  process.exit(1);
});
