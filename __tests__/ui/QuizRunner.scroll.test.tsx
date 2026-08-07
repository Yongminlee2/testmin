import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

// 실기기에서 문항이 바뀌어도 ScrollView가 이전 스크롤 위치에 머무는 버그를 잡는 테스트.
// 실제 ScrollView.scrollTo는 네이티브 커맨드를 거치기 때문에(RNTL v14의 테스트
// 렌더러는 호스트 엘리먼트만 노출하고 컴포짓 인스턴스에 접근할 방법이 없다)
// react-native 전체가 아니라 ScrollView가 정의된 서브모듈 하나만 얇게 모킹해서
// 우리 코드가 ref.scrollTo(...)를 실제로 호출하는지 관찰한다.
// (react-native 전체를 requireActual로 로드하면 DevMenu 등 네이티브 전용 모듈이
// 이 테스트 환경에 없어서 TurboModuleRegistry invariant로 죽는다 — 그래서 서브모듈만 바꾼다.)
const mockScrollTo = jest.fn();
jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = require('react');
  const View = require('react-native/Libraries/Components/View/View').default;
  const MockScrollView = React.forwardRef(
    (props: { readonly children?: React.ReactNode }, ref: React.Ref<{ scrollTo: typeof mockScrollTo }>) => {
      React.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }));
      return React.createElement(View, null, props.children);
    },
  );
  MockScrollView.displayName = 'MockScrollView';
  return { __esModule: true, default: MockScrollView };
});

// eslint-disable-next-line import/first
import { QuizRunner } from '@/ui/QuizRunner';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

function textQuestion(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: '보기1' }, { text: '보기2' }],
    answerIndex: 0,
    difficulty: 1,
  };
}

beforeEach(() => {
  mockScrollTo.mockClear();
  useSession.getState().reset();
});

describe('QuizRunner 스크롤 복귀', () => {
  test('문항이 넘어가면 스크롤을 맨 위로 되돌린다', async () => {
    useSession.getState().start('iq', 'default', 1, [textQuestion('a'), textQuestion('b')]);
    await render(<QuizRunner resultRoute="/test/iq/result" />);

    mockScrollTo.mockClear(); // 마운트 시 최초 호출은 제외하고 "문항 전환" 자체를 확인한다

    await fireEvent.press(screen.getByTestId('choice-0'));

    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    expect(mockScrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
  });

  test('빈 세션(문항 0개)에서도 크래시하지 않는다', async () => {
    await render(<QuizRunner resultRoute="/test/iq/result" />);
    expect(screen.getByText('응시 중인 시험이 없습니다')).toBeTruthy();
  });
});
