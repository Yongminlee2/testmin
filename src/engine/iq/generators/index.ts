import type { Difficulty, GeneratedQuestion } from '../../types';
import { rotationGenerator } from './rotation';
import { countGenerator } from './count';
import { fillGenerator } from './fill';
import { distributeGenerator } from './distribute';
import { sizeGenerator } from './size';
import { sequenceGenerator } from './sequence';
import { logicGenerator } from './logic';
import { hardsequenceGenerator } from './hardsequence';
import { sumGenerator } from './sum';

export interface Generator {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** 같은 시드는 항상 같은 문항을 만든다. 정답 유일성은 생성기가 보장한다. */
  generate(seed: number): GeneratedQuestion;
}

/**
 * 도형 7종 + 수열 2종. 뒤의 셋(logic·sum·hardsequence)은 규칙을 두 번 읽어야
 * 풀리는 상위 난이도다 — 쉬운 문제만 나온다는 지적을 여기서 받는다.
 */
export const GENERATORS: readonly Generator[] = [
  rotationGenerator,
  countGenerator,
  fillGenerator,
  distributeGenerator,
  sizeGenerator,
  sequenceGenerator,
  logicGenerator,
  sumGenerator,
  hardsequenceGenerator,
];
