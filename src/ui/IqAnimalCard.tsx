import { Platform, Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { resultCardMaxWidth } from './ResultIllustration';
import { borderWidth, colors, font, radius, space } from './tokens';
import type { IqAnimalFriend } from '@/content/resultPresentation';

interface Props {
  readonly friend: IqAnimalFriend;
}

/** 사람과 동물의 IQ 숫자를 비교하지 않고, 연구된 인지 강점만 빌려오는 재미 카드. */
export function IqAnimalCard({ friend }: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow} maxFontSizeMultiplier={font.maxScale}>
          이번 퍼즐의 동물 친구
        </Text>
        <Text style={styles.name} maxFontSizeMultiplier={font.maxScale}>
          {friend.name}
        </Text>
        <View style={styles.nickname}>
          <Text style={styles.nicknameText} maxFontSizeMultiplier={font.maxScale}>
            {friend.nickname}
          </Text>
        </View>
        <Text style={styles.fact} maxFontSizeMultiplier={font.maxScale}>
          {friend.fact}
        </Text>
        <Text style={styles.connection} maxFontSizeMultiplier={font.maxScale}>
          {friend.connection}
        </Text>
        <Text style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
          동물과 사람의 IQ 숫자를 비교한 것이 아니며, 연구에서 알려진 인지 강점을 빌린 재미 비유예요.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: resultCardMaxWidth(Platform.OS),
    alignSelf: 'center',
    marginBottom: space.md,
    backgroundColor: colors.sky,
  },
  inner: { alignItems: 'center', paddingVertical: space.md },
  eyebrow: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.black,
    letterSpacing: 2,
    color: colors.ink,
  },
  name: {
    marginTop: space.xs,
    fontSize: font.size.title + 8,
    lineHeight: (font.size.title + 8) * 1.3,
    fontFamily: font.family.black,
    color: colors.ink,
  },
  nickname: {
    marginTop: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
  },
  nicknameText: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.4,
    fontFamily: font.family.black,
    color: colors.ink,
    textAlign: 'center',
  },
  fact: {
    marginTop: space.md,
    paddingHorizontal: space.sm,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.65,
    fontFamily: font.family.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  connection: {
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.65,
    fontFamily: font.family.body,
    color: colors.ink,
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: space.md,
    paddingHorizontal: space.sm,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: font.family.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
