import {
  MIN_TAB_BAR_BOTTOM_GAP,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_SYSTEM_GAP,
  TAB_BAR_TOP_GAP,
  tabBarMetrics,
  tabBarVisualMetrics,
} from '@/ui/tabBarMetrics';

describe('tabBarMetrics', () => {
  test.each([0, -1, Number.NaN])('잘못된 inset %s에도 최소 여백을 보장한다', (inset) => {
    expect(tabBarMetrics(inset)).toEqual({
      topGap: TAB_BAR_TOP_GAP,
      bottomGap: MIN_TAB_BAR_BOTTOM_GAP,
      height: TAB_BAR_CONTENT_HEIGHT,
    });
  });

  test('유효한 시스템 inset 뒤에도 보이는 분리 여백을 더한다', () => {
    expect(tabBarMetrics(34)).toEqual({
      topGap: TAB_BAR_TOP_GAP,
      bottomGap: 34 + TAB_BAR_SYSTEM_GAP,
      height: TAB_BAR_CONTENT_HEIGHT,
    });
  });
});

describe('tabBarVisualMetrics', () => {
  test('작은 Android 화면은 기존 크기를 유지한다', () => {
    expect(tabBarVisualMetrics(320)).toMatchObject({
      wide: false,
      contentHeight: 60,
      iconSize: 18,
      labelFontSize: 10,
      labelLineHeight: 13,
    });
  });

  test('넓은 웹 화면은 아이콘과 라벨을 함께 키운다', () => {
    expect(tabBarVisualMetrics(1884)).toEqual({
      wide: true,
      contentHeight: 72,
      iconSize: 24,
      iconWrapWidth: 42,
      iconWrapHeight: 30,
      labelFontSize: 13,
      labelLineHeight: 18,
      itemMinHeight: 62,
      verticalPadding: 5,
    });
  });
});
