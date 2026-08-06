export type TestKind = 'scored' | 'typed';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';
export type Difficulty = 1 | 2 | 3;

/** 도형 문항을 그리기 위한 선언적 스펙. 계획 2에서 확장한다. */
export interface FigureSpec {
  readonly kind: string;
  readonly [key: string]: unknown;
}

export interface Choice {
  /** 텍스트 선택지 */
  readonly text?: string;
  /** 도형 선택지 (계획 2) */
  readonly figure?: FigureSpec;
  /** 유형형 전용: 축에 미치는 방향과 강도. -2 | -1 | 1 | 2 */
  readonly weight?: number;
  /** 유형형 전용: 이 선택이 뜻하는 것 */
  readonly why?: string;
}

export interface Question {
  readonly id: string;
  readonly kind: TestKind;
  readonly prompt: string;
  readonly figure?: FigureSpec;
  readonly choices: readonly Choice[];
  /** 정답형 전용 */
  readonly answerIndex?: number;
  /** 정답형 전용: 왜 이것이 정답인가 */
  readonly explanation?: string;
  /** 정답형 전용: 각 오답이 왜 틀렸는가. choices와 같은 길이거나 생략 */
  readonly distractorNotes?: readonly string[];
  /** 유형형 전용 */
  readonly axis?: string;
  readonly difficulty: Difficulty;
  readonly tags?: readonly string[];
  /** 사실 검증 근거 */
  readonly source?: string;
}

export interface GradeBand {
  /** 이 급수를 받기 위한 최소 정답률(%). 내림차순으로 정렬되어야 한다. */
  readonly min: number;
  /** 1이 최상, 9가 최하 */
  readonly grade: number;
  /** 급수에 붙는 코믹한 칭호 */
  readonly title: string;
}

export interface GradeTable {
  readonly bands: readonly GradeBand[];
}
