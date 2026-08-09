import { figureChoiceGridMetrics } from '@/ui/figureChoiceLayout';

describe('figureChoiceGridMetrics', () => {
  test('오지선다를 3열로 배치해 마지막 두 보기를 가운데 정렬할 수 있게 한다', () => {
    expect(figureChoiceGridMetrics(412, 5)).toEqual({
      columns: 3,
      figureSize: 80,
      gap: 12,
      itemWidth: 118,
    });
  });

  test('작은 화면에서는 카드와 도형을 함께 줄인다', () => {
    expect(figureChoiceGridMetrics(320, 5)).toEqual({
      columns: 3,
      figureSize: 58,
      gap: 12,
      itemWidth: 88,
    });
  });

  test('보기 네 개까지는 기존처럼 2열을 사용한다', () => {
    expect(figureChoiceGridMetrics(360, 4)).toMatchObject({
      columns: 2,
      itemWidth: 158,
    });
  });
});
