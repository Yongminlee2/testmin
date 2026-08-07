import {
  CATEGORIES,
  DIALECT_DRAW,
  DIALECT_REGIONS,
  IQ_DRAW,
  MZ_DRAW,
  POOLS,
  SCORED_TESTS,
  getGradeBands,
  getPool,
  gradeTableId,
} from '@/content/registry';

// 고정 문항 고사는 콘텐츠 JSON + SCORED_TESTS 한 줄이면 끝나야 한다.
// 홈 카드나 급수표를 따로 손보는 걸 잊으면 사용자가 빈 화면을 만나므로,
// 배선이 전부 붙었는지 여기서 한 번에 확인한다.
describe('SCORED_TESTS 배선', () => {
  test.each(SCORED_TESTS.map((t) => [t.id, t] as const))('%s: 풀·급수표·홈카드', (id, meta) => {
    expect(getPool(id, 'default').length).toBeGreaterThanOrEqual(meta.draw.questionCount);
    expect(getGradeBands(gradeTableId(id, 'default')).length).toBeGreaterThan(0);

    const card = CATEGORIES.find((c) => c.id === id);
    expect(card?.route).toBe(`/test/g/${id}/intro`);
    expect(card?.available).toBe(true);
    expect(card?.questionCount).toBe(meta.draw.questionCount);
  });
});

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

  test('여섯 지역 모두 문항 풀이 있고 available이 참이다', () => {
    for (const r of DIALECT_REGIONS) {
      expect(getPool('dialect', r.id).length).toBeGreaterThan(0);
      expect(r.available).toBe(true);
    }
  });

  // available이 계산된 값이라는 성질은 여기서 지킨다. 등록되지 않은 지역을
  // 물으면 빈 풀이 나와야 한다 — 그래야 새 지역을 추가할 때 콘텐츠 없이
  // available만 참으로 적어두는 실수가 막힌다.
  test('등록되지 않은 지역은 빈 풀을 준다', () => {
    expect(getPool('dialect', 'nowhere')).toHaveLength(0);
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

  // available은 손으로 뒤집는 플래그가 아니라 계산된 값이어야 한다.
  // 콘텐츠 없이 available: true로 적어두면 사용자가 빈 시험에 들어간다.
  // 기대값은 POOLS에서 직접 만든다. 손으로 적은 목록이면 고사를 추가할 때마다
  // 목록이 낡아서, 정작 잡아야 할 "콘텐츠 없이 available: true" 실수를 놓친다.
  test('콘텐츠가 있는 카테고리만 available이다', () => {
    const withContent = new Set(
      Object.entries(POOLS)
        .filter(([, pool]) => pool.length > 0)
        .map(([key]) => key.split(':')[0])
    );
    withContent.add('iq'); // IQ만 정적 풀이 아니라 생성기 기반이다
    for (const c of CATEGORIES) {
      expect(c.available).toBe(withContent.has(c.id));
    }
  });

  test('MZ 카테고리의 questionCount는 MZ_DRAW와 같은 값을 공유한다', () => {
    const mz = CATEGORIES.find((c) => c.id === 'mz');
    expect(mz?.questionCount).toBe(MZ_DRAW.questionCount);
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
