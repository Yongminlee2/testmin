import { scoreByAxis } from '@/engine/typeScore';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

function q(id: string, axis: string, weights: number[]): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: weights.map((w) => ({ text: `w${w}`, weight: w })),
    axis,
    difficulty: 1,
  };
}

/** 축당 2문항짜리 최소 세트 */
function makeSet(): Question[] {
  return [
    q('ei1', 'EI', [2, 1, -1, -2]),
    q('ei2', 'EI', [2, 1, -1, -2]),
    q('sn1', 'SN', [2, 1, -1, -2]),
    q('sn2', 'SN', [2, 1, -1, -2]),
    q('tf1', 'TF', [2, 1, -1, -2]),
    q('tf2', 'TF', [2, 1, -1, -2]),
    q('jp1', 'JP', [2, 1, -1, -2]),
    q('jp2', 'JP', [2, 1, -1, -2]),
  ];
}

/** 모든 문항에 같은 선택지 인덱스로 답한다 */
function answerAll(questions: Question[], index: number): Answer[] {
  return questions.map((x) => ({ questionId: x.id, chosenIndex: index }));
}

describe('scoreByAxis', () => {
  test('모든 축에서 양수를 고르면 ENFP', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0)); // weight +2
    expect(r.code).toBe('ENFP');
  });

  test('모든 축에서 음수를 고르면 ISTJ', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 3)); // weight -2
    expect(r.code).toBe('ISTJ');
  });

  test('코드는 항상 네 글자이고 축 순서를 지킨다', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    expect(r.code).toHaveLength(4);
    expect(r.axes.map((a) => a.axis)).toEqual(['EI', 'SN', 'TF', 'JP']);
  });

  test('축 합계가 0이면 그 축의 마지막 응답 방향으로 결정하고 wasTie를 세운다', () => {
    const qs = makeSet();
    // EI만 +2, -2 → 합계 0, 마지막 응답이 -2이므로 I
    const answers: Answer[] = [
      { questionId: 'ei1', chosenIndex: 0 }, // +2
      { questionId: 'ei2', chosenIndex: 3 }, // -2
      ...answerAll(qs.slice(2), 0),
    ];
    const r = scoreByAxis(qs, answers);
    const ei = r.axes.find((a) => a.axis === 'EI');
    expect(ei?.total).toBe(0);
    expect(ei?.wasTie).toBe(true);
    expect(ei?.letter).toBe('I');
    expect(r.code.startsWith('I')).toBe(true);
  });

  test('동점이 아니면 wasTie는 false', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    expect(r.axes.every((a) => a.wasTie)).toBe(false);
  });

  test('한 축에 응답이 하나도 없으면 negative 글자와 wasTie', () => {
    const qs = makeSet();
    const answers = answerAll(qs, 0).filter((a) => !a.questionId.startsWith('jp'));
    const r = scoreByAxis(qs, answers);
    const jp = r.axes.find((a) => a.axis === 'JP');
    expect(jp?.wasTie).toBe(true);
    expect(jp?.letter).toBe('J');
  });

  test('percent는 0~100 범위이고 완전 치우침이면 100', () => {
    const qs = makeSet();
    const r = scoreByAxis(qs, answerAll(qs, 0));
    for (const a of r.axes) {
      expect(a.percent).toBeGreaterThanOrEqual(0);
      expect(a.percent).toBeLessThanOrEqual(100);
    }
    expect(r.axes[0]!.percent).toBe(100);
  });

  test('완전 반반이면 percent는 50', () => {
    const qs = makeSet();
    const answers: Answer[] = [
      { questionId: 'ei1', chosenIndex: 0 },
      { questionId: 'ei2', chosenIndex: 3 },
      ...answerAll(qs.slice(2), 0),
    ];
    const r = scoreByAxis(qs, answers);
    expect(r.axes.find((a) => a.axis === 'EI')?.percent).toBe(50);
  });

  test('문항이 하나도 없으면 예외 없이 네 글자를 돌려준다', () => {
    const r = scoreByAxis([], []);
    expect(r.code).toHaveLength(4);
    expect(r.axes).toHaveLength(4);
  });

  test('16개 코드가 모두 도달 가능하다', () => {
    const qs = makeSet();
    const seen = new Set<string>();
    // 각 축을 독립적으로 +/- 조합
    for (let mask = 0; mask < 16; mask++) {
      const answers: Answer[] = qs.map((x, i) => {
        const axisIndex = Math.floor(i / 2);
        const positive = (mask >> axisIndex) & 1;
        return { questionId: x.id, chosenIndex: positive ? 0 : 3 };
      });
      seen.add(scoreByAxis(qs, answers).code);
    }
    expect(seen.size).toBe(16);
  });
});
