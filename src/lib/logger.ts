/**
 * @fileOverview 项目统一日志出口（浏览器 / Node.js 双端可用）。
 *
 * 约定（见 AGENTS.md 2.3）：核心业务代码统一使用本 logger，不再直接调用 `console.*`。
 *
 * 设计要点：
 * - **零依赖**：避免给客户端产物引入额外体积；
 * - **双端安全**：不引用任何 Node.js 专有 API（如 `process.stdout` 之外的能力），
 *   因此可同时被服务端（Server Action / Route Handler）与客户端组件引入；
 * - **统一前缀**：所有输出都带 `[womenhealth]` 前缀，便于在日志平台上过滤；
 * - **可分级**：`debug` 仅在非生产环境输出，避免生产日志噪音；
 * - **可收敛**：后续若接入远端日志（如 Sentry / 云日志），只需改动本文件。
 */

/** 统一日志前缀，便于在日志系统中按来源过滤。 */
const LOG_PREFIX = '[womenhealth]';

/**
 * 判断当前是否处于生产环境。
 *
 * 使用 `process.env.NODE_ENV` 取值；在浏览器端该表达式会被构建工具静态替换，
 * 因此不会因为访问 `process` 而报错（Next.js 已内置此处理）。
 *
 * @returns 生产环境返回 `true`。
 */
function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * 将任意类型的异常 / 值归一化为可安全打印的字符串。
 *
 * 对 `Error` 保留 `name` 与 `message`（堆栈由宿主环境在控制台展开），
 * 其余类型做字符串化，避免传入对象时打印出无意义的构造器名称。
 *
 * @param value - 待归一化的值。
 * @returns 可读的描述字符串。
 */
function normalize(value: unknown): string {
    if (value instanceof Error) {
        return `${value.name}: ${value.message}`;
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

/**
 * 项目统一 logger。
 *
 * 所有方法均接受「消息 + 任意上下文字段」，上下文会原样透传给底层控制台，
 * 便于在浏览器 DevTools / 服务端日志中展开查看对象细节。
 */
export const logger = {
    /**
     * 调试日志：仅在非生产环境输出。
     * @param message - 日志消息（建议带模块前缀，如 `[spark]`）。
     * @param args - 附加上下文。
     */
    debug(message: string, ...args: unknown[]): void {
        if (!isProduction()) {
            console.debug(`${LOG_PREFIX} ${message}`, ...args);
        }
    },

    /**
     * 普通信息日志。
     * @param message - 日志消息（建议带模块前缀）。
     * @param args - 附加上下文。
     */
    info(message: string, ...args: unknown[]): void {
        console.info(`${LOG_PREFIX} ${message}`, ...args);
    },

    /**
     * 警告日志：可恢复的异常或降级路径（如限流重试、配置缺失但已降级）。
     * @param message - 日志消息（建议带模块前缀）。
     * @param args - 附加上下文。
     */
    warn(message: string, ...args: unknown[]): void {
        console.warn(`${LOG_PREFIX} ${message}`, ...args);
    },

    /**
     * 错误日志：需要人工关注 / 排查的异常。
     *
     * 传入 `Error` 时会保留完整错误对象（含堆栈）作为上下文，便于后续诊断。
     *
     * @param message - 日志消息（建议带模块前缀）。
     * @param args - 附加上下文，通常传入原始 `error`。
     */
    error(message: string, ...args: unknown[]): void {
        const detail = args.map(normalize).join(' ');
        console.error(
            detail ? `${LOG_PREFIX} ${message} ${detail}` : `${LOG_PREFIX} ${message}`,
            ...args
        );
    },
};

export default logger;
