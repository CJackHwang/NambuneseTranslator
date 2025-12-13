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
    // ... 其他不需要特殊处理
} as const;

// 需要保留为汉字的词性
const PRESERVED_POS_TAGS: string[] = [
    ...POS_CATEGORIES.NOUN,
    ...POS_CATEGORIES.PRONOUN,
    ...POS_CATEGORIES.NUMERAL,
];

export interface HanLPPOSResult {
    tok: string[][];  // 分词结果
    pos: string[][];  // 词性标注
}

// HanLP RSA 公钥
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHLWIFQOZ/uh379CWuF96q1Eif
KNx5Tpu/M9dDsOPYmKwraqc/MOl++cJP0u99qugqhMYm535xcnWl/Z14ZNGvVhEB
sHEdcWT/CvBbSeKIA24eyrrqoKafNVZ0aOE95UqM5Q7630cBnhdo+LOxBlhaMy+8
LaK1tFV4AFNMR6fISwIDAQAB
-----END PUBLIC KEY-----`;

// 兼容 Vite/ESM 导入 JSEncrypt
import JSEncryptLib from 'jsencrypt';
// @ts-ignore
const JSEncrypt = JSEncryptLib.default || JSEncryptLib;

function generateEHeader(): string {
    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(PUBLIC_KEY_PEM);
        const encrypted = encrypt.encrypt(timestamp);
        return encrypted || '';
    } catch (e) {
        console.error("Encryption failed:", e);
        return '';
    }
}

/**
 * 调用 HanLP POS API（通过 corsproxy.io 代理）
 */
export const extractKeywordsWithHanLP = async (
    text: string,
    options: {
        language?: string;
        pos?: string;
        coarse?: boolean;
    } = {}
): Promise<HanLPPOSResult> => {
    try {
        const eHeader = generateEHeader();
        const bodyParams = new URLSearchParams({
            text,
            coarse: (options.coarse || false).toString(),
            language: options.language || 'zh',
            pos: options.pos || 'ctb',
            v1: 'false'
        });

        // 使用 corsproxy.io 绕过 CORS，并直接利用用户浏览器 IP 请求，避开 Vercel IP 封锁
        const targetUrl = 'https://hanlp.hankcs.com/backend/v2/pos';
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

        // 注意：通过代理时，部分 headers 可能被过滤，但我们尽量带上
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'e': eHeader,
                // 这里不需要伪造 Origin/Referer，因为是通过代理转发，或者由浏览器直接发出
            },
            body: bodyParams.toString()
        });

        if (!response.ok) {
            console.error(`HanLP Proxy Error: ${response.status} ${response.statusText}`);
            throw new Error(`HanLP API error: ${response.status} ${response.statusText}`);
        }

        const textData = await response.text();
        // console.log("HanLP Raw Response:", textData.substring(0, 100) + "..."); // Debug log

        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("HanLP Response Parse Error. Raw:", textData);
            throw new Error("Invalid JSON response from HanLP");
        }

        if (!data || !data.tok || !data.pos) {
            console.error("HanLP Invalid Data Structure:", data);
            throw new Error("HanLP response missing 'tok' or 'pos' fields");
        }

        return data as HanLPPOSResult;

    } catch (error) {
        console.error('HanLP extraction error:', error);
        throw error;
    }
};

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
export async function extractTermsWithHanLP(
    text: string,
    language: string = 'zh',
    posModel: string = 'ctb'
): Promise<string[]> {
    if (!text || !text.trim()) {
        return [];
    }

    try {
        const hanlpResult = await extractKeywordsWithHanLP(text, {
            language,
            pos: posModel,
            coarse: false
        });
        return extractPreservedTermsFromPOS(hanlpResult);
    } catch (error) {
        console.error('HanLP extraction error:', error);
        throw error;
    }
}
