import { sizeGenerator, SIZES } from '@/engine/iq/generators/size';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

const G = sizeGenerator;
const kindAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.kind;
const sizeAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.size;

describe('sizeGenerator', () => {
  test('시드 50개에서 같은 시드가 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
  });

  // 리뷰 I-2 — rotation·count·fill은 이 검사를 갖는데 size·distribute는 없었다.
  // blankIndex는 FigureSpec에서 선택 필드라 tsc도 안 잡는다. 이 검사가 없으면
  // blankIndex를 통째로 지워도(격자 9칸이 전부 그려져 정답이 인쇄된다) 초록불로 남는다.
  test('문제 도형은 9칸 격자이고 마지막 칸이 비어 있다', () => {
    const { question } = G.generate(5);
    expect(question.figure?.kind).toBe('grid');
    expect(question.figure?.cells).toHaveLength(9);
    expect(question.figure?.blankIndex).toBe(8);
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(G.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  test('시드 500개에서 정답 위치가 고정되어 있지 않다', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 500; seed++) {
      positions.add(G.generate(seed).question.answerIndex ?? -1);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  // 두 방향이 다 나와야 한다. 한 방향만 나오면 "오른쪽=큼"을 외워도 다 맞는다.
  test('시드 500개에서 커지는 방향과 작아지는 방향이 둘 다 나온다', () => {
    const directions = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const s0 = sizeAt(question, 0) as number;
      const s1 = sizeAt(question, 1) as number;
      directions.add(s1 > s0 ? 'up' : 'down');
    }
    expect(directions.size).toBe(2);
  });

  // 행 규칙의 두 측면 — 한 행 안에서는 종류가 하나로 고정되고, 세 행은 서로 다른 종류다.
  // 생성기의 kindOffset을 다시 읽지 않고 격자(그리고 빈 칸은 marked answer)에서 직접 확인한다.
  test('한 행 안에서는 종류가 하나로 고정되고, 세 행은 서로 다른 종류다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      const rowKindSets = [0, 1, 2].map((r) => {
        const rowCellKinds = [0, 1, 2].map((c) => kindAt(question, r * 3 + c));
        if (r === 2) rowCellKinds[2] = marked?.kind; // 8번 칸은 빈칸이므로 정답으로 메운다
        return rowCellKinds;
      });
      for (const row of rowKindSets) {
        expect(new Set(row).size).toBe(1); // 한 행 안에서는 종류가 하나
      }
      expect(new Set(rowKindSets.map((row) => row[0])).size).toBe(3); // 세 행은 서로 다른 종류
    }
  });

  // ② 시각적 유효성 — 크기가 화면에서 구분되는가
  test('쓰이는 크기는 세 단계뿐이고 서로 0.12 이상 벌어져 있다', () => {
    const used = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (let i = 0; i < 9; i++) {
        const s = sizeAt(question, i);
        if (s !== undefined) used.add(s);
      }
      for (const c of question.choices) {
        const s = c.figure?.cells[0]?.shapes[0]?.size;
        if (s !== undefined) used.add(s);
      }
    }
    const sorted = [...used].sort((a, b) => a - b);
    expect(sorted).toEqual([...SIZES].sort((a, b) => a - b));
    for (let i = 1; i < sorted.length; i++) {
      expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThanOrEqual(0.12);
    }
    expect(sorted[0] as number).toBeGreaterThanOrEqual(0.25);
    expect(sorted[sorted.length - 1] as number).toBeLessThanOrEqual(0.85);
  });

  // 크기가 이 문제의 핵심 규칙이므로 오답도 여기에 몰아준다 (sizeOnly 2개)
  test('오답은 크기만 틀림 2개, 종류만 틀림 1개, 둘 다 틀림 1개다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? -1;
      const a = question.choices[ai]?.figure?.cells[0]?.shapes[0];
      expect(a).toBeDefined();
      let kindOnly = 0, sizeOnly = 0, both = 0;
      question.choices.forEach((c, i) => {
        if (i === ai) return;
        const s = c.figure?.cells[0]?.shapes[0];
        const kw = s?.kind !== a!.kind;
        const sw = s?.size !== a!.size;
        if (kw && sw) both++; else if (kw) kindOnly++; else if (sw) sizeOnly++;
      });
      expect({ kindOnly, sizeOnly, both }).toEqual({ kindOnly: 1, sizeOnly: 2, both: 1 });
    }
  });

  // ★ ① 예측 대조 — 첫 줄의 두 칸에서 등차를 읽어 셋째 칸을 독립 계산한다.
  // "줄에 없는 값"이 아니라 "진행을 이어간 값"으로 구해야 단조성까지 검사된다.
  test('표시된 정답 크기가 줄의 진행을 이어간 값이다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      // 마지막 줄(6,7)의 간격을 읽어 8번 칸을 예측한다
      const s6 = sizeAt(question, 6) as number;
      const s7 = sizeAt(question, 7) as number;
      const expected = s7 + (s7 - s6);
      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.size).toBeCloseTo(expected, 10);
      // 종류는 그 줄에서 일정하다
      expect(marked?.kind).toBe(kindAt(question, 6));
      expect(kindAt(question, 7)).toBe(kindAt(question, 6));
    }
  });

  // ③ 해설 내용 — 방향을 실제로 맞게 말하는가
  test('해설의 방향 서술이 격자의 실제 방향과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const ascending = (sizeAt(question, 1) as number) > (sizeAt(question, 0) as number);
      const text = question.explanation ?? '';
      if (ascending) {
        expect(text).toContain('커집니다');
        expect(text).not.toContain('작아집니다');
      } else {
        expect(text).toContain('작아집니다');
        expect(text).not.toContain('커집니다');
      }
    }
  });

  test('오답은 모두 정답과 다르다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const ai = question.answerIndex ?? 0;
      const answer = question.choices[ai]?.figure;
      question.choices.forEach((c, i) => {
        if (i === ai || c.figure === undefined || answer === undefined) return;
        expect(figureEquals(answer, c.figure)).toBe(false);
      });
    }
  });

  // 리뷰 I-3 — "회전은 삼각형에만"이 fill.test.ts에서만 검사되고 있었다.
  // size는 회전을 규칙으로 쓰지 않으므로 어떤 도형도 회전이 있으면 안 된다.
  // 문제 격자(figure.cells)와 선택지(choices) 양쪽 경로를 다 훑는다 — 격자
  // 생성 경로에만 회전을 주입해도 choices만 보면 못 잡는다(distribute의 M7이
  // 실제로 그 형태였다).
  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) {
          expect(s.rotation).toBe(0);
        }
      }
      for (const c of question.choices) {
        for (const cell of c.figure?.cells ?? []) {
          for (const s of cell.shapes) {
            expect(s.rotation).toBe(0);
          }
        }
      }
    }
  });

  // filled은 이 문제의 변별 속성이 아니다. 격자 안에서도, 선택지 사이에서도 값이 하나로
  // 통일돼야 한다 — 부분적으로만 바뀌면 filled가 의도치 않은 여분의 구분 속성이 되어
  // 정답과 filled만 다른 오답이 생길 수 있다. 전역적으로 어떤 값을 쓰는지는 고정하지 않는다.
  test('filled은 격자와 선택지 전체에서 하나로 통일되어 있다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const filledValues = new Set<boolean>();
      for (const cell of question.figure?.cells ?? []) {
        const f = cell.shapes[0]?.filled;
        if (f !== undefined) filledValues.add(f);
      }
      for (const c of question.choices) {
        const f = c.figure?.cells[0]?.shapes[0]?.filled;
        if (f !== undefined) filledValues.add(f);
      }
      expect(filledValues.size).toBe(1);
    }
  });
});
