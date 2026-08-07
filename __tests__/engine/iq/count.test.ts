import { countGenerator } from '@/engine/iq/generators/count';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('countGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    expect(JSON.stringify(countGenerator.generate(77))).toBe(
      JSON.stringify(countGenerator.generate(77))
    );
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = countGenerator.generate(5);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(countGenerator.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(countGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('모든 선택지의 점 개수가 1개 이상이다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      for (const c of question.choices) {
        expect(c.figure?.cells[0]?.shapes.length ?? 0).toBeGreaterThanOrEqual(1);
      }
    }
  });

  // ★ 예측 대조 — 이 생성기의 정답 오표시를 잡는 유일한 테스트
  test('표시된 정답이 격자에서 역산한 개수와 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const c00 = cells[0]?.shapes.length ?? 0; // (0,0)
      const c01 = cells[1]?.shapes.length ?? 0; // (0,1)
      const step = c01 - c00;
      const expected = c00 + 4 * step; // (2,2)

      const marked = question.choices[question.answerIndex ?? -1]?.figure;
      expect(marked).toBeDefined();
      expect(marked!.cells[0]?.shapes.length).toBe(expected);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
