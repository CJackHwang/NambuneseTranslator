/**
 * HanLP 词性标注服务
 * 通过 Vercel Serverless 代理调用 HanLP API
 * 支持长文本自动分段、顺序请求（带限流和抖动）、结果合并
 */

import {
    HANLP_MAX_CHUNK_SIZE,
    HANLP_MAX_TOTAL_SIZE,
    splitTextIntoChunks,
    mergeHanLPResults,
    parseHanLPResponse,
    type HanLPPOSResult,
} from './hanlpCore';

// 导出常量供 UI 使用
export { HANLP_MAX_CHUNK_SIZE, HANLP_MAX_TOTAL_SIZE };

// 导出类型
export type { HanLPPOSResult };

// === 缓存 ===

/** LRU 缓存最大条目数 */
const CACHE_MAX_SIZE = 50;

/** HanLP 独立缓存 */
const hanlpCache = new Map<string, { result: HanLPPOSResult; timestamp: number }>();

/**
 * 生成缓存 key
 */
function getCacheKey(text: string, options?: HanLPRequestOptions): string {
    const { language = 'zh', pos = 'ctb', coarse = false } = options || {};
    return `hanlp:${language}:${pos}:${coarse}:${text}`;
}

/**
 * 获取缓存结果
 */
function getCachedResult(key: string): HanLPPOSResult | null {
    const cached = hanlpCache.get(key);
    if (cached) {
        // LRU: 移动到末尾
        hanlpCache.delete(key);
        hanlpCache.set(key, cached);
        console.log('HanLP Cache HIT');
        return cached.result;
    }
    return null;
}

/**
 * 存入缓存
 */
function setCacheResult(key: string, result: HanLPPOSResult): void {
    // LRU: 驱逐最旧条目
    if (hanlpCache.size >= CACHE_MAX_SIZE) {
        const oldestKey = hanlpCache.keys().next().value;
        if (oldestKey) hanlpCache.delete(oldestKey);
    }
    hanlpCache.set(key, { result, timestamp: Date.now() });
}

/**
 * 清除 HanLP 缓存
 */
export function clearHanLPCache(): void {
    hanlpCache.clear();
    console.log('HanLP cache cleared');
}

// === 限流器 ===

/** 每分钟最大请求数 */
const RATE_LIMIT_PER_MINUTE = 10;

/** 请求时间戳队列（用于限流） */
const requestTimestamps: number[] = [];

/**
 * 生成随机抖动延迟（0.5-2秒）
 */
function getRandomJitter(): number {
    return 500 + Math.random() * 1500; // 500ms ~ 2000ms
}

/**
 * 等待指定毫秒数
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查并等待限流
 * 如果过去一分钟内请求数达到上限，则等待直到可以发送新请求
 */
async function waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 清理过期的时间戳
    while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
        requestTimestamps.shift();
    }

    // 如果达到限制，等待直到最旧的请求过期
    if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
        const waitTime = requestTimestamps[0] - oneMinuteAgo + 100; // 额外100ms buffer
        console.log(`HanLP: Rate limit reached, waiting ${Math.round(waitTime / 1000)}s...`);
        await sleep(waitTime);
        // 递归检查（清理后可能仍需等待）
        await waitForRateLimit();
    }
}

/**
 * 记录请求时间戳
 */
function recordRequest(): void {
    requestTimestamps.push(Date.now());
}

// === 类型 ===

interface HanLPRequestOptions {
    language?: 'zh' | 'en' | 'ja' | 'mul';
    pos?: 'ctb' | 'pku' | '863';
    coarse?: boolean;
}

// CTB 词性标签到类别的映射
const POS_CATEGORIES = {
    // 名词类（需要保留）
    NOUN: ['NN', 'NR', 'NT'],      // 普通名词、专有名词、时间名词
    PRONOUN: ['PN'],               // 代词
    NUMERAL: ['CD', 'OD', 'M'],    // 基数词、序数词、量词

    // 语气词/助词（需要特殊简化处理）
    PARTICLE: ['SP', 'AS', 'MSP'],

    // 其他类（转换为假名）
    VERB: ['VV', 'VA', 'VC', 'VE'],
    ADJ: ['JJ'],
    ADV: ['AD'],
} as const;

/** POS tags that should be preserved as Kanji (nouns, pronouns, numerals) */
const PRESERVED_POS_TAGS: readonly string[] = [
    ...POS_CATEGORIES.NOUN,
    ...POS_CATEGORIES.PRONOUN,
    ...POS_CATEGORIES.NUMERAL,
] as const;

/** POS tags that should be treated as particles (special simplification) */
const PARTICLE_POS_TAGS: readonly string[] = [...POS_CATEGORIES.PARTICLE] as const;

export interface TextAnalysisResult {
    preservedTerms: string[]; // 名词等（保留汉字）
    particles: Set<string>;   // 语气词（需简化处理）
}

// === API 调用 ===

/**
 * 调用单次 HanLP POS API（通过代理）
 * 内部函数，不带缓存，包含限流控制
 */
async function callHanLPPOSSingle(text: string, options?: HanLPRequestOptions): Promise<HanLPPOSResult> {
    const { language = 'zh', pos = 'ctb', coarse = false } = options || {};

    // 等待限流
    await waitForRateLimit();

    // 记录请求
    recordRequest();

    const response = await fetch('/api/hanlp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language, pos, coarse }),
    });

    const responseText = await response.text();

    if (!response.ok) {
        let errorMsg = responseText;
        try {
            const json = JSON.parse(responseText);
            if (json.error) errorMsg = json.error;
        } catch (e) { }
        throw new Error(`HanLP API Error (${response.status}): ${errorMsg}`);
    }

    const data = JSON.parse(responseText);
    return parseHanLPResponse(data);
}

/**
 * 调用 HanLP POS API（支持长文本自动分段）
 * 带缓存
 */
export async function callHanLPPOS(text: string, options?: HanLPRequestOptions): Promise<HanLPPOSResult> {
    if (!text || !text.trim()) {
        return { tok: [], pos: [] };
    }

    const trimmedText = text.trim();

    // 检查总长度限制
    if (trimmedText.length > HANLP_MAX_TOTAL_SIZE) {
        throw new Error(`Text too long: ${trimmedText.length} chars (max ${HANLP_MAX_TOTAL_SIZE})`);
    }

    // 检查缓存
    const cacheKey = getCacheKey(trimmedText, options);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    // 分段处理
    const chunks = splitTextIntoChunks(trimmedText, HANLP_MAX_CHUNK_SIZE);
    console.log(`HanLP: Processing ${chunks.length} chunk(s), total ${trimmedText.length} chars`);

    let result: HanLPPOSResult;

    if (chunks.length === 1) {
        // 单段：直接请求
        result = await callHanLPPOSSingle(chunks[0], options);
    } else {
        // 多段：顺序请求（带随机抖动），合并结果
        const results: HanLPPOSResult[] = [];
        for (let i = 0; i < chunks.length; i++) {
            // 第一个请求不需要延迟
            if (i > 0) {
                const jitter = getRandomJitter();
                console.log(`HanLP: Waiting ${Math.round(jitter)}ms before chunk ${i + 1}/${chunks.length}...`);
                await sleep(jitter);
            }
            const chunkResult = await callHanLPPOSSingle(chunks[i], options);
            results.push(chunkResult);
        }
        result = mergeHanLPResults(results);
    }

    // 存入缓存
    setCacheResult(cacheKey, result);

    return result;
}

/**
 * 从 HanLP 词性标注结果中提取需要保留的词语（名词、代词、数词）
 */
export function extractPreservedTermsFromPOS(result: HanLPPOSResult): string[] {
    const preserved: string[] = [];

    for (let sentIdx = 0; sentIdx < result.tok.length; sentIdx++) {
        const tokens = result.tok[sentIdx];
        const tags = result.pos[sentIdx];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const tag = tags[i];

            // 检查词性是否需要保留
            if (PRESERVED_POS_TAGS.includes(tag)) {
                // 避免重复
                if (!preserved.includes(token)) {
                    preserved.push(token);
                }
            }
        }
    }

    return preserved;
}

/**
 * 从 HanLP 词性标注结果中提取语气词/助词（用于 v5.2 语气词简化）
 */
export function extractParticlesFromPOS(result: HanLPPOSResult): Set<string> {
    const particles = new Set<string>();

    for (let sentIdx = 0; sentIdx < result.tok.length; sentIdx++) {
        const tokens = result.tok[sentIdx];
        const tags = result.pos[sentIdx];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const tag = tags[i];

            if (PARTICLE_POS_TAGS.includes(tag)) {
                particles.add(token);
            }
        }
    }

    return particles;
}

/**
 * 主函数：调用 HanLP 并返回分析结果
 */
export async function analyzeTextWithHanLP(text: string): Promise<TextAnalysisResult> {
    if (!text || !text.trim()) {
        return { preservedTerms: [], particles: new Set() };
    }

    try {
        const posResult = await callHanLPPOS(text);

        return {
            preservedTerms: extractPreservedTermsFromPOS(posResult),
            particles: extractParticlesFromPOS(posResult),
        };
    } catch (error) {
        console.error('HanLP analysis error:', error);
        throw error;
    }
}

