import {
  MIN_TAB_BAR_BOTTOM_GAP,
  TAB_BAR_CONTENT_HEIGHT,
  tabBarMetrics,
} from '@/ui/tabBarMetrics';

describe('tabBarMetrics', () => {
  test.each([0, -1, Number.NaN])('구형 기기가 잘못된 inset %s를 줘도 최소 여백을 둔다', (inset) => {
    expect(tabBarMetrics(inset)).toEqual({
      bottomPadding: MIN_TAB_BAR_BOTTOM_GAP,
      height: TAB_BAR_CONTENT_HEIGHT + MIN_TAB_BAR_BOTTOM_GAP,
    });
  });

  test('제스처 내비게이션의 실제 inset이 더 크면 그 값을 보존한다', () => {
    expect(tabBarMetrics(34)).toEqual({
      bottomPadding: 34,
      height: TAB_BAR_CONTENT_HEIGHT + 34,
    });
  });
});
