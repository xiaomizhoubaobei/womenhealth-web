/**
 * 定义流量强度的可能值。
 * @typedef {'light' | 'medium' | 'heavy' | 'spotting'} FlowIntensity
 */
export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'spotting';

/**
 * 定义症状的可能值。
 * @typedef {'cramps' | 'bloating' | 'headache' | 'fatigue' | 'mood_swings' | 'acne'} Symptom
 */
export type Symptom = 'cramps' | 'bloating' | 'headache' | 'fatigue' | 'mood_swings' | 'acne';

/**
 * 定义宫颈粘液质量的可能值。
 * @typedef {'dry' | 'sticky' | 'creamy' | 'egg_white'} CervicalMucus
 */
export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'egg_white';

/**
 * 周期日志的接口定义。
 * @interface CycleLog
 * @property {string} id - 日志的唯一标识符。
 * @property {Date} startDate - 经期开始日期。
 * @property {Date} endDate - 经期结束日期。
 * @property {FlowIntensity} [flowIntensity] - 流量强度。
 * @property {Symptom[]} [symptoms] - 相关症状。
 */
export interface CycleLog {
    id: string;
    startDate: Date;
    endDate: Date;
    flowIntensity?: FlowIntensity;
    symptoms?: Symptom[];
}

/**
 * 生育日志的接口定义。
 * @interface FertilityLog
 * @property {string} id - 日志的唯一标识符。
 * @property {Date} date - 记录日期。
 * @property {number} [bbt] - 基础体温。
 * @property {CervicalMucus} [cervicalMucus] - 宫颈粘液质量。
 */
export interface FertilityLog {
    id: string;
    date: Date;
    bbt?: number;
    cervicalMucus?: CervicalMucus;
}
