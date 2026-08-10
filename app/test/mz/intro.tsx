import { ScrollView, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { PageTitle } from '@/ui/PageTitle';
import { MZ_DRAW, getPool } from '@/content/registry';
import { useSession } from '@/store/session';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import { categoryColor, colors, font, space } from '@/ui/tokens';

export default function MzIntroScreen() {
  const router = useRouter();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  const begin = () => {
    const seed = hashSeed(`mz:${Date.now()}`);
    const questions = assemble(getPool('mz', 'default'), seed, {
      count: MZ_DRAW.questionCount,
      difficultyMix: MZ_DRAW.difficultyMix,
    });
    start('mz', 'default', seed, questions);
    router.push('/test/mz/quiz');
  };

  return (
    <>
      <PageTitle title="MZ 고사" />
      <Stack.Screen options={{ title: 'MZ 고사' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          줄임말과 신조어,{'\n'}얼마나 알아듣나요?
        </Text>

        <Text style={styles.body} maxFontSizeMultiplier={font.maxScale}>
          15문항이 나옵니다. 시간 제한은 없습니다.
        </Text>

        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          이번 달 유행어가 아니라 몇 해에 걸쳐 자리 잡은 말만 골랐습니다.
          문항마다 어디서 온 말인지 해설에 적어뒀습니다.
        </Text>

        <Button label="응시하기 →" color={categoryColor.mz} onPress={begin} testID="begin" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  heading: {
    fontSize: font.size.title,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: font.size.title * 1.4,
    marginBottom: space.lg,
  },
  body: {
    fontSize: font.size.body,
    fontFamily: font.family.bold,
    color: colors.ink,
    lineHeight: font.size.body * 1.5,
    marginBottom: space.md,
  },
  note: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    lineHeight: font.size.caption * 1.6,
    marginBottom: space.xl,
  },
});
