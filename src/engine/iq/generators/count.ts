import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

/**
 * 점 배치표. 왼쪽 위부터 행 우선으로 채운 3×4 격자(최대 12개까지 놓는다).
 * x 간격 0.28(0.22→0.5→0.78), y 간격 0.21·0.22·0.21(0.18→0.39→0.61→0.82).
 * 어느 두 점을 골라도 가장 가까운 조합은 세로로 인접한 칸(y 간격 0.21)이고,
 * 가로 인접(0.28)이나 대각선 인접(√(0.28²+0.21²)≈0.35)은 더 멀다 — 그러므로
 * 이 표 전체에서 최소 중심간 거리는 0.21이다. DOT_SIZE(지름) 0.16 < 0.21이므로
 * 어느 조합을 뽑아도 겹치지 않는다(여유 0.05). 9칸→12칸으로 늘리며 지름을
 * 0.18에서 0.16으로 줄인 이유가 이것이다 — 9칸일 때의 최소 간격 0.228보다
 * 12칸의 0.21이 더 좁아져서, 지름을 줄이지 않으면 여유가 없어진다.
 */
const DOT_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [0.22, 0.18], [0.5, 0.18], [0.78, 0.18],
  [0.22, 0.39], [0.5, 0.39], [0.78, 0.39],
  [0.22, 0.61], [0.5, 0.61], [0.78, 0.61],
  [0.22, 0.82], [0.5, 0.82], [0.78, 0.82],
];
const DOT_SIZE = 0.16;

function dots(n: number): CellSpec {
  const count = Math.max(0, Math.min(n, DOT_POSITIONS.length));
  return {
    shapes: DOT_POSITIONS.slice(0, count).map(([x, y]) =>
      shape('circle', { x, y, size: DOT_SIZE, filled: true })
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
    // 보폭(한 칸마다 점이 몇 개씩 늘거나 주는지)도 1과 2 두 가지를 섞는다 —
    // 방향과 마찬가지로 "항상 1개씩"이라는 지름길을 막기 위해서다.
    const step = rand() < 0.5 ? 1 : 2;

    // start(첫 칸의 점 개수) 범위는 방향×보폭 네 조합마다 다르다. 모든 칸과
    // 모든 선택지(answer ± 1, ± 2)가 1~12(DOT_POSITIONS 길이) 안에 들어가야
    // 하므로, 아래 네 범위의 하한·상한은 전부 그 자리에서 역산한 값이다 —
    // 손대면 점 0개짜리 선택지나 배치표 범위를 벗어나는 칸이 나온다.
    let start: number;
    if (ascending && step === 1) {
      // 증가·보폭1: 정답 = start+4 → 5~7. 원래 범위(1~3) 그대로다.
      // 선택지 상한만 보면(answer+2 ≤ 12) start ≤ 6까지도 안전하지만,
      // 가짓수를 표에서 정한 3가지로 유지하려고 1~3을 그대로 둔다.
      start = pickInt(rand, 1, 3);
    } else if (ascending && step === 2) {
      // 증가·보폭2: 정답 = start+8 → 9~10.
      // 상한이 2인 이유 — answer+2 ≤ 12(배치표 길이)여야 하고 answer =
      // start+8이므로 start ≤ 2. start=3이면 answer=11, answer+2=13이 되어
      // 배치표 인덱스를 벗어난다.
      start = pickInt(rand, 1, 2);
    } else if (!ascending && step === 1) {
      // 감소·보폭1: 정답 = start-4 → 3~8.
      // 하한이 7인 이유 — answer-2 ≥ 1(점 0개짜리 선택지 금지)이어야 하고
      // answer = start-4이므로 start ≥ 7. start=6이면 answer=2,
      // answer-2=0이 되어 점이 하나도 없는 선택지가 나온다. 상한 12는
      // 배치표 길이 자체 — 첫 칸이 그보다 많은 점을 요구할 수 없다.
      start = pickInt(rand, 7, 12);
    } else {
      // 감소·보폭2: 정답 = start-8 → 3~4.
      // 하한이 11인 이유 — answer-2 ≥ 1이어야 하고 answer = start-8이므로
      // start ≥ 11. start=10이면 answer=2, answer-2=0으로 역시 점 0개짜리
      // 선택지가 나온다. 상한은 배치표 길이인 12.
      start = pickInt(rand, 11, 12);
    }

    const delta = ascending ? step : -step;

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3;
      cells.push(dots(start + (r + c) * delta));
    }

    const answer = start + 4 * delta; // (2,2)칸

    // 오답은 개수만 어긋난 것. ±1, ±2 — 전부 1 이상이고 서로 다르다.
    const options = shuffle([answer, answer - 2, answer - 1, answer + 1, answer + 2], rand);
    const answerIndex = options.indexOf(answer);

    // 방향에 맞는 낱말을 쓰고 보폭도 그대로 밝힌다 — size.ts·등차수열처럼
    // 음수 단계를 그대로 찍지 않는다("점이 -1개씩 늘어납니다"처럼 어색해지는
    // 걸 막는다).
    const explanation = ascending
      ? `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 ${step}개씩 늘어납니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`
      : `오른쪽으로 한 칸, 아래로 한 칸 갈 때마다 점이 ${step}개씩 줄어듭니다. ` +
        `첫 칸이 ${start}개이므로 마지막 칸은 ${answer}개입니다.`;

    const question: Question = {
      id: iqQuestionId('count', seed),
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
