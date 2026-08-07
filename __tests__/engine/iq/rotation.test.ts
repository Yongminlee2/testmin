import { rotationGenerator } from '@/engine/iq/generators/rotation';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('rotationGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    const a = rotationGenerator.generate(1234);
    const b = rotationGenerator.generate(1234);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('다른 시드는 다른 문항을 만든다', () => {
    const a = rotationGenerator.generate(1);
    const b = rotationGenerator.generate(2);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = rotationGenerator.generate(7);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const gq = rotationGenerator.generate(seed);
      const errors = verifyGenerated(gq);
      if (errors.length > 0) {
        throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
      }
    }
  });

  test('시드 500개에서 정답이 항상 1번에 오지는 않는다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(rotationGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('정답 선택지의 도형이 규칙이 예측하는 모양과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // 여덟 번째 칸(index 7)과 아홉 번째 칸의 관계가 나머지 칸 간격과 같아야 한다
      const first = cells[0]?.shapes[0]?.rotation ?? 0;
      const second = cells[1]?.shapes[0]?.rotation ?? 0;
      const step = ((second - first) % 360 + 360) % 360;
      const expected = ((first + step * 8) % 360 + 360) % 360;
      const answer = question.choices[question.answerIndex ?? 0]?.figure;
      expect(answer).toBeDefined();
      expect(
        figureEquals(answer!, { kind: 'single', cells: [{ shapes: [{ ...cells[0]!.shapes[0]!, rotation: expected }] }] })
      ).toBe(true);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = rotationGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
