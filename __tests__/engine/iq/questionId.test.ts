import { iqQuestionId, parseIqQuestionId } from '@/engine/iq/questionId';
import { assembleIq } from '@/engine/iq/assembleIq';
import { GENERATORS } from '@/engine/iq/generators';
import { IQ_DRAW } from '@/content/registry';

describe('iqQuestionId / parseIqQuestionId', () => {
  test('만든 id를 다시 파싱하면 원래 값이 나온다', () => {
    const id = iqQuestionId('rotation', 12345);
    const parsed = parseIqQuestionId(id);
    expect(parsed).toEqual({ generatorId: 'rotation', seed: 12345 });
  });

  test('형식에 안 맞는 id는 undefined를 준다', () => {
    expect(parseIqQuestionId('dialect-gs-01')).toBeUndefined();
    expect(parseIqQuestionId('iq-rotation-')).toBeUndefined();
    expect(parseIqQuestionId('iq--123')).toBeUndefined();
  });

  // ★ 실제 출제된 문항 전부가 이 계약을 지키는가.
  // 생성기 하나가 형식을 벗어나면 그 문항만 오답노트에서 조용히 사라진다.
  test('assembleIq가 내는 모든 문항 id를 파싱해 원래 문항을 복원할 수 있다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const parsed = parseIqQuestionId(gq.question.id);
        expect(parsed).toBeDefined();
        expect(parsed!.generatorId).toBe(gq.generatorId);
        expect(parsed!.seed).toBe(gq.seed);
        const gen = GENERATORS.find((g) => g.id === parsed!.generatorId);
        expect(JSON.stringify(gen!.generate(parsed!.seed))).toBe(JSON.stringify(gq));
      }
    }
  });
});
