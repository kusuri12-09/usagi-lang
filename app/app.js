const rules = [
  [/생일/, 'birthday'], [/맛있|맛나/, 'tasty'], [/찾았|찾았다|발견|여기\s*있/, 'found'],
  [/물에\s*들어|물속에\s*들어|수영하러/, 'entering_water'], [/어서\s*와|어서\s*오|환영/, 'welcoming'],
  [/왜\?|왜\s|왜$/, 'asking_why'], [/뭐야|설마|깜짝|놀랐/, 'surprised'], [/모르겠|몰라/, 'not_knowing'],
  [/신나|들떴|흥분/, 'excited'], [/기쁘|행복|즐거/, 'happy'], [/해냈|성공|완료/, 'confident'],
  [/잘했|뿌듯|자랑스러/, 'proud'], [/따라와|같이\s*가|함께\s*가/, 'inviting'], [/힘내|응원/, 'encouraging'],
  [/맞아|그렇지|동의/, 'agreeing'], [/알겠|이해했/, 'understood'], [/배고프|먹고\s*싶|군침/, 'appetite'],
  [/크다|거대|엄청\s*커/, 'huge'], [/이거\s*봐|저거\s*봐/, 'showing'], [/춤추|춤을\s*춰/, 'dancing'],
  [/잡초/, 'weed'], [/최근|요즘/, 'recent'],
];
const sounds = ['야', '하', '푸루', '우라', '으핫', '후응'];
const separators = [', ', '! ', ' ', '... ', '? ', '~ '];
const dictionaryPromise = fetch('./dictionary.json').then(response => {
  if (!response.ok) throw new Error('사전을 불러오지 못했어요.');
  return response.json();
});
const repeatedSoundsPromise = fetch('./repeated-sounds.json').then(response => {
  if (!response.ok) throw new Error('반복형 소리를 불러오지 못했어요.');
  return response.json();
});

let secretClicks = 0;
document.querySelector('#secret-trigger').addEventListener('click', () => {
  if (++secretClicks === 7) {
    document.querySelector('#page-title').classList.add('secret');
    document.querySelector('#page-title').innerHTML = '푸르르!<br /><span class="underline">우나 야하~야핫!</span>';
    document.querySelector('footer').textContent = '푸르르! 우나~';
  }
});

function randomUsagi(dictionary, repeatedSounds, input) {
  const wordCount = input.trim().split(/\s+/).filter(part => /[\p{L}\p{N}]/u.test(part)).length || 1;
  let expression;
  do {
    const roll = Math.random();
    const length = wordCount === 1 ? (roll < 0.7 ? 1 : 2)
      : wordCount <= 3 ? (roll < 0.35 ? 1 : roll < 0.8 ? 2 : 3)
      : wordCount < 10 ? (roll < 0.2 ? 1 : roll < 0.65 ? 2 : 3)
      : (roll < 0.1 ? 1 : roll < 0.35 ? 2 : roll < 0.75 ? 3 : 4);
    const variantCount = wordCount === 1 ? 2 : wordCount <= 3 ? 3 : 5;
    const choices = [...sounds, ...Object.keys(repeatedSounds).filter(sound => sound !== 'exact')];
    const parts = Array.from({ length }, () => {
      const sound = choices[Math.floor(Math.random() * choices.length)];
      const variants = repeatedSounds[sound];
      return variants ? variants[Math.floor(Math.random() * variantCount)] : sound;
    });
    expression = parts[0];
    for (let i = 1; i < parts.length; i++) {
      expression += (parts[i] === parts[i - 1] ? '' : separators[Math.floor(Math.random() * separators.length)]) + parts[i];
    }
    expression += '!';
  } while (dictionary.some(entry => entry.expression === expression));
  return expression;
}

let nextTranslationAt = 0;
document.querySelector('#translator-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (Date.now() < nextTranslationAt) return;
  const input = document.querySelector('#source-text').value.trim();
  if (!input) return;
  nextTranslationAt = Date.now() + 1500;
  const button = document.querySelector('#translate-button');
  const card = document.querySelector('.result-card');
  const result = document.querySelector('#result-text');
  const note = document.querySelector('#result-note');
  const copy = document.querySelector('#copy-result');
  button.disabled = true;
  card.classList.remove('is-revealed');
  try {
    const [dictionary, repeatedSounds] = await Promise.all([dictionaryPromise, repeatedSoundsPromise]);
    const unsupported = /못했|실패|안\s*됐|슬프|속상/.test(input);
    const tag = unsupported ? undefined : rules.find(([pattern]) => pattern.test(input))?.[1];
    const entry = dictionary.find(item => item.expression === input) || (tag && dictionary.find(item => item.tags.includes(tag)));
    const repeated = Object.values(repeatedSounds).some(variants => variants.includes(input));
    result.textContent = entry ? entry.expression : repeated ? input : randomUsagi(dictionary, repeatedSounds, input);
    note.textContent = entry ? '사전에서 딱 맞는 말을 찾았어요!' : repeated ? '반복형 소리를 그대로 돌려드렸어요!' : '새로운 우사기어가 탄생했어요!';
    result.classList.remove('placeholder');
    copy.disabled = false;
  } catch {
    result.textContent = '하아?';
    note.textContent = '사전을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.';
    result.classList.remove('placeholder');
    copy.disabled = true;
  }
  void card.offsetWidth;
  card.classList.add('is-revealed');
  setTimeout(() => { button.disabled = false; }, Math.max(0, nextTranslationAt - Date.now()));
});

document.querySelector('#copy-result').addEventListener('click', async event => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(document.querySelector('#result-text').textContent);
    button.textContent = '복사됨!';
  } catch {
    button.textContent = '복사 실패';
  }
  setTimeout(() => { button.textContent = '복사'; }, 1800);
});
