import { mulberry32, shuffle, hashSeed, pickInt } from '@/engine/rng';

describe('mulberry32', () => {
  test('같은 시드는 같은 수열을 만든다', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  test('다른 시드는 다른 수열을 만든다', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  test('출력은 0 이상 1 미만이다', () => {
    const rand = mulberry32(999);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  test('원본 배열을 바꾸지 않는다', () => {
    const src = [1, 2, 3, 4, 5];
    shuffle(src, mulberry32(7));
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  test('원소는 그대로이고 순열만 바뀐다', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(src, mulberry32(7));
    expect(out.slice().sort((x, y) => x - y)).toEqual(src);
  });

  test('같은 시드는 같은 순서를 만든다', () => {
    const src = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(src, mulberry32(42))).toEqual(shuffle(src, mulberry32(42)));
  });

  test('빈 배열도 처리한다', () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
  });
});

describe('hashSeed', () => {
  test('같은 문자열은 같은 값을 준다', () => {
    expect(hashSeed('dialect-gyeongsang')).toBe(hashSeed('dialect-gyeongsang'));
  });

  test('다른 문자열은 다른 값을 준다', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  test('32비트 부호 없는 정수 범위를 지킨다', () => {
    const h = hashSeed('테스트의 민족');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('pickInt', () => {
  test('경계를 포함한 범위 안의 값을 준다', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const v = pickInt(rand, 2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test('min과 max가 같으면 그 값을 준다', () => {
    expect(pickInt(mulberry32(1), 4, 4)).toBe(4);
  });
});
