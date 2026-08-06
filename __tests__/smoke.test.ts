import { appName } from '@/appMeta';

test('앱 이름이 스펙과 일치한다', () => {
  expect(appName).toBe('테스트의 민족');
});
