const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo prebuild가 기본 템플릿으로 넣는 사용자 노출 권한들을 전부 제거한다.
 * app.json의 android.permissions 설정만으로는 제거되지 않으므로
 * tools:node="remove"를 직접 넣어 매니페스트 병합 단계에서 지운다.
 *
 * 이 앱은 문제은행을 전부 번들에 담아 오프라인으로 동작하며 네트워크 호출이
 * 없다. 스토어 데이터 안전 섹션에 "권한 없음"으로 표시하는 것이 제품 요건이므로
 * 아래 권한들은 실제로 쓰이지 않는데도 prebuild 템플릿이 기본으로 추가한다.
 *
 * - android.permission.INTERNET: 네트워크 호출이 전혀 없다.
 * - android.permission.SYSTEM_ALERT_WINDOW: 오버레이를 그리지 않는다.
 * - android.permission.VIBRATE: 햅틱을 쓰지 않는다.
 * - android.permission.READ_EXTERNAL_STORAGE: expo.modules.filesystem이 병합하지만
 *   maxSdkVersion=32라 Android 13+에서는 이미 비활성. 그래도 12 이하 사용자
 *   노출을 막기 위해 제거한다.
 * - android.permission.WRITE_EXTERNAL_STORAGE: 위와 동일한 이유.
 *
 * com.testmin.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION(및 그 uses-permission)은
 * androidx.core:core가 자체 브로드캐스트 보안을 위해 내부적으로 쓰는
 * signature 보호수준 권한이라 여기서 건드리지 않는다. 사용자 노출 권한이
 * 아니고 스토어 권한 목록에도 나타나지 않는다.
 */
const STRIPPED_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.VIBRATE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

module.exports = function withNoPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const kept = (manifest['uses-permission'] || []).filter(
      (p) => !STRIPPED_PERMISSIONS.includes(p.$['android:name'])
    );
    for (const name of STRIPPED_PERMISSIONS) {
      kept.push({
        $: {
          'android:name': name,
          'tools:node': 'remove',
        },
      });
    }
    manifest['uses-permission'] = kept;

    return cfg;
  });
};
