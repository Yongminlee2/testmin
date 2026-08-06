import { assemble } from '@/engine/assemble';
import type { Question, Difficulty } from '@/engine/types';

function q(id: string, difficulty: Difficulty): Question {
  return {
    id,
    kind: 'scored',
    prompt: id,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex: 0,
    explanation: '해설',
    difficulty,
  };
}

const pool: readonly Question[] = [
  ...Array.from({ length: 10 }, (_, i) => q(`e${i}`, 1)),
  ...Array.from({ length: 10 }, (_, i) => q(`m${i}`, 2)),
  ...Array.from({ length: 10 }, (_, i) => q(`h${i}`, 3)),
];

describe('assemble', () => {
  test('요청한 개수만큼 정확히 뽑는다', () => {
    expect(assemble(pool, 1, { count: 12 })).toHaveLength(12);
  });

  test('같은 시드는 같은 문항 구성을 준다', () => {
    const a = assemble(pool, 777, { count: 12 });
    const b = assemble(pool, 777, { count: 12 });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  test('다른 시드는 다른 구성을 준다', () => {
    const a = assemble(pool, 1, { count: 12 });
    const b = assemble(pool, 2, { count: 12 });
    expect(a.map((x) => x.id)).not.toEqual(b.map((x) => x.id));
  });

  test('중복 없이 뽑는다', () => {
    const ids = assemble(pool, 5, { count: 12 }).map((x) => x.id);
    expect(new Set(ids).size).toBe(12);
  });

  test('난이도 분포를 지킨다', () => {
    const out = assemble(pool, 9, {
      count: 12,
      difficultyMix: { 1: 4, 2: 5, 3: 3 },
    });
    const count = (d: Difficulty) => out.filter((x) => x.difficulty === d).length;
    expect(count(1)).toBe(4);
    expect(count(2)).toBe(5);
    expect(count(3)).toBe(3);
  });

  test('난이도가 부족하면 다른 난이도에서 채워 총 개수를 맞춘다', () => {
    const thin: readonly Question[] = [
      q('e0', 1), q('e1', 1),
      ...Array.from({ length: 10 }, (_, i) => q(`m${i}`, 2)),
    ];
    const out = assemble(thin, 3, { count: 8, difficultyMix: { 1: 4, 2: 4 } });
    expect(out).toHaveLength(8);
    expect(new Set(out.map((x) => x.id)).size).toBe(8);
  });

  test('excludeIds에 있는 문항은 후순위로 밀린다', () => {
    const exclude = pool.slice(0, 20).map((x) => x.id);
    const out = assemble(pool, 11, { count: 10, excludeIds: exclude });
    const reused = out.filter((x) => exclude.includes(x.id));
    expect(reused).toHaveLength(0);
  });

  test('풀이 요청 수보다 작으면 중복을 허용하고 경고를 남긴다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tiny: readonly Question[] = [q('a', 1), q('b', 1), q('c', 1)];
    const out = assemble(tiny, 1, { count: 5 });
    expect(out).toHaveLength(5);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('빈 풀에서는 빈 배열을 주고 예외를 던지지 않는다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(assemble([], 1, { count: 5 })).toEqual([]);
    warn.mockRestore();
  });
});
