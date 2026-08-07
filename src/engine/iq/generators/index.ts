import type { Difficulty, GeneratedQuestion } from '../../types';
import { rotationGenerator } from './rotation';
import { countGenerator } from './count';
import { fillGenerator } from './fill';
import { distributeGenerator } from './distribute';
import { sizeGenerator } from './size';
import { sequenceGenerator } from './sequence';
import { logicGenerator } from './logic';

export interface Generator {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** 같은 시드는 항상 같은 문항을 만든다. 정답 유일성은 생성기가 보장한다. */
  generate(seed: number): GeneratedQuestion;
}

/** 도형 6종 + 수열 1종. logic은 두 칸을 겹쳐 읽어야 하는 상위 난이도 규칙이다. */
export const GENERATORS: readonly Generator[] = [
  rotationGenerator,
  countGenerator,
  fillGenerator,
  distributeGenerator,
  sizeGenerator,
  sequenceGenerator,
  logicGenerator,
];
