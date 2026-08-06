import { Text, View, StyleSheet } from 'react-native';
import { colors, font, radius, space } from './tokens';
import { AXIS_LETTERS, type AxisScore } from '@/engine/types';

interface Props {
  readonly score: AxisScore;
}

/** 축 하나의 치우침 막대. wasTie면 "거의 반반"을 함께 알린다. */
export function AxisBar({ score }: Props) {
  const letters = AXIS_LETTERS[score.axis];
  const fillsRight = score.letter === letters.positive;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text
          style={[styles.side, !fillsRight && styles.sideActive]}
          maxFontSizeMultiplier={font.maxScale}
        >
          {letters.negative}
        </Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${score.percent}%` },
              fillsRight ? styles.fillRight : styles.fillLeft,
            ]}
          />
        </View>
        <Text
          style={[styles.side, fillsRight && styles.sideActive]}
          maxFontSizeMultiplier={font.maxScale}
        >
          {letters.positive}
        </Text>
      </View>
      {score.wasTie ? (
        <Text style={styles.tie} maxFontSizeMultiplier={font.maxScale}>
          이 축은 거의 반반입니다
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  side: {
    width: 22,
    textAlign: 'center',
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.4,
    fontFamily: font.family.bold,
    color: colors.muted,
  },
  sideActive: { color: colors.ink, fontFamily: font.family.black },
  track: {
    flex: 1,
    height: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { height: '100%', backgroundColor: colors.lavender },
  fillLeft: { alignSelf: 'flex-start' },
  fillRight: { alignSelf: 'flex-end' },
  tie: {
    marginTop: space.xs,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    fontFamily: font.family.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
