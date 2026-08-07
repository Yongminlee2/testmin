import { mulberry32, pickInt, shuffle } from '../../rng';
import { attachParticle } from '../../korean';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
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
    // 축 교환. 기본(swapped=false)은 열이 종류를, 행이 채움을 맡는다 — 원래
    // 규칙 그대로다. swapped=true면 행이 종류를, 열이 채움을 맡도록 뒤집는다.
    // 문제(종류 3가지 순환·채움 2가지 교대)는 그대로고 배치만 새로워지므로
    // kindOffset(3) × startFilled(2) × swapped(2) = 12가지 퍼즐(계획 4).
    const swapped = rand() < 0.5;

    const comboAt = (r: number, c: number): Combo => {
      const kindIndex = swapped ? r : c;
      const fillIndex = swapped ? c : r;
      return {
        kind: KINDS[(kindOffset + kindIndex) % KINDS.length] as ShapeKind,
        filled: (fillIndex % 2 === 0) === startFilled,
      };
    };

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

    // 해설이 말할 축 이름은 swapped를 직접 읽지 않고 이미 그려진 cells에서
    // 역산한다. 0번 칸과 3번 칸은 같은 열(행만 다르다) — 종류가 같으면 열이
    // 종류를 고정하는 축이고, 다르면 행이 그 축이다. swapped에서 곧장
    // "행"/"열" 문구를 고르면, 나중에 comboAt의 축 배정만 바뀌고 이 분기를
    // 못 따라가는 리팩터링이 나와도 해설은 옛 축을 계속 가리킨 채 초록불로
    // 남는다 — 격자를 직접 보고 판단하면 그 여지가 없다.
    const kindByColumn = cells[0]?.shapes[0]?.kind === cells[3]?.shapes[0]?.kind;
    const kindAxis = kindByColumn ? '열' : '행';
    const fillAxis = kindByColumn ? '행' : '열';

    const question: Question = {
      id: iqQuestionId('fill', seed),
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `${kindAxis}마다 도형이 ${KINDS.map((k) => kindNames[k]).join('→')} 순서로 바뀌고, ` +
        `${fillAxis}마다 색이 번갈아 칠해집니다. 마지막 칸은 ${attachParticle(kindNames[answer.kind], '이고', '고')} ` +
        `${answer.filled ? '색이 칠해진' : '비어 있는'} 모양입니다.`,
      difficulty: 2,
    };

    return { question, generatorId: 'fill', seed };
  },
};
