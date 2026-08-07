import { mulberry32, pickInt, shuffle } from '../../rng';
import { shape } from '../figure';
import { iqQuestionId } from '../questionId';
import type { CellSpec, FigureSpec, GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

const STEPS = [90, 180, 270] as const;

function cellAt(rotation: number): CellSpec {
  // 회전이 보이는 도형은 삼각형뿐이다. 원·마름모·정사각형은
  // 90° 배수에서 자기 자신이 되어 정답과 구분 불가능한 오답을 만든다.
  return { shapes: [shape('triangle', { rotation: ((rotation % 360) + 360) % 360 })] };
}

function single(rotation: number): FigureSpec {
  return { kind: 'single', cells: [cellAt(rotation)] };
}

export const rotationGenerator: Generator = {
  id: 'rotation',
  difficulty: 1,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const step = STEPS[pickInt(rand, 0, STEPS.length - 1)] ?? 90;
    const start = STEPS[pickInt(rand, 0, STEPS.length - 1)] ?? 0;

    const cells: CellSpec[] = [];
    for (let i = 0; i < 9; i++) {
      cells.push(cellAt(start + step * i));
    }

    const answerRotation = ((start + step * 8) % 360 + 360) % 360;

    // 오답은 정답에서 90·180·270° 어긋난 것. 삼각형이라 넷 다 다르게 보인다.
    const wrongRotations = [90, 180, 270].map((d) => (answerRotation + d) % 360);
    // 5지선다를 채우기 위해 한 각도를 더 넣는다 — 45° 어긋난 것(삼각형에서 명확히 다름)
    const extra = (answerRotation + 45) % 360;

    // 선택지 순서를 시드로 섞는다. 정답이 항상 1번이면 안 된다(계획 1의 교훈).
    // rng.ts의 seeded Fisher-Yates(shuffle)를 그대로 쓴다 — 무작위 비교 함수를 쓰는
    // sort(() => rand() - 0.5)는 균등 셔플이 아니고 엔진마다 결과가 달라진다.
    const finalOptions = shuffle([answerRotation, ...wrongRotations, extra], rand);

    const answerIndex = finalOptions.indexOf(answerRotation);

    const question: Question = {
      id: iqQuestionId('rotation', seed),
      kind: 'scored',
      prompt: '빈 칸에 들어갈 도형은?',
      figure: { kind: 'grid', cells, blankIndex: 8 },
      choices: finalOptions.map((r) => ({ figure: single(r) })),
      answerIndex,
      explanation:
        `왼쪽 위에서 오른쪽 아래로 한 칸씩 갈 때마다 삼각형이 시계방향으로 ${step}°씩 돕니다. ` +
        `첫 칸이 ${((start % 360) + 360) % 360}°이므로 아홉 번째 칸은 ${answerRotation}° 회전한 모양입니다.`,
      difficulty: 1,
    };

    return { question, generatorId: 'rotation', seed };
  },
};
