import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '@/ui/Button';
import { colors, font } from '@/ui/tokens';

describe('Button', () => {
  test('라벨을 보여준다', async () => {
    await render(<Button label="응시하기" onPress={() => {}} />);
    expect(screen.getByText('응시하기')).toBeTruthy();
  });

  test('누르면 onPress가 불린다', async () => {
    const onPress = jest.fn();
    await render(<Button label="응시하기" onPress={onPress} testID="go" />);
    await fireEvent.press(screen.getByTestId('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled이면 onPress가 불리지 않는다', async () => {
    const onPress = jest.fn();
    await render(<Button label="응시하기" onPress={onPress} disabled testID="go" />);
    await fireEvent.press(screen.getByTestId('go'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('tokens', () => {
  test('번들 폰트 이름이 expo-google-fonts 내보내기 이름과 일치한다', () => {
    expect(font.family.display).toBe('BlackHanSans_400Regular');
    expect(font.family.body).toBe('NotoSansKR_500Medium');
    expect(font.family.bold).toBe('NotoSansKR_700Bold');
    expect(font.family.black).toBe('NotoSansKR_900Black');
  });

  test('시스템 글자 확대는 1.3배까지만 허용한다', () => {
    expect(font.maxScale).toBe(1.3);
  });

  test('스펙에 정의된 색을 그대로 쓴다', () => {
    expect(colors.ink).toBe('#111111');
    expect(colors.cream).toBe('#FFF8E1');
    expect(colors.yellow).toBe('#FFD43B');
    expect(colors.coral).toBe('#FF8A5B');
    expect(colors.mint).toBe('#4ECDC4');
    expect(colors.lavender).toBe('#B197FC');
    expect(colors.sky).toBe('#74C0FC');
  });
});
