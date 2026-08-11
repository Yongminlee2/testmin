const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
} = require('expo/config-plugins');

const OPTIMIZED_RESOURCE_SHRINKING = 'android.r8.optimizedResourceShrinking';
const REPACKAGE_MARKER = '# testmin-r8-class-repackaging';

/**
 * Expo prebuild 이후에도 Google이 권장하는 release R8 설정을 유지한다.
 * AGP 8.12에서는 최적화된 리소스 축소를 명시적으로 켜야 하며,
 * proguard-android.txt는 -dontoptimize를 포함하므로 optimized 기본 파일로 바꾼다.
 */
module.exports = function withReleaseOptimization(config) {
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withReleaseOptimization requires a Groovy app/build.gradle');
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /getDefaultProguardFile\(["']proguard-android\.txt["']\)/g,
      'getDefaultProguardFile("proguard-android-optimize.txt")'
    );
    return cfg;
  });

  config = withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => item.type !== 'property' || item.key !== OPTIMIZED_RESOURCE_SHRINKING
    );
    cfg.modResults.push({
      type: 'property',
      key: OPTIMIZED_RESOURCE_SHRINKING,
      value: 'true',
    });
    return cfg;
  });

  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const proguardPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      const contents = fs.readFileSync(proguardPath, 'utf8');
      if (!contents.includes(REPACKAGE_MARKER)) {
        fs.writeFileSync(
          proguardPath,
          `${contents.trimEnd()}\n\n${REPACKAGE_MARKER}\n-repackageclasses\n`
        );
      }
      return cfg;
    },
  ]);
};
