import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { DIALECT_REGIONS, getPool } from '@/content/registry';
import { useSession } from '@/store/session';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import { colors, font, space } from '@/ui/tokens';
import { useState } from 'react';

const QUESTION_COUNT = 12;
const DIFFICULTY_MIX = { 1: 4, 2: 5, 3: 3 } as const;

export default function DialectIntroScreen() {
  const router = useRouter();
  const start = useSession((s) => s.start);
  const [selected, setSelected] = useState('gyeongsang');

  const begin = () => {
    const pool = getPool('dialect', selected);
    if (pool.length === 0) {
      Alert.alert('준비 중입니다', '이 지역 문항은 다음 업데이트에 열립니다.');
      return;
    }
    const seed = hashSeed(`dialect:${selected}:${Date.now()}`);
    const questions = assemble(pool, seed, {
      count: QUESTION_COUNT,
      difficultyMix: DIFFICULTY_MIX,
    });
    start('dialect', selected, seed, questions);
    router.push('/test/dialect/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '사투리 고사' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          어느 지역으로{'\n'}응시하시겠습니까?
        </Text>

        <View style={styles.grid}>
          {DIALECT_REGIONS.map((r) => (
            <Pressable
              key={r.id}
              testID={`region-${r.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === r.id }}
              style={styles.cell}
              onPress={() => {
                if (!r.available) {
                  Alert.alert('준비 중입니다', `${r.title} 문항은 다음 업데이트에 열립니다.`);
                  return;
                }
                setSelected(r.id);
              }}
            >
              <Card
                color={selected === r.id ? colors.yellow : colors.white}
                offset={r.available ? 3 : 0}
              >
                <Text
                  style={[styles.cellText, !r.available && styles.dim]}
                  maxFontSizeMultiplier={font.maxScale}
                >
                  {r.title}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          지역별로 급수가 따로 매겨집니다. 경상도 1급인데 제주도 9급인 게 이 시험의 재미입니다.
        </Text>

        <Button
          label="응시하기 →"
          color={colors.yellow}
          onPress={begin}
          testID="begin"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  heading: {
    fontSize: font.size.title,
    fontFamily: font.family.black,
    color: colors.ink,
    lineHeight: 28,
    marginBottom: space.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47%' },
  cellText: {
    textAlign: 'center',
    fontSize: font.size.body,
    fontFamily: font.family.black,
    color: colors.ink,
    paddingVertical: space.sm,
  },
  dim: { color: colors.muted },
  note: {
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    lineHeight: 18,
    marginVertical: space.lg,
  },
});
