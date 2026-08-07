import { mulberry32, pickInt, shuffle } from '../../rng';
import { attachParticle } from '../../korean';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

/** 화면에서 확실히 구분되는 세 단계. 인접 간격 0.2 — 최소 요구치 0.12의 1.6배. */
export const SIZES = [0.3, 0.5, 0.7] as const;

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly size: number;
}

function cellOf(c: Combo): CellSpec {
  return { shapes: [shape(c.kind, { size: c.size, filled: true })] };
}

function single(c: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(c)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.size}`;
}

export const sizeGenerator: Generator = {
  id: 'size',
  difficulty: 2,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, 2);
    // 커지는 방향인가 작아지는 방향인가. 두 방향 다 나와야 "오른쪽=큼"을 외우는 걸 막는다.
    const ascending = rand() < 0.5;
    // 축 교환. 기본(swapped=false)은 행이 종류를, 열이 크기를 맡는다 — 원래
    // 규칙 그대로다. swapped=true면 열이 종류를, 행이 크기를 맡도록 뒤집는다.
    // SIZES 자체(0.3/0.5/0.7)는 손대지 않는다 — 실기기로 확인한 간격이다.
    // kindOffset(3) × ascending(2) × swapped(2) = 12가지 퍼즐(계획 4).
    const swapped = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => {
      const kindIndex = swapped ? c : r;
      const sizeIndex = swapped ? r : c;
      return {
        kind: KINDS[(kindIndex + kindOffset) % 3] as ShapeKind,
        size: (ascending ? SIZES[sizeIndex] : SIZES[2 - sizeIndex]) as number,
      };
    };

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const otherSizes = SIZES.filter((s) => s !== answer.size);
    const wrong: Combo[] = [
      // 크기만 틀림 2개 — 크기가 이 문제의 핵심 규칙이므로 오답도 여기에 몰아준다
      ...otherSizes.map((s) => ({ kind: answer.kind, size: s })),
      { kind: otherKinds[pickInt(rand, 0, otherKinds.length - 1)] as ShapeKind, size: answer.size },
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

    // 해설이 말할 축은 swapped를 직접 읽지 않고 이미 그려진 cells에서 역산한다
    // (fill.ts와 같은 원칙). 0번 칸과 1번 칸은 같은 행(열만 다르다) — 종류가
    // 같으면 행이 종류를 고정하는 축이고, 다르면 열이 그 축이다.
    const kindByRow = cells[0]?.shapes[0]?.kind === cells[1]?.shapes[0]?.kind;
    const kindLine = kindByRow ? '가로 줄' : '세로 줄';
    const direction = kindByRow ? '오른쪽으로' : '아래로';

    const question: Question = {
      id: iqQuestionId('size', seed),
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `${kindLine}마다 도형 종류가 정해져 있고, ${direction} 갈수록 ` +
        `${ascending ? '커집니다' : '작아집니다'}. ` +
        `마지막 ${kindLine}은 ${attachParticle(kindNames[answer.kind], '이고', '고')}, 그 안에서 세 번째이므로 ` +
        `${ascending ? '가장 큰' : '가장 작은'} 크기입니다.`,
      difficulty: 2,
    };

    return { question, generatorId: 'size', seed };
  },
};
