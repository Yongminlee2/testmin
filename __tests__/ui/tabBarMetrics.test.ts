import {
  MIN_TAB_BAR_BOTTOM_GAP,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_SYSTEM_GAP,
  TAB_BAR_TOP_GAP,
  tabBarMetrics,
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
