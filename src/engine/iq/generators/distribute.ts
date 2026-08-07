import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import { SIZES } from './size';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly size: number;
}

function cellOf(c: Combo): CellSpec {
  return { shapes: [shape(c.kind, { size: c.size, filled: false })] };
}

function single(c: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(c)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.size}`;
}

export const distributeGenerator: Generator = {
  id: 'distribute',
  difficulty: 3,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, 2);
    const sizeOffset = pickInt(rand, 0, 2);

    // 두 라틴 방진이 서로 직교한다: (r+c)와 (r+2c)는 mod 3에서 9쌍이 전부 다르다.
    // 그래서 종류와 크기가 상관관계를 갖지 않고, 둘 다 읽어야 풀린다.
    const comboAt = (r: number, c: number): Combo => ({
      kind: KINDS[(r + c + kindOffset) % 3] as ShapeKind,
      size: SIZES[(r + 2 * c + sizeOffset) % 3] as number,
    });

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    // 오답은 어긴 규칙별로 하나씩 — fill.ts와 같은 원칙.
    //  (a) 종류는 맞고 크기만 틀림 (1개): 종류 줄만 읽은 사람
    //  (b) 크기는 맞고 종류만 틀림 (2개): 크기 줄만 읽은 사람. 마지막 줄에 이미 있는 종류다
    //  (c) 둘 다 틀림 (1개)
    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const otherSizes = SIZES.filter((s) => s !== answer.size);
    const wrong: Combo[] = [
      { kind: answer.kind, size: otherSizes[pickInt(rand, 0, otherSizes.length - 1)] as number },
      ...otherKinds.map((k) => ({ kind: k, size: answer.size })),
      {
        kind: otherKinds[pickInt(rand, 0, otherKinds.length - 1)] as ShapeKind,
        size: otherSizes[pickInt(rand, 0, otherSizes.length - 1)] as number,
      },
    ];
    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => comboKey(o) === comboKey(answer));

    const kindNames: Record<ShapeKind, string> = {
      circle: '원', square: '사각형', triangle: '삼각형', diamond: '마름모',
    };
    const sizeName = (s: number): string =>
      s === SIZES[0] ? '작은' : s === SIZES[1] ? '중간' : '큰';

    // 해설은 이미 채운 cells 배열(6번·7번 칸)에서 직접 읽는다. comboAt(2,0)/comboAt(2,1)을
    // 다시 불러 별도로 계산하면 그리는 격자와 해설이 서로 다른 셀을 가리킬 위험이 생긴다 —
    // ★ 예측 대조 테스트와 같은 원칙("그려진 격자에서 역산").
    const rowCells = [cells[6] as CellSpec, cells[7] as CellSpec];
    const rowKinds = rowCells.map((cell) => kindNames[cell.shapes[0]?.kind as ShapeKind]);
    const rowSizes = rowCells.map((cell) => sizeName(cell.shapes[0]?.size as number));

    const question: Question = {
      id: `iq-distribute-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `가로 한 줄에는 원·사각형·삼각형이 한 번씩, 크기도 작은·중간·큰 것이 한 번씩 나옵니다. ` +
        `마지막 줄에는 이미 ${rowKinds.join('과 ')}이 있으므로 빈 칸은 ${kindNames[answer.kind]}이고, ` +
        `${rowSizes.join('·')} 크기가 이미 나왔으므로 ${sizeName(answer.size)} 크기입니다.`,
      difficulty: 3,
    };

    return { question, generatorId: 'distribute', seed };
  },
};
