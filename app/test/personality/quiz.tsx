import { Stack } from 'expo-router';
import { QuizRunner } from '@/ui/QuizRunner';
import { colors } from '@/ui/tokens';

export default function PersonalityQuizScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'MBTI식 16유형 고사', headerBackVisible: true }} />
      <QuizRunner resultRoute="/test/personality/result" accent={colors.lavender} />
    </>
  );
}
