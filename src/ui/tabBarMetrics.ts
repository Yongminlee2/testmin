/** 아이콘과 라벨이 차지하는 둥근 탭 바 자체 높이. */
export const TAB_BAR_CONTENT_HEIGHT = 60;

/** 태블릿·웹에서 하단 메뉴를 한 단계 키우는 기준 폭. */
export const WIDE_TAB_BAR_BREAKPOINT = 768;

/** 넓은 화면에서 메뉴가 좌우 끝까지 흩어지지 않도록 제한하는 폭. */
export const WIDE_TAB_BAR_MAX_WIDTH = 760;

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

export interface TabBarVisualMetrics {
  readonly wide: boolean;
  readonly contentHeight: number;
  readonly iconSize: number;
  readonly iconWrapWidth: number;
  readonly iconWrapHeight: number;
  readonly labelFontSize: number;
  readonly labelLineHeight: number;
  readonly itemMinHeight: number;
  readonly verticalPadding: number;
}

/** 모바일 밀도는 유지하고, 태블릿·웹에서만 아이콘과 글자를 함께 키운다. */
export function tabBarVisualMetrics(
  viewportWidth: number,
  web = false,
): TabBarVisualMetrics {
  const safeWidth =
    Number.isFinite(viewportWidth) && viewportWidth > 0
      ? viewportWidth
      : 360;
  const wide = safeWidth >= WIDE_TAB_BAR_BREAKPOINT;

  if (!wide && web) {
    return {
      wide: false,
      contentHeight: 64,
      iconSize: 21,
      iconWrapWidth: 36,
      iconWrapHeight: 26,
      labelFontSize: 10,
      labelLineHeight: 16,
      itemMinHeight: 54,
      verticalPadding: 4,
    };
  }

  return wide
    ? {
        wide: true,
        contentHeight: 72,
        iconSize: 25,
        iconWrapWidth: 42,
        iconWrapHeight: 30,
        labelFontSize: 13,
        labelLineHeight: 18,
        itemMinHeight: 62,
        verticalPadding: 5,
      }
    : {
        wide: false,
        contentHeight: TAB_BAR_CONTENT_HEIGHT,
        iconSize: 21,
        iconWrapWidth: 36,
        iconWrapHeight: 26,
        labelFontSize: 10,
        labelLineHeight: 13,
        itemMinHeight: 50,
        verticalPadding: 4,
      };
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
