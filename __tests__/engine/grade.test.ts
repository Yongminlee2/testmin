import { gradeFor } from '@/engine/grade';
import type { GradeBand } from '@/engine/types';
import grades from '@/content/grades.json';

const bands: readonly GradeBand[] = [
  { min: 100, grade: 1, title: '1급' },
  { min: 90, grade: 2, title: '2급' },
  { min: 80, grade: 3, title: '3급' },
  { min: 70, grade: 4, title: '4급' },
  { min: 60, grade: 5, title: '5급' },
  { min: 50, grade: 6, title: '6급' },
  { min: 40, grade: 7, title: '7급' },
  { min: 25, grade: 8, title: '8급' },
  { min: 0, grade: 9, title: '9급' },
];

describe('gradeFor', () => {
  test('만점은 1급', () => {
    expect(gradeFor(12, 12, bands).grade).toBe(1);
  });

  test('0점은 9급', () => {
    expect(gradeFor(0, 12, bands).grade).toBe(9);
  });

  test('경계 바로 위와 아래가 다른 급수를 받는다', () => {
    // 10문항 기준: 9문항 = 90% = 2급, 8문항 = 80% = 3급
    expect(gradeFor(9, 10, bands).grade).toBe(2);
    expect(gradeFor(8, 10, bands).grade).toBe(3);
  });

  test('11/12는 91.6%라 2급', () => {
    expect(gradeFor(11, 12, bands).grade).toBe(2);
  });

  test('총 문항이 0이면 최하 급수를 준다', () => {
    expect(gradeFor(0, 0, bands).grade).toBe(9);
  });

  test('칭호를 함께 돌려준다', () => {
    expect(gradeFor(12, 12, bands).title).toBe('1급');
  });
});

describe('grades.json', () => {
  test('경상도 사투리 급수 테이블이 0~100%를 빈틈없이 덮는다', () => {
    const table = grades['dialect-gyeongsang'];
    expect(table).toBeDefined();
    const bandsOf = table!.bands;
    const sorted = [...bandsOf].sort((a, b) => b.min - a.min);
    expect(sorted[0]!.min).toBe(100);
    expect(sorted[sorted.length - 1]!.min).toBe(0);
    expect(sorted).toEqual(bandsOf);
  });

  test('모든 급수에 칭호가 있다', () => {
    for (const table of Object.values(grades)) {
      for (const band of table.bands) {
        expect(band.title.length).toBeGreaterThan(0);
      }
    }
  });
});
