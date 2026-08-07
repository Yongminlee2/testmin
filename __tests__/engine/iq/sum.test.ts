import { sumGenerator } from '@/engine/iq/generators/sum';
import { verifyGenerated } from '@/engine/iq/verify';
import { figureEquals } from '@/engine/iq/figure';
import type { Question } from '@/engine/types';

const G = sumGenerator;

/** 격자 칸의 점 개수를 그림에서 직접 센다. 생성기 내부 값을 읽지 않는다. */
function dotsOf(q: Question, cellIndex: number): number {
  return q.figure?.cells[cellIndex]?.shapes.length ?? -1;
}

function dotsOfChoice(q: Question, choiceIndex: number): number {
  return q.choices[choiceIndex]?.figure?.cells[0]?.shapes.length ?? -1;
}

describe('sumGenerator', () => {
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

  // ★ 예측 대조 — 앞의 두 줄에서 합을 읽어내고, 마지막 줄의 빈칸을 독립적으로 계산한다.
  // 생성기의 total 변수를 쓰지 않으므로 규칙이 깨지면 여기서 걸린다.
  test('표시된 정답이 앞 두 줄에서 읽은 합으로 계산한 값과 같다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);

      const row0 = dotsOf(question, 0) + dotsOf(question, 1) + dotsOf(question, 2);
      const row1 = dotsOf(question, 3) + dotsOf(question, 4) + dotsOf(question, 5);
      expect(row1).toBe(row0);

      const expected = row0 - dotsOf(question, 6) - dotsOf(question, 7);
      expect(dotsOfChoice(question, question.answerIndex ?? -1)).toBe(expected);
    }
  });

  // 그림으로 세는 문제이므로 점이 겹쳐 보이면 문제 자체가 성립하지 않는다.
  test('한 칸의 점들은 서로 다른 자리에 놓인다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const cells = [
        ...(question.figure?.cells ?? []),
        ...question.choices.map((c) => c.figure?.cells[0]),
      ];
      for (const cell of cells) {
        const keys = (cell?.shapes ?? []).map((s) => `${s.x}:${s.y}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  // 빈 칸(점 0개)은 정답 자리의 '?'와 헷갈린다. 선택지에도 격자에도 나오면 안 된다.
  test('점이 하나도 없는 칸은 나오지 않는다', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { question } = G.generate(seed);
      for (let i = 0; i < 8; i++) expect(dotsOf(question, i)).toBeGreaterThan(0);
      for (let i = 0; i < question.choices.length; i++) {
        expect(dotsOfChoice(question, i)).toBeGreaterThan(0);
      }
    }
  });

  test('해설이 그림에서 읽은 합과 정답 개수를 그대로 말한다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { question } = G.generate(seed);
      const total = dotsOf(question, 0) + dotsOf(question, 1) + dotsOf(question, 2);
      const answer = dotsOfChoice(question, question.answerIndex ?? -1);
      expect(question.explanation ?? '').toContain(`${total}개입니다`);
      expect(question.explanation ?? '').toContain(`= ${answer}개입니다`);
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
});
