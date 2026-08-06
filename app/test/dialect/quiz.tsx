import { Stack } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';

export default function DialectQuizScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '사투리 고사', headerBackVisible: true }} />
      <QuizRunner resultRoute="/test/dialect/result" />
    </>
  );
}
