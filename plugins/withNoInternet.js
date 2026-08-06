const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo prebuild가 기본으로 넣는 android.permission.INTERNET을 제거한다.
 * app.json의 android.permissions 설정만으로는 제거되지 않으므로
 * tools:node="remove"를 직접 넣어 매니페스트 병합 단계에서 지운다.
 */
module.exports = function withNoInternet(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const kept = (manifest['uses-permission'] || []).filter(
      (p) => p.$['android:name'] !== 'android.permission.INTERNET'
    );
    kept.push({
      $: {
        'android:name': 'android.permission.INTERNET',
        'tools:node': 'remove',
      },
    });
    manifest['uses-permission'] = kept;

    return cfg;
  });
};
