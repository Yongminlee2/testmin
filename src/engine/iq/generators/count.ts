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
      // 어느 조합도 겹치지 않는다. 0.228 이상으로 올리면 간격이 사라진다.
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
    // 증가만 있으면 "오른쪽 아래로 갈수록 늘어난다"를 외워서 풀 수 있다.
    // size.ts(커짐/작아짐)와 수열의 등차 규칙(증가/감소)처럼 두 방향 다
    // 나와야 그 지름길이 막힌다.
    const ascending = rand() < 0.5;
    // 감소 쪽 start 하한이 7인 이유(리뷰에서 지정): 오답이 answer ±1·±2이고,
    // 감소 쪽 최소 answer는 start=7일 때 3이다. answer-2=1로 정확히 맞아야
    // 하는데, 이 하한을 [5,9]처럼 낮추면 answer가 1까지 내려가 answer-2=-1인
    // 오답이 생긴다. dots()는 음수를 0으로 접어버리므로 점이 하나도 없는
    // 선택지가 나오게 된다 — "모든 선택지의 점 개수가 1개 이상" 불변식이 깨진다.
    const start = ascending ? pickInt(rand, 1, 3) : pickInt(rand, 7, 9);
    const step = ascending ? 1 : -1;

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

    // 방향에 맞는 낱말을 쓴다 — size.ts·등차수열처럼 음수 단계를 그대로
    // 찍지 않는다("점이 -1개씩 늘어납니다"처럼 어색해지는 걸 막는다).
    const explanation = ascending
      ? `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 1개씩 늘어납니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`
      : `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 1개씩 줄어듭니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`;

    const question: Question = {
      id: `iq-count-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((n) => ({ figure: single(n) })),
      answerIndex,
      explanation,
      difficulty: 1,
    };

    return { question, generatorId: 'count', seed };
  },
};
