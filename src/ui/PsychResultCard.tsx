import { Platform, Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { ResultIllustration, resultCardMaxWidth } from './ResultIllustration';
import { borderWidth, colors, font, radius, space } from './tokens';
import type { ResultComic } from '@/content/resultIllustrations';

interface Props {
  readonly testTitle: string;
  readonly typeName: string;
  readonly description: string;
  readonly evidence: string;
  readonly illustration: ResultComic;
}

/** 정답형·MBTI형과 다른, 심리 반응 패턴 전용 결과 카드. */
export function PsychResultCard({
  testTitle,
  typeName,
  description,
  evidence,
  illustration,
}: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          {testTitle}
        </Text>
        <Text style={styles.eyebrow} maxFontSizeMultiplier={font.maxScale}>
          가장 자주 고른 반응 패턴
        </Text>
        <Text style={styles.headline} maxFontSizeMultiplier={font.maxScale}>
          {typeName}
        </Text>
        <Text style={styles.description} maxFontSizeMultiplier={font.maxScale}>
          {description}
        </Text>
        <View style={styles.evidence}>
          <Text style={styles.evidenceText} maxFontSizeMultiplier={font.maxScale}>
            {evidence}
          </Text>
        </View>
        <ResultIllustration {...illustration} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: resultCardMaxWidth(Platform.OS),
    alignSelf: 'center',
    marginBottom: space.lg,
  },
  inner: { alignItems: 'stretch', paddingVertical: space.md },
  label: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.black,
    letterSpacing: 3,
    color: colors.muted,
    textAlign: 'center',
  },
  eyebrow: {
    marginTop: space.md,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: font.family.bold,
    color: colors.muted,
    textAlign: 'center',
  },
  headline: {
    marginTop: space.xs,
    fontSize: font.size.title + 8,
    lineHeight: (font.size.title + 8) * 1.3,
    fontFamily: font.family.black,
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.6,
    fontFamily: font.family.body,
    color: colors.ink,
    textAlign: 'center',
  },
  evidence: {
    alignSelf: 'center',
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
  },
  evidenceText: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.4,
    fontFamily: font.family.black,
    color: colors.ink,
    textAlign: 'center',
  },
});
