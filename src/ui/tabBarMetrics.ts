/** 아이콘·라벨이 차지하는 탭 바 본체 높이. 시스템 안전영역은 별도로 더한다. */
export const TAB_BAR_CONTENT_HEIGHT = 58;

/**
 * 일부 구형 Android/제조사 ROM은 3버튼 내비게이션 바가 보이는데도 bottom inset을
 * 0으로 보고한다. 이때도 한글 라벨 한 줄이 시스템 바와 떨어지도록 최소 여백을 둔다.
 */
export const MIN_TAB_BAR_BOTTOM_GAP = 12;

export interface TabBarMetrics {
  readonly bottomPadding: number;
  readonly height: number;
}

export function tabBarMetrics(reportedBottomInset: number): TabBarMetrics {
  const validInset =
    Number.isFinite(reportedBottomInset) && reportedBottomInset > 0
      ? reportedBottomInset
      : 0;
  const bottomPadding = Math.max(validInset, MIN_TAB_BAR_BOTTOM_GAP);
  return {
    bottomPadding,
    height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
  };
}
