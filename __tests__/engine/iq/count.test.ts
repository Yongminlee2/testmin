import { countGenerator } from '@/engine/iq/generators/count';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import type { FigureSpec } from '@/engine/types';

describe('countGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    // 단일 시드는 불리언/저카디널리티 형태의 난수 유입을 절반 확률로만 잡는다.
    // 여러 시드를 돌려 우연히 일치할 확률을 낮춘다.
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(countGenerator.generate(seed))).toBe(
        JSON.stringify(countGenerator.generate(seed))
      );
    }
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

  // 리뷰 Important #1 — DOT_POSITIONS 좌표가 겹치면 점 2개가 화면에 1개로 그려져
  // shapes.length는 정답과 일치한다고 계산되는데 실제로는 눈에 보이는 점이 하나
  // 모자란 문제가 생긴다. 개수(length) 기반 검사로는 이 오류를 못 잡으므로
  // 실제 생성된 도형에서 좌표를 직접 모아 쌍쌍이 거리를 잰다.
  // 지름은 리터럴로 하드코딩하지 않고 생성된 도형의 size 필드에서 그대로 읽는다.
  test('점 좌표는 어느 조합도 겹치지 않는다', () => {
    const positionsByIndex = new Map<number, { x: number; y: number }>();
    let diameter: number | undefined;

    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const figures: FigureSpec[] = [
        ...(question.figure ? [question.figure] : []),
        ...question.choices
          .map((c) => c.figure)
          .filter((f): f is FigureSpec => f !== undefined),
      ];
      for (const fig of figures) {
        for (const cell of fig.cells) {
          cell.shapes.forEach((s, i) => {
            positionsByIndex.set(i, { x: s.x, y: s.y });
            diameter = s.size;
          });
        }
      }
    }

    // 이 테스트 자체가 인덱스 0~8을 전부 관측했는지 확인한다 —
    // 못 봤다면 아래 거리 검사가 일부 좌표를 놓친 채 통과해버릴 수 있다.
    expect(positionsByIndex.size).toBe(9);
    if (diameter === undefined) {
      throw new Error('점 크기를 하나도 관측하지 못했다 — 테스트 커버리지 부족');
    }

    const positions = [...positionsByIndex.values()];
    let minDistance = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i] as { x: number; y: number };
        const b = positions[j] as { x: number; y: number };
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < minDistance) minDistance = d;
      }
    }

    // 두 원이 겹치지 않으려면 중심간 거리가 지름보다 커야 한다
    expect(minDistance).toBeGreaterThan(diameter);
  });

  // 리뷰 Important #3 — 해설 문자열은 verifyGenerated에서 "비어있지 않은지"만
  // 검사되므로, 계산값과 무관한 문장으로 바뀌어도 다른 테스트가 못 잡는다.
  // 생성기 내부 변수를 다시 읽으면 동어반복이므로, 그려진 격자에서 첫 칸
  // 개수와 정답 개수를 독립적으로 역산해 해설 문자열에 그 숫자가 실제로
  // 들어있는지 확인한다.
  test('해설이 격자에서 역산한 개수를 실제로 언급한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = countGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      const c00 = cells[0]?.shapes.length ?? 0; // (0,0)
      const c01 = cells[1]?.shapes.length ?? 0; // (0,1)
      const step = c01 - c00;
      const expected = c00 + 4 * step; // (2,2)

      const explanation = question.explanation ?? '';
      expect(explanation).toContain(String(c00));
      expect(explanation).toContain(String(expected));
    }
  });
});
