export type TestKind = 'scored' | 'typed';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';
export type Difficulty = 1 | 2 | 3;

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond';

export interface ShapeSpec {
  readonly kind: ShapeKind;
  /** 0, 90, 180, 270 */
  readonly rotation: number;
  readonly filled: boolean;
  /** 셀 크기 대비 0.2~1.0 */
  readonly size: number;
  /** 셀 안에서의 위치. 0~1 */
  readonly x: number;
  readonly y: number;
}

export interface CellSpec {
  readonly shapes: readonly ShapeSpec[];
}

export interface FigureSpec {
  /** 'grid'는 3×3 행렬(cells 9개), 'single'은 낱개 도형(cells 1개) */
  readonly kind: 'grid' | 'single';
  readonly cells: readonly CellSpec[];
  /** grid 전용: 비워둘 칸의 인덱스. 보통 8(마지막) */
  readonly blankIndex?: number;
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
  /** 득표 방식 전용: 이 선택지가 표를 던지는 유형 id */
  readonly typeId?: string;
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

/** 생성기가 돌려주는 것 — 문항 하나와 그걸 만든 근거 */
export interface GeneratedQuestion {
  readonly question: Question;
  readonly generatorId: string;
  readonly seed: number;
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

/** 성격 16유형의 네 축. 각 축의 음수 방향이 첫 글자, 양수 방향이 둘째 글자. */
export const AXES = ['EI', 'SN', 'TF', 'JP'] as const;
export type AxisKey = (typeof AXES)[number];

/** 축별 글자 매핑. weight 합계가 음수면 negative, 양수면 positive. */
export const AXIS_LETTERS: Record<AxisKey, { negative: string; positive: string }> = {
  EI: { negative: 'I', positive: 'E' },
  SN: { negative: 'S', positive: 'N' },
  TF: { negative: 'T', positive: 'F' },
  JP: { negative: 'J', positive: 'P' },
};

export interface AxisScore {
  readonly axis: AxisKey;
  /** 가중치 합계 */
  readonly total: number;
  /** 이 축에서 나온 글자 */
  readonly letter: string;
  /** 0~100. 50이면 완전히 반반 */
  readonly percent: number;
  /** 합계가 0이라 마지막 응답으로 결정했는가 */
  readonly wasTie: boolean;
}

export interface AxisResult {
  /** 예: "ENFP" */
  readonly code: string;
  readonly axes: readonly AxisScore[];
}

export interface VoteResult {
  /** 최다 득표 유형의 id */
  readonly typeId: string;
  /** typeId → 득표수 */
  readonly tally: Readonly<Record<string, number>>;
  /** 동점이라 뒤쪽 문항 우선 규칙으로 결정했는가 */
  readonly wasTie: boolean;
}

/** 16유형 별명 데이터 한 항목 */
export interface TypeNameEntry {
  readonly code: string;
  /** 자체 창작 별명. 16Personalities 유형명 금지 */
  readonly nickname: string;
  readonly description: string;
  readonly emoji: string;
}
