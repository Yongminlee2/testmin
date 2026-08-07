import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { IQ_SCORE_MAX, IQ_SCORE_MIN } from '@/engine/iq/iqScore';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly score: number;
  readonly percent: number;
}

/**
 * IQ 점수를 크게 보여주는 카드. 숫자만 크게 띄우면 실제 검사 점수처럼 읽히므로
 * 어떻게 나온 값인지(정답률 → 70~145 구간)를 같은 카드 안에서 밝힌다.
 * 안내 문구(IQ_DISCLAIMER)는 결과 화면이 별도로 함께 표시한다.
 */
export function IqScoreCard({ score, percent }: Props) {
  const span = IQ_SCORE_MAX - IQ_SCORE_MIN;
  const clamped = Math.max(IQ_SCORE_MIN, Math.min(IQ_SCORE_MAX, score));
  const ratio = span === 0 ? 0 : (clamped - IQ_SCORE_MIN) / span;

  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          추정 아이큐
        </Text>

        <View style={styles.scoreRow}>
          <Text style={styles.iq} maxFontSizeMultiplier={1}>
            IQ
          </Text>
          <Text testID="iq-score-number" style={styles.score} maxFontSizeMultiplier={1}>
            {score}
          </Text>
        </View>

        {/* 눈금 위 위치로 "이 앱이 쓰는 구간의 어디쯤"인지를 보여준다.
            바깥 세상 기준의 백분위가 아니다 — 규준 표본이 없으므로 쓰지 않는다. */}
        <View style={styles.scale} testID="iq-scale">
          <View style={styles.track} />
          <View style={[styles.marker, { left: `${ratio * 100}%` }]} />
        </View>
        <View style={styles.ticks}>
          <Text style={styles.tick} maxFontSizeMultiplier={font.maxScale}>
            {IQ_SCORE_MIN}
          </Text>
          <Text style={styles.tick} maxFontSizeMultiplier={font.maxScale}>
            {IQ_SCORE_MAX}
          </Text>
        </View>

        <Text testID="iq-score-basis" style={styles.basis} maxFontSizeMultiplier={font.maxScale}>
          정답률 {Math.round(percent)}%를 {IQ_SCORE_MIN}~{IQ_SCORE_MAX} 구간에 그대로 대응시킨
          값입니다.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md, backgroundColor: colors.mint },
  inner: { alignItems: 'center', paddingVertical: space.md },
  label: {
    fontSize: font.size.caption,
    fontFamily: font.family.black,
    letterSpacing: 3,
    color: colors.ink,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  iq: {
    fontSize: font.size.title,
    fontFamily: font.family.display,
    color: colors.ink,
  },
  score: {
    fontSize: font.size.grade + 14,
    fontFamily: font.family.display,
    lineHeight: 74,
    color: colors.ink,
  },
  scale: {
    width: '78%',
    height: 14,
    marginTop: space.xs,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
  },
  marker: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: radius.pill,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    backgroundColor: colors.yellow,
  },
  ticks: {
    width: '78%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  tick: { fontSize: font.size.caption, fontFamily: font.family.bold, color: colors.ink },
  basis: {
    marginTop: space.md,
    paddingHorizontal: space.lg,
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 17,
  },
});
