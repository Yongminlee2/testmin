import { Stack, useLocalSearchParams } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';
import { getScoredTest } from '@/content/registry';
import { categoryColor } from '@/ui/tokens';

export default function ScoredQuizScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const meta = getScoredTest(testId ?? '');

  return (
    <>
      <Stack.Screen options={{ title: meta?.title ?? '고사', headerBackVisible: true }} />
      <QuizRunner
        resultRoute={`/test/g/${testId ?? ''}/result`}
        accent={meta ? categoryColor[meta.colorKey] : undefined}
      />
    </>
  );
}
