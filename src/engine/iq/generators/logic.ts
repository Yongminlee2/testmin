import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question, ShapeKind } from '../../types';
import type { Generator } from './index';

/**
 * 논리 결합 규칙 — 한 줄의 세 번째 칸이 앞 두 칸을 겹쳐서 나온다.
 *
 * 기존 다섯 생성기는 전부 "한 속성이 일정하게 변한다"는 형태라, 규칙 하나만
 * 찾으면 풀린다. 사용자가 "너무 쉽다"고 한 이유가 이것이다. 이 규칙은
 * 두 칸을 동시에 보고 겹쳐야 해서 난이도가 한 단계 위다.
 *
 * 세 가지 결합 중 하나를 쓴다. 어느 것인지도 스스로 알아내야 한다:
 *   xor — 한쪽에만 있는 것이 남는다 (양쪽에 다 있으면 사라진다)
 *   and — 양쪽에 다 있는 것만 남는다
 *   or  — 둘 중 어디든 있으면 남는다
 *
 * 칸은 세 자리(좌·중·우)를 가지며 각 자리에 점이 있거나 없다. 자리마다
 * 독립적으로 결합하므로, 규칙을 찾으면 세 자리를 각각 계산해 답이 나온다.
 */

type Combine = 'xor' | 'and' | 'or';
const COMBINES: readonly Combine[] = ['xor', 'and', 'or'];

/** 점 세 개가 놓일 가로 위치. 세로는 가운데 고정. */
const SLOTS: readonly number[] = [0.25, 0.5, 0.75];

const MARK: ShapeKind = 'circle';

function cellOf(bits: readonly boolean[]): CellSpec {
  return {
    shapes: bits.flatMap((on, i) =>
      on ? [shape(MARK, { x: SLOTS[i] as number, y: 0.5, size: 0.3, filled: true })] : []
    ),
  };
}

function single(bits: readonly boolean[]): FigureSpec {
  return { kind: 'single', cells: [cellOf(bits)] };
}

function apply(mode: Combine, a: boolean, b: boolean): boolean {
  if (mode === 'xor') return a !== b;
  if (mode === 'and') return a && b;
  return a || b;
}

function key(bits: readonly boolean[]): string {
  return bits.map((b) => (b ? '1' : '0')).join('');
}

const WHY: Record<Combine, string> = {
  xor: '한쪽 칸에만 점이 있는 자리는 남고, 양쪽에 다 있는 자리는 사라집니다',
  and: '양쪽 칸에 모두 점이 있는 자리만 남습니다',
  or: '두 칸 중 어느 한쪽에라도 점이 있으면 남습니다',
};

export const logicGenerator: Generator = {
  id: 'logic',
  difficulty: 3,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const mode = COMBINES[pickInt(rand, 0, COMBINES.length - 1)] as Combine;

    // 각 행의 앞 두 칸을 뽑고 세 번째 칸을 규칙으로 계산한다.
    // 결과가 전부 빈 칸이거나 전부 찬 칸이면 규칙을 읽을 단서가 약해지므로 다시 뽑는다.
    const rows: boolean[][][] = [];
    for (let r = 0; r < 3; r++) {
      for (let attempt = 0; ; attempt++) {
        const a = SLOTS.map(() => rand() < 0.5);
        const b = SLOTS.map(() => rand() < 0.5);
        const c = a.map((v, i) => apply(mode, v, b[i] as boolean));
        const filled = c.filter(Boolean).length;
        // 마지막 행(정답이 나올 행)은 특히 0개·3개를 피한다 — 오답을 만들 여지가 없다.
        const tooPlain = filled === 0 || filled === 3;
        if (!tooPlain || attempt > 40) {
          rows.push([a, b, c]);
          break;
        }
      }
    }

    const cells: CellSpec[] = rows.flatMap((row) => row.map(cellOf));
    const answer = rows[2]?.[2] as boolean[];

    // 오답은 "다른 결합 규칙을 적용한 결과"와 "정답에서 한 자리만 뒤집은 것".
    // 규칙을 잘못 고른 사람과, 규칙은 맞았는데 한 자리를 놓친 사람 둘 다를 노린다.
    const a2 = rows[2]?.[0] as boolean[];
    const b2 = rows[2]?.[1] as boolean[];
    const candidates: boolean[][] = [];
    for (const other of COMBINES) {
      if (other === mode) continue;
      candidates.push(a2.map((v, i) => apply(other, v, b2[i] as boolean)));
    }
    for (let i = 0; i < SLOTS.length; i++) {
      candidates.push(answer.map((v, j) => (i === j ? !v : v)));
    }

    const seen = new Set<string>([key(answer)]);
    const wrong: boolean[][] = [];
    for (const c of candidates) {
      if (wrong.length === 4) break;
      if (seen.has(key(c))) continue;
      seen.add(key(c));
      wrong.push(c);
    }
    // 후보가 겹쳐 모자라면 남은 조합에서 채운다. 3자리라 8가지뿐이므로 항상 채워진다.
    for (let mask = 0; wrong.length < 4 && mask < 8; mask++) {
      const c = [0, 1, 2].map((i) => ((mask >> i) & 1) === 1);
      if (seen.has(key(c))) continue;
      seen.add(key(c));
      wrong.push(c);
    }

    const options = shuffle([answer, ...wrong], rand);
    const answerIndex = options.findIndex((o) => key(o) === key(answer));

    const question: Question = {
      id: `iq-logic-${seed}`,
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: options.map((o) => ({ figure: single(o) })),
      answerIndex,
      explanation:
        `가로 한 줄에서 앞의 두 칸을 겹치면 세 번째 칸이 됩니다. ${WHY[mode]}. ` +
        `마지막 줄도 같은 방식으로 겹치면 점이 ${answer.filter(Boolean).length}개인 모양이 됩니다.`,
      difficulty: 3,
    };

    return { question, generatorId: 'logic', seed };
  },
};
