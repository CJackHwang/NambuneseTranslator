
/**
 * ZhengYu v5.1 Core Dictionary
 * Based on the "Noun Anchor" principle:
 * - Nouns/Pronouns -> Kanji (Keep original or map to Trad. Chinese)
 * - Verbs/Adj/Particles -> Kana (Defined here)
 */

export interface DictEntry {
  mandarin: string[]; // Possible Mandarin triggers
  cantonese: string;  // The Cantonese Kanji representation
  jyutping: string;   // Jyutping
  zhengyu: string;    // The v5.1 Kana/Kanji output
  type: 'noun' | 'verb' | 'adj' | 'particle' | 'other';
}

export const CORE_DICTIONARY: DictEntry[] = [
  // === 基础代词 (Kanji) ===
  { mandarin: ['我'], cantonese: '我', jyutping: 'ngo5', zhengyu: '我', type: 'noun' },
  { mandarin: ['你'], cantonese: '你', jyutping: 'nei5', zhengyu: '你', type: 'noun' },
  { mandarin: ['他', '她', '它'], cantonese: '佢', jyutping: 'keoi5', zhengyu: '佢', type: 'noun' },
  { mandarin: ['我们'], cantonese: '我哋', jyutping: 'ngo5dei6', zhengyu: '我哋', type: 'noun' },
  { mandarin: ['你们'], cantonese: '你哋', jyutping: 'nei5dei6', zhengyu: '你哋', type: 'noun' },
  { mandarin: ['他们', '她们', '它们'], cantonese: '佢哋', jyutping: 'keoi5dei6', zhengyu: '佢哋', type: 'noun' },

  // === 指示代词 (Mixed: Formal Kanji / Informal Kana) ===
  // 默认采用非正式口语假名，符合"正语"推广方向
  { mandarin: ['这个'], cantonese: '呢個', jyutping: 'ni1go3', zhengyu: 'にご', type: 'noun' },
  { mandarin: ['那个'], cantonese: '嗰個', jyutping: 'go2go3', zhengyu: 'ごご', type: 'noun' },
  { mandarin: ['哪个', '谁'], cantonese: '边個', jyutping: 'bin1go3', zhengyu: 'びんご', type: 'noun' },
  { mandarin: ['这里'], cantonese: '呢度', jyutping: 'ni1dou6', zhengyu: 'にどう', type: 'noun' },
  { mandarin: ['那里'], cantonese: '嗰度', jyutping: 'go2dou6', zhengyu: 'ごどう', type: 'noun' },
  { mandarin: ['哪里'], cantonese: '边度', jyutping: 'bin1dou6', zhengyu: 'びんどう', type: 'noun' },
  { mandarin: ['什么'], cantonese: '乜嘢', jyutping: 'mat1je5', zhengyu: 'まっいぇ', type: 'noun' },

  // === 动词 (Hiragana) ===
  { mandarin: ['食', '吃'], cantonese: '食', jyutping: 'sik6', zhengyu: 'しっ', type: 'verb' },
  { mandarin: ['去'], cantonese: '去', jyutping: 'heoi3', zhengyu: 'へおい', type: 'verb' },
  { mandarin: ['看', '睇'], cantonese: '睇', jyutping: 'tai2', zhengyu: 'たい', type: 'verb' },
  { mandarin: ['是', '系', '在'], cantonese: '系/喺', jyutping: 'hai6', zhengyu: 'はい', type: 'verb' }, // Merged hai2/hai6 for simplicity in rules
  { mandarin: ['有'], cantonese: '有', jyutping: 'jau5', zhengyu: 'やう', type: 'verb' },
  { mandarin: ['来'], cantonese: '嚟', jyutping: 'lai4', zhengyu: 'らい', type: 'verb' },
  { mandarin: ['做', '干'], cantonese: '做', jyutping: 'zou6', zhengyu: 'ぞう', type: 'verb' },
  { mandarin: ['行', '走'], cantonese: '行', jyutping: 'haang4', zhengyu: 'はあん', type: 'verb' },
  { mandarin: ['买'], cantonese: '买', jyutping: 'maai5', zhengyu: 'まあい', type: 'verb' },
  { mandarin: ['讲', '说'], cantonese: '讲', jyutping: 'gong2', zhengyu: 'ごん', type: 'verb' },
  { mandarin: ['听'], cantonese: '听', jyutping: 'teng1', zhengyu: 'てん', type: 'verb' },
  { mandarin: ['决定'], cantonese: '决定', jyutping: 'kyut3ding6', zhengyu: 'きゅっぢん', type: 'verb' },
  
  // === 形容词/副词 (Hiragana) ===
  { mandarin: ['好', '很'], cantonese: '好', jyutping: 'hou2', zhengyu: 'ほう', type: 'adj' },
  { mandarin: ['大'], cantonese: '大', jyutping: 'daai6', zhengyu: 'だあい', type: 'adj' },
  { mandarin: ['小', '细'], cantonese: '细', jyutping: 'sai3', zhengyu: 'さい', type: 'adj' },
  { mandarin: ['多'], cantonese: '多', jyutping: 'do1', zhengyu: 'ど', type: 'adj' },
  { mandarin: ['少'], cantonese: '少', jyutping: 'siu2', zhengyu: 'しう', type: 'adj' },
  { mandarin: ['漂亮', '美', '靓'], cantonese: '靓', jyutping: 'leng3', zhengyu: 'れん', type: 'adj' },
  { mandarin: ['高'], cantonese: '高', jyutping: 'gou1', zhengyu: 'ごう', type: 'adj' },
  { mandarin: ['矮'], cantonese: '矮', jyutping: 'ai2', zhengyu: 'あい', type: 'adj' },
  { mandarin: ['都'], cantonese: '都', jyutping: 'dou1', zhengyu: 'どう', type: 'adj' },
  { mandarin: ['还', '仲'], cantonese: '仲', jyutping: 'zung6', zhengyu: 'ぞん', type: 'adj' },
  { mandarin: ['先'], cantonese: '先', jyutping: 'sin1', zhengyu: 'しん', type: 'adj' },
  { mandarin: ['就'], cantonese: '就', jyutping: 'zau6', zhengyu: 'ざう', type: 'adj' },
  { mandarin: ['又'], cantonese: '又', jyutping: 'jau6', zhengyu: 'やう', type: 'adj' },
  { mandarin: ['未', '没'], cantonese: '未', jyutping: 'mei6', zhengyu: 'めい', type: 'adj' },
  { mandarin: ['不', '唔'], cantonese: '唔', jyutping: 'm4', zhengyu: 'ん', type: 'adj' },
  { mandarin: ['热'], cantonese: '热', jyutping: 'jit6', zhengyu: 'いっ', type: 'adj' },
  { mandarin: ['太'], cantonese: '太', jyutping: 'taai3', zhengyu: 'たあい', type: 'adj' },
  { mandarin: ['忙'], cantonese: '忙', jyutping: 'mong4', zhengyu: 'もん', type: 'adj' },
  { mandarin: ['舒服'], cantonese: '舒服', jyutping: 'syu1fuk6', zhengyu: 'しゅふっ', type: 'adj' },

  // === 助词/连词 (Hiragana) ===
  { mandarin: ['了', '咗'], cantonese: '咗', jyutping: 'zo2', zhengyu: 'ぞ', type: 'particle' },
  { mandarin: ['正在', '紧'], cantonese: '紧', jyutping: 'gan2', zhengyu: 'がん', type: 'particle' },
  { mandarin: ['的', '嘅'], cantonese: '嘅', jyutping: 'ge3', zhengyu: 'げ', type: 'particle' },
  { mandarin: ['吗', '咩'], cantonese: '咩', jyutping: 'me1', zhengyu: 'め', type: 'particle' },
  { mandarin: ['啊'], cantonese: '啊', jyutping: 'aa3', zhengyu: 'あ', type: 'particle' },
  { mandarin: ['啦'], cantonese: '啦', jyutping: 'laa1', zhengyu: 'ら', type: 'particle' },
  { mandarin: ['和', '跟', '同'], cantonese: '同', jyutping: 'tung4', zhengyu: 'とん', type: 'particle' },
  { mandarin: ['因为'], cantonese: '因为', jyutping: 'jan1wai6', zhengyu: 'やんわい', type: 'particle' },
  { mandarin: ['所以'], cantonese: '所以', jyutping: 'so2ji5', zhengyu: 'そい', type: 'particle' },
  { mandarin: ['或者'], cantonese: '或者', jyutping: 'waak6ze2', zhengyu: 'わあっぜ', type: 'particle' },
  
  // === 量词 (Hiragana) ===
  { mandarin: ['个'], cantonese: '個', jyutping: 'go3', zhengyu: 'ご', type: 'particle' },
  { mandarin: ['只'], cantonese: '只', jyutping: 'zek3', zhengyu: 'ぜっ', type: 'particle' },
  { mandarin: ['件'], cantonese: '件', jyutping: 'gin6', zhengyu: 'ぎん', type: 'particle' },
  { mandarin: ['间'], cantonese: '间', jyutping: 'gaan1', zhengyu: 'があん', type: 'particle' },
  
  // === 专有名词/常见名词 (Kanji - for demo purposes) ===
  { mandarin: ['饭', '米饭'], cantonese: '飯', jyutping: 'faan6', zhengyu: '飯', type: 'noun' },
  { mandarin: ['电影', '戏'], cantonese: '戏', jyutping: 'hei3', zhengyu: '戏', type: 'noun' }, // Colloquial
  { mandarin: ['街'], cantonese: '街', jyutping: 'gaai1', zhengyu: '街', type: 'noun' },
  { mandarin: ['东西', '野'], cantonese: '嘢', jyutping: 'je5', zhengyu: '嘢', type: 'noun' },
  { mandarin: ['明天', '听日'], cantonese: '听日', jyutping: 'ting1jat6', zhengyu: '听日', type: 'noun' },
  { mandarin: ['今天', '今日'], cantonese: '今日', jyutping: 'gam1jat6', zhengyu: '今日', type: 'noun' },
  { mandarin: ['屋', '房子'], cantonese: '屋', jyutping: 'uk1', zhengyu: '屋', type: 'noun' },
  { mandarin: ['家', '家里'], cantonese: '屋企', jyutping: 'uk1kei2', zhengyu: '屋企', type: 'noun' },
  { mandarin: ['天', '天气'], cantonese: '天气', jyutping: 'tin1hei3', zhengyu: '天气', type: 'noun' },
  { mandarin: ['山'], cantonese: '山', jyutping: 'saan1', zhengyu: '山', type: 'noun' },
];
