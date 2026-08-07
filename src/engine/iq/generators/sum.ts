import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

/**
 * 행 합 보존 규칙 — 가로 한 줄의 점 개수를 모두 더하면 어느 줄이든 같은 수가 된다.
 *
 * 이 규칙은 한 칸만 봐서는 절대 안 풀린다. 위 두 줄에서 "합이 같다"를 먼저
 * 알아내고, 그 합에서 마지막 줄의 앞 두 칸을 빼야 답이 나온다. 기존
 * distribute(종류×크기 라틴 방진)나 logic(두 칸 겹치기)과는 읽는 방식이 다르다.
 */

/** 주사위 눈처럼 개수마다 자리를 고정한다. 세어야 하는 그림이라 배치가 흔들리면 안 된다. */
const LAYOUTS: readonly (readonly (readonly [number, number])[])[] = [
  [],
  [[0.5, 0.5]],
  [
    [0.3, 0.5],
    [0.7, 0.5],
  ],
  [
    [0.5, 0.28],
    [0.3, 0.72],
    [0.7, 0.72],
  ],
  [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.5, 0.5],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  [
    [0.3, 0.25],
    [0.7, 0.25],
    [0.3, 0.5],
    [0.7, 0.5],
    [0.3, 0.75],
    [0.7, 0.75],
  ],
];

/** 한 칸에 그릴 수 있는 점의 최대 개수. LAYOUTS의 마지막 인덱스와 같아야 한다. */
const MAX_DOTS = LAYOUTS.length - 1;

function cellOf(n: number): CellSpec {
  const layout = LAYOUTS[n] ?? [];
  return {
    shapes: layout.map(([x, y]) => shape('circle', { x, y, size: 0.24, filled: true })),
  };
}

function single(n: number): FigureSpec {
  return { kind: 'single', cells: [cellOf(n)] };
}

/**
 * 합이 total인 세 수를 뽑는다. 각 항은 1..MAX_DOTS.
 * 0을 허용하지 않는 이유: 빈 칸이 정답 자리의 '?'와 헷갈린다.
 */
function splitRow(total: number, rand: () => number): number[] {
  for (;;) {
    const a = pickInt(rand, 1, MAX_DOTS);
    const b = pickInt(rand, 1, MAX_DOTS);
    const c = total - a - b;
    if (c >= 1 && c <= MAX_DOTS) return [a, b, c];
  }
}

export const sumGenerator: Generator = {
  id: 'sum',
  difficulty: 3,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);

    // 합의 범위: 세 항이 모두 1 이상 MAX_DOTS 이하로 갈라질 수 있어야 한다.
    const total = pickInt(rand, 6, 12);

    const rows: number[][] = [];
    for (let r = 0; r < 3; r++) {
      for (let attempt = 0; ; attempt++) {
        const row = splitRow(total, rand);
        // 세 칸이 전부 같은 개수면 "합이 같다"가 아니라 "다 같다"로 읽혀
        // 규칙을 오해하게 만든다. 마지막 줄은 특히 그렇다.
        const flat = row[0] === row[1] && row[1] === row[2];
        if (!flat || attempt > 40) {
          rows.push(row);
          break;
        }
      }
    }

    const last = rows[2] as number[];
    const a = last[0] as number;
    const b = last[1] as number;
    const answer = last[2] as number;

    const cells: CellSpec[] = rows.flatMap((row) => row.map(cellOf));

    // 오답은 실제로 나올 법한 오독을 노린다:
    //   a + b        — 빼는 대신 더함
    //   |a - b|      — 두 칸의 차로 읽음
    //   answer ± 1   — 셈 실수
    //   세로 합으로 읽었을 때의 값 — 방향을 잘못 잡음
    const columnRead = total - (rows[0]?.[2] as number) - (rows[1]?.[2] as number);
    const candidates = [a + b, Math.abs(a - b), answer + 1, answer - 1, columnRead];

    const seen = new Set<number>([answer]);
    const wrong: number[] = [];
    for (const c of candidates) {
      if (wrong.length === 4) break;
      if (c < 1 || c > MAX_DOTS || seen.has(c)) continue;
      seen.add(c);
      wrong.push(c);
    }
    // 후보가 겹쳐 모자라면 1..MAX_DOTS에서 채운다 — 개수가 6가지뿐이라 항상 채워진다.
    for (let n = 1; wrong.length < 4 && n <= MAX_DOTS; n++) {
      if (seen.has(n)) continue;
      seen.add(n);
      wrong.push(n);
    }

    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.indexOf(answer);

    const question: Question = {
      id: iqQuestionId('sum', seed),
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((n) => ({ figure: single(n) })),
      answerIndex,
      explanation:
        `가로 한 줄의 점을 모두 더하면 어느 줄이든 ${total}개입니다. ` +
        `마지막 줄은 ${a} + ${b} = ${a + b}개까지 나왔으니 남은 칸은 ${total} - ${a + b} = ${answer}개입니다.`,
      difficulty: 3,
    };

    return { question, generatorId: 'sum', seed };
  },
};
