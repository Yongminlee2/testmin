// react-native-safe-area-context 공식 테스트 모크.
// SafeAreaProvider로 감싸지 않은 화면 테스트에서도 useSafeAreaInsets()가
// (0,0,0,0)을 반환하도록 해서 "No safe area value available" 에러를 막는다.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  // 소스가 TSX(export default)라서 CJS interop에 따라 .default에 실릴 수 있다.
  return mock.default ?? mock;
});

// @react-native-async-storage/async-storage 공식 테스트 모크. 네이티브 모듈이 없는
// Jest 환경에서 getItem/setItem이 실제로 동작하는 인메모리 저장소로 동작하게 한다.
// 손으로 모크를 새로 만들지 않고 패키지가 제공하는 것을 그대로 쓴다.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-view-shot: 캡처는 순수 네이티브 로직이라 Jest 환경에 없다.
// 항상 같은 더미 uri를 돌려주는 스텁 — ShareButton 테스트는 이 uri가
// Sharing.shareAsync로 그대로 전달되는지만 확인한다.
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file:///mock-capture.png')),
}));

// expo-sharing: 네이티브 공유 시트도 Jest 환경에 없다.
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
