/**
 * HanLP 核心逻辑模块
 * 统一 Vercel Serverless 和 Vite Dev Server 的共享代码
 */

// === 常量 ===

/** 单次 API 请求的最大字符数（保守值，实际限制约800） */
export const HANLP_MAX_CHUNK_SIZE = 700;

/** 总输入的最大字符数（5次请求 × 700字符） */
export const HANLP_MAX_TOTAL_SIZE = 3500;

/** HanLP API 端点 */
export const HANLP_API_URL = 'https://hanlp.hankcs.com/backend/v2/pos';

/** HanLP RSA 公钥 */
export const HANLP_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHLWIFQOZ/uh379CWuF96q1Eif
KNx5Tpu/M9dDsOPYmKwraqc/MOl++cJP0u99qugqhMYm535xcnWl/Z14ZNGvVhEB
sHEdcWT/CvBbSeKIA24eyrrqoKafNVZ0aOE95UqM5Q7630cBnhdo+LOxBlhaMy+8
LaK1tFV4AFNMR6fISwIDAQAB
-----END PUBLIC KEY-----`;

// === 类型 ===

export interface HanLPPOSResult {
    tok: string[][];  // 分词结果
    pos: string[][];  // 词性标注
}

export interface HanLPRequestOptions {
    language?: 'zh' | 'en' | 'ja' | 'mul';
    pos?: 'ctb' | 'pku' | '863';
    coarse?: boolean;
}

// === 文本分段逻辑 ===

/**
 * 按句子边界分段文本
 * 优先在句号、问号、感叹号处分段，保持语义完整性
 */
export function splitTextIntoChunks(text: string, maxSize: number = HANLP_MAX_CHUNK_SIZE): string[] {
    if (!text || text.length <= maxSize) {
        return text ? [text] : [];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxSize) {
            chunks.push(remaining);
            break;
        }

        // 在 maxSize 范围内寻找最后一个句子边界
        const searchRange = remaining.slice(0, maxSize);

        // 句子结束标点（中英文）
        const sentenceEnders = /[。！？.!?]/g;
        let lastBoundary = -1;
        let match;

        while ((match = sentenceEnders.exec(searchRange)) !== null) {
            lastBoundary = match.index + 1; // 包含标点符号
        }

        // 如果没找到句子边界，尝试找逗号、分号等次级边界
        if (lastBoundary === -1 || lastBoundary < maxSize * 0.3) {
            const clauseEnders = /[，、；,;]/g;
            while ((match = clauseEnders.exec(searchRange)) !== null) {
                lastBoundary = match.index + 1;
            }
        }

        // 如果还是没找到合适边界，或边界太靠前（<30%），则硬切
        if (lastBoundary === -1 || lastBoundary < maxSize * 0.3) {
            lastBoundary = maxSize;
        }

        chunks.push(remaining.slice(0, lastBoundary));
        remaining = remaining.slice(lastBoundary);
    }

    return chunks;
}

/**
 * 合并多个 HanLP 词性标注结果
 */
export function mergeHanLPResults(results: HanLPPOSResult[]): HanLPPOSResult {
    const merged: HanLPPOSResult = { tok: [], pos: [] };

    for (const result of results) {
        merged.tok.push(...result.tok);
        merged.pos.push(...result.pos);
    }

    return merged;
}

/**
 * 解析 HanLP BRAT 格式响应为结构化结果
 */
export function parseHanLPResponse(data: any): HanLPPOSResult {
    const result: HanLPPOSResult = { tok: [], pos: [] };

    // 兼容性处理：如果返回的是 BRAT 格式的字符串数组
    if (Array.isArray(data)) {
        for (const sentence of data as string[]) {
            const lines = sentence.split('\n');
            const tokens: string[] = [];
            const tags: string[] = [];

            for (const line of lines) {
                // 解析格式如: "T1 NR 0 2 南武"
                const match = line.match(/^T\d+\s+(\S+)\s+\d+\s+\d+\s+(.+)$/);
                if (match) {
                    tags.push(match[1]);
                    tokens.push(match[2]);
                }
            }
            if (tokens.length > 0) {
                result.tok.push(tokens);
                result.pos.push(tags);
            }
        }
    } else if (data.tok && data.pos) {
        // 如果已经是标准格式
        result.tok = data.tok;
        result.pos = data.pos;
    }

    return result;
}
