import { ScrollView, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { IQ_DRAW } from '@/content/registry';
import { useSession } from '@/store/session';
import { assembleIq } from '@/engine/iq/assembleIq';
import { IQ_DISCLAIMER } from '@/engine/iq/iqScore';
import { hashSeed } from '@/engine/rng';
import { colors, font, space } from '@/ui/tokens';

export default function IqIntroScreen() {
  const router = useRouter();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  const begin = () => {
    const seed = hashSeed(`iq:${Date.now()}`);
    const generated = assembleIq(seed, IQ_DRAW);
    start('iq', 'default', seed, generated.map((g) => g.question));
    router.push('/test/iq/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'IQ 고사' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: space.xxl + insets.bottom },
        ]}
      >
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          도형과 수열을 보고{'\n'}빈 칸을 채우는 시험입니다
        </Text>

        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          회전·개수·채움·분배·크기·수열, 여섯 가지 유형에서 {IQ_DRAW.questionCount}문항이
          나옵니다. 시간 제한은 없습니다.
        </Text>

        <Text style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
          {IQ_DISCLAIMER}
        </Text>

        <Button
          label="응시하기 →"
          color={colors.mint}
          onPress={begin}
          testID="begin"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  heading: {
    fontSize: font.size.title,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: 28,
    marginBottom: space.lg,
  },
  note: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    lineHeight: 21,
    marginBottom: space.md,
  },
  disclaimer: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    lineHeight: 17,
    marginBottom: space.xl,
  },
});
