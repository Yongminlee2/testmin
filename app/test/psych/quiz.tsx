import { Stack } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';
import { colors } from '@/ui/tokens';

export default function PsychQuizScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '심리 테스트', headerBackVisible: true }} />
      <QuizRunner resultRoute="/test/psych/result" accent={colors.sky} />
    </>
  );
}
