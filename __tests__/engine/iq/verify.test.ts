import { verifyGenerated } from '@/engine/iq/verify';
import { shape } from '@/engine/iq/figure';
import type { FigureSpec, GeneratedQuestion, Question } from '@/engine/types';

const fig = (size: number): FigureSpec => ({
  kind: 'single',
  cells: [{ shapes: [shape('circle', { size })] }],
});

function make(overrides: Partial<Question> = {}): GeneratedQuestion {
  const question: Question = {
    id: 'iq-test-1',
    kind: 'scored',
    prompt: '다음에 올 도형은?',
    choices: [0.2, 0.4, 0.6, 0.8, 1.0].map((s) => ({ figure: fig(s) })),
    answerIndex: 0,
    explanation: '규칙 설명',
    difficulty: 1,
    ...overrides,
  };
  return { question, generatorId: 'test', seed: 1 };
}

describe('verifyGenerated', () => {
  test('올바른 문항은 오류가 없다', () => {
    expect(verifyGenerated(make())).toEqual([]);
  });

  test('선택지가 5개가 아니면 잡는다', () => {
    const gq = make({ choices: [{ figure: fig(0.2) }, { figure: fig(0.4) }] });
    expect(verifyGenerated(gq).some((e) => e.includes('5지선다'))).toBe(true);
  });

  test('answerIndex가 없으면 잡는다', () => {
    const gq = make();
    const q = { ...gq.question };
    delete (q as { answerIndex?: number }).answerIndex;
    expect(verifyGenerated({ ...gq, question: q }).some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('answerIndex가 범위를 벗어나면 잡는다', () => {
    expect(verifyGenerated(make({ answerIndex: 5 })).some((e) => e.includes('범위'))).toBe(true);
  });

  test('해설이 비면 잡는다', () => {
    expect(verifyGenerated(make({ explanation: '  ' })).some((e) => e.includes('해설'))).toBe(true);
  });

  test('질문이 비면 잡는다', () => {
    expect(verifyGenerated(make({ prompt: '' })).some((e) => e.includes('질문'))).toBe(true);
  });

  test('도형이 같은 선택지 두 개를 잡는다', () => {
    const gq = make({
      choices: [fig(0.2), fig(0.4), fig(0.6), fig(0.8), fig(0.2)].map((f) => ({ figure: f })),
    });
    expect(verifyGenerated(gq).some((e) => e.includes('도형이 같습니다'))).toBe(true);
  });

  test('값이 같은 텍스트 선택지 두 개를 잡는다', () => {
    const gq = make({
      choices: [{ text: '3' }, { text: '6' }, { text: '12' }, { text: '24' }, { text: '6' }],
    });
    expect(verifyGenerated(gq).some((e) => e.includes('값이 같습니다'))).toBe(true);
  });

  test('오류 메시지에 생성기 id와 시드가 들어간다', () => {
    const gq = { ...make({ explanation: '' }), generatorId: 'rotation', seed: 4242 };
    const errors = verifyGenerated(gq);
    expect(errors.some((e) => e.includes('rotation') && e.includes('4242'))).toBe(true);
  });
});
