import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypeCard } from '@/ui/TypeCard';
import { Button } from '@/ui/Button';
import { ShareButton } from '@/ui/ShareButton';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { useHistory } from '@/store/history';
import { scoreByAxis } from '@/engine/typeScore';
import { assembleByAxis } from '@/engine/assembleTyped';
import { hashSeed } from '@/engine/rng';
import { getPool, getTypeName, PERSONALITY_DRAW } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function PersonalityResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { questions, answers, variant, seed } = useSession();
  const start = useSession((s) => s.start);

  const result =
    questions.length === 0 || variant === null ? null : scoreByAxis(questions, answers);

  // 채점 직후 성적표에 딱 한 번만 기록한다. ref 가드가 없으면 재렌더될 때마다
  // 같은 응시가 중복 저장된다. 축 합계형(성격 16유형)은 정답·오답 개념이 없으므로
  // 오답노트에는 아무것도 넘기지 않는다.
  const savedRef = useRef(false);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    if (savedRef.current || result === null || variant === null) return;
    savedRef.current = true;
    const entry = getTypeName(result.code);
    void useHistory.getState().saveResult({
      testId: 'personality',
      variant,
      seed,
      result: { kind: 'axis', code: result.code, nickname: entry?.nickname ?? result.code },
    });
  }, [result, variant, seed]);

  if (result === null || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const entry = getTypeName(result.code);

  const retry = () => {
    const pool = getPool('personality', 'default');
    const nextSeed = hashSeed(`personality:${Date.now()}`);
    const next = assembleByAxis(pool, nextSeed, {
      perAxis: PERSONALITY_DRAW.perAxis,
      excludeIds: questions.map((q) => q.id),
    });
    start('personality', 'default', nextSeed, next);
    router.replace('/test/personality/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <View ref={cardRef} collapsable={false}>
          <TypeCard
            label="성격 16유형 고사"
            headline={result.code}
            nickname={entry?.nickname ?? result.code}
            description={entry?.description ?? ''}
            axes={result.axes}
          />
        </View>

        <ShareButton targetRef={cardRef} dialogTitle="성격 16유형 고사" />

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
