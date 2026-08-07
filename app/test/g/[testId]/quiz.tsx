import { Stack, useLocalSearchParams } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';
import { SCORED_TESTS, getScoredTest } from '@/content/registry';
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

/**
 * 정적 웹 내보내기(GitHub Pages)에서 이 동적 경로를 실제 페이지로 만들어 준다.
 * 없으면 [testId] 자리가 그대로 남아, 링크를 직접 열거나 새로고침할 때 404가 난다.
 */
export function generateStaticParams(): Array<Record<string, string>> {
  return SCORED_TESTS.map((t) => ({ testId: t.id }));
}
