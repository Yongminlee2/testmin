import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { PSYCH_TESTS, getPsychTest } from '@/content/registry';
import { useSession } from '@/store/session';
import { hashSeed } from '@/engine/rng';
import { colors, font, space } from '@/ui/tokens';

export default function PsychIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const start = useSession((s) => s.start);
  const [selected, setSelected] = useState('love');

  const begin = () => {
    const test = getPsychTest(selected);
    if (test === undefined) {
      Alert.alert('준비 중입니다', '이 테스트는 다음 업데이트에 열립니다.');
      return;
    }
    // 섞지 않고 순서 그대로 — 득표 균형과 동점 규칙이 문항 순서에 의존한다
    const seed = hashSeed(`psych:${selected}:${Date.now()}`);
    start('psych', selected, seed, test.questions);
    router.push('/test/psych/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '심리 테스트' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}
      >
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          어떤 테스트를{'\n'}해보시겠습니까?
        </Text>

        {PSYCH_TESTS.map((t) => (
          <Pressable
            key={t.id}
            testID={`psych-${t.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === t.id }}
            onPress={() => {
              if (!t.available) {
                Alert.alert('준비 중입니다', `${t.title}은(는) 다음 업데이트에 열립니다.`);
                return;
              }
              setSelected(t.id);
            }}
          >
            <Card
              color={selected === t.id ? colors.sky : colors.white}
              offset={t.available ? 3 : 0}
              style={styles.card}
            >
              <Text
                style={[styles.cardText, !t.available && styles.dim]}
                maxFontSizeMultiplier={font.maxScale}
              >
                {t.title}
                {t.available ? '' : ' · 준비 중'}
              </Text>
            </Card>
          </Pressable>
        ))}

        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          정답이 없는 테스트입니다. 12문항을 풀면 다섯 유형 중 하나가 나옵니다.
        </Text>

        <Button label="시작하기 →" color={colors.sky} onPress={begin} testID="begin" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg },
  heading: {
    fontSize: font.size.title,
    lineHeight: font.size.title * 1.5,
    fontFamily: font.family.black,
    color: colors.ink,
    marginBottom: space.lg,
  },
  card: { marginBottom: space.md },
  cardText: {
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.5,
    fontFamily: font.family.black,
    color: colors.ink,
    paddingVertical: space.xs,
    textAlign: 'center',
  },
  dim: { color: colors.muted },
  note: {
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.6,
    fontFamily: font.family.body,
    color: colors.muted,
    marginVertical: space.lg,
  },
});
