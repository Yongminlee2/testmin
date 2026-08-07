import { mulberry32, pickInt, shuffle } from '../../rng';
import { attachParticle } from '../../korean';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
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
    // 축 교환. 두 라틴 방진 (r+c)와 (r+2c) 중 어느 쪽이 종류를 맡고 어느 쪽이
    // 크기를 맡을지 뒤집는다. 두 방진은 서로 직교하므로(mod 3에서 9쌍이 전부
    // 다르다) 맞바꿔도 직교성은 그대로 유지된다 — 어느 쪽을 종류에 붙이든
    // 종류·크기 조합 9개가 전부 달라서 두 규칙을 다 읽어야 풀린다는 성질은
    // 안 변한다. kindOffset(3) × sizeOffset(3) × swapped(2) = 18가지 퍼즐(계획 4).
    const swapped = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => {
      const squareA = (r + c) % 3;
      const squareB = (r + 2 * c) % 3;
      const kindSquare = swapped ? squareB : squareA;
      const sizeSquare = swapped ? squareA : squareB;
      return {
        kind: KINDS[(kindSquare + kindOffset) % 3] as ShapeKind,
        size: SIZES[(sizeSquare + sizeOffset) % 3] as number,
      };
    };

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

    // 리뷰 m-3 — KINDS가 원·사각형·삼각형뿐일 때는 셋 다 받침이 있어
    // "과"·"이"를 하드코딩해도 우연히 전부 맞았다. kindNames에는 이미
    // diamond: '마름모'(받침 없음)가 들어 있으므로, KINDS에 마름모가 들어오는
    // 순간 하드코딩은 "마름모이 있으므로"처럼 깨진다. attachParticle로
    // 받침 유무에 맞춰 조사를 고른다 — rowKinds[0]의 받침에 따라 와/과를,
    // 이어붙인 구절 전체(끝 글자는 rowKinds[1]과 같다)의 받침에 따라 이/가를 고른다.
    const rowKind0 = rowKinds[0] as string;
    const rowKind1 = rowKinds[1] as string;
    const rowKindsPhrase = `${attachParticle(rowKind0, '과', '와')} ${rowKind1}`;

    const question: Question = {
      id: iqQuestionId('distribute', seed),
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `가로 한 줄에는 원·사각형·삼각형이 한 번씩, 크기도 작은·중간·큰 것이 한 번씩 나옵니다. ` +
        `마지막 줄에는 이미 ${attachParticle(rowKindsPhrase, '이', '가')} 있으므로 빈 칸은 ` +
        `${attachParticle(kindNames[answer.kind], '이고', '고')}, ` +
        `${rowSizes.join('·')} 크기가 이미 나왔으므로 ${sizeName(answer.size)} 크기입니다.`,
      difficulty: 3,
    };

    return { question, generatorId: 'distribute', seed };
  },
};
