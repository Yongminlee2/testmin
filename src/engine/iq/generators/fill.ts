import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

const KINDS: readonly ShapeKind[] = ['circle', 'square', 'triangle'];

interface Combo {
  readonly kind: ShapeKind;
  readonly filled: boolean;
}

function cellOf(combo: Combo): CellSpec {
  return { shapes: [shape(combo.kind, { filled: combo.filled, size: 0.62 })] };
}

function single(combo: Combo): FigureSpec {
  return { kind: 'single', cells: [cellOf(combo)] };
}

function comboKey(c: Combo): string {
  return `${c.kind}:${c.filled ? 1 : 0}`;
}

export const fillGenerator: Generator = {
  id: 'fill',
  difficulty: 2,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const kindOffset = pickInt(rand, 0, KINDS.length - 1);
    const startFilled = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => ({
      kind: KINDS[(kindOffset + c) % KINDS.length] as ShapeKind,
      filled: (r % 2 === 0) === startFilled,
    });

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellOf(comboAt(Math.floor(i / 3), i % 3)));
    }

    const answer = comboAt(2, 2);

    // 오답 4개는 무작위로 뽑지 않고 **어긴 규칙별로 하나씩** 구성한다.
    // 후보 5개 중 4개를 무작위로 뽑으면 가장 교육적인 오답이 빠질 수 있다.
    //  (a) 종류는 맞고 채움만 틀림 → 열 규칙만 읽고 행 규칙을 놓친 사람이 고른다
    //  (b) 채움은 맞고 종류만 틀림 (2개) → 행 규칙만 읽고 열 규칙을 놓친 사람이 고른다
    //  (c) 둘 다 틀림 (1개) → 아무 규칙도 못 읽은 경우
    const otherKinds = KINDS.filter((k) => k !== answer.kind);
    const bothWrong = otherKinds.map((k) => ({ kind: k, filled: !answer.filled }));
    const wrong: Combo[] = [
      { kind: answer.kind, filled: !answer.filled },
      ...otherKinds.map((k) => ({ kind: k, filled: answer.filled })),
      bothWrong[pickInt(rand, 0, bothWrong.length - 1)] as Combo,
    ];
    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => comboKey(o) === comboKey(answer));

    const kindNames: Record<ShapeKind, string> = {
      circle: '원',
      square: '사각형',
      triangle: '삼각형',
      diamond: '마름모',
    };

    const question: Question = {
      id: `iq-fill-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `열마다 도형이 ${KINDS.map((k) => kindNames[k]).join('→')} 순서로 바뀌고, ` +
        `행마다 색이 번갈아 칠해집니다. 마지막 칸은 ${kindNames[answer.kind]}이고 ` +
        `${answer.filled ? '색이 칠해진' : '비어 있는'} 모양입니다.`,
      difficulty: 2,
    };

    return { question, generatorId: 'fill', seed };
  },
};
