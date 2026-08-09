/** 아이콘과 라벨이 차지하는 둥근 탭 바 자체 높이. */
export const TAB_BAR_CONTENT_HEIGHT = 60;

/** 스크롤 콘텐츠와 둥근 탭 바 사이의 시각적 분리 공간. */
export const TAB_BAR_TOP_GAP = 10;

/** 시스템 inset을 신뢰할 수 없는 구형 Android에서도 보장할 하단 여백. */
export const MIN_TAB_BAR_BOTTOM_GAP = 12;

/** inset이 있는 기기에서도 시스템 바와 둥근 탭 바 사이에 보일 여백. */
export const TAB_BAR_SYSTEM_GAP = 8;

export interface TabBarMetrics {
  readonly topGap: number;
  readonly bottomGap: number;
  readonly height: number;
}

export function tabBarMetrics(reportedBottomInset: number): TabBarMetrics {
  const validInset =
    Number.isFinite(reportedBottomInset) && reportedBottomInset > 0
      ? reportedBottomInset
      : 0;

  return {
    topGap: TAB_BAR_TOP_GAP,
    bottomGap:
      validInset > 0
        ? validInset + TAB_BAR_SYSTEM_GAP
        : MIN_TAB_BAR_BOTTOM_GAP,
    height: TAB_BAR_CONTENT_HEIGHT,
  };
}
