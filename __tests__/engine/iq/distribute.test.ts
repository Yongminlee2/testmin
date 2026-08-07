import { distributeGenerator } from '@/engine/iq/generators/distribute';
import { SIZES } from '@/engine/iq/generators/size';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';

const G = distributeGenerator;
const kindAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.kind;
const sizeAt = (q: ReturnType<typeof G.generate>['question'], i: number) =>
  q.figure?.cells[i]?.shapes[0]?.size;

describe('distributeGenerator', () => {
  test('시드 50개에서 같은 시드가 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
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

  // 규칙 자체의 무결성 — 이게 깨지면 정답이 둘이거나 풀 수 없는 문제가 나온다
  test('모든 행과 열에 세 종류·세 크기가 정확히 한 번씩 나온다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      // 빈 칸(8번)은 정답으로 메워서 완성된 격자로 본다
      const full = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        kind: kindAt(question, i),
        size: sizeAt(question, i),
      }));
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      full.push({ kind: ans?.kind, size: ans?.size });

      for (let line = 0; line < 3; line++) {
        const row = [0, 1, 2].map((c) => full[line * 3 + c]);
        const col = [0, 1, 2].map((r) => full[r * 3 + line]);
        for (const group of [row, col]) {
          expect(new Set(group.map((g) => g?.kind)).size).toBe(3);
          expect(new Set(group.map((g) => g?.size)).size).toBe(3);
        }
      }
    }
  });

  // 그레코-라틴 성질의 핵심 — 9칸의 (종류, 크기) 조합이 전부 달라야 한다.
  // 위의 행·열 검사는 종류와 크기를 각각 따로 세므로, 두 라틴 방진이 직교하지 않고
  // 종류가 크기를 결정해버리는 상관관계(예: 원이면 항상 작음)가 생겨도 못 잡는다.
  // 그러면 규칙 하나만 읽어도 풀리는 문제가 되어 "둘 다 읽어야 풀린다"는 설계 의도가 깨진다.
  test('9칸의 (종류, 크기) 조합이 서로 다르다 (직교성)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const combos = [0, 1, 2, 3, 4, 5, 6, 7].map(
        (i) => `${kindAt(question, i)}:${sizeAt(question, i)}`
      );
      const ans = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      combos.push(`${ans?.kind}:${ans?.size}`);
      expect(new Set(combos).size).toBe(9);
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

  test('오답은 종류만 틀림 2개, 크기만 틀림 1개, 둘 다 틀림 1개다', () => {
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
      expect({ kindOnly, sizeOnly, both }).toEqual({ kindOnly: 2, sizeOnly: 1, both: 1 });
    }
  });

  // ★ ① 예측 대조 — 마지막 줄에 빠진 종류·크기를 격자에서 직접 구한다.
  // 생성기의 (r+c)%3 공식을 다시 쓰지 않는다. 라틴 방진이면 "줄에 없는 값"이 곧 답이다.
  test('표시된 정답이 마지막 줄에서 빠진 종류·크기와 일치한다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const rowKinds = [kindAt(question, 6), kindAt(question, 7)];
      const rowSizes = [sizeAt(question, 6), sizeAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKinds.includes(k)
      );
      const missingSize = SIZES.find((s) => !rowSizes.includes(s));
      expect(missingKind).toBeDefined();
      expect(missingSize).toBeDefined();

      const marked = question.choices[question.answerIndex ?? -1]?.figure?.cells[0]?.shapes[0];
      expect(marked?.kind).toBe(missingKind);
      expect(marked?.size).toBe(missingSize);
    }
  });

  // ③ 해설 내용
  test('해설이 격자에서 역산한 종류를 실제로 언급한다', () => {
    const names: Record<string, string> = { circle: '원', square: '사각형', triangle: '삼각형' };
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const rowKinds = [kindAt(question, 6), kindAt(question, 7)];
      const missingKind = (['circle', 'square', 'triangle'] as const).find(
        (k) => !rowKinds.includes(k)
      );
      const text = question.explanation ?? '';
      // 정답 종류를 말해야 하고, 마지막 줄에 이미 있는 두 종류도 근거로 들어야 한다
      expect(text).toContain(names[missingKind as string] as string);
      for (const k of rowKinds) {
        expect(text).toContain(names[k as string] as string);
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
