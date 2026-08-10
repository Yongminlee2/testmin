const { withAppBuildGradle } = require('expo/config-plugins');

const START = '// testmin-local-release-signing:start';
const END = '// testmin-local-release-signing:end';

const SIGNING_BLOCK = `
${START}
// Local Play upload credentials stay outside Git. EAS injects its own signing
// configuration on remote builders; this block only activates when the local
// keystore.properties and referenced keystore are both present.
def testminSigningPropertiesFile = rootProject.file('../keystore.properties')
def testminSigningProperties = new Properties()
if (testminSigningPropertiesFile.exists()) {
    testminSigningPropertiesFile.withInputStream { testminSigningProperties.load(it) }
}
def testminSigningStoreName = testminSigningProperties.getProperty('storeFile')
def testminSigningStoreFile = testminSigningStoreName
    ? rootProject.file('../' + testminSigningStoreName)
    : null
def testminHasLocalReleaseKey = testminSigningStoreFile != null &&
    testminSigningStoreFile.exists() &&
    testminSigningProperties.getProperty('storePassword') &&
    testminSigningProperties.getProperty('keyAlias') &&
    testminSigningProperties.getProperty('keyPassword')

if (testminHasLocalReleaseKey) {
    def testminReleaseSigning = android.signingConfigs.findByName('testminRelease') ?:
        android.signingConfigs.create('testminRelease')
    testminReleaseSigning.storeFile = testminSigningStoreFile
    testminReleaseSigning.storePassword = testminSigningProperties.getProperty('storePassword')
    testminReleaseSigning.keyAlias = testminSigningProperties.getProperty('keyAlias')
    testminReleaseSigning.keyPassword = testminSigningProperties.getProperty('keyPassword')
    android.buildTypes.release.signingConfig = testminReleaseSigning
}
${END}
`;

module.exports = function withLocalReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withLocalReleaseSigning requires a Groovy app/build.gradle');
    }

    if (!cfg.modResults.contents.includes(START)) {
      cfg.modResults.contents = `${cfg.modResults.contents.trimEnd()}\n${SIGNING_BLOCK}`;
    }

    return cfg;
  });
};
