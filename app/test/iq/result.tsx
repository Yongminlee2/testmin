import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Certificate } from '@/ui/Certificate';
import { Button } from '@/ui/Button';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { scoreIq } from '@/engine/iq/iqScore';
import { assembleIq } from '@/engine/iq/assembleIq';
import { hashSeed } from '@/engine/rng';
import { IQ_DRAW, getGradeBands, gradeTableId } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function IqResultScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const bands = getGradeBands(gradeTableId('iq', variant));
  // scoreIq()가 돌려주는 객체에서 점수와 안내 문구를 함께 꺼낸다 — 상수를
  // 따로 import하지 않는다. 점수를 꺼내는 경로와 문구를 꺼내는 경로가
  // 갈라지면 화면이 점수만 보여주고 문구를 빼먹는 실수가 생길 수 있다.
  const result = scoreIq(questions, answers, bands);

  const retry = () => {
    const seed = hashSeed(`iq:${Date.now()}`);
    const generated = assembleIq(seed, IQ_DRAW);
    start('iq', variant, seed, generated.map((g) => g.question));
    router.replace('/test/iq/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: space.xxl + insets.bottom },
        ]}
      >
        <Text testID="iq-score" style={styles.score} maxFontSizeMultiplier={font.maxScale}>
          추정 점수 {result.estimatedScore}
        </Text>

        <Certificate
          label="IQ 고사"
          grade={result.grade}
          title={result.title}
          detail={`${result.total}문항 중 ${result.correct}문항 정답`}
          note={
            result.wrong.length === 0
              ? '틀린 문항이 없습니다.'
              : `틀린 ${result.wrong.length}문항의 해설을 확인해보세요.`
          }
        />

        <Text
          testID="iq-disclaimer"
          style={styles.disclaimer}
          maxFontSizeMultiplier={font.maxScale}
        >
          {result.disclaimer}
        </Text>

        {result.wrong.length > 0 ? (
          <Button
            label={`✎ 틀린 ${result.wrong.length}문항 해설 보기`}
            onPress={() => router.push('/test/iq/review')}
            testID="go-review"
          />
        ) : null}

        <Button
          label="↻ 다시 응시"
          color={colors.coral}
          onPress={retry}
          testID="retry"
        />
        <Button
          label="홈으로"
          onPress={() => router.dismissAll()}
          testID="go-home"
        />

        <AdSlot />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  score: {
    textAlign: 'center',
    fontSize: font.size.lead,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.sm,
  },
  disclaimer: {
    fontSize: font.size.caption,
    fontFamily: font.family.body,
    color: colors.muted,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: space.lg,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontFamily: font.family.bold, color: colors.muted },
});
