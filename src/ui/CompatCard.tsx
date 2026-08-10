import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { borderWidth, colors, font, radius, space } from './tokens';

export interface CompatEntry {
  /** 화면에 크게 보일 이름. 성격은 "ENFP", 심리는 유형 이름 */
  readonly label: string;
  /** 별명이나 한 줄 설명. 없으면 생략 */
  readonly sub?: string;
  /** 왜 그런지 — 이 앱은 결과만이 아니라 근거를 같이 준다 */
  readonly why: string;
}

interface Props {
  readonly goodWith: readonly CompatEntry[];
  readonly hardWith?: CompatEntry;
  /** 궁합을 무엇으로 판정했는지. 규칙을 밝히지 않으면 근거 없는 단정이 된다 */
  readonly rule: string;
  readonly goodHeading?: string;
  readonly hardHeading?: string;
  readonly disclaimer?: string;
}

/**
 * 잘 맞는 유형 / 부딪히는 유형.
 *
 * 이 앱은 문항마다 "왜 그게 답인가"를 주는 게 원칙인데, 궁합에는 정답이 없다.
 * 그래서 (1) 무슨 규칙으로 뽑았는지 rule로 밝히고, (2) 짝마다 이유를 붙이고,
 * (3) 재미로 보는 것이라는 안내를 항상 함께 띄운다. IQ 추정 점수에 안내 문구를
 * 강제한 것과 같은 이유다 — 근거가 약한 값을 단정처럼 보여주면 안 된다.
 */
export function CompatCard({
  goodWith,
  hardWith,
  rule,
  goodHeading = '이 조합은 티키타카가 빨라요',
  hardHeading = '이 조합은 통역 한 번 더',
  disclaimer = '네 글자는 판결문이 아니라 대화 시작 버튼이에요. 실제 관계는 서로의 말과 행동이 만듭니다.',
}: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          {goodHeading}
        </Text>

        {goodWith.map((e) => (
          <View key={`good-${e.label}`} style={[styles.row, styles.good]}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={font.maxScale}>
              {e.label}
            </Text>
            {e.sub ? (
              <Text style={styles.rowSub} maxFontSizeMultiplier={font.maxScale}>
                {e.sub}
              </Text>
            ) : null}
            <Text style={styles.rowWhy} maxFontSizeMultiplier={font.maxScale}>
              {e.why}
            </Text>
          </View>
        ))}

        {hardWith ? (
          <>
            <Text style={[styles.heading, styles.headingGap]} maxFontSizeMultiplier={font.maxScale}>
              {hardHeading}
            </Text>
            <View style={[styles.row, styles.hard]}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={font.maxScale}>
                {hardWith.label}
              </Text>
              {hardWith.sub ? (
                <Text style={styles.rowSub} maxFontSizeMultiplier={font.maxScale}>
                  {hardWith.sub}
                </Text>
              ) : null}
              <Text style={styles.rowWhy} maxFontSizeMultiplier={font.maxScale}>
                {hardWith.why}
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.ruleBox}>
          <Text style={styles.ruleLabel} maxFontSizeMultiplier={font.maxScale}>
            왜 이런 조합인가요?
          </Text>
          <Text testID="compat-rule" style={styles.rule} maxFontSizeMultiplier={font.maxScale}>
            {rule}
          </Text>
        </View>
        <Text testID="compat-disclaimer" style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
          {disclaimer}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  inner: { paddingVertical: space.md },
  heading: {
    fontSize: font.size.lead,
    lineHeight: font.size.lead * 1.4,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.sm,
  },
  headingGap: { marginTop: space.lg },
  row: {
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.button,
    padding: space.md,
    marginBottom: space.sm,
  },
  good: { backgroundColor: colors.mint },
  hard: { backgroundColor: colors.coral },
  rowLabel: {
    fontSize: font.size.title,
    lineHeight: font.size.title * 1.35,
    fontFamily: font.family.black,
    color: colors.ink,
  },
  rowSub: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.bold,
    color: colors.ink,
    marginTop: 2,
  },
  rowWhy: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.6,
    fontFamily: font.family.body,
    color: colors.ink,
    marginTop: space.sm,
  },
  ruleBox: {
    marginTop: space.md,
    padding: space.sm,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.button,
    backgroundColor: colors.cream,
  },
  ruleLabel: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.4,
    fontFamily: font.family.black,
    color: colors.ink,
  },
  rule: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.body,
    color: colors.ink,
    marginTop: space.xs,
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: font.family.body,
    color: colors.muted,
    marginTop: space.sm,
  },
});
