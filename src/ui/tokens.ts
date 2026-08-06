export const colors = {
  ink: '#111111',
  cream: '#FFF8E1',
  white: '#FFFFFF',
  yellow: '#FFD43B',
  coral: '#FF8A5B',
  mint: '#4ECDC4',
  lavender: '#B197FC',
  sky: '#74C0FC',
  muted: 'rgba(17,17,17,0.6)',
} as const;

export const borderWidth = {
  card: 2.5,
  strong: 3,
} as const;

export const radius = {
  button: 12,
  card: 14,
  panel: 24,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  /** 시스템 글자 확대는 1.3배까지만 허용한다. 그 이상은 두꺼운 테두리 레이아웃이 깨진다. */
  maxScale: 1.3,
  /**
   * 번들 폰트 이름. app/_layout.tsx의 useFonts에서 이 키로 등록한다.
   * fontWeight 대신 폰트 패밀리로 굵기를 고른다 — 안드로이드는
   * 커스텀 폰트에 fontWeight를 적용하면 가짜 볼드가 생겨 모양이 뭉개진다.
   */
  family: {
    display: 'BlackHanSans_400Regular',
    body: 'NotoSansKR_500Medium',
    bold: 'NotoSansKR_700Bold',
    black: 'NotoSansKR_900Black',
  },
  size: {
    caption: 11,
    body: 14,
    lead: 16,
    title: 19,
    display: 28,
    grade: 46,
  },
} as const;

/**
 * fontWeight → fontFamily 치환 규칙.
 * 이 계획의 모든 StyleSheet에서 아래 표대로 바꿔 쓴다.
 *
 *   fontWeight: '900'  →  fontFamily: font.family.black
 *   fontWeight: '800'  →  fontFamily: font.family.bold
 *   fontWeight: '700'  →  fontFamily: font.family.bold
 *   fontWeight: '600'  →  fontFamily: font.family.body
 *
 * 큰 숫자(급수 표시)와 앱 이름만 font.family.display를 쓴다.
 * 커스텀 폰트에 fontWeight를 함께 주면 안드로이드가 가짜 볼드를 만들어
 * 획이 뭉개지므로 두 속성을 동시에 쓰지 않는다.
 */

/** 카테고리별 대표색 */
export const categoryColor = {
  iq: colors.mint,
  personality: colors.lavender,
  mz: colors.coral,
  dialect: colors.yellow,
  psych: colors.sky,
} as const;
