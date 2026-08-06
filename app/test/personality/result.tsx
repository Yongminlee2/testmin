import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypeCard } from '@/ui/TypeCard';
import { Button } from '@/ui/Button';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { scoreByAxis } from '@/engine/typeScore';
import { assembleByAxis } from '@/engine/assembleTyped';
import { hashSeed } from '@/engine/rng';
import { getPool, getTypeName, PERSONALITY_DRAW } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function PersonalityResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers } = useSession();
  const start = useSession((s) => s.start);

  if (questions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const result = scoreByAxis(questions, answers);
  const entry = getTypeName(result.code);

  const retry = () => {
    const pool = getPool('personality', 'default');
    const seed = hashSeed(`personality:${Date.now()}`);
    const next = assembleByAxis(pool, seed, {
      perAxis: PERSONALITY_DRAW.perAxis,
      excludeIds: questions.map((q) => q.id),
    });
    start('personality', 'default', seed, next);
    router.replace('/test/personality/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <TypeCard
          label="성격 16유형 고사"
          headline={result.code}
          nickname={entry?.nickname ?? result.code}
          description={entry?.description ?? ''}
          axes={result.axes}
        />

        <Button
          label="✎ 문항별 해설 보기"
          onPress={() => router.push('/test/personality/review')}
          testID="go-review"
        />
        <Button label="↻ 다시 응시" color={colors.coral} onPress={retry} testID="retry" />
        <Button label="홈으로" onPress={() => router.dismissAll()} testID="go-home" />

        <AdSlot />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
    fontFamily: font.family.bold,
    color: colors.muted,
  },
});
