/**
 * @fileOverview 星火接入层的运行时兼容补丁。
 *
 * 背景（已在本地实测复现，非猜测）：
 * - `ws` 的 `lib/buffer-util.js` 会 `try { require('bufferutil') } catch {}` 尝试加载**原生加速模块**；
 *   若加载成功，它会把自己的 `mask()` 重写为「短帧走 JS、长帧走原生」的实现；
 * - Next.js 在打包 Route Handler 时，会把未被解析成功的**可选原生依赖**替换为空模块
 *   （打包结果里可见 `9727:()=>{}`）。于是 `require('bufferutil')` 在 `try` 里**不抛错**，
 *   但返回的是 `{}`；后续客户端发送掩码帧时执行 `bufferUtil.mask(...)` 即报
 *   `TypeError: b.mask is not a function`，导致所有星火调用失败；
 * - 普通 Node 进程（非 Next 打包）能正常解析 `bufferutil`，所以该问题**只在 Next 运行时出现**。
 *
 * 处理方式：在加载 `ws` 之前设置 `WS_NO_BUFFER_UTIL=1`，让 `ws` 走纯 JS 掩码实现，
 * 彻底绕开「空原生模块」。该实现与原生版本协议一致，仅失去长帧的微小性能优化，
 * 对「一次问答一次握手」的星火短连接场景无实际影响。
 *
 * 注意：必须由**所有**引入 `ws` 的模块在本模块导入后再引入 `ws`（运行时查表即生效），
 * 否则补丁可能来不及应用。
 */

if (!process.env.WS_NO_BUFFER_UTIL) {
    // 必须在首次 `require('ws')` 之前设置，故使用赋值而非 import。
    process.env.WS_NO_BUFFER_UTIL = '1';
}

export {};
