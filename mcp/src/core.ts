import dictionaryData from '../../dictionary.json' with { type: 'json' };
import repeatedSoundsData from '../../repeated-sounds.json' with { type: 'json' };

type Entry = { expression: string; meanings: string[]; tags: string[]; note?: string };
const dictionary = dictionaryData as Entry[];
const repeatedSounds = repeatedSoundsData as Record<string, string[]>;
const byTag = new Map<string, Entry[]>();
for (const entry of dictionary) {
  for (const tag of entry.tags) byTag.set(tag, [...(byTag.get(tag) ?? []), entry]);
}

const rules: [RegExp, string][] = [
  [/생일/, 'birthday'],
  [/맛있|맛나/, 'tasty'],
  [/찾았|찾았다|발견|여기\s*있/, 'found'],
  [/물에\s*들어|물속에\s*들어|수영하러/, 'entering_water'],
  [/어서\s*와|어서\s*오|환영/, 'welcoming'],
  [/왜\?|왜\s|왜$/, 'asking_why'],
  [/뭐야|설마|깜짝|놀랐/, 'surprised'],
  [/모르겠|몰라/, 'not_knowing'],
  [/신나|들떴|흥분/, 'excited'],
  [/기쁘|행복|즐거/, 'happy'],
  [/해냈|성공|완료/, 'confident'],
  [/잘했|뿌듯|자랑스러/, 'proud'],
  [/따라와|같이\s*가|함께\s*가/, 'inviting'],
  [/힘내|응원/, 'encouraging'],
  [/맞아|그렇지|동의/, 'agreeing'],
  [/알겠|이해했/, 'understood'],
  [/배고프|먹고\s*싶|군침/, 'appetite'],
  [/크다|거대|엄청\s*커/, 'huge'],
  [/이거\s*봐|저거\s*봐/, 'showing'],
  [/춤추|춤을\s*춰/, 'dancing'],
  [/잡초/, 'weed'],
  [/최근|요즘/, 'recent'],
];

export function reaction(tag: string) {
  const entry = byTag.get(tag)?.[0];
  return {
    reaction: entry?.expression ?? randomUsagi().expression,
    tag: entry ? tag : null,
    matched: Boolean(entry),
    generated: !entry,
  };
}

export function translate(text: string) {
  const normalized = text.trim();
  const exact = dictionary.find(entry => entry.expression === normalized);
  if (exact) return { original: text, translated: exact.expression, tag: exact.tags[0] ?? null, matched: true, generated: false };
  // shortcut: unsupported negative statements use patterns, expand when real examples show missed forms.
  const unsupported = /못했|실패|안\s*됐|슬프|속상/.test(normalized);
  const tag = unsupported ? undefined : rules.find(([pattern]) => pattern.test(normalized))?.[1];
  const result = tag ? reaction(tag) : { reaction: randomUsagi(normalized).expression, tag: null, matched: false, generated: true };
  return { original: text, translated: result.reaction, tag: result.tag, matched: result.matched, generated: result.generated };
}

const sounds = ['야', '하', '푸루', '우라', '으핫', '후응'];
const longSounds = [...sounds, ...Object.keys(repeatedSounds)];
const separators = [', ', '! ', ' ', '... ', '? ', '~ '];
export function randomUsagi(input = '') {
  const wordCount = input.trim().split(/\s+/).filter(part => /[\p{L}\p{N}]/u.test(part)).length || 1;
  let expression: string;
  do {
    const roll = Math.random();
    const length = wordCount === 1 ? (roll < 0.9 ? 1 : 2) : wordCount <= 3 ? (roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3) : (roll < 0.4 ? 1 : roll < 0.75 ? 2 : 3);
    const variantCount = wordCount === 1 ? 2 : wordCount <= 3 ? 3 : 5;
    const parts = Array.from({ length }, () => {
      const sound = longSounds[Math.floor(Math.random() * longSounds.length)];
      const variants = repeatedSounds[sound];
      return variants ? variants[Math.floor(Math.random() * variantCount)] : sound;
    });
    expression = parts[0];
    for (let i = 1; i < parts.length; i++) {
      expression += (parts[i] === parts[i - 1] ? '' : separators[Math.floor(Math.random() * separators.length)]) + parts[i];
    }
    expression += '!';
  } while (dictionary.some(entry => entry.expression === expression));
  return { expression, generated: true };
}
