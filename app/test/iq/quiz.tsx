import { Stack } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';
import { colors } from '@/ui/tokens';

export default function IqQuizScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'IQ 고사', headerBackVisible: true }} />
      <QuizRunner resultRoute="/test/iq/result" accent={colors.mint} />
    </>
  );
}
