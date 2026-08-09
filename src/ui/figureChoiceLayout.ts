import { space } from './tokens';

const HORIZONTAL_SCREEN_PADDING = space.lg * 2;
const FIVE_CHOICE_COLUMNS = 3;
const DEFAULT_COLUMNS = 2;
const MAX_FIGURE_SIZE = 80;
const MIN_FIGURE_SIZE = 52;
// Card의 좌우 padding(24)과 양쪽 테두리(약 5)를 모두 포함해야 웹의
// min-content 너비 때문에 세 번째 보기가 다음 줄로 밀리지 않는다.
const FIGURE_CARD_INSET = space.md * 2 + 6;

export interface FigureChoiceGridMetrics {
  readonly columns: number;
  readonly figureSize: number;
  readonly gap: number;
  readonly itemWidth: number;
}

/**
 * 도형 오지선다는 3개 + 2개로 가운데 정렬한다. 작은 Android 화면에서도
 * 도형이 카드 테두리에 닿지 않도록 보기 크기를 함께 줄인다.
 */
export function figureChoiceGridMetrics(
  viewportWidth: number,
  choiceCount: number,
): FigureChoiceGridMetrics {
  const safeWidth = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 360;
  const columns = choiceCount >= 5 ? FIVE_CHOICE_COLUMNS : DEFAULT_COLUMNS;
  const gap = space.md;
  const contentWidth = Math.max(safeWidth - HORIZONTAL_SCREEN_PADDING, 0);
  const itemWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);
  const figureSize = Math.max(
    MIN_FIGURE_SIZE,
    Math.min(MAX_FIGURE_SIZE, itemWidth - FIGURE_CARD_INSET),
  );

  return { columns, figureSize, gap, itemWidth };
}
