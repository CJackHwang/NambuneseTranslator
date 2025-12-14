

/**
 * Zhengyu v5.1 Kana Converter Algorithm
 * Strict adherence to the v5.1 specification.
 */

// Regex for parsing Jyutping (Initial + Final + Tone)
// Handles kw, gw, ng as initials.
const JYUTPING_REGEX = /^(gw|kw|ng|b|p|m|f|d|t|n|l|g|k|h|w|z|c|s|j)?([a-z]+)([1-6])?$/;

// Standard Mapping Tables
const KANA_ROWS: Record<string, string[]> = {
  '': ['あ', 'い', 'う', 'え', 'お'],
  'b': ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  'p': ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  'm': ['ま', 'み', 'む', 'め', 'も'],
  'f': ['ふぁ', 'ふぃ', 'ふ', 'ふぇ', 'ふぉ'], // Special F-series
  'd': ['だ', 'ぢ', 'づ', 'で', 'ど'], // d- special: di->ぢ, du->づ
  't': ['た', 'ち', 'つ', 'て', 'と'], // t- special: ti->ち
  'n': ['な', 'に', 'ぬ', 'ね', 'の'],
  'l': ['ら', 'り', 'る', 'れ', 'ろ'],
  'g': ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  'k': ['か', 'き', 'く', 'け', 'こ'],
  'gw': ['ぐわ', 'ぐい', 'ぐ', 'ぐえ', 'ぐを'], // gw- special
  'kw': ['くわ', 'くい', 'く', 'くえ', 'くを'], // kw- special
  'w': ['わ', 'うぃ', 'う', 'うぇ', 'を'],    // w- special: wo->を
  'h': ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  'z': ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], // z- special: zi->じ
  'c': ['つぁ', 'つぃ', 'つ', 'つぇ', 'つぉ'], // c- special: No Palatalization!
  's': ['さ', 'し', 'す', 'せ', 'そ'], // s- special: si->し
  'j': ['や', 'い', 'ゆ', 'いぇ', 'よ'], // j- special: ji->い, jyu->ゆ, jaa->や
  'ng': ['あ', 'い', 'う', 'え', 'お'], // Zero initial treatment usually
};

// Helper to get kana from row/col
const getKana = (initial: string, vowel: string): string => {
  // Map vowel to index
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

  // Special handling for J-initial overrides from the table logic if needed
  // But 'j' row in KANA_ROWS above approximates the spec:
  // jaa (a) -> や, ji (i) -> い, jyu (u) -> ゆ, je (e) -> いぇ.
  if (initial === 'j') {
    if (vowel === 'a') return 'や';
    if (vowel === 'i') return 'い';
    if (vowel === 'u') return 'ゆ';
    if (vowel === 'e') return 'いぇ';
    if (vowel === 'o') return 'よ';
  }

  return row[idx];
};

export const convertToKana = (jyutping: string): string => {
  // 1. Handle Punctuation/Raw text/Katakana (already converted by AI)
  // If input contains non-jyutping characters (like Katakana or symbols), return as is.
  if (!/^[a-z0-9]+$/i.test(jyutping)) return jyutping;

  // 2. Special Syllabic Nasals
  if (jyutping.startsWith('m') && jyutping.length <= 2 && !/[aeiou]/.test(jyutping)) return 'ん'; // m4
  if (jyutping.startsWith('ng') && jyutping.length <= 3 && !/[aeiou]/.test(jyutping)) return 'ん'; // ng4

  const match = jyutping.match(JYUTPING_REGEX);
  if (!match) return jyutping;

  let [_, initial, final, tone] = match;
  initial = initial || ''; // Zero initial

  // Normalize initial for lookup
  if (initial === 'ng') initial = ''; // Treat ng- initial as zero per spec rule 2.

  // Parse Nucleus and Coda
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

  // === CORE MAPPING LOGIC ===

  // Handle 'yu' special cases first (Rule 3C/3D)
  if (nucleus === 'yu') {
    // j-yu -> ゆ (Rule 3D)
    if (initial === 'j' || initial === '') {
      result = 'ゆ';
    }
    // c-yu -> つゆ (Rule 3C - No Palatalization)
    else if (initial === 'c') {
      result = 'つゆ';
    }
    // Other consonants -> Palatalization (Cy+u)
    // b, p, m, f, d, t, n, l, g, k, h, z, s
    else {
      // Map:
      // b->びゅ, p->ぴゅ, m->みゅ (rare), f-> (none), 
      // d->ぢゅ, t->ちゅ, n->にゅ, l->りゅ
      // g->ぎゅ, k->きゅ, h->ひゅ
      // z->じゅ, s->しゅ

      // Helper to get I-column char
      const iChar = getKana(initial, 'i');
      // Handle exceptions where iChar isn't the base for Yoon (twisted sound)
      // Actually standard JP Yoon is i-col + small yu.
      // ti (ち) + yu -> ちゅ.
      // si (し) + yu -> しゅ.
      // di (ぢ) + yu -> ぢゅ.
      // zi (じ) + yu -> じゅ.

      // Check if valid combination in standard JP, otherwise approximations
      result = iChar + 'ゅ';
    }
    return result + coda;
  }

  // Standard Vowels
  switch (nucleus) {
    case 'aa':
      // open: aa -> col a + 'あ'
      // closed: aa(n) -> col a + 'ん'
      // special: if initial is 'f', faa -> ふぁあ
      result = getKana(initial, 'a');
      if (coda === '') {
        // Special rule: if no coda, long 'aa' gets suffix 'あ'.
        // e.g. baa -> ばあ
        result += 'あ';
      } else {
        // If coda exists, usually long 'aa' is just the 'a' col char + coda?
        // Spec Table 1.1:
        // baa(n) -> ばあん (ba + a + n).
        // So we add 'あ' if explicit long vowel needed?
        // Table: baa(n) -> ばあん.
        // Table: ba(n) -> ばん.
        // So YES, we need 'あ' suffix for 'aa' even with coda.
        result += 'あ';
      }
      break;

    case 'aai':
      result = getKana(initial, 'a') + 'あい';
      break;
    case 'aau':
      result = getKana(initial, 'a') + 'あう';
      break;

    case 'a':
      // Short 'a'
      // ba(n) -> ばん (Table 2.1)
      // No 'あ' suffix.
      result = getKana(initial, 'a');
      break;

    case 'ai':
      result = getKana(initial, 'a') + 'い';
      break;
    case 'au':
      result = getKana(initial, 'a') + 'う'; // Spec 2.2: au -> ga-u -> がう (uses 'u' suffix?)
      // Table 2.1: au -> mau -> まう.
      // Spec 2.2: au -> zau -> ざう.
      // But 'w' row: w-au not listed?
      // Table 2.2: j-au -> やう.
      // So yes, suffix 'う'.
      break;

    case 'e':
      // se -> せ
      result = getKana(initial, 'e');
      break;
    case 'ei':
      // sei -> せい
      result = getKana(initial, 'e') + 'い';
      break;

    case 'i':
      // si -> し
      result = getKana(initial, 'i');
      break;
    case 'iu':
      // siu -> しう
      result = getKana(initial, 'i') + 'う';
      break;

    case 'o':
      // so -> そ
      // gw-o -> ぐを (Spec 5.2) -> getKana('gw', 'o') returns 'ぐを'.
      result = getKana(initial, 'o');
      break;
    case 'ou':
      // sou -> そう
      result = getKana(initial, 'o') + 'う';
      break;
    case 'oi':
      // soi -> そい
      result = getKana(initial, 'o') + 'い';
      break;

    case 'u':
      // fu -> ふ
      // gu -> ぐ
      result = getKana(initial, 'u');
      break;
    case 'ui':
      // gui -> ぐい
      // w-ui -> うい
      result = getKana(initial, 'u') + 'い';
      break;

    case 'oe':
      // goe -> ごえ
      result = getKana(initial, 'o') + 'え';
      break;
    case 'oeng':
      // soeng -> そえん (Spec 7: oeng -> -おえん)
      result = getKana(initial, 'o') + 'えん';
      break;
    case 'oek':
      // soek -> そえっ (Spec 7: oek -> -おえっ)
      result = getKana(initial, 'o') + 'えっ';
      break;
    case 'eoi':
      // heoi -> へおい
      // e col + 'おい'
      result = getKana(initial, 'e') + 'おい';
      break;
    case 'eo':
      // eon -> nucleus 'eo', coda 'n'
      // eot -> nucleus 'eo', coda 't' -> 'っ'
      // seon -> せおん
      // nucleus 'eo' -> e col + 'お'
      result = getKana(initial, 'e') + 'お';
      break;

    default:
      // Fallback for rare vowels or errors: map to 'a' col or keep raw
      result = getKana(initial, 'a') || nucleus;
      break;
  }

  return result + coda;
};
