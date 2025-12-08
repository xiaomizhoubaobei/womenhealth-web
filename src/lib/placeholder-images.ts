import data from './placeholder-images.json';

/**
 * 图像占位符的数据结构。
 * @typedef {object} ImagePlaceholder
 * @property {string} id - 图像的唯一标识符。
 * @property {string} description - 图像的描述。
 * @property {string} imageUrl - 图像的 URL。
 * @property {string} imageHint - 用于 AI 图像搜索的提示词。
 */
export type ImagePlaceholder = {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
};

/**
 * 从 JSON 文件中加载的占位符图像数组。
 * @type {ImagePlaceholder[]}
 */
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
