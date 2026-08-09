import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { AxisBar } from './AxisBar';
import { ResultIllustration } from './ResultIllustration';
import { borderWidth, colors, font, radius, space } from './tokens';
import type { AxisScore } from '@/engine/types';
import type { ResultComic } from '@/content/resultIllustrations';

interface Props {
  /** 상단 라벨. 예: "성격 16유형 고사" */
  readonly label: string;
  /** 큰 글씨. 성격은 "ENFP", 심리는 유형 이모지 */
  readonly headline: string;
  /** 자체 별명 */
  readonly nickname: string;
  readonly description: string;
  /** 성격 전용. 없으면 막대를 그리지 않는다 */
  readonly axes?: readonly AxisScore[];
  readonly note?: string;
  readonly illustration?: ResultComic;
}

/** 유형형 결과 카드. 계획 4에서 이 View를 그대로 이미지로 캡처한다. */
export function TypeCard({ label, headline, nickname, description, axes, note, illustration }: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          {label}
        </Text>
        <Text style={styles.headline} maxFontSizeMultiplier={1}>
          {headline}
        </Text>
        <View style={styles.seal}>
          <Text style={styles.sealText} maxFontSizeMultiplier={font.maxScale}>
            {nickname}
          </Text>
        </View>
        <Text style={styles.description} maxFontSizeMultiplier={font.maxScale}>
          {description}
        </Text>

        {axes && axes.length > 0 ? (
          <View style={styles.axes}>
            {axes.map((a) => (
              <AxisBar key={a.axis} score={a} />
            ))}
          </View>
        ) : null}

        {note ? (
          <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
            {note}
          </Text>
        ) : null}

        {illustration ? <ResultIllustration {...illustration} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  inner: { alignItems: 'stretch', paddingVertical: space.md },
  label: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.black,
    letterSpacing: 3,
    color: colors.muted,
    textAlign: 'center',
  },
  headline: {
    fontSize: font.size.grade,
    lineHeight: font.size.grade * 1.35,
    fontFamily: font.family.display,
    color: colors.ink,
    textAlign: 'center',
    marginVertical: space.xs,
  },
  seal: {
    alignSelf: 'center',
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.sm,
  },
  sealText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.4,
    fontFamily: font.family.black,
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    marginTop: space.md,
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.6,
    fontFamily: font.family.body,
    color: colors.ink,
    textAlign: 'center',
  },
  axes: { marginTop: space.lg },
  note: {
    marginTop: space.md,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
