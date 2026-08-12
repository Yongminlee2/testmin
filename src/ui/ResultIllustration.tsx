import { Image, Platform, Text, View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';
import type { ResultStory } from '@/content/resultStories';
import type { ResultJournal } from '@/content/resultPresentation';

interface Props {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
  readonly story: ResultStory;
  readonly journal: ResultJournal;
}

export const WEB_RESULT_ILLUSTRATION_MAX_WIDTH = 560;
export const WEB_RESULT_CARD_MAX_WIDTH =
  WEB_RESULT_ILLUSTRATION_MAX_WIDTH + (space.md + borderWidth.card) * 2;

/** 네이티브 앱은 카드 폭을 그대로 쓰고 웹의 넓은 화면에서만 최대 폭을 둔다. */
export function resultIllustrationMaxWidth(platform: string): number | undefined {
  return platform === 'web' ? WEB_RESULT_ILLUSTRATION_MAX_WIDTH : undefined;
}

/** 웹 결과 카드의 안쪽 폭을 일러스트 폭과 정확히 맞춘다. */
export function resultCardMaxWidth(platform: string): number | undefined {
  return platform === 'web' ? WEB_RESULT_CARD_MAX_WIDTH : undefined;
}

/** 결과 카드에 들어가는 래스터 코믹 컷. 공유 이미지에도 그대로 포함된다. */
export function ResultIllustration({ source, accessibilityLabel, caption, story, journal }: Props) {
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
          {journal.title}
        </Text>
        <StoryRow marker="01" label={journal.habitLabel} text={story.habit} color={colors.sky} />
        <StoryRow marker="02" label={journal.charmLabel} text={story.charm} color={colors.mint} />
        <StoryRow marker="03" label={journal.tipLabel} text={story.tip} color={colors.lavender} />
        <Text style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
          {journal.disclaimer}
        </Text>
      </View>
    </View>
  );
}

function StoryRow({
  marker,
  label,
  text,
  color,
}: {
  readonly marker: string;
  readonly label: string;
  readonly text: string;
  readonly color: string;
}) {
  return (
    <View style={[styles.storyRow, { backgroundColor: color }]}>
      <Text style={styles.storyMarker} maxFontSizeMultiplier={1}>
        {marker}
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
  wrap: {
    width: '100%',
    maxWidth: resultIllustrationMaxWidth(Platform.OS),
    alignSelf: 'center',
    marginTop: space.md,
  },
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
  storyMarker: {
    width: 28,
    marginTop: 1,
    fontSize: 11,
    lineHeight: 20,
    fontFamily: font.family.black,
    color: colors.ink,
    textAlign: 'center',
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
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
