/**
 * HanLP 词性标注服务
 * 通过 Vercel Serverless 代理调用 HanLP API
 */

// CTB 词性标签到类别的映射
const POS_CATEGORIES = {
    // 名词类（需要保留）
    NOUN: ['NN', 'NR', 'NT'],      // 普通名词、专有名词、时间名词
    PRONOUN: ['PN'],               // 代词
    NUMERAL: ['CD', 'OD', 'M'],    // 基数词、序数词、量词

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

export interface HanLPPOSResult {
    tok: string[][];  // 分词结果
    pos: string[][];  // 词性标注
}

/**
 * 调用 HanLP POS API（通过 Vercel 代理）
 */
export async function callHanLPPOS(text: string, options?: {
    language?: 'zh' | 'en' | 'ja' | 'mul';
    pos?: 'ctb' | 'pku' | '863';
    coarse?: boolean;
}): Promise<HanLPPOSResult> {
    const { language = 'zh', pos = 'ctb', coarse = false } = options || {};

    try {
        const response = await fetch('/api/hanlp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, language, pos, coarse }),
        });

        const responseText = await response.text();

        if (!response.ok) {
            // 解析错误信息
            let errorMsg = responseText;
            try {
                const json = JSON.parse(responseText);
                if (json.error) errorMsg = json.error;
            } catch (e) { }
            throw new Error(`HanLP API Error (${response.status}): ${errorMsg}`);
        }

        const data = JSON.parse(responseText);

        let result: HanLPPOSResult = { tok: [], pos: [] };

        // 兼容性处理：如果返回的是 BRAT 格式的字符串数组（Node Proxy 转发的原始数据）
        if (Array.isArray(data)) {
            for (const sentence of (data as string[])) {
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
            // 如果代理已经处理成了标准格式
            result = data;
        } else {
            console.warn("Unknown HanLP response format:", data);
        }

        return result;

    } catch (error: any) {
        throw new Error(error.message || 'HanLP Network Error');
    }
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
 * 主函数：调用 HanLP 并提取关键词
 * 可直接替代 geminiService 的 extractPreservedTerms
 */
export async function extractTermsWithHanLP(text: string): Promise<string[]> {
    if (!text || !text.trim()) {
        return [];
    }

    try {
        const posResult = await callHanLPPOS(text);
        return extractPreservedTermsFromPOS(posResult);
    } catch (error) {
        console.error('HanLP extraction error:', error);
        throw error;
    }
}
