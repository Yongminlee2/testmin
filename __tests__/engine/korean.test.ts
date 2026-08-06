import { hasFinalConsonant, attachParticle } from '@/engine/korean';

describe('hasFinalConsonant', () => {
  test.each(['수박', '강원', '말'])('받침 있는 말 %s는 true', (word) => {
    expect(hasFinalConsonant(word)).toBe(true);
  });

  test.each(['고사', '테스트', '제주도', '나'])('받침 없는 말 %s는 false', (word) => {
    expect(hasFinalConsonant(word)).toBe(false);
  });

  test.each(['IQ', 'test', '2026', ''])('한글이 아닌 %s는 예외 없이 false', (word) => {
    expect(() => hasFinalConsonant(word)).not.toThrow();
    expect(hasFinalConsonant(word)).toBe(false);
  });
});

describe('attachParticle', () => {
  test('받침 없으면 두 번째 조사를 붙인다: 고사 + 은/는 → 고사는', () => {
    expect(attachParticle('고사', '은', '는')).toBe('고사는');
  });

  test('받침 있으면 첫 번째 조사를 붙인다: 수박 + 은/는 → 수박은', () => {
    expect(attachParticle('수박', '은', '는')).toBe('수박은');
  });

  test('받침 있으면 첫 번째 조사를 붙인다: 책 + 이/가 → 책이', () => {
    expect(attachParticle('책', '이', '가')).toBe('책이');
  });

  test('받침 없으면 두 번째 조사를 붙인다: 나무 + 이/가 → 나무가', () => {
    expect(attachParticle('나무', '이', '가')).toBe('나무가');
  });

  test('섞인 문자열은 마지막 글자 기준으로 판단한다: IQ 고사 → IQ 고사는', () => {
    expect(attachParticle('IQ 고사', '은', '는')).toBe('IQ 고사는');
  });
});
