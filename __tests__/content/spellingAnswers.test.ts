import { getPool } from '@/content/registry';

const expectedAnswers: Readonly<Record<string, string>> = {
  'sp-0001': '안 돼요',
  'sp-0002': '안',
  'sp-0003': '웬',
  'sp-0004': '며칠',
  'sp-0005': '어떡해',
  'sp-0006': '으로서',
  'sp-0007': '이따가',
  'sp-0008': '부치다',
  'sp-0009': '나아라',
  'sp-0010': '든지 / 든지',
  'sp-0011': '금세',
  'sp-0012': '오랜만',
  'sp-0013': '설렌다',
  'sp-0014': '바람',
  'sp-0015': '육개장',
};

describe('맞춤법 고사 정답 원문', () => {
  const questions = getPool('spelling', 'default');

  test('15문항의 answerIndex가 검수한 정답을 정확히 가리킨다', () => {
    expect(questions).toHaveLength(Object.keys(expectedAnswers).length);
    for (const question of questions) {
      expect(question.choices[question.answerIndex as number]?.text).toBe(
        expectedAnswers[question.id]
      );
    }
  });

  test('선택 문장에는 든지/든지, 소문 문장에는 금세가 정답이다', () => {
    expect(expectedAnswers['sp-0010']).toBe('든지 / 든지');
    expect(expectedAnswers['sp-0011']).toBe('금세');
    expect(
      questions.find((question) => question.id === 'sp-0011')?.choices[
        questions.find((question) => question.id === 'sp-0011')?.answerIndex as number
      ]?.text
    ).not.toBe('금쇄');
  });
});
