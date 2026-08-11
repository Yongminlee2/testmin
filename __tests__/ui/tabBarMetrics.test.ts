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
  test('작은 Android 화면에서도 아이콘을 또렷하게 보여준다', () => {
    expect(tabBarVisualMetrics(320)).toMatchObject({
      wide: false,
      contentHeight: 60,
      iconSize: 21,
      labelFontSize: 10,
      labelLineHeight: 13,
    });
  });

  test('좁은 웹 화면에서는 한글 라벨의 아래 획이 잘리지 않도록 높이를 확보한다', () => {
    expect(tabBarVisualMetrics(320, true)).toMatchObject({
      wide: false,
      contentHeight: 64,
      labelFontSize: 10,
      labelLineHeight: 16,
      itemMinHeight: 54,
    });
  });

  test('넓은 웹 화면은 아이콘과 라벨을 함께 키운다', () => {
    expect(tabBarVisualMetrics(1884)).toEqual({
      wide: true,
      contentHeight: 72,
      iconSize: 25,
      iconWrapWidth: 42,
      iconWrapHeight: 30,
      labelFontSize: 13,
      labelLineHeight: 18,
      itemMinHeight: 62,
      verticalPadding: 5,
    });
  });
});
