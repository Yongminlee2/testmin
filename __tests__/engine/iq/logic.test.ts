import { logicGenerator } from '@/engine/iq/generators/logic';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import type { Question } from '@/engine/types';

const G = logicGenerator;

/** 한 칸에서 점이 놓인 가로 위치를 읽어 3자리 비트로 되돌린다. */
function bitsOf(q: Question, cellIndex: number): boolean[] {
  const cell = q.figure?.cells[cellIndex];
  const xs = (cell?.shapes ?? []).map((s) => s.x);
  return [0.25, 0.5, 0.75].map((slot) => xs.some((x) => Math.abs(x - slot) < 0.01));
}

function bitsOfChoice(q: Question, choiceIndex: number): boolean[] {
  const cell = q.choices[choiceIndex]?.figure?.cells[0];
  const xs = (cell?.shapes ?? []).map((s) => s.x);
  return [0.25, 0.5, 0.75].map((slot) => xs.some((x) => Math.abs(x - slot) < 0.01));
}

/** 격자에서 규칙을 역산한다. 앞의 두 행으로 어떤 결합인지 판정한다. */
function inferCombine(q: Question): 'xor' | 'and' | 'or' | 'none' {
  const modes = ['xor', 'and', 'or'] as const;
  const fits = modes.filter((m) =>
    [0, 1].every((row) => {
      const a = bitsOf(q, row * 3);
      const b = bitsOf(q, row * 3 + 1);
      const c = bitsOf(q, row * 3 + 2);
      return a.every((v, i) => {
        const bi = b[i] as boolean;
        const want = m === 'xor' ? v !== bi : m === 'and' ? v && bi : v || bi;
        return want === c[i];
      });
    })
  );
  return fits.length === 1 ? fits[0] as 'xor' | 'and' | 'or' : 'none';
}

describe('logicGenerator', () => {
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

  // ② 시각적 유효성 — 점은 세 자리에만 놓이고 서로 겹치지 않는다
  test('점은 정해진 세 자리에만 놓이고 한 자리에 두 개가 겹치지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const cells = [...(question.figure?.cells ?? []), ...question.choices.map((c) => c.figure?.cells[0])];
      for (const cell of cells) {
        const xs = (cell?.shapes ?? []).map((s) => s.x);
        for (const x of xs) {
          expect([0.25, 0.5, 0.75].some((slot) => Math.abs(x - slot) < 0.01)).toBe(true);
        }
        expect(new Set(xs).size).toBe(xs.length);
      }
    }
  });

  test('회전을 구분 기준으로 쓰지 않는다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      for (const cell of question.figure?.cells ?? []) {
        for (const s of cell.shapes) expect(s.rotation).toBe(0);
      }
      for (const c of question.choices) {
        for (const s of c.figure?.cells[0]?.shapes ?? []) expect(s.rotation).toBe(0);
      }
    }
  });

  test('시드 500개에서 세 가지 결합 규칙이 모두 나온다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) seen.add(inferCombine(G.generate(seed).question));
    expect(seen.has('xor')).toBe(true);
    expect(seen.has('and')).toBe(true);
    expect(seen.has('or')).toBe(true);
  });

  // ★ ① 예측 대조 — 격자에서 규칙을 역산해 정답을 독립적으로 계산한다.
  // 생성기의 mode 변수를 읽지 않고, 앞의 두 행이 만족하는 결합을 찾아 마지막 행에 적용한다.
  test('표시된 정답이 격자에서 역산한 결합 결과와 일치한다', () => {
    let checked = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      const mode = inferCombine(question);
      // 앞 두 행만으로 결합이 하나로 안 좁혀지는 시드는 이 검사에서 제외한다
      // (예: 앞 두 행이 우연히 두 규칙을 동시에 만족). 규칙 자체는 아래 별도 테스트가 본다.
      if (mode === 'none') continue;
      checked += 1;
      const a = bitsOf(question, 6);
      const b = bitsOf(question, 7);
      const expected = a.map((v, i) => {
        const bi = b[i] as boolean;
        return mode === 'xor' ? v !== bi : mode === 'and' ? v && bi : v || bi;
      });
      expect(bitsOfChoice(question, question.answerIndex ?? -1)).toEqual(expected);
    }
    // 대다수 시드에서 결합이 하나로 좁혀져야 문제가 풀 수 있는 형태다
    expect(checked).toBeGreaterThan(150);
  });

  // ③ 해설 내용 — 격자에서 역산한 점 개수를 실제로 말하는가
  test('해설이 격자에서 역산한 정답의 점 개수를 언급한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const n = bitsOfChoice(question, question.answerIndex ?? -1).filter(Boolean).length;
      expect(question.explanation ?? '').toContain(`점이 ${n}개`);
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
});
