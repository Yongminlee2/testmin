import { sizeGenerator, SIZES } from '@/engine/iq/generators/size';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import { puzzleKey } from '@/engine/iq/assembleIq';

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
  //
  // Task 4(축 교환) 리뷰 — 원래는 sizeAt(1) > sizeAt(0)(0번·1번 칸, 같은 행)로만
  // 판별했다. swapped 도입 이후 크기가 행을 따라 진행하는 시드가 섞이면
  // 0번·1번 칸이 같은 행의 두 칸이라 크기가 아예 같아지고(둘 다 열만 다르지
  // 크기와 무관한 축), 이 비교가 "커짐"을 전혀 못 읽는 구멍이 생긴다. 종류가
  // 고정되는 축(0번·1번 칸이 같은 종류인지)부터 가려낸 뒤 크기가 실제로
  // 변하는 축에서 두 칸을 골라 비교한다.
  test('시드 500개에서 커지는 방향과 작아지는 방향이 둘 다 나온다', () => {
    const directions = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);
      const s0 = sizeAt(question, 0) as number;
      const sNext = (kindByRow ? sizeAt(question, 1) : sizeAt(question, 3)) as number;
      directions.add(sNext > s0 ? 'up' : 'down');
    }
    expect(directions.size).toBe(2);
  });

  // 종류 규칙의 두 측면 — 한 줄 안에서는 종류가 하나로 고정되고, 나머지 두
  // 줄은 서로 다른 종류다. 생성기의 kindOffset을 다시 읽지 않고 격자(그리고
  // 빈 칸은 marked answer)에서 직접 확인한다.
  //
  // Task 4 리뷰 — 원래 이 테스트는 "행마다 고정"만 검사했다. swapped=true인
  // 시드(열마다 고정)에서는 행 3칸의 종류가 전부 달라 new Set(row).size가 1이
  // 아니라 3이 나와 곧장 빨간불이 됐다 — 축이 바뀌면 "줄"의 정의(행 또는
  // 열)도 같이 바뀌어야 한다. 0번·1번 칸(같은 행)의 종류가 같은지로 먼저
  // 축을 가려낸다.
  test('한 줄 안에서는 종류가 하나로 고정되고, 나머지 두 줄은 서로 다른 종류다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);

      const lineKindSets = [0, 1, 2].map((line) => {
        // 행 고정이면 같은 행의 세 칸(가로), 열 고정이면 같은 열의 세 칸(세로)을 모은다.
        const idxs = kindByRow
          ? [line * 3, line * 3 + 1, line * 3 + 2]
          : [line, line + 3, line + 6];
        return idxs.map((i) => (i === 8 ? marked?.kind : kindAt(question, i))); // 8번 칸은 정답으로 메운다
      });
      for (const line of lineKindSets) {
        expect(new Set(line).size).toBe(1); // 한 줄 안에서는 종류가 하나
      }
      expect(new Set(lineKindSets.map((line) => line[0])).size).toBe(3); // 세 줄은 서로 다른 종류
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

  // ★ ① 예측 대조 — 마지막 줄의 두 칸에서 등차를 읽어 빈 칸을 독립 계산한다.
  // "줄에 없는 값"이 아니라 "진행을 이어간 값"으로 구해야 단조성까지 검사된다.
  //
  // Task 4 리뷰 — 원래는 크기가 항상 6번·7번 칸(마지막 행)을 따라 진행한다고
  // 가정했다. swapped=true(열이 종류·행이 크기)인 시드는 크기가 2번·5번 칸
  // (마지막 열)을 따라 진행하므로 6번·7번 칸은 사실 같은 열(2)의 종류만
  // 일정할 뿐 크기는 늘 같은 값(그 열의 크기)이라 등차가 0으로 계산되고
  // 예측이 빗나갔다 — 종류가 고정되는 축부터 가려내 크기가 실제로 진행하는
  // 줄을 골라야 한다.
  test('표시된 정답 크기가 줄의 진행을 이어간 값이다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);
      // 종류가 고정되는 줄(빈 칸을 포함하는 줄) 안에서, 크기가 진행하는 두 칸을 읽는다.
      const [i0, i1] = kindByRow ? [6, 7] : [2, 5];
      const s0 = sizeAt(question, i0) as number;
      const s1 = sizeAt(question, i1) as number;
      const expected = s1 + (s1 - s0);
      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.size).toBeCloseTo(expected, 10);
      // 종류는 그 줄에서 일정하다
      expect(marked?.kind).toBe(kindAt(question, i0));
      expect(kindAt(question, i1)).toBe(kindAt(question, i0));
    }
  });

  // ③ 해설 내용 — 방향을 실제로 맞게 말하는가. 위 "커지는·작아지는 방향" 테스트와
  // 같은 이유로, 크기가 실제로 변하는 축에서 두 칸을 골라야 한다.
  test('해설의 방향 서술이 격자의 실제 방향과 일치한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);
      const s0 = sizeAt(question, 0) as number;
      const sNext = (kindByRow ? sizeAt(question, 1) : sizeAt(question, 3)) as number;
      const ascending = sNext > s0;
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

  // Task 4(축 교환) — 해설이 실제 축을 말하는지 확인한다. 종류가 행에 고정된
  // 배치인지 열에 고정된 배치인지를 swapped 내부 변수가 아니라 격자(0번·1번
  // 칸)에서 읽어 판별한 다음, 반대되는 축 이름이 나오면 실패시킨다. 이
  // 테스트는 계획 4가 "가장 위험하다"고 지목한 규칙을 정면으로 검사한다 —
  // 해설 문구가 한쪽 배치에 고정돼 있으면 swapped=true 시드에서 반드시
  // 빨간불이 난다.
  test('해설이 격자의 실제 축을 말한다', () => {
    let sawRowKind = false;
    let sawColumnKind = false;
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);
      const text = question.explanation ?? '';
      if (kindByRow) {
        sawRowKind = true;
        expect(text).toContain('가로 줄마다');
        expect(text).toContain('오른쪽으로');
        expect(text).not.toContain('세로 줄마다');
      } else {
        sawColumnKind = true;
        expect(text).toContain('세로 줄마다');
        expect(text).toContain('아래로');
        expect(text).not.toContain('가로 줄마다');
      }
    }
    expect(sawRowKind).toBe(true);
    expect(sawColumnKind).toBe(true);
  });

  // Task 4 — 시드 500개에서 두 축 배치(행이 종류를 맡는 배치, 열이 종류를
  // 맡는 배치)가 모두 나오는지 격자에서 직접 확인한다. swapped 내부 변수를
  // 읽지 않고, 0번·1번 칸(같은 행, 열만 다르다)의 종류가 같은지로 판별한다.
  test('시드 500개에서 축 배치 두 가지가 모두 나온다', () => {
    const arrangements = new Set<'rowKind' | 'columnKind'>();
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const kindByRow = kindAt(question, 0) === kindAt(question, 1);
      arrangements.add(kindByRow ? 'rowKind' : 'columnKind');
    }
    expect(arrangements).toEqual(new Set(['rowKind', 'columnKind']));
  });

  // Task 4 증거 — 넓힌 뒤 실측 퍼즐 가짓수가 12(kindOffset 3가지 × ascending
  // 2가지 × swapped 2가지)여야 한다. puzzleKey는 tools/validate-content.ts의
  // measureGeneratorCapacity와 같은 키다.
  test('서로 다른 퍼즐이 12가지다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 1000; seed++) {
      seen.add(puzzleKey(G.generate(seed)));
    }
    expect(seen.size).toBe(12);
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
