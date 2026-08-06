import personality from '@/content/personality.json';
import { AXES } from '@/engine/types';
import type { Question } from '@/engine/types';

const questions = personality as unknown as Question[];
const LIKERT = ['매우 그렇다', '그렇다', '아니다', '전혀 아니다'];

describe('성격 16유형 문항', () => {
  test('32문항이고 ID가 규칙을 지키며 중복이 없다', () => {
    expect(questions).toHaveLength(32);
    for (const q of questions) expect(q.id).toMatch(/^pers-\d{4}$/);
    expect(new Set(questions.map((q) => q.id)).size).toBe(32);
  });

  test('모든 문항이 typed이고 유효한 축을 갖는다', () => {
    for (const q of questions) {
      expect(q.kind).toBe('typed');
      expect(AXES).toContain(q.axis);
    }
  });

  test('축마다 정확히 8문항', () => {
    for (const axis of AXES) {
      expect(questions.filter((q) => q.axis === axis)).toHaveLength(8);
    }
  });

  test('모든 문항이 같은 리커트 선택지 문구를 같은 순서로 쓴다', () => {
    for (const q of questions) {
      expect(q.choices.map((c) => c.text)).toEqual(LIKERT);
    }
  });

  test('가중치는 정방향 [2,1,-1,-2] 또는 역방향 [-2,-1,1,2] 둘 중 하나다', () => {
    for (const q of questions) {
      const w = q.choices.map((c) => c.weight);
      const forward = JSON.stringify(w) === JSON.stringify([2, 1, -1, -2]);
      const reverse = JSON.stringify(w) === JSON.stringify([-2, -1, 1, 2]);
      expect(forward || reverse).toBe(true);
    }
  });

  test('축마다 정방향 4개·역방향 4개로 균형이 잡혀 있다', () => {
    for (const axis of AXES) {
      const inAxis = questions.filter((q) => q.axis === axis);
      const forward = inAxis.filter((q) => q.choices[0]?.weight === 2);
      expect(forward).toHaveLength(4);
    }
  });

  test('모든 문항에 어느 축을 재는지 설명이 있다', () => {
    for (const q of questions) {
      expect((q.explanation ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  test('정답형 필드가 섞여 있지 않다', () => {
    for (const q of questions) {
      expect(q.answerIndex).toBeUndefined();
    }
  });

  // 브리프 표(task-6-brief.md)의 F/R 열을 그대로 옮긴 지도. id별로 어느
  // 방향이어야 하는지 고정해서, 같은 축 안에서 F/R이 서로 뒤바뀌어도
  // (예: pers-0001과 pers-0005가 맞바뀌어도) 위의 "개수만 세는" 테스트들은
  // 통과하지만 이 테스트는 실패하도록 한다.
  const DIRECTION: Record<string, 'F' | 'R'> = {
    'pers-0001': 'F',
    'pers-0002': 'F',
    'pers-0003': 'F',
    'pers-0004': 'F',
    'pers-0005': 'R',
    'pers-0006': 'R',
    'pers-0007': 'R',
    'pers-0008': 'R',
    'pers-0009': 'F',
    'pers-0010': 'F',
    'pers-0011': 'F',
    'pers-0012': 'F',
    'pers-0013': 'R',
    'pers-0014': 'R',
    'pers-0015': 'R',
    'pers-0016': 'R',
    'pers-0017': 'F',
    'pers-0018': 'F',
    'pers-0019': 'F',
    'pers-0020': 'F',
    'pers-0021': 'R',
    'pers-0022': 'R',
    'pers-0023': 'R',
    'pers-0024': 'R',
    'pers-0025': 'F',
    'pers-0026': 'F',
    'pers-0027': 'F',
    'pers-0028': 'F',
    'pers-0029': 'R',
    'pers-0030': 'R',
    'pers-0031': 'R',
    'pers-0032': 'R',
  };

  test('각 문항의 방향(F/R)이 브리프 표의 id별 지정과 정확히 일치한다', () => {
    for (const q of questions) {
      const expected = DIRECTION[q.id];
      expect(expected).toBeDefined();
      const firstWeight = q.choices[0]?.weight;
      const actual = firstWeight === 2 ? 'F' : firstWeight === -2 ? 'R' : undefined;
      expect(actual).toBe(expected);
    }
  });
});
