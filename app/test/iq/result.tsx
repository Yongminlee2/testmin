import { useEffect, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IqScoreCard } from '@/ui/IqScoreCard';
import { IqAnimalCard } from '@/ui/IqAnimalCard';
import { Card } from '@/ui/Card';
import { ResultIllustration } from '@/ui/ResultIllustration';
import { Button } from '@/ui/Button';
import { ShareButton } from '@/ui/ShareButton';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { useHistory } from '@/store/history';
import { scoreIq } from '@/engine/iq/iqScore';
import { assembleIq } from '@/engine/iq/assembleIq';
import { hashSeed } from '@/engine/rng';
import { IQ_DRAW, getGradeBands, gradeTableId } from '@/content/registry';
import { iqComic } from '@/content/resultIllustrations';
import { iqAnimalFriend } from '@/content/resultPresentation';
import { colors, font, space } from '@/ui/tokens';

export default function IqResultScreen() {
  const router = useRouter();
  const { questions, answers, variant, seed } = useSession();
  const start = useSession((s) => s.start);
  const insets = useSafeAreaInsets();

  const bands = variant === null ? [] : getGradeBands(gradeTableId('iq', variant));
  // scoreIq()가 돌려주는 객체에서 점수와 안내 문구를 함께 꺼낸다 — 상수를
  // 따로 import하지 않는다. 점수를 꺼내는 경로와 문구를 꺼내는 경로가
  // 갈라지면 화면이 점수만 보여주고 문구를 빼먹는 실수가 생길 수 있다.
  const result =
    questions.length === 0 || variant === null ? null : scoreIq(questions, answers, bands);

  // 채점 직후 성적표에 딱 한 번만 기록한다. ref 가드가 없으면 재렌더될 때마다
  // 같은 응시가 중복 저장된다.
  const savedRef = useRef(false);
  const cardRef = useRef<View>(null);
  useEffect(() => {
    if (savedRef.current || result === null || variant === null) return;
    savedRef.current = true;
    void useHistory.getState().saveResult({
      testId: 'iq',
      variant,
      seed,
      result: {
        kind: 'scored',
        correct: result.correct,
        total: result.total,
        grade: result.grade,
        title: result.title,
        // estimatedScore를 함께 저장한다 — 성적표가 이 값을 보여줄 때는
        // result.disclaimer(=IQ_DISCLAIMER)와 같은 안내 문구를 반드시 같이
        // 보여줘야 한다. IqResult 타입은 disclaimer를 필수 필드로 둬서 이 규칙을
        // 강제하지만(src/engine/iq/iqScore.ts), 저장된 TestRecord는 estimatedScore만
        // 들고 있고 문구를 함께 들고 다니지 않는다 — 그 강제력이 저장 시점에 사라진다.
        // 그러므로 이 값을 읽어 화면에 그리는 쪽(성적표, 다음 작업)이 직접 챙겨야 한다.
        estimatedScore: result.estimatedScore,
      },
      wrong: result.wrong,
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

  const retry = () => {
    const nextSeed = hashSeed(`iq:${Date.now()}`);
    const generated = assembleIq(nextSeed, IQ_DRAW);
    start('iq', variant, nextSeed, generated.map((g) => g.question));
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
        {/* 점수·합격증·안내 문구를 한 View로 묶는다 — 공유 이미지는 앱 밖으로
            나가는 새로운 표시 자리이고, 점수가 보이는 곳엔 안내 문구도 함께
            보여야 한다는 규칙이 여기도 그대로 적용된다. */}
        <View ref={cardRef} collapsable={false}>
          <IqScoreCard
            score={result.estimatedScore}
            percent={result.percent}
            grade={result.grade}
            title={result.title}
            correct={result.correct}
            total={result.total}
            disclaimer={result.disclaimer}
          />

          <IqAnimalCard friend={iqAnimalFriend(result.estimatedScore)} />

          <Card style={styles.comicCard}>
            <ResultIllustration {...iqComic(result.estimatedScore)} />
          </Card>
        </View>

        <ShareButton targetRef={cardRef} dialogTitle="IQ 고사" />

        {result.wrong.length > 0 ? (
          <Button
            label="✎ 문항별 해설 보기"
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
  comicCard: { marginBottom: space.lg },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontFamily: font.family.bold, color: colors.muted },
});
