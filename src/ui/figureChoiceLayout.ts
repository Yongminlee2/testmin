import { space } from './tokens';

const HORIZONTAL_SCREEN_PADDING = space.lg * 2;
const FIVE_CHOICE_COLUMNS = 3;
const DEFAULT_COLUMNS = 2;
const MAX_FIGURE_SIZE = 80;
const COMPACT_MAX_FIGURE_SIZE = 60;
const MAX_WIDE_FIGURE_SIZE = 96;
const MIN_FIGURE_SIZE = 52;
const MAX_THREE_COLUMN_ITEM_WIDTH = 200;
const MAX_TWO_COLUMN_ITEM_WIDTH = 260;
const WIDE_VIEWPORT = 768;
const COMPACT_VIEWPORT_HEIGHT = 720;
const COMPACT_QUESTION_FIGURE_SIZE = 180;
const DEFAULT_QUESTION_FIGURE_SIZE = 220;
const WIDE_QUESTION_FIGURE_SIZE = 240;
// Card의 좌우 padding(24)과 양쪽 테두리(약 5)를 모두 포함해야 웹의
// min-content 너비 때문에 세 번째 보기가 다음 줄로 밀리지 않는다.
const FIGURE_CARD_INSET = space.md * 2 + 6;

export interface FigureChoiceGridMetrics {
  readonly columns: number;
  readonly figureSize: number;
  readonly gap: number;
  readonly itemWidth: number;
  readonly gridWidth: number;
}

/** Keeps the puzzle and all five choices above compact Android navigation areas. */
export function questionFigureSizeForViewport(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const safeWidth = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 360;
  const safeHeight = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 800;

  if (safeWidth >= WIDE_VIEWPORT) return WIDE_QUESTION_FIGURE_SIZE;
  if (safeHeight < COMPACT_VIEWPORT_HEIGHT) return COMPACT_QUESTION_FIGURE_SIZE;
  return DEFAULT_QUESTION_FIGURE_SIZE;
}

/**
 * 도형 오지선다는 3개 + 2개로 가운데 정렬한다. 작은 Android 화면에서도
 * 도형이 카드 테두리에 닿지 않도록 보기 크기를 함께 줄인다.
 */
export function figureChoiceGridMetrics(
  viewportWidth: number,
  choiceCount: number,
  viewportHeight = 800,
): FigureChoiceGridMetrics {
  const safeWidth = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 360;
  const safeHeight = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 800;
  const columns = choiceCount >= 5 ? FIVE_CHOICE_COLUMNS : DEFAULT_COLUMNS;
  const gap = space.md;
  const contentWidth = Math.max(safeWidth - HORIZONTAL_SCREEN_PADDING, 0);
  const itemWidthLimit =
    columns === FIVE_CHOICE_COLUMNS
      ? MAX_THREE_COLUMN_ITEM_WIDTH
      : MAX_TWO_COLUMN_ITEM_WIDTH;
  const itemWidth = Math.min(
    itemWidthLimit,
    Math.floor((contentWidth - gap * (columns - 1)) / columns),
  );
  const figureSizeLimit =
    safeWidth >= WIDE_VIEWPORT
      ? MAX_WIDE_FIGURE_SIZE
      : safeHeight < COMPACT_VIEWPORT_HEIGHT
        ? COMPACT_MAX_FIGURE_SIZE
        : MAX_FIGURE_SIZE;
  const figureSize = Math.max(
    MIN_FIGURE_SIZE,
    Math.min(figureSizeLimit, itemWidth - FIGURE_CARD_INSET),
  );
  const gridWidth = itemWidth * columns + gap * (columns - 1);

  return { columns, figureSize, gap, itemWidth, gridWidth };
}
