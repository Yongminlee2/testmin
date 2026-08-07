import { fillGenerator } from '@/engine/iq/generators/fill';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('fillGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    expect(JSON.stringify(fillGenerator.generate(31))).toBe(
      JSON.stringify(fillGenerator.generate(31))
    );
  });

  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = fillGenerator.generate(9);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(fillGenerator.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(fillGenerator.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = fillGenerator.generate(seed);
      for (const c of question.choices) {
        for (const s of c.figure?.cells[0]?.shapes ?? []) {
          expect(s.rotation).toBe(0);
        }
      }
    }
  });

  // 오답 구성이 규칙별 하나씩인지 확인한다. 이 테스트가 없으면
  // 무작위 slice로 되돌아가도 아무도 눈치채지 못한다.
  test('오답은 종류만 틀림 2개, 채움만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();

      let kindOnly = 0;
      let fillOnly = 0;
      let both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kindWrong = s?.kind !== a!.kind;
        const fillWrong = s?.filled !== a!.filled;
        if (kindWrong && fillWrong) both++;
        else if (kindWrong) kindOnly++;
        else if (fillWrong) fillOnly++;
      });
      expect({ kindOnly, fillOnly, both }).toEqual({ kindOnly: 2, fillOnly: 1, both: 1 });
    }
  });

  // ★ 예측 대조 — 열의 종류 주기와 행의 채움 교대를 격자에서 역산한다
  test('표시된 정답이 격자에서 역산한 종류·채움과 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // (2,2)의 종류는 (0,2)와 같은 열이므로 같다. 채움은 (0,2)와 (1,2)의 교대에서 역산한다.
      const kindAtCol2 = cells[2]?.shapes[0]?.kind;
      const fillRow0 = cells[2]?.shapes[0]?.filled;
      const fillRow1 = cells[5]?.shapes[0]?.filled;
      expect(fillRow0).not.toBe(fillRow1); // 행마다 교대라는 전제 확인
      const expectedFilled = fillRow0; // 행 0과 행 2는 같은 상태

      const marked = question.choices[question.answerIndex ?? -1]?.figure;
      expect(marked).toBeDefined();
      const s = marked!.cells[0]?.shapes[0];
      expect(s?.kind).toBe(kindAtCol2);
      expect(s?.filled).toBe(expectedFilled);
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });
});
