import { Image, Text, View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';
import type { ResultStory } from '@/content/resultStories';

interface Props {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
  readonly story: ResultStory;
}

/** 결과 카드에 들어가는 래스터 코믹 컷. 공유 이미지에도 그대로 포함된다. */
export function ResultIllustration({ source, accessibilityLabel, caption, story }: Props) {
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

      <View style={styles.story} testID="comic-observation-log">
        <Text style={styles.storyTitle} maxFontSizeMultiplier={font.maxScale}>
          📓 코믹 관찰일지
        </Text>
        <StoryRow emoji="🎬" label="평소 장면" text={story.habit} color={colors.sky} />
        <StoryRow emoji="✨" label="숨은 장점" text={story.charm} color={colors.mint} />
        <StoryRow emoji="🍀" label="다음 한 수" text={story.tip} color={colors.lavender} />
        <Text style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
          웃자고 만든 관찰일지예요. 사람은 상황과 컨디션에 따라 얼마든지 달라집니다.
        </Text>
      </View>
    </View>
  );
}

function StoryRow({
  emoji,
  label,
  text,
  color,
}: {
  readonly emoji: string;
  readonly label: string;
  readonly text: string;
  readonly color: string;
}) {
  return (
    <View style={[styles.storyRow, { backgroundColor: color }]}>
      <Text style={styles.storyEmoji} maxFontSizeMultiplier={1}>
        {emoji}
      </Text>
      <View style={styles.storyCopy}>
        <Text style={styles.storyLabel} maxFontSizeMultiplier={font.maxScale}>
          {label}
        </Text>
        <Text style={styles.storyText} maxFontSizeMultiplier={font.maxScale}>
          {text}
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
  story: {
    marginTop: space.md,
    padding: space.sm,
    gap: space.sm,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.card,
    backgroundColor: colors.white,
  },
  storyTitle: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.4,
    textAlign: 'center',
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.sm,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.button,
  },
  storyEmoji: {
    width: 24,
    fontSize: font.size.body,
    lineHeight: font.size.body * 1.4,
  },
  storyCopy: { flex: 1 },
  storyLabel: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.4,
  },
  storyText: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: font.family.body,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.55,
  },
  disclaimer: {
    paddingHorizontal: space.xs,
    color: colors.muted,
    fontFamily: font.family.body,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
