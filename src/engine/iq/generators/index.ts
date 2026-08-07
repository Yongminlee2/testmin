import type { Difficulty, GeneratedQuestion } from '../../types';
import { rotationGenerator } from './rotation';
import { countGenerator } from './count';
import { fillGenerator } from './fill';

export interface Generator {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** 같은 시드는 항상 같은 문항을 만든다. 정답 유일성은 생성기가 보장한다. */
  generate(seed: number): GeneratedQuestion;
}

/** Task 5에서 나머지가 채워진다. */
export const GENERATORS: readonly Generator[] = [rotationGenerator, countGenerator, fillGenerator];
