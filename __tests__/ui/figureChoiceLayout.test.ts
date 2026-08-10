import {
  figureChoiceGridMetrics,
  questionFigureSizeForViewport,
} from '@/ui/figureChoiceLayout';

describe('questionFigureSizeForViewport', () => {
  test('compact Android heights use a smaller puzzle so the second choice row remains reachable', () => {
    expect(questionFigureSizeForViewport(360, 640)).toBe(180);
  });

  test('regular phones and wide web screens keep their intended puzzle sizes', () => {
    expect(questionFigureSizeForViewport(393, 829)).toBe(220);
    expect(questionFigureSizeForViewport(1440, 900)).toBe(240);
  });
});

describe('figureChoiceGridMetrics', () => {
  test('compact heights reduce option figures while keeping large tap targets', () => {
    expect(figureChoiceGridMetrics(360, 5, 640)).toMatchObject({
      columns: 3,
      figureSize: 60,
      itemWidth: 101,
    });
  });

  test('오지선다를 3열로 배치해 마지막 두 보기를 가운데 정렬할 수 있게 한다', () => {
    expect(figureChoiceGridMetrics(412, 5)).toEqual({
      columns: 3,
      figureSize: 80,
      gap: 12,
      itemWidth: 118,
      gridWidth: 378,
    });
  });

  test('작은 화면에서는 카드와 도형을 함께 줄인다', () => {
    expect(figureChoiceGridMetrics(320, 5)).toEqual({
      columns: 3,
      figureSize: 58,
      gap: 12,
      itemWidth: 88,
      gridWidth: 288,
    });
  });

  test('보기 네 개까지는 기존처럼 2열을 사용한다', () => {
    expect(figureChoiceGridMetrics(360, 4)).toMatchObject({
      columns: 2,
      itemWidth: 158,
    });
  });

  test('넓은 웹 화면에서도 카드가 늘어나지 않고 3개 열을 유지한다', () => {
    expect(figureChoiceGridMetrics(1902, 5)).toEqual({
      columns: 3,
      figureSize: 96,
      gap: 12,
      itemWidth: 200,
      gridWidth: 624,
    });
  });
});
