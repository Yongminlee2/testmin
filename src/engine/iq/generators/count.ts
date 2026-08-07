import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

/** 점 개수별 배치. 최대 9개까지 겹치지 않게 놓는다. */
const DOT_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.5, 0.5],
  [0.28, 0.28],
  [0.72, 0.72],
  [0.72, 0.28],
  [0.28, 0.72],
  [0.5, 0.22],
  [0.5, 0.78],
  [0.22, 0.5],
  [0.78, 0.5],
];

function dots(n: number): CellSpec {
  const count = Math.max(0, Math.min(n, DOT_POSITIONS.length));
  return {
    shapes: DOT_POSITIONS.slice(0, count).map(([x, y]) =>
      // size 0.18 = 반지름 0.09. 위 배치의 최소 중심간 거리가 0.228이므로
      // 어느 조합도 겹치지 않는다. 0.2 이상으로 올리면 간격이 사라진다.
      shape('circle', { x, y, size: 0.18, filled: true })
    ),
  };
}

function single(n: number): FigureSpec {
  return { kind: 'single', cells: [dots(n)] };
}

export const countGenerator: Generator = {
  id: 'count',
  difficulty: 1,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const start = pickInt(rand, 1, 3);
    const step = 1;

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3;
      cells.push(dots(start + (r + c) * step));
    }

    const answer = start + 4 * step; // (2,2)칸

    // 오답은 개수만 어긋난 것. ±1, ±2 — 전부 1 이상이고 서로 다르다.
    const options = shuffle([answer, answer - 2, answer - 1, answer + 1, answer + 2], rand);
    const answerIndex = options.indexOf(answer);

    const question: Question = {
      id: `iq-count-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((n) => ({ figure: single(n) })),
      answerIndex,
      explanation:
        `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 ${step}개씩 늘어납니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`,
      difficulty: 1,
    };

    return { question, generatorId: 'count', seed };
  },
};
