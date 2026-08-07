import { CATEGORIES, DIALECT_DRAW, DIALECT_REGIONS, IQ_DRAW, getPool } from '@/content/registry';

describe('DIALECT_DRAW (출제 규칙 단일 소스)', () => {
  test('12문항, 난이도 배분 {1:4, 2:5, 3:3}이다', () => {
    expect(DIALECT_DRAW).toEqual({
      questionCount: 12,
      difficultyMix: { 1: 4, 2: 5, 3: 3 },
    });
  });
});

describe('available은 풀 존재 여부로 계산된다', () => {
  test('풀이 있는 지역(경상도)은 available이 참이다', () => {
    const gyeongsang = DIALECT_REGIONS.find((r) => r.id === 'gyeongsang');
    expect(gyeongsang?.available).toBe(true);
    expect(getPool('dialect', 'gyeongsang').length).toBeGreaterThan(0);
  });

  test('풀이 없는 지역은 available이 거짓이다', () => {
    for (const r of DIALECT_REGIONS.filter((r) => r.id !== 'gyeongsang')) {
      expect(getPool('dialect', r.id)).toHaveLength(0);
      expect(r.available).toBe(false);
    }
  });

  test('풀이 있는 카테고리(사투리·성격·심리)는 available이 참이다', () => {
    for (const id of ['dialect', 'personality', 'psych']) {
      const category = CATEGORIES.find((c) => c.id === id);
      expect(category?.available).toBe(true);
    }
  });

  // IQ는 POOLS가 아니라 GENERATORS로 가용성을 계산한다 — 정적 풀이 없어도 잠기면 안 된다.
  test('생성기가 등록된 IQ는 available이 참이다', () => {
    const iq = CATEGORIES.find((c) => c.id === 'iq');
    expect(iq?.available).toBe(true);
  });

  test('아직 풀도 생성기도 없는 카테고리는 available이 거짓이다', () => {
    for (const c of CATEGORIES.filter(
      (c) => c.id !== 'dialect' && c.id !== 'personality' && c.id !== 'psych' && c.id !== 'iq'
    )) {
      expect(c.available).toBe(false);
    }
  });

  test('사투리 카테고리의 questionCount는 DIALECT_DRAW와 같은 값을 공유한다', () => {
    const dialect = CATEGORIES.find((c) => c.id === 'dialect');
    expect(dialect?.questionCount).toBe(DIALECT_DRAW.questionCount);
  });

  // 리뷰 Important #3 — 사투리와 같은 패턴이다. 20을 두 곳(CATEGORIES, IQ_DRAW)에
  // 따로 적어두면 하나만 고쳤을 때 조용히 갈라진다. 하드코딩(예: 99)으로 되돌려도
  // 이 테스트가 없으면 잡히지 않는다.
  test('IQ 카테고리의 questionCount는 IQ_DRAW와 같은 값을 공유한다', () => {
    const iq = CATEGORIES.find((c) => c.id === 'iq');
    expect(iq?.questionCount).toBe(IQ_DRAW.questionCount);
  });
});

describe('CATEGORIES route 계약', () => {
  test('모든 카테고리가 고유한 route를 가진다', () => {
    const routes = CATEGORIES.map((c) => c.route);
    expect(new Set(routes)).toHaveProperty('size', routes.length);
  });

  test('사투리 카테고리의 route는 사투리 인트로다', () => {
    const dialect = CATEGORIES.find((c) => c.id === 'dialect');
    expect(dialect?.route).toBe('/test/dialect/intro');
  });
});
