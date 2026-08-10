import { useState, type ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from './tokens';

export interface InteractivePressableState extends PressableStateCallbackType {
  readonly hovered: boolean;
  readonly focused: boolean;
}

type NativePressableProps = ComponentProps<typeof Pressable>;

interface Props extends Omit<NativePressableProps, 'style'> {
  /** 기본 lift 효과를 끄고 화면별 스타일만 적용할 때 사용한다. */
  readonly feedback?: 'lift' | 'none';
  readonly style?:
    | StyleProp<ViewStyle>
    | ((state: InteractivePressableState) => StyleProp<ViewStyle>);
}

/**
 * 마우스·키보드·터치에서 같은 선택 피드백을 주는 Pressable.
 * 웹은 hover/focus, 앱은 press와 Android ripple을 즉시 보여준다.
 */
export function InteractivePressable({
  feedback = 'lift',
  style,
  disabled = false,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  android_ripple,
  ...props
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...props}
      disabled={disabled}
      android_ripple={
        android_ripple ?? { color: 'rgba(17,17,17,0.12)', borderless: false }
      }
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={(pressState) => {
        const state: InteractivePressableState = {
          ...pressState,
          hovered,
          focused,
        };
        const ownStyle = typeof style === 'function' ? style(state) : style;

        return [
          styles.base,
          ownStyle,
          feedback === 'lift' && hovered && !disabled && styles.hovered,
          feedback === 'lift' && pressState.pressed && !disabled && styles.pressed,
          focused && !disabled && styles.focused,
          disabled && styles.disabled,
        ];
      }}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    cursor: 'pointer',
  },
  hovered: {
    opacity: 0.94,
    transform: [{ translateY: -2 }, { scale: 1.006 }],
  },
  pressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }, { scale: 0.99 }],
  },
  focused: {
    outlineColor: colors.sky,
    outlineOffset: 2,
    outlineStyle: 'solid',
    outlineWidth: 3,
  },
  disabled: {
    cursor: 'auto',
  },
});
