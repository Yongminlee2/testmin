import { scoreByVote } from '@/engine/typeScore';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

const TYPES = ['a', 'b', 'c', 'd', 'e'];

function q(id: string, typeIds: string[]): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: typeIds.map((t) => ({ text: t, typeId: t })),
    difficulty: 1,
  };
}

describe('scoreByVote', () => {
  test('최다 득표 유형을 돌려준다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd']), q('3', ['a', 'b', 'c', 'd'])];
    const answers: Answer[] = [
      { questionId: '1', chosenIndex: 0 },
      { questionId: '2', chosenIndex: 0 },
      { questionId: '3', chosenIndex: 1 },
    ];
    const r = scoreByVote(qs, answers, TYPES);
    expect(r.typeId).toBe('a');
    expect(r.tally['a']).toBe(2);
    expect(r.tally['b']).toBe(1);
    expect(r.wasTie).toBe(false);
  });

  test('tally에는 0표 유형도 포함된다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: 0 }], TYPES);
    expect(Object.keys(r.tally).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(r.tally['e']).toBe(0);
  });

  test('동점이면 뒤쪽 문항에서 득표한 유형이 이긴다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd'])];
    const answers: Answer[] = [
      { questionId: '1', chosenIndex: 0 }, // a
      { questionId: '2', chosenIndex: 1 }, // b
    ];
    const r = scoreByVote(qs, answers, TYPES);
    expect(r.typeId).toBe('b');
    expect(r.wasTie).toBe(true);
  });

  test('미응답 문항은 표를 던지지 않는다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd']), q('2', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: 0 }], TYPES);
    expect(r.tally['a']).toBe(1);
    expect(Object.values(r.tally).reduce((s, n) => s + n, 0)).toBe(1);
  });

  test('응답이 하나도 없으면 예외 없이 첫 유형과 wasTie를 돌려준다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [], TYPES);
    expect(r.typeId).toBe('a');
    expect(r.wasTie).toBe(true);
  });

  test('chosenIndex가 -1이면 표를 던지지 않는다', () => {
    const qs = [q('1', ['a', 'b', 'c', 'd'])];
    const r = scoreByVote(qs, [{ questionId: '1', chosenIndex: -1 }], TYPES);
    expect(Object.values(r.tally).reduce((s, n) => s + n, 0)).toBe(0);
  });

  test('낮은 표수 동점이 있어도 확실한 승자가 있으면 wasTie는 false다', () => {
    const qs = [
      q('1', ['a', 'b', 'c', 'd', 'e']),
      q('2', ['a', 'b', 'c', 'd', 'e']),
      q('3', ['a', 'b', 'c', 'd', 'e']),
      q('4', ['a', 'b', 'c', 'd', 'e']),
      q('5', ['a', 'b', 'c', 'd', 'e']),
    ];
    const answers: Answer[] = [
      { questionId: '1', chosenIndex: 2 }, // c
      { questionId: '2', chosenIndex: 2 }, // c
      { questionId: '3', chosenIndex: 2 }, // c
      { questionId: '4', chosenIndex: 0 }, // a
      { questionId: '5', chosenIndex: 1 }, // b
    ];
    const r = scoreByVote(qs, answers, TYPES);
    expect(r.tally).toEqual({ a: 1, b: 1, c: 3, d: 0, e: 0 });
    expect(r.typeId).toBe('c');
    expect(r.wasTie).toBe(false);
  });
});
