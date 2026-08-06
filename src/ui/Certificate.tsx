import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly grade: number;
  readonly title: string;
  readonly detail: string;
  readonly note?: string;
}

/** 공유 대상이 되는 급수 합격증. 계획 3에서 이 View를 그대로 이미지로 캡처한다. */
export function Certificate({ label, grade, title, detail, note }: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          {label}
        </Text>
        <Text style={styles.grade} maxFontSizeMultiplier={1}>
          {grade}급
        </Text>
        <Text style={styles.detail} maxFontSizeMultiplier={font.maxScale}>
          {detail}
        </Text>
        <View style={styles.seal}>
          <Text style={styles.sealText} maxFontSizeMultiplier={font.maxScale}>
            🏅 <Text>{title}</Text>
          </Text>
        </View>
        {note ? (
          <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
            {note}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  inner: { alignItems: 'center', paddingVertical: space.md },
  label: {
    fontSize: font.size.caption,
    fontFamily: font.family.black,
    letterSpacing: 3,
    color: colors.muted,
  },
  grade: {
    fontSize: font.size.grade,
    fontFamily: font.family.display,
    color: colors.ink,
    marginVertical: space.xs,
  },
  detail: { fontSize: font.size.caption, fontFamily: font.family.bold, color: colors.muted },
  seal: {
    marginTop: space.md,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  sealText: { fontSize: font.size.body, fontFamily: font.family.black, color: colors.ink },
  note: {
    marginTop: space.md,
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
