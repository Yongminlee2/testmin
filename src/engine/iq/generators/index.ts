import type { Difficulty, GeneratedQuestion } from '../../types';
import { rotationGenerator } from './rotation';
import { countGenerator } from './count';
import { fillGenerator } from './fill';
import { distributeGenerator } from './distribute';
import { sizeGenerator } from './size';
import { sequenceGenerator } from './sequence';

export interface Generator {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** 같은 시드는 항상 같은 문항을 만든다. 정답 유일성은 생성기가 보장한다. */
  generate(seed: number): GeneratedQuestion;
}

/** 여섯 번째이자 마지막 생성기(sequence)까지 다 채워졌다. */
export const GENERATORS: readonly Generator[] = [
  rotationGenerator,
  countGenerator,
  fillGenerator,
  distributeGenerator,
  sizeGenerator,
  sequenceGenerator,
];
