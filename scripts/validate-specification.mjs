/**
 * Specification Validation Script
 * 
 * This script validates all Jyutping → Kana conversion examples in specification.md
 * against the actual kanaConverter implementation.
 * 
 * Run with: node scripts/validate-specification.mjs
 */

// ============ KANA CONVERTER LOGIC (copied from kanaConverter.ts) ============

const JYUTPING_REGEX = /^(gw|kw|ng|b|p|m|f|d|t|n|l|g|k|h|w|z|c|s|j)?([a-z]+)([1-6])?$/;

const KANA_ROWS = {
    '': ['あ', 'い', 'う', 'え', 'お'],
    'b': ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
    'p': ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
    'm': ['ま', 'み', 'む', 'め', 'も'],
    'f': ['ふぁ', 'ふぃ', 'ふ', 'ふぇ', 'ふぉ'],
    'd': ['だ', 'ぢ', 'づ', 'で', 'ど'],
    't': ['た', 'ち', 'つ', 'て', 'と'],
    'n': ['な', 'に', 'ぬ', 'ね', 'の'],
    'l': ['ら', 'り', 'る', 'れ', 'ろ'],
    'g': ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
    'k': ['か', 'き', 'く', 'け', 'こ'],
    'gw': ['ぐわ', 'ぐい', 'ぐ', 'ぐえ', 'ぐを'],
    'kw': ['くわ', 'くい', 'く', 'くえ', 'くを'],
    'w': ['わ', 'うぃ', 'う', 'うぇ', 'を'],
    'h': ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    'z': ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    'c': ['つぁ', 'つぃ', 'つ', 'つぇ', 'つぉ'],
    's': ['さ', 'し', 'す', 'せ', 'そ'],
    'j': ['や', 'い', 'ゆ', 'いぇ', 'よ'],
    'ng': ['あ', 'い', 'う', 'え', 'お'],
};

const getKana = (initial, vowel) => {
    let idx = 0;
    switch (vowel) {
        case 'a': idx = 0; break;
        case 'i': idx = 1; break;
        case 'u': idx = 2; break;
        case 'e': idx = 3; break;
        case 'o': idx = 4; break;
        default: return '';
    }

    const row = KANA_ROWS[initial] || KANA_ROWS[''];

    if (initial === 'j') {
        if (vowel === 'a') return 'や';
        if (vowel === 'i') return 'い';
        if (vowel === 'u') return 'ゆ';
        if (vowel === 'e') return 'いぇ';
        if (vowel === 'o') return 'よ';
    }

    return row[idx];
};

const convertToKana = (jyutping, isParticle = false) => {
    if (!/^[a-z0-9]+$/i.test(jyutping)) return jyutping;

    if (jyutping.startsWith('m') && jyutping.length <= 2 && !/[aeiou]/.test(jyutping)) return 'ん';
    if (jyutping.startsWith('ng') && jyutping.length <= 3 && !/[aeiou]/.test(jyutping)) return 'ん';

    const match = jyutping.match(JYUTPING_REGEX);
    if (!match) return jyutping;

    let [_, initial, final, tone] = match;
    initial = initial || '';

    if (initial === 'ng') initial = '';

    let nucleus = final;
    let coda = '';

    if (final.endsWith('m') || final.endsWith('n') || final.endsWith('ng')) {
        coda = 'ん';
        nucleus = final.replace(/(ng|n|m)$/, '');
    } else if (final.endsWith('p') || final.endsWith('t') || final.endsWith('k')) {
        coda = 'っ';
        nucleus = final.replace(/(p|t|k)$/, '');
    }

    let result = '';

    if (nucleus === 'yu') {
        if (initial === 'j' || initial === '') {
            result = 'ゆ';
        } else if (initial === 'c') {
            result = 'つゆ';
        } else {
            const iChar = getKana(initial, 'i');
            result = iChar + 'ゅ';
        }
        return result + coda;
    }

    switch (nucleus) {
        case 'aa':
            result = isParticle ? getKana(initial, 'a') : getKana(initial, 'a') + 'ー';
            break;
        case 'aai':
            result = getKana(initial, 'a') + 'ーい';
            break;
        case 'aau':
            result = getKana(initial, 'a') + 'ーう';
            break;
        case 'a':
            result = getKana(initial, 'a');
            break;
        case 'ai':
            result = getKana(initial, 'a') + 'い';
            break;
        case 'au':
            result = getKana(initial, 'a') + 'う';
            break;
        case 'e':
            result = getKana(initial, 'e');
            break;
        case 'ei':
            result = getKana(initial, 'e') + 'い';
            break;
        case 'i':
            result = getKana(initial, 'i');
            break;
        case 'iu':
            result = getKana(initial, 'i') + 'う';
            break;
        case 'o':
            result = getKana(initial, 'o');
            break;
        case 'ou':
            result = getKana(initial, 'o') + 'う';
            break;
        case 'oi':
            result = getKana(initial, 'o') + 'い';
            break;
        case 'u':
            result = getKana(initial, 'u');
            break;
        case 'ui':
            result = getKana(initial, 'u') + 'い';
            break;
        case 'oe':
            result = getKana(initial, 'o') + 'え';
            break;
        case 'oeng':
            result = getKana(initial, 'o') + 'えん';
            break;
        case 'oek':
            result = getKana(initial, 'o') + 'えっ';
            break;
        case 'eoi':
            result = getKana(initial, 'e') + 'おい';
            break;
        case 'eo':
            result = getKana(initial, 'e') + 'お';
            break;
        default:
            result = getKana(initial, 'a') || nucleus;
            break;
    }

    return result + coda;
};

// ============ VALIDATION LOGIC ============

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test cases extracted from specification.md
// Format: { jyutping: string, expectedKana: string, description: string, isParticle?: boolean }
const testCases = [
    // 第一章 示例
    { jyutping: 'sik6', expectedKana: 'しっ', description: '食' },
    { jyutping: 'heoi3', expectedKana: 'へおい', description: '去' },
    { jyutping: 'lai4', expectedKana: 'らい', description: '来' },
    { jyutping: 'tai2', expectedKana: 'たい', description: '睇' },
    { jyutping: 'jau5', expectedKana: 'やう', description: '有' },
    { jyutping: 'hai6', expectedKana: 'はい', description: '系/喺' },
    { jyutping: 'hou2', expectedKana: 'ほう', description: '好' },
    { jyutping: 'daai6', expectedKana: 'だーい', description: '大' },
    { jyutping: 'sai3', expectedKana: 'さい', description: '细' },
    { jyutping: 'do1', expectedKana: 'ど', description: '多' },
    { jyutping: 'leng3', expectedKana: 'れん', description: '靓' },
    { jyutping: 'dou1', expectedKana: 'どう', description: '都' },
    { jyutping: 'zung6', expectedKana: 'ずん', description: '仲' },
    { jyutping: 'sin1', expectedKana: 'しん', description: '先' },
    { jyutping: 'zau6', expectedKana: 'ざう', description: '就' },
    { jyutping: 'go3', expectedKana: 'ご', description: '個' },
    { jyutping: 'zek3', expectedKana: 'ぜっ', description: '只' },
    { jyutping: 'dou6', expectedKana: 'どう', description: '度' },
    { jyutping: 'ci3', expectedKana: 'つぃ', description: '次' },
    { jyutping: 'jat6', expectedKana: 'やっ', description: '日' },
    { jyutping: 'zo2', expectedKana: 'ぞ', description: '咗' },
    { jyutping: 'gan2', expectedKana: 'がん', description: '紧' },
    { jyutping: 'ge3', expectedKana: 'げ', description: '嘅' },
    { jyutping: 'tung4', expectedKana: 'つん', description: '同' },

    // 音韵简化原则示例
    { jyutping: 'gaa1', expectedKana: 'がー', description: '家 (长元音)' },
    { jyutping: 'saam1', expectedKana: 'さーん', description: '三 (长元音+鼻音)' },
    { jyutping: 'ngo5', expectedKana: 'お', description: '我 (ng声母)' },
    { jyutping: 'nei5', expectedKana: 'ねい', description: '你 (n声母)' },
    { jyutping: 'lei5', expectedKana: 'れい', description: '李 (l声母)' },
    { jyutping: 'sam1', expectedKana: 'さん', description: '心 (短元音)' },
    { jyutping: 'san1', expectedKana: 'さん', description: '山 (短元音)' },
    { jyutping: 'sang1', expectedKana: 'さん', description: '生 (短元音)' },
    { jyutping: 'sap1', expectedKana: 'さっ', description: '湿 (入声)' },
    { jyutping: 'sat1', expectedKana: 'さっ', description: '失 (入声)' },
    { jyutping: 'sak1', expectedKana: 'さっ', description: '塞 (入声)' },

    // 声母对应表示例
    { jyutping: 'baa1', expectedKana: 'ばー', description: '巴' },
    { jyutping: 'paa3', expectedKana: 'ぱー', description: '怕' },
    { jyutping: 'maa1', expectedKana: 'まー', description: '妈' },
    { jyutping: 'faa1', expectedKana: 'ふぁー', description: '花' },
    { jyutping: 'dei6', expectedKana: 'でい', description: '地' },
    { jyutping: 'dik1', expectedKana: 'ぢっ', description: '滴' },
    { jyutping: 'tin1', expectedKana: 'ちん', description: '天' },
    { jyutping: 'kaa1', expectedKana: 'かー', description: '卡' },
    { jyutping: 'gwaa1', expectedKana: 'ぐわー', description: '瓜' },
    { jyutping: 'kwaa1', expectedKana: 'くわー', description: '夸' },
    { jyutping: 'waa1', expectedKana: 'わー', description: '蛙' },
    { jyutping: 'wo1', expectedKana: 'を', description: '蜗' },
    { jyutping: 'haa1', expectedKana: 'はー', description: '虾' },
    { jyutping: 'zaa1', expectedKana: 'ざー', description: '渣' },
    { jyutping: 'zi6', expectedKana: 'じ', description: '字' },
    { jyutping: 'ci1', expectedKana: 'つぃ', description: '妻' },
    { jyutping: 'cyu1', expectedKana: 'つゆ', description: '初' },
    { jyutping: 'saa1', expectedKana: 'さー', description: '沙' },
    { jyutping: 'si1', expectedKana: 'し', description: '诗' },
    { jyutping: 'jaa5', expectedKana: 'やー', description: '也' },
    { jyutping: 'ji1', expectedKana: 'い', description: '医' },
    { jyutping: 'jyu4', expectedKana: 'ゆ', description: '鱼' },

    // 颚化规则
    { jyutping: 'kyut3', expectedKana: 'きゅっ', description: '决' },
    { jyutping: 'je5', expectedKana: 'いぇ', description: '野(je)' },

    // 常用动词
    { jyutping: 'teng1', expectedKana: 'てん', description: '听' },
    { jyutping: 'gong2', expectedKana: 'ごん', description: '讲' },
    { jyutping: 'maai5', expectedKana: 'まーい', description: '买' },
    { jyutping: 'zou6', expectedKana: 'ぞう', description: '做' },
    { jyutping: 'haang4', expectedKana: 'はーん', description: '行' },

    // 常用形容词
    { jyutping: 'siu2', expectedKana: 'しう', description: '少' },
    { jyutping: 'gou1', expectedKana: 'ごう', description: '高' },
    { jyutping: 'ai2', expectedKana: 'あい', description: '矮' },

    // 常用副词
    { jyutping: 'mei6', expectedKana: 'めい', description: '未' },
    { jyutping: 'm4', expectedKana: 'ん', description: '唔' },

    // 常用量词
    { jyutping: 'bun2', expectedKana: 'ぶん', description: '本' },
    { jyutping: 'gin6', expectedKana: 'ぎん', description: '件' },
    { jyutping: 'gaan1', expectedKana: 'がーん', description: '间' },

    // 常用助词/语气词
    { jyutping: 'gwo3', expectedKana: 'ぐを', description: '过' },
    { jyutping: 'me1', expectedKana: 'め', description: '咩' },
    { jyutping: 'gaa3', expectedKana: 'がー', description: '㗎' },

    // 常用连词
    { jyutping: 'daan6', expectedKana: 'だーん', description: '但' },

    // N-L 对照组
    { jyutping: 'naam4', expectedKana: 'なーん', description: '南' },
    { jyutping: 'laam4', expectedKana: 'らーん', description: '蓝' },
    { jyutping: 'nin4', expectedKana: 'にん', description: '年' },
    { jyutping: 'lin4', expectedKana: 'りん', description: '连' },
    { jyutping: 'nou5', expectedKana: 'のう', description: '脑' },
    { jyutping: 'lou5', expectedKana: 'ろう', description: '老' },
    { jyutping: 'naa4', expectedKana: 'なー', description: '拿' },
    { jyutping: 'laa1', expectedKana: 'らー', description: '啦' },

    // 常见错误纠正里的正确示例
    { jyutping: 'gaai1', expectedKana: 'がーい', description: '街' },
    { jyutping: 'syu1', expectedKana: 'しゅ', description: '書' },

    // 特殊韵母
    { jyutping: 'keoi5', expectedKana: 'けおい', description: '佢' },

    // 语气词（使用 isParticle）
    { jyutping: 'aa3', expectedKana: 'あ', description: '啊(语气词)', isParticle: true },
    { jyutping: 'aa1', expectedKana: 'あー', description: '阿(名词前缀)', isParticle: false },
];

// Additional comprehensive test cases from syllable tables
const syllableTableTests = [
    // AA 行
    { jyutping: 'aa1', expectedKana: 'あー', description: 'AA 行 零声母' },
    { jyutping: 'baa1', expectedKana: 'ばー', description: 'AA 行 b声母' },
    { jyutping: 'aai1', expectedKana: 'あーい', description: 'AAI 行 零声母' },
    { jyutping: 'aau1', expectedKana: 'あーう', description: 'AAU 行 零声母' },
    { jyutping: 'aam1', expectedKana: 'あーん', description: 'AAM 行 零声母' },
    { jyutping: 'aan1', expectedKana: 'あーん', description: 'AAN 行 零声母' },
    { jyutping: 'aang1', expectedKana: 'あーん', description: 'AANG 行 零声母' },
    { jyutping: 'aap1', expectedKana: 'あーっ', description: 'AAP 行 零声母' },
    { jyutping: 'aat1', expectedKana: 'あーっ', description: 'AAT 行 零声母' },
    { jyutping: 'aak1', expectedKana: 'あーっ', description: 'AAK 行 零声母' },

    // A 行 (短元音)
    { jyutping: 'ai1', expectedKana: 'あい', description: 'AI 行 零声母' },
    { jyutping: 'au1', expectedKana: 'あう', description: 'AU 行 零声母' },
    { jyutping: 'am1', expectedKana: 'あん', description: 'AM 行 零声母' },
    { jyutping: 'an1', expectedKana: 'あん', description: 'AN 行 零声母' },
    { jyutping: 'ang1', expectedKana: 'あん', description: 'ANG 行 零声母' },
    { jyutping: 'ap1', expectedKana: 'あっ', description: 'AP 行 零声母' },
    { jyutping: 'at1', expectedKana: 'あっ', description: 'AT 行 零声母' },
    { jyutping: 'ak1', expectedKana: 'あっ', description: 'AK 行 零声母' },

    // E 行
    { jyutping: 'ei1', expectedKana: 'えい', description: 'EI 行 零声母' },
    { jyutping: 'em1', expectedKana: 'えん', description: 'EM 行 零声母' },
    { jyutping: 'en1', expectedKana: 'えん', description: 'EN 行 零声母' },
    { jyutping: 'eng1', expectedKana: 'えん', description: 'ENG 行 零声母' },
    { jyutping: 'ep1', expectedKana: 'えっ', description: 'EP 行 零声母' },
    { jyutping: 'et1', expectedKana: 'えっ', description: 'ET 行 零声母' },
    { jyutping: 'ek1', expectedKana: 'えっ', description: 'EK 行 零声母' },

    // I 行
    { jyutping: 'i1', expectedKana: 'い', description: 'I 行 零声母' },
    { jyutping: 'iu1', expectedKana: 'いう', description: 'IU 行 零声母' },
    { jyutping: 'im1', expectedKana: 'いん', description: 'IM 行 零声母' },
    { jyutping: 'in1', expectedKana: 'いん', description: 'IN 行 零声母' },
    { jyutping: 'ing1', expectedKana: 'いん', description: 'ING 行 零声母' },
    { jyutping: 'ip1', expectedKana: 'いっ', description: 'IP 行 零声母' },
    { jyutping: 'it1', expectedKana: 'いっ', description: 'IT 行 零声母' },
    { jyutping: 'ik1', expectedKana: 'いっ', description: 'IK 行 零声母' },

    // O 行
    { jyutping: 'o1', expectedKana: 'お', description: 'O 行 零声母' },
    { jyutping: 'oi1', expectedKana: 'おい', description: 'OI 行 零声母' },
    { jyutping: 'ou1', expectedKana: 'おう', description: 'OU 行 零声母' },
    { jyutping: 'om1', expectedKana: 'おん', description: 'OM 行 零声母' },
    { jyutping: 'on1', expectedKana: 'おん', description: 'ON 行 零声母' },
    { jyutping: 'ong1', expectedKana: 'おん', description: 'ONG 行 零声母' },
    { jyutping: 'op1', expectedKana: 'おっ', description: 'OP 行 零声母' },
    { jyutping: 'ot1', expectedKana: 'おっ', description: 'OT 行 零声母' },
    { jyutping: 'ok1', expectedKana: 'おっ', description: 'OK 行 零声母' },

    // U 行
    { jyutping: 'u1', expectedKana: 'う', description: 'U 行 零声母' },
    { jyutping: 'ui1', expectedKana: 'うい', description: 'UI 行 零声母' },
    { jyutping: 'um1', expectedKana: 'うん', description: 'UM 行 零声母' },
    { jyutping: 'un1', expectedKana: 'うん', description: 'UN 行 零声母' },
    { jyutping: 'ung1', expectedKana: 'うん', description: 'UNG 行 零声母' },
    { jyutping: 'up1', expectedKana: 'うっ', description: 'UP 行 零声母' },
    { jyutping: 'ut1', expectedKana: 'うっ', description: 'UT 行 零声母' },
    { jyutping: 'uk1', expectedKana: 'うっ', description: 'UK 行 零声母' },

    // OE/EO 行
    { jyutping: 'oe1', expectedKana: 'おえ', description: 'OE 行 零声母' },
    { jyutping: 'oek1', expectedKana: 'おえっ', description: 'OEK 行 零声母' },
    { jyutping: 'oeng1', expectedKana: 'おえん', description: 'OENG 行 零声母' },
    { jyutping: 'eoi1', expectedKana: 'えおい', description: 'EOI 行 零声母' },
    { jyutping: 'eon1', expectedKana: 'えおん', description: 'EON 行 零声母' },
    { jyutping: 'eot1', expectedKana: 'えおっ', description: 'EOT 行 零声母' },

    // YU 行
    { jyutping: 'yu1', expectedKana: 'ゆ', description: 'YU 行 零声母' },
    { jyutping: 'yun1', expectedKana: 'ゆん', description: 'YUN 行 零声母' },
    { jyutping: 'yut1', expectedKana: 'ゆっ', description: 'YUT 行 零声母' },

    // 特殊声母组合
    { jyutping: 'gwo1', expectedKana: 'ぐを', description: 'GW + O' },
    { jyutping: 'kwo1', expectedKana: 'くを', description: 'KW + O' },

    // 自成音节鼻音
    { jyutping: 'ng4', expectedKana: 'ん', description: '吴/五 (ng)' },
];

// Run validation
console.log('='.repeat(60));
console.log('《正语日新标》规范验证报告');
console.log('='.repeat(60));
console.log();

const allTests = [...testCases, ...syllableTableTests];
let passCount = 0;
let failCount = 0;
const failures = [];

for (const test of allTests) {
    const actual = convertToKana(test.jyutping, test.isParticle || false);
    const passed = actual === test.expectedKana;

    if (passed) {
        passCount++;
    } else {
        failCount++;
        failures.push({
            ...test,
            actual,
        });
    }
}

console.log(`测试总数: ${allTests.length}`);
console.log(`通过: ${passCount} ✅`);
console.log(`失败: ${failCount} ❌`);
console.log();

if (failures.length > 0) {
    console.log('-'.repeat(60));
    console.log('失败的测试用例:');
    console.log('-'.repeat(60));

    for (const f of failures) {
        console.log(`  ${f.description}: ${f.jyutping}`);
        console.log(`    规范期望: ${f.expectedKana}`);
        console.log(`    代码输出: ${f.actual}`);
        console.log();
    }
}

console.log('='.repeat(60));
console.log('验证完成');
console.log('='.repeat(60));

// Output summary as JSON for later use
const report = {
    total: allTests.length,
    passed: passCount,
    failed: failCount,
    failures: failures,
    timestamp: new Date().toISOString(),
};

console.log();
console.log('JSON 报告:');
console.log(JSON.stringify(report, null, 2));
