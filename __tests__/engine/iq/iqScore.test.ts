import { estimateIqScore, scoreIq, IQ_DISCLAIMER } from '@/engine/iq/iqScore';
import { getGradeBands } from '@/content/registry';

describe('estimateIqScore', () => {
  test('정답률 0%는 70점, 100%는 145점이다', () => {
    expect(estimateIqScore(0)).toBe(70);
    expect(estimateIqScore(100)).toBe(145);
  });

  test('정답률이 오르면 점수도 오른다', () => {
    for (let p = 1; p <= 100; p++) {
      expect(estimateIqScore(p)).toBeGreaterThanOrEqual(estimateIqScore(p - 1));
    }
  });

  test('범위를 벗어난 정답률도 70~145에 갇힌다', () => {
    expect(estimateIqScore(-50)).toBe(70);
    expect(estimateIqScore(500)).toBe(145);
    expect(estimateIqScore(Number.NaN)).toBeGreaterThanOrEqual(70);
  });
});

describe('scoreIq', () => {
  // ★ 점수만 있고 문구가 없는 결과는 만들 수 없어야 한다
  test('결과에 항상 안내 문구가 들어 있다', () => {
    const r = scoreIq([], [], getGradeBands('iq-default'));
    expect(r.disclaimer).toBe(IQ_DISCLAIMER);
    expect(r.disclaimer.length).toBeGreaterThan(0);
  });

  test('안내 문구가 실제 지능검사가 아님을 밝힌다', () => {
    // 문구를 마케팅 문장으로 바꿔치기하는 걸 막는다
    expect(IQ_DISCLAIMER).toContain('실제 지능검사');
    expect(IQ_DISCLAIMER).toContain('규준 표본');
  });

  test('빈 응답이어도 크래시하지 않고 최하 급수를 준다', () => {
    const r = scoreIq([], [], getGradeBands('iq-default'));
    expect(r.total).toBe(0);
    expect(r.grade).toBe(9);
    expect(r.estimatedScore).toBe(70);
  });
});
