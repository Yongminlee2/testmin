import type { GradeBand, GradeTable, Question } from '@/engine/types';
import gradesJson from './grades.json';
import gyeongsang from './dialect/gyeongsang.json';

const grades = gradesJson as unknown as Record<string, GradeTable>;

export interface CategoryMeta {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly emoji: string;
  readonly colorKey: 'iq' | 'personality' | 'mz' | 'dialect' | 'psych';
  readonly questionCount: number;
  /** 계획 1에서 실제로 응시 가능한지 */
  readonly available: boolean;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'iq', title: 'IQ 고사', subtitle: '도형·수열·유추', emoji: '🧠', colorKey: 'iq', questionCount: 20, available: false },
  { id: 'personality', title: '성격 16유형 고사', subtitle: '4개 축 × 6문항', emoji: '🎭', colorKey: 'personality', questionCount: 24, available: false },
  { id: 'mz', title: 'MZ 고사', subtitle: '신조어·밈 해독', emoji: '📱', colorKey: 'mz', questionCount: 15, available: false },
  { id: 'dialect', title: '사투리 고사', subtitle: '6개 지역 · 골라서 응시', emoji: '🗣️', colorKey: 'dialect', questionCount: 12, available: true },
  { id: 'psych', title: '심리 테스트', subtitle: '연애·스트레스 성향', emoji: '🔮', colorKey: 'psych', questionCount: 12, available: false },
];

export interface RegionMeta {
  readonly id: string;
  readonly title: string;
  readonly available: boolean;
}

export const DIALECT_REGIONS: readonly RegionMeta[] = [
  { id: 'gyeongsang', title: '경상도', available: true },
  { id: 'jeolla', title: '전라도', available: false },
  { id: 'chungcheong', title: '충청도', available: false },
  { id: 'gangwon', title: '강원도', available: false },
  { id: 'jeju', title: '제주도', available: false },
  { id: 'seoul', title: '서울·경기', available: false },
];

const POOLS: Record<string, readonly Question[]> = {
  'dialect:gyeongsang': gyeongsang as unknown as Question[],
};

/** 없는 조합이면 빈 배열을 준다 (호출부가 크래시하지 않게). */
export function getPool(testId: string, variant: string): readonly Question[] {
  return POOLS[`${testId}:${variant}`] ?? [];
}

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
