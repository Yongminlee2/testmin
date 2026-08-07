import { assembleIq } from '@/engine/iq/assembleIq';
import { verifyGenerated } from '@/engine/iq/verify';
import { GENERATORS } from '@/engine/iq/generators';
import { IQ_DRAW } from '@/content/registry';

describe('assembleIq', () => {
  test('같은 시드는 같은 세트를 만든다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(JSON.stringify(assembleIq(seed, IQ_DRAW))).toBe(
        JSON.stringify(assembleIq(seed, IQ_DRAW))
      );
    }
  });

  test('요청한 개수만큼 나온다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(assembleIq(seed, IQ_DRAW)).toHaveLength(IQ_DRAW.questionCount);
    }
  });

  // ★ 한 세트에 같은 퍼즐이 두 번 나오면 앱이 고장난 것처럼 보인다
  test('시드 200개에서 한 세트 안에 같은 퍼즐이 두 번 나오지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = assembleIq(seed, IQ_DRAW);
      const keys = set.map((gq) =>
        gq.question.figure
          ? `${gq.generatorId}|${JSON.stringify(gq.question.figure)}`
          : `${gq.generatorId}|${gq.question.prompt}`
      );
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  // ★★ 계획 1에서 출시 직전까지 갔던 결함: 정답이 전부 1번
  test('시드 200개에서 정답 위치가 다섯 자리에 고루 퍼진다', () => {
    const counts = [0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 200; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        counts[gq.question.answerIndex as number] =
          (counts[gq.question.answerIndex as number] as number) + 1;
      }
    }
    const total = counts.reduce((a, b) => a + b, 0);
    for (const c of counts) {
      // 균등이면 20%. 12%~28%면 충분히 고르다.
      expect(c / total).toBeGreaterThan(0.12);
      expect(c / total).toBeLessThan(0.28);
    }
  });

  test('모든 문항이 verifyGenerated를 통과한다', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const errors = verifyGenerated(gq);
        if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
      }
    }
  });

  test('난이도 분포가 설정과 일치한다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const set = assembleIq(seed, IQ_DRAW);
      for (const d of [1, 2, 3] as const) {
        expect(set.filter((gq) => gq.question.difficulty === d)).toHaveLength(
          IQ_DRAW.difficultyMix[d] as number
        );
      }
    }
  });

  test('모든 생성기가 출제에 실제로 쓰인다', () => {
    const used = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) used.add(gq.generatorId);
    }
    expect(used.size).toBe(GENERATORS.length);
  });

  // 오답노트가 (generatorId, seed)만 저장하고 나중에 문항을 복원한다.
  // 그 전제가 성립하는지 여기서 못박는다.
  test('generatorId와 seed로 같은 문항을 복원할 수 있다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const gq of assembleIq(seed, IQ_DRAW)) {
        const gen = GENERATORS.find((g) => g.id === gq.generatorId);
        expect(gen).toBeDefined();
        expect(JSON.stringify(gen!.generate(gq.seed))).toBe(JSON.stringify(gq));
      }
    }
  });
});
