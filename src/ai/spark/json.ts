/**
 * @fileOverview 从大模型文本回复中稳健地提取 JSON 载荷的通用工具。
 *
 * 大模型（含星火 Lite）即使被要求「只输出 JSON」，也常带有 Markdown 代码块、
 * 前后说明文字或尾随逗号。本模块负责尽最大努力清洗并解析，避免直接 JSON.parse 抛错。
 */

/**
 * 解析错误：当文本中无法提取出合法 JSON 时抛出。
 */
export class SparkJsonParseError extends Error {
    /** 原始模型回复，便于排查提示词问题。 */
    readonly raw: string;

    constructor(message: string, raw: string) {
        super(message);
        this.name = 'SparkJsonParseError';
        this.raw = raw;
    }
}

/**
 * 去除 Markdown 代码块包裹与常见噪声字符。
 *
 * @param raw - 模型原始回复。
 * @returns 清洗后的候选 JSON 文本。
 */
function normalize(raw: string): string {
    let text = raw.trim();

    // 去掉 ```json ... ``` / ``` ... ``` 代码块包裹。
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
        text = fenceMatch[1].trim();
    }

    return text;
}

/**
 * 从文本中截取最外层成对的大括号或方括号片段。
 *
 * 之所以不盲目截取到最后一个 `}`，是因为回复中可能包含多个 JSON 片段或多段说明文字。
 *
 * @param text - 清洗后的文本。
 * @returns 截取出的 JSON 片段，未找到时返回 null。
 */
function extractJsonCandidate(text: string): string | null {
    const startIndex = text.search(/[[{]/);
    if (startIndex === -1) {
        return null;
    }

    const openChar = text[startIndex];
    const closeChar = openChar === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i += 1) {
        const char = text[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === openChar) {
            depth += 1;
        } else if (char === closeChar) {
            depth -= 1;
            if (depth === 0) {
                return text.slice(startIndex, i + 1);
            }
        }
    }

    return null;
}

/**
 * 解析模型回复中的 JSON，返回泛型结果。
 *
 * @param raw - 模型原始回复文本。
 * @param validator - 可选的结构校验函数；返回 `null` 表示合法，返回字符串表示具体错误信息。
 * @returns 解析后的 JSON 对象。
 * @throws {SparkJsonParseError} 当无法提取或解析 JSON，或结构校验失败时抛出。
 */
export function parseJsonFromText<T>(
    raw: string,
    validator?: (value: unknown) => string | null
): T {
    const candidate = extractJsonCandidate(normalize(raw));

    if (!candidate) {
        throw new SparkJsonParseError('模型回复中未找到 JSON 片段。', raw);
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(candidate);
    } catch {
        // 兜底：移除对象/数组中的尾随逗号后再尝试一次。
        const relaxed = candidate.replace(/,\s*([}\]])/g, '$1');
        try {
            parsed = JSON.parse(relaxed);
        } catch {
            throw new SparkJsonParseError('模型回复中的 JSON 无法解析。', raw);
        }
    }

    if (validator) {
        const validationError = validator(parsed);
        if (validationError) {
            throw new SparkJsonParseError(`模型回复结构不符合预期：${validationError}`, raw);
        }
    }

    return parsed as T;
}
