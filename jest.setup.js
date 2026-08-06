// react-native-safe-area-context 공식 테스트 모크.
// SafeAreaProvider로 감싸지 않은 화면 테스트에서도 useSafeAreaInsets()가
// (0,0,0,0)을 반환하도록 해서 "No safe area value available" 에러를 막는다.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  // 소스가 TSX(export default)라서 CJS interop에 따라 .default에 실릴 수 있다.
  return mock.default ?? mock;
});
