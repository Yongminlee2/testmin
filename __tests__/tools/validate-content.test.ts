import { validateScoredQuestions, validateGradeTable } from '../../tools/validate-content';
import type { Question, GradeTable } from '@/engine/types';

function ok(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 문제`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex: 0,
    explanation: '해설이 있습니다',
    difficulty: 1,
  };
}

const opts = { expectedChoiceCount: 4 };

describe('validateScoredQuestions', () => {
  test('올바른 문항 묶음은 오류가 없다', () => {
    expect(validateScoredQuestions([ok('a'), ok('b')], opts)).toEqual([]);
  });

  test('answerIndex가 범위를 벗어나면 잡는다', () => {
    const bad = { ...ok('a'), answerIndex: 4 };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('answerIndex가 없으면 잡는다', () => {
    const { answerIndex, ...rest } = ok('a');
    const errors = validateScoredQuestions([rest as Question], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('해설이 비어 있으면 잡는다', () => {
    const bad = { ...ok('a'), explanation: '   ' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('해설'))).toBe(true);
  });

  test('ID 중복을 잡는다', () => {
    const errors = validateScoredQuestions([ok('a'), ok('a')], opts);
    expect(errors.some((e) => e.includes('중복'))).toBe(true);
  });

  test('선택지 개수가 규격과 다르면 잡는다', () => {
    const bad = { ...ok('a'), choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }] };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 개수'))).toBe(true);
  });

  test('같은 문항 안의 선택지 텍스트 중복을 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: 'ㄱ' }, { text: 'ㄱ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 텍스트'))).toBe(true);
  });

  test('빈 선택지 텍스트를 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: '' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('비어'))).toBe(true);
  });

  test('오류 메시지에 문항 ID가 들어간다', () => {
    const bad = { ...ok('dialect-gs-0007'), explanation: '' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('dialect-gs-0007'))).toBe(true);
  });
});

describe('validateGradeTable', () => {
  const good: GradeTable = {
    bands: [
      { min: 100, grade: 1, title: '1급' },
      { min: 50, grade: 5, title: '5급' },
      { min: 0, grade: 9, title: '9급' },
    ],
  };

  test('올바른 테이블은 오류가 없다', () => {
    expect(validateGradeTable('t', good)).toEqual([]);
  });

  test('내림차순이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 50, grade: 5, title: '5급' },
        { min: 100, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('내림차순'))).toBe(true);
  });

  test('최상 밴드가 100이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 90, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('100'))).toBe(true);
  });

  test('최하 밴드가 0이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '1급' },
        { min: 10, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('0%'))).toBe(true);
  });

  test('칭호가 비면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('칭호'))).toBe(true);
  });
});
