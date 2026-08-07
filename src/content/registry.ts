import type { Difficulty, GradeBand, GradeTable, Question } from '@/engine/types';
import gradesJson from './grades.json';
import gyeongsang from './dialect/gyeongsang.json';
import personality from './personality.json';
import typeNamesJson from './typeNames.json';
import type { TypeNameEntry } from '@/engine/types';
import love from './psych/love.json';
import mz from './mz.json';
import { GENERATORS } from '@/engine/iq/generators';
import type { IqDrawConfig } from '@/engine/iq/assembleIq';

const grades = gradesJson as unknown as Record<string, GradeTable>;

/** 한 시험의 출제 규칙. intro/result/홈배지가 모두 이 값 하나만 읽는다. */
export interface DrawConfig {
  readonly questionCount: number;
  readonly difficultyMix: Partial<Record<Difficulty, number>>;
}

/** MZ 고사 출제 설정. 풀 15개에서 15문항 — 전부 낸다. */
export const MZ_DRAW: DrawConfig = {
  questionCount: 15,
  difficultyMix: { 1: 5, 2: 5, 3: 5 },
};

export const DIALECT_DRAW: DrawConfig = {
  questionCount: 12,
  difficultyMix: { 1: 4, 2: 5, 3: 3 },
};

/** IQ 고사 출제 설정. 난이도별 목표 개수의 합이 questionCount와 같아야 한다. */
export const IQ_DRAW: IqDrawConfig = {
  questionCount: 20,
  difficultyMix: { 1: 7, 2: 7, 3: 6 },
};

/**
 * 등록된 모든 문항 풀. `${testId}:${variant}` 키로 저장한다.
 * 콘텐츠 검증 CLI(tools/validate-content.ts)가 이 목록을 그대로 순회한다 —
 * 새 지역/카테고리를 추가할 때 검증 스크립트를 따로 고칠 필요가 없다.
 */
export const POOLS: Record<string, readonly Question[]> = {
  'dialect:gyeongsang': gyeongsang as unknown as Question[],
  'mz:default': mz as unknown as Question[],
  'personality:default': personality as unknown as Question[],
  'psych:love': (love as unknown as { questions: Question[] }).questions,
};

/**
 * 풀마다 채점 방식이 다르므로 검증 규칙도 다르다 — 'scored'는 정답형(answerIndex),
 * 'axis'는 축 합계형(personality), 'vote'는 득표형(심리 테스트, 계획 2 후반).
 * POOLS에 풀을 추가할 때 여기도 같이 등록해야 한다: 검증 CLI가 등록되지 않은
 * 풀을 만나면 조용히 건너뛰지 않고 실패한다.
 */
export type PoolScoring = 'scored' | 'axis' | 'vote';

export const POOL_SCORING: Record<string, PoolScoring> = {
  'dialect:gyeongsang': 'scored',
  'mz:default': 'scored',
  'personality:default': 'axis',
  'psych:love': 'vote',
};

/** 없는 조합이면 빈 배열을 준다 (호출부가 크래시하지 않게). */
export function getPool(testId: string, variant: string): readonly Question[] {
  return POOLS[`${testId}:${variant}`] ?? [];
}

/** 성격 고사 출제 설정. 축당 6문항 = 총 24문항 */
export const PERSONALITY_DRAW = { perAxis: 6 } as const;

const TYPE_NAMES = typeNamesJson as unknown as TypeNameEntry[];

/** 없는 코드면 undefined. 호출부가 폴백을 준비한다. */
export function getTypeName(code: string): TypeNameEntry | undefined {
  return TYPE_NAMES.find((t) => t.code === code);
}

export interface PsychTypeEntry {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly description: string;
}

export interface PsychTestMeta {
  readonly id: string;
  readonly title: string;
  readonly types: readonly PsychTypeEntry[];
  readonly questions: readonly Question[];
  readonly available: boolean;
}

const PSYCH_RAW: Record<string, unknown> = { love };

/** 심리 테스트 목록. intro 화면이 이걸로 선택지를 그린다. */
export const PSYCH_TESTS: readonly PsychTestMeta[] = [
  buildPsych('love'),
  { id: 'stress', title: '스트레스 반응', types: [], questions: [], available: false },
  { id: 'comm', title: '소통 유형', types: [], questions: [], available: false },
];

function buildPsych(id: string): PsychTestMeta {
  const raw = PSYCH_RAW[id] as
    | { id: string; title: string; types: PsychTypeEntry[]; questions: Question[] }
    | undefined;
  if (raw === undefined) {
    return { id, title: id, types: [], questions: [], available: false };
  }
  return {
    id: raw.id,
    title: raw.title,
    types: raw.types,
    questions: raw.questions,
    available: raw.questions.length > 0,
  };
}

/** 없는 id면 undefined. 호출부가 폴백을 준비한다. */
export function getPsychTest(id: string): PsychTestMeta | undefined {
  return PSYCH_TESTS.find((t) => t.id === id && t.available);
}

/** 이 testId로 등록된 풀이 하나라도 있으면 참. CATEGORIES의 available을 여기서 계산한다. */
function categoryHasPool(testId: string): boolean {
  const prefix = `${testId}:`;
  return Object.entries(POOLS).some(
    ([key, pool]) => key.startsWith(prefix) && pool.length > 0
  );
}

export interface CategoryMeta {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly emoji: string;
  readonly colorKey: 'iq' | 'personality' | 'mz' | 'dialect' | 'psych';
  readonly questionCount: number;
  /** 홈 화면에서 이동할 인트로 경로. available이 false인 동안은 실제로 열리지 않는다. */
  readonly route: string;
  /** 이 카테고리에 등록된 풀이 있는지로 계산한다 — 손으로 뒤집는 플래그가 아니다. */
  readonly available: boolean;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'iq',
    title: 'IQ 고사',
    subtitle: '도형·수열·유추',
    emoji: '🧠',
    colorKey: 'iq',
    questionCount: IQ_DRAW.questionCount,
    route: '/test/iq/intro',
    // IQ는 정적 풀(POOLS)이 아니라 시드에서 생성한다. categoryHasPool은 항상
    // false를 주므로 여기서는 등록된 생성기가 있는지로 계산한다.
    available: GENERATORS.length > 0,
  },
  {
    id: 'personality',
    title: '성격 16유형 고사',
    subtitle: '4개 축 × 6문항',
    emoji: '🎭',
    colorKey: 'personality',
    questionCount: 24,
    route: '/test/personality/intro',
    available: categoryHasPool('personality'),
  },
  {
    id: 'mz',
    title: 'MZ 고사',
    subtitle: '신조어·밈 해독',
    emoji: '📱',
    colorKey: 'mz',
    questionCount: MZ_DRAW.questionCount,
    route: '/test/mz/intro',
    available: categoryHasPool('mz'),
  },
  {
    id: 'dialect',
    title: '사투리 고사',
    subtitle: '6개 지역 · 골라서 응시',
    emoji: '🗣️',
    colorKey: 'dialect',
    questionCount: DIALECT_DRAW.questionCount,
    route: '/test/dialect/intro',
    available: categoryHasPool('dialect'),
  },
  {
    id: 'psych',
    title: '심리 테스트',
    subtitle: '연애·스트레스 성향',
    emoji: '🔮',
    colorKey: 'psych',
    questionCount: 12,
    route: '/test/psych/intro',
    available: categoryHasPool('psych'),
  },
];

export interface RegionMeta {
  readonly id: string;
  readonly title: string;
  readonly available: boolean;
}

export const DIALECT_REGIONS: readonly RegionMeta[] = [
  { id: 'gyeongsang', title: '경상도', available: getPool('dialect', 'gyeongsang').length > 0 },
  { id: 'jeolla', title: '전라도', available: getPool('dialect', 'jeolla').length > 0 },
  { id: 'chungcheong', title: '충청도', available: getPool('dialect', 'chungcheong').length > 0 },
  { id: 'gangwon', title: '강원도', available: getPool('dialect', 'gangwon').length > 0 },
  { id: 'jeju', title: '제주도', available: getPool('dialect', 'jeju').length > 0 },
  { id: 'seoul', title: '서울·경기', available: getPool('dialect', 'seoul').length > 0 },
];

export function gradeTableId(testId: string, variant: string): string {
  return `${testId}-${variant}`;
}

/** 없는 테이블이면 0~100을 덮는 최소 테이블을 준다. */
export function getGradeBands(tableId: string): readonly GradeBand[] {
  return (
    grades[tableId]?.bands ?? [
      { min: 100, grade: 1, title: '1급' },
      { min: 0, grade: 9, title: '9급' },
    ]
  );
}
