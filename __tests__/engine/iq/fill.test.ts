import { fillGenerator } from '@/engine/iq/generators/fill';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

describe('fillGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    // 단일 시드는 불리언/저카디널리티 형태의 난수 유입을 절반 확률로만 잡는다.
    // 여러 시드를 돌려 우연히 일치할 확률을 낮춘다.
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(fillGenerator.generate(seed))).toBe(
        JSON.stringify(fillGenerator.generate(seed))
      );
    }
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
      // 문제 격자(figure.cells)와 선택지(choices) 둘 다 확인한다.
      // 지금은 둘 다 cellOf()를 거쳐서 우연히 같이 통과할 뿐, 격자 생성 경로만
      // 따로 회전을 주입해도 choices만 보면 못 잡는다 — 리뷰 Important #2.
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) {
          expect(s.rotation).toBe(0);
        }
      }
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

  // 리뷰 Important #3 — 해설 문자열은 verifyGenerated에서 "비어있지 않은지"만
  // 검사되므로, 계산값과 무관한 문장으로 바뀌어도 다른 테스트가 못 잡는다.
  // 생성기 내부 변수(kindNames, answer 등)를 다시 읽으면 동어반복이므로,
  // ★ 예측 대조와 같은 방식으로 격자에서 종류·채움을 독립적으로 역산해
  // 해설 문자열에 그 한국어 표현이 실제로 들어있는지 확인한다.
  test('해설이 격자에서 역산한 종류·채움을 실제로 언급한다', () => {
    const KIND_NAMES_KR: Record<string, string> = {
      circle: '원',
      square: '사각형',
      triangle: '삼각형',
      diamond: '마름모',
    };

    for (let seed = 1; seed <= 300; seed++) {
      const { question } = fillGenerator.generate(seed);
      const cells = question.figure?.cells ?? [];
      // (2,2)의 종류는 (0,2)와 같은 열이므로 같다. 채움은 (0,2)와 (1,2)의 교대에서 역산한다.
      const kindAtCol2 = cells[2]?.shapes[0]?.kind;
      const fillRow0 = cells[2]?.shapes[0]?.filled;
      expect(kindAtCol2).toBeDefined();

      const kindNameKr = KIND_NAMES_KR[kindAtCol2 as string];
      const fillWording = fillRow0 ? '칠해진' : '비어 있는';

      const explanation = question.explanation ?? '';
      expect(explanation).toContain(kindNameKr as string);
      expect(explanation).toContain(fillWording);
    }
  });
});
