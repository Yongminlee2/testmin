import { assembleByAxis } from '@/engine/assembleTyped';
import type { Question } from '@/engine/types';

function q(id: string, axis: string): Question {
  return {
    id,
    kind: 'typed',
    prompt: id,
    choices: [
      { text: '매우 그렇다', weight: 2 },
      { text: '그렇다', weight: 1 },
      { text: '아니다', weight: -1 },
      { text: '전혀 아니다', weight: -2 },
    ],
    axis,
    difficulty: 1,
  };
}

const pool: readonly Question[] = [
  ...Array.from({ length: 8 }, (_, i) => q(`ei${i}`, 'EI')),
  ...Array.from({ length: 8 }, (_, i) => q(`sn${i}`, 'SN')),
  ...Array.from({ length: 8 }, (_, i) => q(`tf${i}`, 'TF')),
  ...Array.from({ length: 8 }, (_, i) => q(`jp${i}`, 'JP')),
];

describe('assembleByAxis', () => {
  test('축별로 정확히 perAxis개씩 뽑는다', () => {
    const out = assembleByAxis(pool, 1, { perAxis: 6 });
    expect(out).toHaveLength(24);
    for (const axis of ['EI', 'SN', 'TF', 'JP']) {
      expect(out.filter((x) => x.axis === axis)).toHaveLength(6);
    }
  });

  test('같은 시드는 같은 구성을 준다', () => {
    const a = assembleByAxis(pool, 42, { perAxis: 6 });
    const b = assembleByAxis(pool, 42, { perAxis: 6 });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  test('다른 시드는 다른 구성을 준다', () => {
    const a = assembleByAxis(pool, 1, { perAxis: 6 });
    const b = assembleByAxis(pool, 2, { perAxis: 6 });
    expect(a.map((x) => x.id)).not.toEqual(b.map((x) => x.id));
  });

  test('중복 없이 뽑는다', () => {
    const out = assembleByAxis(pool, 5, { perAxis: 6 });
    expect(new Set(out.map((x) => x.id)).size).toBe(24);
  });

  test('선택지를 섞지 않는다 — 리커트 순서가 유지된다', () => {
    const out = assembleByAxis(pool, 7, { perAxis: 6 });
    for (const x of out) {
      expect(x.choices.map((c) => c.text)).toEqual([
        '매우 그렇다',
        '그렇다',
        '아니다',
        '전혀 아니다',
      ]);
      expect(x.choices.map((c) => c.weight)).toEqual([2, 1, -1, -2]);
    }
  });

  test('같은 축 문항이 전부 연속으로 나오지는 않는다', () => {
    const out = assembleByAxis(pool, 9, { perAxis: 6 });
    const axesInOrder = out.map((x) => x.axis);
    // 앞의 6개가 전부 같은 축이면 셔플이 안 된 것
    expect(new Set(axesInOrder.slice(0, 6)).size).toBeGreaterThan(1);
  });

  test('축이 부족하면 다른 축에서 채우지 않고 경고한다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const thin: readonly Question[] = [
      q('ei0', 'EI'),
      q('ei1', 'EI'),
      ...Array.from({ length: 8 }, (_, i) => q(`sn${i}`, 'SN')),
      ...Array.from({ length: 8 }, (_, i) => q(`tf${i}`, 'TF')),
      ...Array.from({ length: 8 }, (_, i) => q(`jp${i}`, 'JP')),
    ];
    const out = assembleByAxis(thin, 3, { perAxis: 6 });
    expect(out.filter((x) => x.axis === 'EI')).toHaveLength(2);
    expect(out.filter((x) => x.axis === 'SN')).toHaveLength(6);
    expect(out.filter((x) => x.axis === 'TF')).toHaveLength(6);
    expect(out.filter((x) => x.axis === 'JP')).toHaveLength(6);
    expect(out).toHaveLength(20);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('excludeIds에 있는 문항은 후순위로 밀린다', () => {
    const exclude = pool.filter((x) => x.axis === 'EI').slice(0, 2).map((x) => x.id);
    const out = assembleByAxis(pool, 11, { perAxis: 6, excludeIds: exclude });
    expect(out.filter((x) => exclude.includes(x.id))).toHaveLength(0);
  });

  test('빈 풀에서는 빈 배열을 주고 예외를 던지지 않는다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(assembleByAxis([], 1, { perAxis: 6 })).toEqual([]);
    warn.mockRestore();
  });
});
