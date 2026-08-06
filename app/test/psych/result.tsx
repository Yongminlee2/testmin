import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypeCard } from '@/ui/TypeCard';
import { Button } from '@/ui/Button';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { scoreByVote } from '@/engine/typeScore';
import { hashSeed } from '@/engine/rng';
import { getPsychTest } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function PsychResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers, variant } = useSession();
  const start = useSession((s) => s.start);

  const test = variant ? getPsychTest(variant) : undefined;

  if (questions.length === 0 || test === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const result = scoreByVote(questions, answers, test.types.map((t) => t.id));
  const won = test.types.find((t) => t.id === result.typeId);
  const votes = result.tally[result.typeId] ?? 0;

  const retry = () => {
    const seed = hashSeed(`psych:${test.id}:${Date.now()}`);
    start('psych', test.id, seed, test.questions);
    router.replace('/test/psych/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '결과', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <TypeCard
          label={test.title}
          headline={won?.emoji ?? '🔮'}
          nickname={won?.name ?? result.typeId}
          description={won?.description ?? ''}
          note={
            result.wasTie
              ? `12문항 중 ${votes}표 — 다른 유형과 거의 비슷했습니다`
              : `12문항 중 ${votes}표`
          }
        />

        <Button
          label="✎ 문항별 해설 보기"
          onPress={() => router.push('/test/psych/review')}
          testID="go-review"
        />
        <Button label="↻ 다시 하기" color={colors.coral} onPress={retry} testID="retry" />
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
