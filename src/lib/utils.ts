import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并多个 CSS 类名，并处理 Tailwind CSS 类的冲突。
 * @param {...ClassValue} inputs - 要合并的类名。
 * @returns {string} 合并后的类名字符串。
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
