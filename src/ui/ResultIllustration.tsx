import { Image, Text, View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
}

/** 결과 카드에 들어가는 래스터 코믹 컷. 공유 이미지에도 그대로 포함된다. */
export function ResultIllustration({ source, accessibilityLabel, caption }: Props) {
  return (
    <View style={styles.wrap} testID="result-illustration">
      <View style={styles.imageFrame}>
        <Image
          source={source}
          accessibilityLabel={accessibilityLabel}
          resizeMode="cover"
          style={styles.image}
        />
      </View>
      <View style={styles.captionBubble}>
        <Text style={styles.caption} maxFontSizeMultiplier={font.maxScale}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginTop: space.md },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.card,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  captionBubble: {
    alignSelf: 'center',
    maxWidth: '92%',
    marginTop: -space.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
  },
  caption: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
    textAlign: 'center',
  },
});
