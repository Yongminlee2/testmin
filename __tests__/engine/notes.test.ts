import { addNotes, parseNotes, MAX_NOTES } from '@/engine/notes';
import type { WrongNote } from '@/engine/notes';

function note(overrides: Partial<WrongNote> = {}): WrongNote {
  return {
    testId: 'dialect',
    variant: 'gyeongsang',
    questionId: 'q1',
    chosenIndex: 1,
    answerIndex: 0,
    addedAt: 1000,
    ...overrides,
  };
}

describe('parseNotes', () => {
  test('저장 데이터가 깨져 있어도 빈 목록을 주고 throw 하지 않는다', () => {
    const badInputs: unknown[] = [
      null,
      undefined,
      0,
      'x',
      [],
      [1, 2],
      [{}],
      [{ questionId: 'a' }],
      '{"broken":',
    ];
    for (const bad of badInputs) {
      expect(() => parseNotes(bad)).not.toThrow();
      expect(Array.isArray(parseNotes(bad))).toBe(true);
    }
  });

  test('항목 하나가 망가져도 나머지는 살아남는다', () => {
    const good1 = note({ questionId: 'good-1' });
    const good2 = note({ questionId: 'good-2', testId: 'iq', variant: 'default' });
    const broken = { testId: 'dialect', questionId: 'broken' }; // chosenIndex 등 없음
    const parsed = parseNotes([good1, broken, good2]);
    expect(parsed).toHaveLength(2);
    expect(parsed.map((n) => n.questionId)).toEqual(['good-1', 'good-2']);
  });

  test('정상 데이터는 JSON 왕복 후에도 그대로 복원된다', () => {
    const raw = [note({ questionId: 'a' }), note({ questionId: 'b', chosenIndex: -1 })];
    const roundTripped = JSON.parse(JSON.stringify(raw));
    expect(parseNotes(roundTripped)).toEqual(raw);
  });

  test('배열이 아닌 값이 오면 빈 배열을 준다', () => {
    expect(parseNotes(note())).toEqual([]);
  });
});

describe('addNotes', () => {
  test('같은 questionId는 쌓이지 않고 갱신된다', () => {
    let list: WrongNote[] = [];
    list = addNotes(list, [note({ questionId: 'q1', chosenIndex: 1, addedAt: 1 })]);
    list = addNotes(list, [note({ questionId: 'q1', chosenIndex: 2, addedAt: 2 })]);
    list = addNotes(list, [note({ questionId: 'q1', chosenIndex: 3, addedAt: 3 })]);

    expect(list).toHaveLength(1);
    expect(list[0]?.chosenIndex).toBe(3);
    expect(list[0]?.addedAt).toBe(3);
  });

  test('다른 questionId는 각각 쌓인다', () => {
    let list: WrongNote[] = [];
    list = addNotes(list, [note({ questionId: 'q1' })]);
    list = addNotes(list, [note({ questionId: 'q2' })]);
    expect(list.map((n) => n.questionId).sort()).toEqual(['q1', 'q2']);
  });

  test('한 번에 넘긴 added 안에 같은 questionId가 있으면 마지막 것만 남는다', () => {
    const list = addNotes([], [
      note({ questionId: 'q1', chosenIndex: 1 }),
      note({ questionId: 'q1', chosenIndex: 2 }),
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]?.chosenIndex).toBe(2);
  });

  test('새로 추가된 오답이 앞쪽에 온다', () => {
    const list = addNotes([note({ questionId: 'old' })], [note({ questionId: 'new' })]);
    expect(list.map((n) => n.questionId)).toEqual(['new', 'old']);
  });

  test('상한을 넘으면 오래된 것부터 버린다', () => {
    let list: WrongNote[] = [];
    const total = MAX_NOTES + 10;
    for (let i = 0; i < total; i++) {
      list = addNotes(list, [note({ questionId: `q${i}`, addedAt: i })]);
    }
    expect(list).toHaveLength(MAX_NOTES);
    expect(list[0]?.questionId).toBe(`q${total - 1}`);
    for (let i = 0; i < 10; i++) {
      expect(list.find((n) => n.questionId === `q${i}`)).toBeUndefined();
    }
    expect(list.find((n) => n.questionId === 'q10')).toBeDefined();
  });

  test('원본 배열을 변형하지 않는다', () => {
    const list = [note({ questionId: 'a' })] as const;
    const before = [...list];
    addNotes(list, [note({ questionId: 'b' })]);
    expect(list).toEqual(before);
  });
});
