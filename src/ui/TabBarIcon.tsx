import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { colors, radius } from './tokens';

export type TabBarIconName = 'exam' | 'records' | 'notes' | 'settings';

interface Props {
  readonly name: TabBarIconName;
  readonly focused: boolean;
  readonly color: ColorValue;
  readonly size?: number;
  readonly wrapWidth?: number;
  readonly wrapHeight?: number;
}

const iconName = {
  exam: { active: 'sparkles', inactive: 'sparkles-outline' },
  records: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  notes: { active: 'reader', inactive: 'reader-outline' },
  settings: { active: 'options', inactive: 'options-outline' },
} as const;

/** 활성 상태는 채움, 비활성 상태는 윤곽으로 구분하는 현대적인 Ionicons 탭 아이콘. */
export function TabBarIcon({
  name,
  focused,
  color,
  size = 18,
  wrapWidth = 32,
  wrapHeight = 24,
}: Props) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.wrap,
        { width: wrapWidth, height: wrapHeight },
        focused && styles.focused,
      ]}
    >
      <Ionicons
        accessible={false}
        name={focused ? iconName[name].active : iconName[name].inactive}
        size={size}
        color={focused ? colors.ink : color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  focused: { backgroundColor: colors.yellow },
});
