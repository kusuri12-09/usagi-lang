import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUsagi, reaction, translate } from '../src/core.ts';

test('known situations use dictionary expressions', () => {
  assert.deepEqual(reaction('birthday'), { reaction: '유후후후후후후후후후', tag: 'birthday', matched: true, generated: false });
  assert.equal(translate('케이크 맛있다!').translated, '우아');
  assert.equal(translate('여기 있었네!').translated, '야하');
  assert.equal(translate('하아?').translated, '하아?');
});

test('unknown and negated inputs use a clearly marked random fallback', () => {
  const unknownEmotion = reaction('sad');
  assert.equal(unknownEmotion.matched, false);
  assert.equal(unknownEmotion.generated, true);
  assert.equal(unknownEmotion.tag, null);
  assert.match(unknownEmotion.reaction, /^[가-힣,!?\. ~]+!$/);
  for (const text of ['성공하지 못했어', '내일 회의가 취소됐어']) {
    const output = translate(text);
    assert.equal(output.matched, false);
    assert.equal(output.generated, true);
    assert.match(output.translated, /^[가-힣,!?\. ~]+!$/);
  }
});

test('random expressions use one to three sounds based on word count', () => {
  const originalRandom = Math.random;
  const values = [0.95, 0.1, 0.5, 0.99];
  try {
    Math.random = () => values.shift() ?? 0;
    assert.equal(randomUsagi('안녕').expression, '하~ 후응!');
    values.push(0.95, 0.1, 0.5, 0.4, 0.99, 0);
    assert.equal(randomUsagi('오늘 뭐 할까').expression, '하~ 후응, 으핫!');
    values.push(0, 0);
    assert.equal(randomUsagi('오늘 우리 같이 놀자').expression, '야!');
    values.push(0, 0.7, 0.99);
    assert.equal(randomUsagi('안녕').expression, '유후후!');
    values.push(0, 0.7, 0.99);
    assert.equal(randomUsagi('오늘 우리 같이 놀자').expression, '유후후후후후!');
  } finally {
    Math.random = originalRandom;
  }
});

test('random expressions are bounded and marked as generated', () => {
  for (let i = 0; i < 100; i++) {
    const generated = randomUsagi();
    assert.equal(generated.generated, true);
    assert.match(generated.expression, /^[가-힣,!?\. ~]+!$/);
    assert.ok(generated.expression.length <= 16);
    assert.doesNotMatch(generated.expression, /푸르/);
  }
});
