import { Stack } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';

export default function MzQuizScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'MZ 고사', headerBackVisible: true }} />
      <QuizRunner resultRoute="/test/mz/result" />
    </>
  );
}
