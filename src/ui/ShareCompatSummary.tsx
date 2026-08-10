import {
  Image,
  Platform,
  Text,
  View,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';

export interface ShareCompatEntry {
  readonly label: string;
  readonly sub?: string;
  readonly image: ImageSourcePropType;
  readonly accessibilityLabel: string;
}

interface Props {
  readonly goodWith: readonly ShareCompatEntry[];
  readonly hardWith?: ShareCompatEntry;
}

export const SHARE_COMPAT_WEB_MAX_WIDTH = 560;
export const SHARE_COMPAT_IMAGE_SIZE = 72;

/** 넓은 웹에서는 결과 일러스트와 같은 폭으로 묶고, 앱에서는 카드 폭을 그대로 쓴다. */
export function shareCompatMaxWidth(platform: string): number | undefined {
  return platform === 'web' ? SHARE_COMPAT_WEB_MAX_WIDTH : undefined;
}

/** 공유 이미지 안에만 들어가는 간단한 관계 미리보기. 상세 이유는 본 결과 화면에 남긴다. */
export function ShareCompatSummary({ goodWith, hardWith }: Props) {
  const goodEntries = goodWith.slice(0, 2);
  if (goodEntries.length === 0 && hardWith === undefined) return null;

  return (
    <View testID="share-compat-summary" style={styles.wrap}>
      <Text style={styles.title} maxFontSizeMultiplier={font.maxScale}>
        내 결과의 관계 지도
      </Text>

      {goodEntries.length > 0 ? (
        <RelationSection
          testID="share-compat-good"
          title="잘 맞는 유형"
          badge="티키타카 후보"
          entries={goodEntries}
          color={colors.mint}
        />
      ) : null}

      {hardWith ? (
        <RelationSection
          testID="share-compat-hard"
          title="박자를 맞춰볼 유형"
          badge="통역 한 번 더"
          entries={[hardWith]}
          color={colors.coral}
        />
      ) : null}

      <Text style={styles.disclaimer} maxFontSizeMultiplier={font.maxScale}>
        안 맞는 사람 확정이 아니라, 서로의 설명서를 한 장 더 읽어보면 좋은 조합이에요.
      </Text>
    </View>
  );
}

function RelationSection({
  testID,
  title,
  badge,
  entries,
  color,
}: {
  readonly testID: string;
  readonly title: string;
  readonly badge: string;
  readonly entries: readonly ShareCompatEntry[];
  readonly color: string;
}) {
  return (
    <View testID={testID} style={styles.section}>
      <View style={[styles.sectionTitle, { backgroundColor: color }]}>
        <Text style={styles.sectionTitleText} maxFontSizeMultiplier={font.maxScale}>
          {title}
        </Text>
      </View>

      {entries.map((entry, index) => (
        <View
          key={`${title}-${entry.label}-${index}`}
          testID={`${testID}-entry-${index}`}
          style={[styles.item, { backgroundColor: color }]}
        >
          <View testID={`${testID}-image-frame-${index}`} style={styles.imageFrame}>
            <Image
              source={entry.image}
              accessibilityLabel={entry.accessibilityLabel}
              resizeMode="cover"
              style={styles.image}
            />
          </View>

          <View style={styles.copy}>
            <View style={styles.badge}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
                {badge}
              </Text>
            </View>
            <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
              {entry.label}
            </Text>
            {entry.sub ? (
              <Text style={styles.sub} maxFontSizeMultiplier={font.maxScale}>
                {entry.sub}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: shareCompatMaxWidth(Platform.OS),
    alignSelf: 'center',
    marginBottom: space.lg,
    padding: space.md,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  title: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.lead,
    lineHeight: font.size.lead * 1.4,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginTop: space.md,
    gap: space.sm,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
  },
  sectionTitleText: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.4,
  },
  item: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  imageFrame: {
    width: SHARE_COMPAT_IMAGE_SIZE,
    height: SHARE_COMPAT_IMAGE_SIZE,
    flexShrink: 0,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  badge: {
    maxWidth: '100%',
    marginBottom: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  badgeText: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: 9,
    lineHeight: 13,
  },
  label: {
    maxWidth: '100%',
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.lead,
    lineHeight: font.size.lead * 1.35,
  },
  sub: {
    maxWidth: '100%',
    marginTop: 1,
    color: colors.ink,
    fontFamily: font.family.body,
    fontSize: font.size.caption,
    lineHeight: font.size.caption * 1.5,
  },
  disclaimer: {
    marginTop: space.md,
    paddingHorizontal: space.xs,
    color: colors.muted,
    fontFamily: font.family.body,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
