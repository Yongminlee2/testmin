# 테스트의 민족 — 계획 1: 기반 + 사투리 고사 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에 설치해서 경상도 사투리 고사를 실제로 풀고 급수·합격증·문항별 해설까지 볼 수 있는 앱을 만든다. 이 과정에서 채점 엔진, 디자인 시스템, 네이티브 빌드 파이프라인, 권한 0개 제약을 전부 실물로 검증한다.

**Architecture:** `src/engine`은 React를 전혀 import하지 않는 순수 TypeScript로 두고 Node에서 Jest로 검증한다. 화면은 Expo Router 파일 기반 라우팅을 쓰고, 문항 데이터는 `src/content`의 순수 JSON으로 분리한다. 출제·채점은 시드 기반이라 같은 시드면 항상 같은 문제가 나온다.

**Tech Stack:** Expo SDK 57 (React Native 0.86), TypeScript strict, Expo Router, Zustand, Jest + jest-expo + @testing-library/react-native

> 태스크 1 실행 시점에 `create-expo-app@latest`가 SDK 57을 설치했다. 계획 작성 시점 기준은 56이었으나 SDK 57의 `minSdkVersion` 기본값도 24라 안드로이드 8 지원 요건은 그대로 충족되며, targetSdk 36 요건에도 더 잘 맞는다. 57로 진행한다.

**설계 문서:** `docs/superpowers/specs/2026-08-06-testmin-design.md`

## Global Constraints

모든 태스크에 아래 제약이 암묵적으로 포함된다.

- 패키지명은 `com.testmin.app` — 절대 변경 금지
- 앱 이름은 `테스트의 민족`
- `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`, `buildToolsVersion 37.0.0`
  - **태스크 2에서 37 → 36으로 정정.** SDK 저장소에 정수 `platforms;android-37`이 존재하지 않는다. 실재하는 패키지는 `platforms;android-37.0`이고 `AndroidVersion.ApiLevel=37.0`이라, 정수 `compileSdk 37`에 대한 AGP의 target-hash 조회가 영영 실패한다. 이를 우회하려면 `android.suppressUnsupportedCompileSdk=37.0`이 필요한데, "이 AGP가 공식 지원하지 않는 compileSdk를 쓰고 있다"는 억제 플래그를 스토어 제출본에 넣을 이유가 없다. 37은 RN 커뮤니티 템플릿의 기본값이었을 뿐 우리 요구사항이 아니었고, 실제로 필요한 건 Play가 요구하는 **targetSdk 36**뿐이다.
- **권한 0개.** `INTERNET`을 포함해 어떤 `uses-permission`도 최종 산출물에 남지 않아야 한다
- `expo-updates`(OTA)를 설치하지 않는다 — 인터넷 권한이 붙는다
- 라이트 모드 고정 (`userInterfaceStyle: "light"`), 다크 모드 미지원
- "MBTI", "옹호자/중재자" 등 16Personalities 유형명, 레이븐·WAIS 문항을 어디에도 쓰지 않는다
- `src/engine/**`는 `react`, `react-native`, `expo*`를 import하지 않는다
- 프로젝트 경로는 ASCII만 (`C:\workAndroid\TestMin`)
- 색상 토큰: ink `#111111` / cream `#FFF8E1` / white `#FFFFFF` / yellow `#FFD43B` / coral `#FF8A5B` / mint `#4ECDC4` / lavender `#B197FC` / sky `#74C0FC`
- 텍스트 문항은 4지선다 고정
- 커밋 메시지는 한국어, 마지막 줄에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## File Structure

계획 1이 끝났을 때의 파일 구조와 각 파일의 책임.

```
TestMin/
  app.json                          Expo 설정 (SDK 레벨, 패키지명, 플러그인)
  plugins/withNoInternet.js         INTERNET 권한 제거 config plugin
  jest.config.js                    jest-expo 프리셋
  tsconfig.json                     strict
  app/
    _layout.tsx                     루트 스택
    (tabs)/_layout.tsx              4탭 셸
    (tabs)/index.tsx                홈 — 5개 카테고리 카드
    (tabs)/records.tsx              성적표 (계획 3에서 채움, 지금은 안내만)
    (tabs)/notes.tsx                오답노트 (계획 3에서 채움)
    (tabs)/settings.tsx             설정 — 고지·라이선스
    test/dialect/intro.tsx          지역 선택
    test/dialect/quiz.tsx           문항 진행
    test/dialect/result.tsx         급수 합격증
    test/dialect/review.tsx         문항별 해설
  src/
    engine/
      types.ts                      Question·Choice·GradeBand 등 모든 데이터 타입
      rng.ts                        시드 RNG, 셔플, 문자열 해시
      grade.ts                      정답률 → 급수 매핑
      score.ts                      정답형 채점
      assemble.ts                   풀 → 출제 세트
    content/
      grades.json                   카테고리별 급수 구간·칭호
      dialect/gyeongsang.json       경상도 문항 15개
    ui/
      tokens.ts                     색·테두리·간격·타이포 토큰
      HardShadow.tsx                네오브루탈 하드 섀도우 래퍼
      Button.tsx                    기본 버튼
      Card.tsx                      테두리 카드
      Badge.tsx                     알약 배지
      AdSlot.tsx                    광고 자리 (v1은 null)
    store/
      session.ts                    진행 중인 응시 상태 (Zustand)
  tools/
    validate-content.ts             문항 데이터 검증 (라이브러리 + CLI)
  __tests__/
    engine/rng.test.ts
    engine/grade.test.ts
    engine/score.test.ts
    engine/assemble.test.ts
    tools/validate-content.test.ts
    ui/Button.test.tsx
    content/dialect.test.ts
```

**경계 원칙:** `src/engine`과 `tools`는 순수 TypeScript다. `src/ui`와 `app`만 React를 안다. `src/content`는 데이터만 있고 코드가 없다.

---

### Task 1: Expo 프로젝트 생성과 테스트 러너

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `jest.config.js`, `babel.config.js`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `__tests__/smoke.test.ts`
- Note: `C:\workAndroid\TestMin`에는 이미 `.git`, `.gitignore`, `docs/`가 있다. `create-expo-app`은 비어 있지 않은 디렉터리를 거부하므로 임시 폴더에 만든 뒤 옮긴다.

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: 동작하는 Expo Router 프로젝트, `npm test`로 Jest 실행 가능

- [ ] **Step 1: 임시 폴더에 Expo 프로젝트 생성**

```bash
cd /c/workAndroid && npx create-expo-app@latest _testmin_tmp --template default --no-install
```

- [ ] **Step 2: 생성된 파일을 TestMin으로 옮기고 임시 폴더 삭제**

PowerShell로 실행한다. `.git`과 `docs`를 덮어쓰지 않도록 `_testmin_tmp` 안의 것만 복사한다.

```powershell
Copy-Item -Path C:\workAndroid\_testmin_tmp\* -Destination C:\workAndroid\TestMin -Recurse -Force
Remove-Item -Recurse -Force C:\workAndroid\_testmin_tmp
Remove-Item -Recurse -Force C:\workAndroid\TestMin\.gitignore.orig -ErrorAction SilentlyContinue
```

템플릿이 가져온 `.gitignore`가 우리 것을 덮었을 수 있다. `git -C C:\workAndroid\TestMin diff .gitignore`로 확인하고, 덮였다면 `git -C C:\workAndroid\TestMin checkout .gitignore`로 되돌린 뒤 템플릿 항목 중 없는 것만 손으로 추가한다.

- [ ] **Step 3: 의존성 설치**

```bash
cd /c/workAndroid/TestMin && npm install && npx expo install zustand react-native-svg expo-build-properties
```

```bash
cd /c/workAndroid/TestMin && npm install --save-dev jest jest-expo @types/jest @testing-library/react-native tsx
```

- [ ] **Step 4: `app.json`을 프로젝트 설정으로 교체**

```json
{
  "expo": {
    "name": "테스트의 민족",
    "slug": "testmin",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "testmin",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "backgroundColor": "#FFF8E1",
    "android": {
      "package": "com.testmin.app",
      "versionCode": 1,
      "edgeToEdgeEnabled": true
    },
    "ios": {
      "bundleIdentifier": "com.testmin.app",
      "supportsTablet": false
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "compileSdkVersion": 37,
            "targetSdkVersion": 36,
            "buildToolsVersion": "37.0.0"
          }
        }
      ]
    ]
  }
}
```

`experiments.typedRoutes`는 **켜지 않는다.** 라우트 타입은 dev 서버가 `.expo/types`에 생성하는데, 태스크 10에서 홈 화면이 아직 없는 `/test/dialect/intro`로 `router.push`를 하므로 `tsc --noEmit`이 그 시점에 깨진다. 타입 안전성보다 태스크 순서가 우선이다.

- [ ] **Step 5: `tsconfig.json`을 strict로**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 6: `jest.config.js` 작성**

```js
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

- [ ] **Step 7: `package.json`에 스크립트 추가**

`scripts` 블록만 교체한다. **`"main": "expo-router/entry"` 항목은 절대 건드리지 않는다** — 지우면 앱이 뜨지 않는다.

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "validate:content": "tsx tools/validate-content.ts"
}
```

- [ ] **Step 8: 실패하는 스모크 테스트 작성**

`__tests__/smoke.test.ts`:

```ts
import { appName } from '@/appMeta';

test('앱 이름이 스펙과 일치한다', () => {
  expect(appName).toBe('테스트의 민족');
});
```

- [ ] **Step 9: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/smoke.test.ts
```

Expected: FAIL — `Cannot find module '@/appMeta'`

- [ ] **Step 10: 최소 구현**

`src/appMeta.ts`:

```ts
export const appName = '테스트의 민족';
export const packageName = 'com.testmin.app';
```

- [ ] **Step 11: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/smoke.test.ts && npx tsc --noEmit
```

Expected: PASS, 타입 에러 0개

- [ ] **Step 12: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "Expo SDK 56 프로젝트 뼈대 + Jest 테스트 러너

TypeScript strict, Expo Router, jest-expo 프리셋 구성.
app.json에 패키지명 com.testmin.app, minSdk 24 / targetSdk 36 고정.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: 네이티브 빌드 파이프라인과 권한 0개 검증

이 태스크를 앞에 두는 이유: 툴체인이나 권한 제약이 깨져 있으면 뒤의 모든 작업이 헛수고가 된다. 여기서 먼저 확인한다.

**Files:**
- Create: `plugins/withNoInternet.js`
- Modify: `app.json` (plugins 배열에 추가)

**Interfaces:**
- Consumes: Task 1의 `app.json`
- Produces: `android/` 네이티브 프로젝트, 권한 0개인 debug APK

- [ ] **Step 1: 툴체인 확인**

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -version
```

Expected: JDK 17 이상. 출력이 17 미만이면 여기서 멈추고 사용자에게 보고한다.

```powershell
Get-ChildItem C:\workAndroid\android-sdk-ascii\platforms -Directory | Select-Object -ExpandProperty Name
```

Expected: `android-37`이 목록에 있어야 한다. 없으면 다음 스텝으로.

- [ ] **Step 2: android-37 플랫폼 설치 (Step 1에서 없을 때만)**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& C:\workAndroid\android-sdk-ascii\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\workAndroid\android-sdk-ascii "platforms;android-37"
```

- [ ] **Step 3: `local.properties`와 gradle 환경 준비**

`C:\workAndroid\TestMin\android`는 아직 없으므로, prebuild 후에 생성한다. 먼저 환경변수를 세션에 고정한다.

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\workAndroid\android-sdk-ascii"
$env:ANDROID_SDK_ROOT = "C:\workAndroid\android-sdk-ascii"
```

- [ ] **Step 4: INTERNET 권한 제거 플러그인 작성**

`plugins/withNoInternet.js`:

```js
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
```

- [ ] **Step 5: `app.json`의 plugins 배열에 등록**

`"expo-router"` 다음 줄에 `"./plugins/withNoInternet"`를 추가한다. 최종 plugins 배열:

```json
"plugins": [
  "expo-router",
  "./plugins/withNoInternet",
  [
    "expo-build-properties",
    {
      "android": {
        "minSdkVersion": 24,
        "compileSdkVersion": 37,
        "targetSdkVersion": 36,
        "buildToolsVersion": "37.0.0"
      }
    }
  ]
]
```

- [ ] **Step 6: prebuild 실행**

```bash
cd /c/workAndroid/TestMin && npx expo prebuild --platform android --clean
```

Expected: `android/` 디렉터리 생성

- [ ] **Step 7: 매니페스트에 remove 지시가 들어갔는지 확인**

```bash
cd /c/workAndroid/TestMin && grep -n "INTERNET" android/app/src/main/AndroidManifest.xml
```

Expected: `tools:node="remove"`가 붙은 한 줄만 보인다

- [ ] **Step 8: debug APK 빌드**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\workAndroid\android-sdk-ascii"
cd C:\workAndroid\TestMin\android
.\gradlew.bat assembleDebug --no-daemon
```

Expected: BUILD SUCCESSFUL, `android/app/build/outputs/apk/debug/app-debug.apk` 생성

- [ ] **Step 9: 권한이 0개인지 실제 APK에서 검증**

```powershell
& C:\workAndroid\android-sdk-ascii\build-tools\37.0.0\aapt2.exe dump permissions C:\workAndroid\TestMin\android\app\build\outputs\apk\debug\app-debug.apk
```

Expected: `uses-permission` 줄이 하나도 출력되지 않는다. 한 줄이라도 나오면 Step 4의 플러그인을 고치고 Step 6부터 다시 한다.

디버그 빌드는 Metro 접속을 위해 `AndroidManifest.xml`의 debug 변형에 INTERNET이 다시 들어갈 수 있다. 그 경우 이 검증은 **release 빌드로** 수행한다 (`.\gradlew.bat assembleRelease`). 최종 판정 기준은 release APK다.

- [ ] **Step 10: 커밋**

`android/`는 `.gitignore`에 있으므로 플러그인과 설정만 커밋된다.

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "네이티브 빌드 파이프라인 + INTERNET 권한 제거 플러그인

expo prebuild로 android/ 생성, config plugin으로 INTERNET을
tools:node=remove 처리. release APK에서 aapt2로 권한 0개 검증.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: 시드 RNG

**Files:**
- Create: `src/engine/rng.ts`
- Test: `__tests__/engine/rng.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `mulberry32(seed: number): () => number` — [0,1) 난수 생성기
  - `shuffle<T>(items: readonly T[], rand: () => number): T[]` — 원본 불변, 새 배열 반환
  - `hashSeed(text: string): number` — 문자열 → 32비트 부호 없는 정수
  - `pickInt(rand: () => number, minInclusive: number, maxInclusive: number): number`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/rng.test.ts`:

```ts
import { mulberry32, shuffle, hashSeed, pickInt } from '@/engine/rng';

describe('mulberry32', () => {
  test('같은 시드는 같은 수열을 만든다', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  test('다른 시드는 다른 수열을 만든다', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  test('출력은 0 이상 1 미만이다', () => {
    const rand = mulberry32(999);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  test('원본 배열을 바꾸지 않는다', () => {
    const src = [1, 2, 3, 4, 5];
    shuffle(src, mulberry32(7));
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  test('원소는 그대로이고 순열만 바뀐다', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(src, mulberry32(7));
    expect(out.slice().sort((x, y) => x - y)).toEqual(src);
  });

  test('같은 시드는 같은 순서를 만든다', () => {
    const src = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(src, mulberry32(42))).toEqual(shuffle(src, mulberry32(42)));
  });

  test('빈 배열도 처리한다', () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
  });
});

describe('hashSeed', () => {
  test('같은 문자열은 같은 값을 준다', () => {
    expect(hashSeed('dialect-gyeongsang')).toBe(hashSeed('dialect-gyeongsang'));
  });

  test('다른 문자열은 다른 값을 준다', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  test('32비트 부호 없는 정수 범위를 지킨다', () => {
    const h = hashSeed('테스트의 민족');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('pickInt', () => {
  test('경계를 포함한 범위 안의 값을 준다', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const v = pickInt(rand, 2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test('min과 max가 같으면 그 값을 준다', () => {
    expect(pickInt(mulberry32(1), 4, 4)).toBe(4);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/rng.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/rng'`

- [ ] **Step 3: 구현**

`src/engine/rng.ts`:

```ts
/** 시드 기반 결정적 난수 생성기. 같은 시드는 항상 같은 수열을 만든다. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates. 원본을 바꾸지 않고 새 배열을 돌려준다. */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** FNV-1a. 문자열을 시드로 쓸 수 있는 32비트 정수로 바꾼다. */
export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** minInclusive 이상 maxInclusive 이하의 정수. */
export function pickInt(
  rand: () => number,
  minInclusive: number,
  maxInclusive: number
): number {
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rand() * span);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/rng.test.ts
```

Expected: PASS (13 tests)

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 시드 기반 결정적 RNG

mulberry32 + Fisher-Yates 셔플 + FNV-1a 문자열 해시.
같은 시드가 항상 같은 출제를 만들어내는 기반.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 데이터 타입과 급수 매핑

**Files:**
- Create: `src/engine/types.ts`, `src/engine/grade.ts`, `src/content/grades.json`
- Test: `__tests__/engine/grade.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - 타입 `TestKind`, `Axis`, `Choice`, `Question`, `GradeBand`, `GradeTable`
  - `gradeFor(correct: number, total: number, bands: readonly GradeBand[]): GradeBand`
  - `src/content/grades.json` — 키가 테스트 ID인 급수 테이블 모음

- [ ] **Step 1: 타입 파일 작성**

`src/engine/types.ts`:

```ts
export type TestKind = 'scored' | 'typed';
export type Axis = 'EI' | 'SN' | 'TF' | 'JP';
export type Difficulty = 1 | 2 | 3;

/** 도형 문항을 그리기 위한 선언적 스펙. 계획 2에서 확장한다. */
export interface FigureSpec {
  readonly kind: string;
  readonly [key: string]: unknown;
}

export interface Choice {
  /** 텍스트 선택지 */
  readonly text?: string;
  /** 도형 선택지 (계획 2) */
  readonly figure?: FigureSpec;
  /** 유형형 전용: 축에 미치는 방향과 강도. -2 | -1 | 1 | 2 */
  readonly weight?: number;
  /** 유형형 전용: 이 선택이 뜻하는 것 */
  readonly why?: string;
}

export interface Question {
  readonly id: string;
  readonly kind: TestKind;
  readonly prompt: string;
  readonly figure?: FigureSpec;
  readonly choices: readonly Choice[];
  /** 정답형 전용 */
  readonly answerIndex?: number;
  /** 정답형 전용: 왜 이것이 정답인가 */
  readonly explanation?: string;
  /** 정답형 전용: 각 오답이 왜 틀렸는가. choices와 같은 길이거나 생략 */
  readonly distractorNotes?: readonly string[];
  /** 유형형 전용 */
  readonly axis?: string;
  readonly difficulty: Difficulty;
  readonly tags?: readonly string[];
  /** 사실 검증 근거 */
  readonly source?: string;
}

export interface GradeBand {
  /** 이 급수를 받기 위한 최소 정답률(%). 내림차순으로 정렬되어야 한다. */
  readonly min: number;
  /** 1이 최상, 9가 최하 */
  readonly grade: number;
  /** 급수에 붙는 코믹한 칭호 */
  readonly title: string;
}

export interface GradeTable {
  readonly bands: readonly GradeBand[];
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`__tests__/engine/grade.test.ts`:

```ts
import { gradeFor } from '@/engine/grade';
import type { GradeBand } from '@/engine/types';
import grades from '@/content/grades.json';

const bands: readonly GradeBand[] = [
  { min: 100, grade: 1, title: '1급' },
  { min: 90, grade: 2, title: '2급' },
  { min: 80, grade: 3, title: '3급' },
  { min: 70, grade: 4, title: '4급' },
  { min: 60, grade: 5, title: '5급' },
  { min: 50, grade: 6, title: '6급' },
  { min: 40, grade: 7, title: '7급' },
  { min: 25, grade: 8, title: '8급' },
  { min: 0, grade: 9, title: '9급' },
];

describe('gradeFor', () => {
  test('만점은 1급', () => {
    expect(gradeFor(12, 12, bands).grade).toBe(1);
  });

  test('0점은 9급', () => {
    expect(gradeFor(0, 12, bands).grade).toBe(9);
  });

  test('경계 바로 위와 아래가 다른 급수를 받는다', () => {
    // 10문항 기준: 9문항 = 90% = 2급, 8문항 = 80% = 3급
    expect(gradeFor(9, 10, bands).grade).toBe(2);
    expect(gradeFor(8, 10, bands).grade).toBe(3);
  });

  test('11/12는 91.6%라 2급', () => {
    expect(gradeFor(11, 12, bands).grade).toBe(2);
  });

  test('총 문항이 0이면 최하 급수를 준다', () => {
    expect(gradeFor(0, 0, bands).grade).toBe(9);
  });

  test('칭호를 함께 돌려준다', () => {
    expect(gradeFor(12, 12, bands).title).toBe('1급');
  });
});

describe('grades.json', () => {
  test('경상도 사투리 급수 테이블이 0~100%를 빈틈없이 덮는다', () => {
    const table = grades['dialect-gyeongsang'];
    expect(table).toBeDefined();
    const bandsOf = table!.bands;
    const sorted = [...bandsOf].sort((a, b) => b.min - a.min);
    expect(sorted[0]!.min).toBe(100);
    expect(sorted[sorted.length - 1]!.min).toBe(0);
    expect(sorted).toEqual(bandsOf);
  });

  test('모든 급수에 칭호가 있다', () => {
    for (const table of Object.values(grades)) {
      for (const band of table.bands) {
        expect(band.title.length).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/grade.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/grade'`

- [ ] **Step 4: 구현**

`src/engine/grade.ts`:

```ts
import type { GradeBand } from './types';

/**
 * 정답률로 급수를 정한다.
 * bands는 min 기준 내림차순이어야 하며, 마지막 밴드의 min은 0이어야 한다.
 * total이 0이면 최하 밴드를 돌려준다.
 */
export function gradeFor(
  correct: number,
  total: number,
  bands: readonly GradeBand[]
): GradeBand {
  const last = bands[bands.length - 1];
  if (last === undefined) {
    throw new Error('급수 테이블이 비어 있습니다');
  }
  if (total <= 0) return last;

  const percent = (correct / total) * 100;
  for (const band of bands) {
    if (percent >= band.min) return band;
  }
  return last;
}
```

`src/content/grades.json`:

```json
{
  "dialect-gyeongsang": {
    "bands": [
      { "min": 100, "grade": 1, "title": "부산 이모 인정" },
      { "min": 90, "grade": 2, "title": "토박이 소리 듣는다" },
      { "min": 80, "grade": 3, "title": "외가가 경상도" },
      { "min": 70, "grade": 4, "title": "드라마로 배웠다" },
      { "min": 60, "grade": 5, "title": "부산 여행 3회" },
      { "min": 50, "grade": 6, "title": "절반은 찍었다" },
      { "min": 40, "grade": 7, "title": "억양만 안다" },
      { "min": 25, "grade": 8, "title": "\"단디\"도 몰랐다" },
      { "min": 0, "grade": 9, "title": "서울 사람 확정" }
    ]
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/grade.test.ts && npx tsc --noEmit
```

Expected: PASS (8 tests), 타입 에러 0개

- [ ] **Step 6: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 데이터 타입 정의 + 정답률 → 급수 매핑

Question/Choice/GradeBand 타입과 gradeFor 구현.
경상도 사투리 급수 테이블에 코믹 칭호 9종 포함.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: 정답형 채점

**Files:**
- Create: `src/engine/score.ts`
- Test: `__tests__/engine/score.test.ts`

**Interfaces:**
- Consumes: `Question`, `GradeBand` (Task 4), `gradeFor` (Task 4)
- Produces:
  - `type Answer = { questionId: string; chosenIndex: number }` — 미응답은 `chosenIndex: -1`
  - `interface WrongItem { questionId: string; chosenIndex: number; answerIndex: number }`
  - `interface ScoredResult { total, correct, percent, grade, title, wrong }`
  - `scoreTest(questions: readonly Question[], answers: readonly Answer[], bands: readonly GradeBand[]): ScoredResult`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/score.test.ts`:

```ts
import { scoreTest } from '@/engine/score';
import type { Question, GradeBand } from '@/engine/types';

const bands: readonly GradeBand[] = [
  { min: 100, grade: 1, title: '1급' },
  { min: 50, grade: 5, title: '5급' },
  { min: 0, grade: 9, title: '9급' },
];

function q(id: string, answerIndex: number): Question {
  return {
    id,
    kind: 'scored',
    prompt: `문제 ${id}`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions: readonly Question[] = [q('a', 0), q('b', 1), q('c', 2), q('d', 3)];

describe('scoreTest', () => {
  test('전부 맞히면 만점과 최상 급수', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 1 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
    ], bands);

    expect(result.correct).toBe(4);
    expect(result.total).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.grade).toBe(1);
    expect(result.wrong).toHaveLength(0);
  });

  test('전부 틀리면 0점과 최하 급수', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 1 },
      { questionId: 'b', chosenIndex: 0 },
      { questionId: 'c', chosenIndex: 0 },
      { questionId: 'd', chosenIndex: 0 },
    ], bands);

    expect(result.correct).toBe(0);
    expect(result.grade).toBe(9);
    expect(result.wrong).toHaveLength(4);
  });

  test('틀린 문항에 내가 고른 답과 정답이 함께 담긴다', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 3 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
    ], bands);

    expect(result.wrong).toEqual([
      { questionId: 'b', chosenIndex: 3, answerIndex: 1 },
    ]);
  });

  test('응답이 없는 문항은 오답 처리하고 chosenIndex는 -1', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
    ], bands);

    expect(result.correct).toBe(1);
    expect(result.wrong).toHaveLength(3);
    expect(result.wrong.every((w) => w.chosenIndex === -1)).toBe(true);
  });

  test('문항 순서대로 오답이 쌓인다', () => {
    const result = scoreTest(questions, [], bands);
    expect(result.wrong.map((w) => w.questionId)).toEqual(['a', 'b', 'c', 'd']);
  });

  test('answerIndex가 없는 문항은 채점 대상에서 제외한다', () => {
    const broken: Question = {
      id: 'x',
      kind: 'typed',
      prompt: '유형형 문항',
      choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }],
      axis: 'EI',
      difficulty: 1,
    };
    const result = scoreTest([...questions, broken], [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 1 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
      { questionId: 'x', chosenIndex: 0 },
    ], bands);

    expect(result.total).toBe(4);
    expect(result.correct).toBe(4);
  });

  test('문항이 하나도 없으면 0점 9급이고 예외를 던지지 않는다', () => {
    const result = scoreTest([], [], bands);
    expect(result.total).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.grade).toBe(9);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/score.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/score'`

- [ ] **Step 3: 구현**

`src/engine/score.ts`:

```ts
import { gradeFor } from './grade';
import type { GradeBand, Question } from './types';

export interface Answer {
  readonly questionId: string;
  /** 미응답은 -1 */
  readonly chosenIndex: number;
}

export interface WrongItem {
  readonly questionId: string;
  readonly chosenIndex: number;
  readonly answerIndex: number;
}

export interface ScoredResult {
  readonly total: number;
  readonly correct: number;
  readonly percent: number;
  readonly grade: number;
  readonly title: string;
  readonly wrong: readonly WrongItem[];
}

/**
 * 정답형 채점.
 * answerIndex가 없는 문항은 채점 대상에서 제외한다(유형형 문항이 섞여도 안전).
 * 응답이 없는 문항은 오답으로 처리하고 chosenIndex를 -1로 남긴다.
 */
export function scoreTest(
  questions: readonly Question[],
  answers: readonly Answer[],
  bands: readonly GradeBand[]
): ScoredResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const scorable = questions.filter((q) => typeof q.answerIndex === 'number');
  const wrong: WrongItem[] = [];
  let correct = 0;

  for (const q of scorable) {
    const answerIndex = q.answerIndex as number;
    const chosenIndex = chosenById.get(q.id) ?? -1;
    if (chosenIndex === answerIndex) {
      correct += 1;
    } else {
      wrong.push({ questionId: q.id, chosenIndex, answerIndex });
    }
  }

  const total = scorable.length;
  const percent = total === 0 ? 0 : (correct / total) * 100;
  const band = gradeFor(correct, total, bands);

  return { total, correct, percent, grade: band.grade, title: band.title, wrong };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/score.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 정답형 채점

미응답은 -1로 오답 처리, 유형형 문항이 섞여도 제외하고 채점.
오답 목록에 고른 답과 정답을 함께 담아 해설 화면이 바로 쓰게 함.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: 출제 (assemble)

**Files:**
- Create: `src/engine/assemble.ts`
- Test: `__tests__/engine/assemble.test.ts`

**Interfaces:**
- Consumes: `Question`, `Difficulty` (Task 4), `mulberry32`, `shuffle` (Task 3)
- Produces:
  - `interface AssembleOptions { count: number; difficultyMix?: Partial<Record<Difficulty, number>>; excludeIds?: readonly string[] }`
  - `assemble(pool: readonly Question[], seed: number, options: AssembleOptions): Question[]`

**동작 규칙:**
1. `difficultyMix`가 있으면 난이도별로 정확히 그 수만큼 뽑는다. 특정 난이도가 부족하면 다른 난이도에서 채운다.
2. `excludeIds`에 있는 문항은 **후순위**로 밀 뿐 완전히 배제하지 않는다 (풀이 작을 때 출제 불가가 되면 안 된다).
3. 풀 전체가 `count`보다 작으면 중복을 허용해 채우고 `console.warn`을 남긴다.
4. 같은 시드는 항상 같은 결과를 준다.
5. 반환 배열의 순서도 시드로 섞는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/engine/assemble.test.ts`:

```ts
import { assemble } from '@/engine/assemble';
import type { Question, Difficulty } from '@/engine/types';

function q(id: string, difficulty: Difficulty): Question {
  return {
    id,
    kind: 'scored',
    prompt: id,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex: 0,
    explanation: '해설',
    difficulty,
  };
}

const pool: readonly Question[] = [
  ...Array.from({ length: 10 }, (_, i) => q(`e${i}`, 1)),
  ...Array.from({ length: 10 }, (_, i) => q(`m${i}`, 2)),
  ...Array.from({ length: 10 }, (_, i) => q(`h${i}`, 3)),
];

describe('assemble', () => {
  test('요청한 개수만큼 정확히 뽑는다', () => {
    expect(assemble(pool, 1, { count: 12 })).toHaveLength(12);
  });

  test('같은 시드는 같은 문항 구성을 준다', () => {
    const a = assemble(pool, 777, { count: 12 });
    const b = assemble(pool, 777, { count: 12 });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  test('다른 시드는 다른 구성을 준다', () => {
    const a = assemble(pool, 1, { count: 12 });
    const b = assemble(pool, 2, { count: 12 });
    expect(a.map((x) => x.id)).not.toEqual(b.map((x) => x.id));
  });

  test('중복 없이 뽑는다', () => {
    const ids = assemble(pool, 5, { count: 12 }).map((x) => x.id);
    expect(new Set(ids).size).toBe(12);
  });

  test('난이도 분포를 지킨다', () => {
    const out = assemble(pool, 9, {
      count: 12,
      difficultyMix: { 1: 4, 2: 5, 3: 3 },
    });
    const count = (d: Difficulty) => out.filter((x) => x.difficulty === d).length;
    expect(count(1)).toBe(4);
    expect(count(2)).toBe(5);
    expect(count(3)).toBe(3);
  });

  test('난이도가 부족하면 다른 난이도에서 채워 총 개수를 맞춘다', () => {
    const thin: readonly Question[] = [
      q('e0', 1), q('e1', 1),
      ...Array.from({ length: 10 }, (_, i) => q(`m${i}`, 2)),
    ];
    const out = assemble(thin, 3, { count: 8, difficultyMix: { 1: 4, 2: 4 } });
    expect(out).toHaveLength(8);
    expect(new Set(out.map((x) => x.id)).size).toBe(8);
  });

  test('excludeIds에 있는 문항은 후순위로 밀린다', () => {
    const exclude = pool.slice(0, 20).map((x) => x.id);
    const out = assemble(pool, 11, { count: 10, excludeIds: exclude });
    const reused = out.filter((x) => exclude.includes(x.id));
    expect(reused).toHaveLength(0);
  });

  test('풀이 요청 수보다 작으면 중복을 허용하고 경고를 남긴다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tiny: readonly Question[] = [q('a', 1), q('b', 1), q('c', 1)];
    const out = assemble(tiny, 1, { count: 5 });
    expect(out).toHaveLength(5);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('빈 풀에서는 빈 배열을 주고 예외를 던지지 않는다', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(assemble([], 1, { count: 5 })).toEqual([]);
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/assemble.test.ts
```

Expected: FAIL — `Cannot find module '@/engine/assemble'`

- [ ] **Step 3: 구현**

`src/engine/assemble.ts`:

```ts
import { mulberry32, shuffle } from './rng';
import type { Difficulty, Question } from './types';

export interface AssembleOptions {
  readonly count: number;
  /** 난이도별 목표 개수. 합이 count와 달라도 count가 우선한다. */
  readonly difficultyMix?: Partial<Record<Difficulty, number>>;
  /** 최근에 나온 문항 ID. 완전 배제가 아니라 후순위로 민다. */
  readonly excludeIds?: readonly string[];
}

/**
 * 문항 풀에서 출제 세트를 만든다.
 * 같은 시드는 항상 같은 결과를 준다.
 */
export function assemble(
  pool: readonly Question[],
  seed: number,
  options: AssembleOptions
): Question[] {
  const { count, difficultyMix, excludeIds } = options;
  if (pool.length === 0) {
    console.warn('[assemble] 문항 풀이 비어 있습니다');
    return [];
  }

  const rand = mulberry32(seed);
  const recent = new Set(excludeIds ?? []);

  // 최근에 안 나온 것을 앞으로, 각 그룹 안에서는 시드로 섞는다.
  const fresh = shuffle(pool.filter((q) => !recent.has(q.id)), rand);
  const stale = shuffle(pool.filter((q) => recent.has(q.id)), rand);
  const ordered = [...fresh, ...stale];

  const picked: Question[] = [];
  const used = new Set<string>();

  const take = (candidates: readonly Question[], want: number): void => {
    for (const q of candidates) {
      if (picked.length >= count || want <= 0) return;
      if (used.has(q.id)) continue;
      picked.push(q);
      used.add(q.id);
      want -= 1;
    }
  };

  // 1단계: 난이도 분포를 먼저 채운다.
  if (difficultyMix) {
    for (const key of [1, 2, 3] as const) {
      const want = difficultyMix[key] ?? 0;
      if (want > 0) take(ordered.filter((q) => q.difficulty === key), want);
    }
  }

  // 2단계: 남은 자리를 난이도 무관하게 채운다.
  take(ordered, count - picked.length);

  // 3단계: 풀이 모자라면 중복을 허용한다.
  if (picked.length < count) {
    console.warn(
      `[assemble] 풀이 부족합니다: ${pool.length}개로 ${count}개를 출제하려 해 중복을 허용합니다`
    );
    let i = 0;
    while (picked.length < count) {
      picked.push(ordered[i % ordered.length] as Question);
      i += 1;
    }
  }

  return shuffle(picked, rand);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/engine/assemble.test.ts
```

Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "엔진: 시드 기반 출제

난이도 분포 강제, 최근 출제 문항 후순위, 풀 부족 시 중복 허용 폴백.
크래시 대신 경고를 남기고 항상 요청한 개수를 채운다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: 콘텐츠 검증 스크립트

잘못된 문항이 앱에 들어가면 오답 해설이 그대로 사용자에게 나간다. 이걸 커밋 전에 막는다.

**Files:**
- Create: `tools/validate-content.ts`
- Test: `__tests__/tools/validate-content.test.ts`

**Interfaces:**
- Consumes: `Question`, `GradeTable` (Task 4)
- Produces:
  - `validateScoredQuestions(questions: readonly Question[], opts: { expectedChoiceCount: number }): string[]`
  - `validateGradeTable(id: string, table: GradeTable): string[]`
  - CLI: `npm run validate:content` → 문제가 있으면 exit 1

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/tools/validate-content.test.ts`:

```ts
import { validateScoredQuestions, validateGradeTable } from '../../tools/validate-content';
import type { Question, GradeTable } from '@/engine/types';

function ok(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 문제`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex: 0,
    explanation: '해설이 있습니다',
    difficulty: 1,
  };
}

const opts = { expectedChoiceCount: 4 };

describe('validateScoredQuestions', () => {
  test('올바른 문항 묶음은 오류가 없다', () => {
    expect(validateScoredQuestions([ok('a'), ok('b')], opts)).toEqual([]);
  });

  test('answerIndex가 범위를 벗어나면 잡는다', () => {
    const bad = { ...ok('a'), answerIndex: 4 };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('answerIndex가 없으면 잡는다', () => {
    const { answerIndex, ...rest } = ok('a');
    const errors = validateScoredQuestions([rest as Question], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('해설이 비어 있으면 잡는다', () => {
    const bad = { ...ok('a'), explanation: '   ' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('해설'))).toBe(true);
  });

  test('ID 중복을 잡는다', () => {
    const errors = validateScoredQuestions([ok('a'), ok('a')], opts);
    expect(errors.some((e) => e.includes('중복'))).toBe(true);
  });

  test('선택지 개수가 규격과 다르면 잡는다', () => {
    const bad = { ...ok('a'), choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }] };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 개수'))).toBe(true);
  });

  test('같은 문항 안의 선택지 텍스트 중복을 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: 'ㄱ' }, { text: 'ㄱ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 텍스트'))).toBe(true);
  });

  test('빈 선택지 텍스트를 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: '' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('비어'))).toBe(true);
  });

  test('오류 메시지에 문항 ID가 들어간다', () => {
    const bad = { ...ok('dialect-gs-0007'), explanation: '' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('dialect-gs-0007'))).toBe(true);
  });
});

describe('validateGradeTable', () => {
  const good: GradeTable = {
    bands: [
      { min: 100, grade: 1, title: '1급' },
      { min: 50, grade: 5, title: '5급' },
      { min: 0, grade: 9, title: '9급' },
    ],
  };

  test('올바른 테이블은 오류가 없다', () => {
    expect(validateGradeTable('t', good)).toEqual([]);
  });

  test('내림차순이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 50, grade: 5, title: '5급' },
        { min: 100, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('내림차순'))).toBe(true);
  });

  test('최상 밴드가 100이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 90, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('100'))).toBe(true);
  });

  test('최하 밴드가 0이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '1급' },
        { min: 10, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('0%'))).toBe(true);
  });

  test('칭호가 비면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('칭호'))).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/tools/validate-content.test.ts
```

Expected: FAIL — `Cannot find module '../../tools/validate-content'`

- [ ] **Step 3: 구현**

`tools/validate-content.ts`:

```ts
import type { GradeTable, Question } from '../src/engine/types';

export interface ScoredValidationOptions {
  /** 텍스트 문항은 4, IQ 도형·수열은 5 */
  readonly expectedChoiceCount: number;
}

/** 정답형 문항 묶음을 검사하고 사람이 읽을 수 있는 오류 목록을 돌려준다. */
export function validateScoredQuestions(
  questions: readonly Question[],
  opts: ScoredValidationOptions
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const q of questions) {
    const at = `[${q.id}]`;

    if (seen.has(q.id)) errors.push(`${at} 문항 ID가 중복됩니다`);
    seen.add(q.id);

    if (q.choices.length !== opts.expectedChoiceCount) {
      errors.push(
        `${at} 선택지 개수가 ${q.choices.length}개입니다 (규격 ${opts.expectedChoiceCount}개)`
      );
    }

    if (typeof q.answerIndex !== 'number') {
      errors.push(`${at} answerIndex가 없습니다`);
    } else if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
      errors.push(
        `${at} answerIndex ${q.answerIndex}가 선택지 범위(0~${q.choices.length - 1})를 벗어납니다`
      );
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${at} 해설이 비어 있습니다`);
    }

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`${at} 질문이 비어 있습니다`);
    }

    const texts: string[] = [];
    q.choices.forEach((c, i) => {
      const text = (c.text ?? '').trim();
      if (text.length === 0 && c.figure === undefined) {
        errors.push(`${at} ${i}번 선택지가 비어 있습니다`);
        return;
      }
      if (texts.includes(text)) {
        errors.push(`${at} 선택지 텍스트가 중복됩니다: "${text}"`);
      }
      texts.push(text);
    });

    if (q.distractorNotes && q.distractorNotes.length !== q.choices.length) {
      errors.push(
        `${at} distractorNotes 길이(${q.distractorNotes.length})가 선택지 수(${q.choices.length})와 다릅니다`
      );
    }
  }

  return errors;
}

/** 급수 테이블이 0~100%를 빈틈없이 덮는지 검사한다. */
export function validateGradeTable(id: string, table: GradeTable): string[] {
  const errors: string[] = [];
  const at = `[${id}]`;
  const bands = table.bands;

  if (bands.length === 0) {
    errors.push(`${at} 급수 밴드가 비어 있습니다`);
    return errors;
  }

  for (let i = 1; i < bands.length; i++) {
    if ((bands[i] as { min: number }).min >= (bands[i - 1] as { min: number }).min) {
      errors.push(`${at} 급수 밴드가 min 기준 내림차순이 아닙니다 (${i}번째)`);
      break;
    }
  }

  if ((bands[0] as { min: number }).min !== 100) {
    errors.push(`${at} 최상 밴드의 min이 100이 아닙니다`);
  }
  if ((bands[bands.length - 1] as { min: number }).min !== 0) {
    errors.push(`${at} 최하 밴드의 min이 0%가 아닙니다`);
  }

  for (const b of bands) {
    if (!b.title || b.title.trim().length === 0) {
      errors.push(`${at} ${b.grade}급의 칭호가 비어 있습니다`);
    }
  }

  return errors;
}

/** CLI 진입점. 문제가 있으면 exit 1. */
async function main(): Promise<void> {
  const gyeongsang = (await import('../src/content/dialect/gyeongsang.json'))
    .default as unknown as Question[];
  const grades = (await import('../src/content/grades.json')).default as unknown as Record<
    string,
    GradeTable
  >;

  const errors: string[] = [
    ...validateScoredQuestions(gyeongsang, { expectedChoiceCount: 4 }),
    ...Object.entries(grades).flatMap(([id, table]) => validateGradeTable(id, table)),
  ];

  if (errors.length > 0) {
    console.error(`콘텐츠 검증 실패 — ${errors.length}건`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log(`콘텐츠 검증 통과 — 문항 ${gyeongsang.length}개, 급수 테이블 ${Object.keys(grades).length}개`);
}

if (require.main === module) {
  void main();
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/tools/validate-content.test.ts
```

Expected: PASS (14 tests). CLI는 아직 문항 파일이 없어 실패하는 게 정상이다 — Task 8에서 통과시킨다.

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "도구: 문항·급수 테이블 검증 스크립트

정답 인덱스 범위, 해설 누락, ID 중복, 선택지 개수·중복,
급수 테이블 커버리지를 검사한다. 오답 해설이 출시되는 걸 막는 방어선.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: 경상도 사투리 문항 15개

**Files:**
- Create: `src/content/dialect/gyeongsang.json`
- Test: `__tests__/content/dialect.test.ts`

**Interfaces:**
- Consumes: `validateScoredQuestions` (Task 7), `Question` (Task 4)
- Produces: `src/content/dialect/gyeongsang.json` — 난이도 1/2/3이 각 5개씩인 15문항

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/content/dialect.test.ts`:

```ts
import { validateScoredQuestions } from '../../tools/validate-content';
import type { Question } from '@/engine/types';
import gyeongsang from '@/content/dialect/gyeongsang.json';

const questions = gyeongsang as unknown as Question[];

describe('경상도 사투리 문항', () => {
  test('검증 스크립트를 통과한다', () => {
    expect(validateScoredQuestions(questions, { expectedChoiceCount: 4 })).toEqual([]);
  });

  test('출제 수(12)보다 충분히 많은 풀을 가진다', () => {
    expect(questions.length).toBeGreaterThanOrEqual(15);
  });

  test('난이도가 1/2/3에 고르게 분포한다', () => {
    for (const d of [1, 2, 3]) {
      expect(questions.filter((q) => q.difficulty === d).length).toBeGreaterThanOrEqual(4);
    }
  });

  test('모든 문항이 scored이고 검증 근거를 남긴다', () => {
    for (const q of questions) {
      expect(q.kind).toBe('scored');
      expect(q.source && q.source.length).toBeGreaterThan(0);
    }
  });

  test('ID 규칙을 지킨다', () => {
    for (const q of questions) {
      expect(q.id).toMatch(/^dialect-gs-\d{4}$/);
    }
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/content/dialect.test.ts
```

Expected: FAIL — `Cannot find module '@/content/dialect/gyeongsang.json'`

- [ ] **Step 3: 문항 파일 작성**

`src/content/dialect/gyeongsang.json`:

```json
[
  {
    "id": "dialect-gs-0001",
    "kind": "scored",
    "prompt": "\"개안타\"는 무슨 뜻일까요?",
    "choices": [
      { "text": "괜찮다" },
      { "text": "개운하다" },
      { "text": "가엾다" },
      { "text": "귀찮다" }
    ],
    "answerIndex": 0,
    "explanation": "'괜찮다'가 경상 방언에서 '개안타/개안네'로 줄어든 형태입니다. \"개안나?\"는 \"괜찮니?\"가 됩니다.",
    "difficulty": 1,
    "tags": ["형용사"],
    "source": "경상 방언 축약형 (괜찮다 → 개안타)"
  },
  {
    "id": "dialect-gs-0002",
    "kind": "scored",
    "prompt": "\"억수로 좋다\"에서 '억수로'는?",
    "choices": [
      { "text": "몹시, 매우" },
      { "text": "억지로" },
      { "text": "가끔" },
      { "text": "겨우" }
    ],
    "answerIndex": 0,
    "explanation": "'억수'는 물이 쏟아지듯 많다는 데서 온 말로, 부사로 쓰여 '아주·매우'를 뜻합니다. '억지로'와는 어원이 다릅니다.",
    "difficulty": 1,
    "tags": ["부사"],
    "source": "억수(장대비) → 정도 부사로 전이"
  },
  {
    "id": "dialect-gs-0003",
    "kind": "scored",
    "prompt": "\"우얄꼬\"를 표준어로 옮기면?",
    "choices": [
      { "text": "어떻게 하나" },
      { "text": "왜 그럴까" },
      { "text": "언제 올까" },
      { "text": "누가 할까" }
    ],
    "answerIndex": 0,
    "explanation": "'어찌하다'가 '우야다'로 바뀌고 여기에 의문형 어미 '-ㄹ꼬'가 붙은 말입니다. 난감할 때 혼잣말로 씁니다.",
    "difficulty": 1,
    "tags": ["동사"],
    "source": "어찌하다 → 우야다 + -ㄹ꼬"
  },
  {
    "id": "dialect-gs-0004",
    "kind": "scored",
    "prompt": "남동생이 손위 남자 형제를 부르는 \"히야\"는?",
    "choices": [
      { "text": "형" },
      { "text": "삼촌" },
      { "text": "친구" },
      { "text": "할아버지" }
    ],
    "answerIndex": 0,
    "explanation": "'형아'가 경상 방언에서 '히야'로 실현된 형태입니다. 자기보다 나이 많은 남자를 친근하게 부를 때도 씁니다.",
    "difficulty": 1,
    "tags": ["호칭"],
    "source": "형아 → 히야 (모음 변화)"
  },
  {
    "id": "dialect-gs-0005",
    "kind": "scored",
    "prompt": "\"이바구 좀 하자\"에서 '이바구'는?",
    "choices": [
      { "text": "이야기" },
      { "text": "내기" },
      { "text": "화해" },
      { "text": "식사" }
    ],
    "answerIndex": 0,
    "explanation": "'이야기'의 경상 방언형입니다. 부산 초량의 '이바구길'이라는 지명도 여기서 나왔습니다.",
    "difficulty": 1,
    "tags": ["명사"],
    "source": "이야기 → 이바구 / 부산 이바구길 지명"
  },
  {
    "id": "dialect-gs-0006",
    "kind": "scored",
    "prompt": "\"단디 해라\"에서 '단디'는?",
    "choices": [
      { "text": "단단히, 야무지게" },
      { "text": "딱 한 번만" },
      { "text": "단둘이서" },
      { "text": "단념하고" }
    ],
    "answerIndex": 0,
    "explanation": "'단단히'가 줄어든 부사입니다. 축약된 정도 부사라서 '한 번만' 같은 횟수 의미는 들어 있지 않습니다.",
    "difficulty": 2,
    "tags": ["부사"],
    "source": "단단히 → 단디 (부사 축약)"
  },
  {
    "id": "dialect-gs-0007",
    "kind": "scored",
    "prompt": "시장에서 파는 \"정구지\"는 어떤 채소일까요?",
    "choices": [
      { "text": "부추" },
      { "text": "미나리" },
      { "text": "쑥갓" },
      { "text": "고들빼기" }
    ],
    "answerIndex": 0,
    "explanation": "부추를 가리키는 경상·충청 방언입니다. '정구지찌짐'은 부추전을 말합니다.",
    "difficulty": 2,
    "tags": ["명사", "음식"],
    "source": "부추의 지역 방언형 (정구지찌짐)"
  },
  {
    "id": "dialect-gs-0008",
    "kind": "scored",
    "prompt": "\"만다꼬 그캤노\"에서 '만다꼬'는?",
    "choices": [
      { "text": "뭐하러, 뭐한다고" },
      { "text": "만약에" },
      { "text": "많다고" },
      { "text": "먼저" }
    ],
    "answerIndex": 0,
    "explanation": "'무엇 한다고'가 줄어 '만다꼬'가 됐습니다. 굳이 그럴 필요가 있었냐고 타박할 때 씁니다.",
    "difficulty": 2,
    "tags": ["부사"],
    "source": "무엇 한다고 → 만다꼬"
  },
  {
    "id": "dialect-gs-0009",
    "kind": "scored",
    "prompt": "\"언자 그만해라\"에서 '언자'는?",
    "choices": [
      { "text": "이제" },
      { "text": "얼른" },
      { "text": "언제" },
      { "text": "어차피" }
    ],
    "answerIndex": 0,
    "explanation": "'이제'의 경상 방언형입니다. 발음이 비슷한 '언제'와 헷갈리기 쉬운데, '언자'는 시점을 묻는 말이 아니라 '지금부터'라는 뜻입니다.",
    "difficulty": 2,
    "tags": ["부사"],
    "source": "이제 → 언자 (모음 변화)"
  },
  {
    "id": "dialect-gs-0010",
    "kind": "scored",
    "prompt": "\"가가 가가?\"는 무슨 뜻일까요?",
    "choices": [
      { "text": "걔가 그 애냐?" },
      { "text": "같이 갈래?" },
      { "text": "가지고 갔니?" },
      { "text": "가다가 말았니?" }
    ],
    "answerIndex": 0,
    "explanation": "'그 아이가'가 '가가'로 줄고, 뒤의 '가가'는 '그 아이인가'입니다. 성조로만 구분되는 경상 방언의 대표 예시입니다.",
    "difficulty": 2,
    "tags": ["문장", "성조"],
    "source": "그 아이 → 가 (지시대명사 축약), 경상 성조 언어 특징"
  },
  {
    "id": "dialect-gs-0011",
    "kind": "scored",
    "prompt": "레몬을 먹고 \"쌔그랍다\"고 했다면?",
    "choices": [
      { "text": "시다" },
      { "text": "쓰다" },
      { "text": "짜다" },
      { "text": "떫다" }
    ],
    "answerIndex": 0,
    "explanation": "신맛을 뜻하는 '시다'의 경상 방언형입니다. 발음이 '쓰다'와 비슷해 헷갈리지만 쓴맛이 아니라 신맛입니다.",
    "difficulty": 3,
    "tags": ["형용사", "맛"],
    "source": "시다 → 새그랍다/쌔그랍다"
  },
  {
    "id": "dialect-gs-0012",
    "kind": "scored",
    "prompt": "국밥을 먹고 \"대끼리다\"라고 했다면?",
    "choices": [
      { "text": "최고다" },
      { "text": "너무 뜨겁다" },
      { "text": "양이 적다" },
      { "text": "느끼하다" }
    ],
    "answerIndex": 0,
    "explanation": "썩 훌륭하다는 뜻의 감탄 표현입니다. '대끼리네'는 '끝내준다'에 가깝습니다.",
    "difficulty": 3,
    "tags": ["감탄"],
    "source": "경상 방언 감탄 표현 (대끼리)"
  },
  {
    "id": "dialect-gs-0013",
    "kind": "scored",
    "prompt": "\"짜다리 안 좋다\"에서 '짜다리'는?",
    "choices": [
      { "text": "별로, 그다지" },
      { "text": "아주 많이" },
      { "text": "짜게" },
      { "text": "자주" }
    ],
    "answerIndex": 0,
    "explanation": "'그다지'에 해당하는 부사로, 뒤에 부정 표현이 따라옵니다. 정도가 크다는 뜻이 아니라 오히려 약하다는 뜻입니다.",
    "difficulty": 3,
    "tags": ["부사"],
    "source": "그다지 → 짜다리 (부정 호응 부사)"
  },
  {
    "id": "dialect-gs-0014",
    "kind": "scored",
    "prompt": "\"그런 거 쌔삐맀다\"는 무슨 뜻일까요?",
    "choices": [
      { "text": "널려 있다, 흔하다" },
      { "text": "다 써버렸다" },
      { "text": "상해서 버렸다" },
      { "text": "숨겨두었다" }
    ],
    "answerIndex": 0,
    "explanation": "'쌔다(쌓이다)'에 '버렸다'가 붙어 아주 흔하다는 뜻이 됐습니다. 버렸다는 글자 때문에 없어졌다고 읽기 쉬운데 정반대입니다.",
    "difficulty": 3,
    "tags": ["동사"],
    "source": "쌔다(쌓이다) + 버리다 → 흔하다"
  },
  {
    "id": "dialect-gs-0015",
    "kind": "scored",
    "prompt": "\"어제 디비 잤다\"에서 '디비 자다'는?",
    "choices": [
      { "text": "곯아떨어져 푹 잤다" },
      { "text": "밤을 새웠다" },
      { "text": "잠을 설쳤다" },
      { "text": "낮잠을 잤다" }
    ],
    "answerIndex": 0,
    "explanation": "'뒤집다'의 방언형 '디비다'에서 온 말로, 뒤집어질 만큼 깊이 잤다는 뜻입니다. 잠을 못 잤다는 뜻이 아닙니다.",
    "difficulty": 3,
    "tags": ["동사"],
    "source": "뒤집다 → 디비다"
  }
]
```

- [ ] **Step 4: 테스트와 CLI 검증 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/content/dialect.test.ts && npm run validate:content
```

Expected: PASS (5 tests) + `콘텐츠 검증 통과 — 문항 15개, 급수 테이블 1개`

- [ ] **Step 5: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "콘텐츠: 경상도 사투리 문항 15개

난이도 1/2/3 각 5개, 전 문항에 정답 해설과 검증 근거 포함.
전부 자체 창작이며 기존 문제집을 옮기지 않았다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: 디자인 시스템

**Files:**
- Create: `src/ui/tokens.ts`, `src/ui/HardShadow.tsx`, `src/ui/Button.tsx`, `src/ui/Card.tsx`, `src/ui/Badge.tsx`, `src/ui/AdSlot.tsx`
- Modify: `package.json` (폰트 패키지 추가)
- Test: `__tests__/ui/Button.test.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `colors`, `radius`, `borderWidth`, `space`, `font` (tokens.ts)
  - `<HardShadow offset?, radius?, children>` — 네오브루탈 하드 섀도우 래퍼
  - `<Button label, onPress, color?, disabled?, testID?>`
  - `<Card color?, radius?, children, style?>`
  - `<Badge label, color?>`
  - `<AdSlot />` — v1은 `null`

**구현 메모 1 — 하드 섀도우:** RN의 `elevation`은 부드러운 그림자라 네오브루탈 톤이 안 나온다. 카드 뒤에 같은 크기·같은 radius의 검정 `View`를 오프셋만큼 밀어 깔아서 하드 섀도우를 만든다. 이 방식은 Android 8부터 최신까지, iOS까지 동일하게 보인다.

**구현 메모 2 — 폰트:** 스펙은 본문 폰트로 Pretendard를 지정했으나, Pretendard의 npm 패키지는 웹폰트(woff2) 위주라 RN이 쓰는 ttf/otf를 안정적으로 얻으려면 GitHub 릴리스에서 파일을 직접 받아야 한다. **`@expo-google-fonts/noto-sans-kr`로 대체한다** — npm 설치만으로 끝나고, 같은 SIL OFL이며, 한글 자소 커버리지가 더 넓다. 제목용 Black Han Sans는 스펙대로 `@expo-google-fonts/black-han-sans`를 쓴다. 두 폰트 모두 앱에 번들되므로 iOS로 옮겨도 레이아웃이 그대로다.

- [ ] **Step 0: 폰트 패키지 설치**

```bash
cd /c/workAndroid/TestMin && npx expo install expo-font expo-splash-screen @expo-google-fonts/black-han-sans @expo-google-fonts/noto-sans-kr
```

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/ui/Button.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '@/ui/Button';
import { colors, font } from '@/ui/tokens';

describe('Button', () => {
  test('라벨을 보여준다', () => {
    render(<Button label="응시하기" onPress={() => {}} />);
    expect(screen.getByText('응시하기')).toBeTruthy();
  });

  test('누르면 onPress가 불린다', () => {
    const onPress = jest.fn();
    render(<Button label="응시하기" onPress={onPress} testID="go" />);
    fireEvent.press(screen.getByTestId('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled이면 onPress가 불리지 않는다', () => {
    const onPress = jest.fn();
    render(<Button label="응시하기" onPress={onPress} disabled testID="go" />);
    fireEvent.press(screen.getByTestId('go'));
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/ui/Button.test.tsx
```

Expected: FAIL — `Cannot find module '@/ui/Button'`

- [ ] **Step 3: 토큰 작성**

`src/ui/tokens.ts`:

```ts
export const colors = {
  ink: '#111111',
  cream: '#FFF8E1',
  white: '#FFFFFF',
  yellow: '#FFD43B',
  coral: '#FF8A5B',
  mint: '#4ECDC4',
  lavender: '#B197FC',
  sky: '#74C0FC',
  muted: 'rgba(17,17,17,0.6)',
} as const;

export const borderWidth = {
  card: 2.5,
  strong: 3,
} as const;

export const radius = {
  button: 12,
  card: 14,
  panel: 24,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  /** 시스템 글자 확대는 1.3배까지만 허용한다. 그 이상은 두꺼운 테두리 레이아웃이 깨진다. */
  maxScale: 1.3,
  /**
   * 번들 폰트 이름. app/_layout.tsx의 useFonts에서 이 키로 등록한다.
   * fontWeight 대신 폰트 패밀리로 굵기를 고른다 — 안드로이드는
   * 커스텀 폰트에 fontWeight를 적용하면 가짜 볼드가 생겨 모양이 뭉개진다.
   */
  family: {
    display: 'BlackHanSans_400Regular',
    body: 'NotoSansKR_500Medium',
    bold: 'NotoSansKR_700Bold',
    black: 'NotoSansKR_900Black',
  },
  size: {
    caption: 11,
    body: 14,
    lead: 16,
    title: 19,
    display: 28,
    grade: 46,
  },
} as const;

/**
 * fontWeight → fontFamily 치환 규칙.
 * 이 계획의 모든 StyleSheet에서 아래 표대로 바꿔 쓴다.
 *
 *   fontWeight: '900'  →  fontFamily: font.family.black
 *   fontWeight: '800'  →  fontFamily: font.family.bold
 *   fontWeight: '700'  →  fontFamily: font.family.bold
 *   fontWeight: '600'  →  fontFamily: font.family.body
 *
 * 큰 숫자(급수 표시)와 앱 이름만 font.family.display를 쓴다.
 * 커스텀 폰트에 fontWeight를 함께 주면 안드로이드가 가짜 볼드를 만들어
 * 획이 뭉개지므로 두 속성을 동시에 쓰지 않는다.
 */

/** 카테고리별 대표색 */
export const categoryColor = {
  iq: colors.mint,
  personality: colors.lavender,
  mz: colors.coral,
  dialect: colors.yellow,
  psych: colors.sky,
} as const;
```

- [ ] **Step 4: HardShadow 작성**

`src/ui/HardShadow.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius as radiusToken } from './tokens';

interface Props {
  readonly offset?: number;
  readonly radius?: number;
  readonly style?: ViewStyle;
  readonly children: React.ReactNode;
}

/**
 * 네오브루탈 하드 섀도우.
 * RN의 elevation은 부드러운 그림자라 톤이 안 나오므로,
 * 뒤에 같은 모양의 검정 View를 오프셋만큼 밀어 깐다.
 * Android 8부터 최신까지, iOS까지 동일하게 보인다.
 */
export function HardShadow({
  offset = 3,
  radius = radiusToken.card,
  style,
  children,
}: Props) {
  return (
    <View style={style}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.ink,
            borderRadius: radius,
            transform: [{ translateX: offset }, { translateY: offset }],
          },
        ]}
      />
      {children}
    </View>
  );
}
```

- [ ] **Step 5: Button / Card / Badge / AdSlot 작성**

`src/ui/Button.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { HardShadow } from './HardShadow';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly onPress: () => void;
  readonly color?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
}

export function Button({
  label,
  onPress,
  color = colors.white,
  disabled = false,
  testID,
}: Props) {
  return (
    <HardShadow offset={disabled ? 0 : 3} radius={radius.button} style={styles.wrap}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: disabled ? '#E8E8E8' : color },
        ]}
      >
        <Text
          style={styles.label}
          maxFontSizeMultiplier={font.maxScale}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.button,
  },
  label: {
    color: colors.ink,
    fontSize: font.size.body,
    fontFamily: font.family.black,
    textAlign: 'center',
  },
});
```

`src/ui/Card.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { HardShadow } from './HardShadow';
import { borderWidth, colors, radius as radiusToken, space } from './tokens';

interface Props {
  readonly color?: string;
  readonly radius?: number;
  readonly offset?: number;
  readonly style?: ViewStyle;
  readonly children: React.ReactNode;
}

export function Card({
  color = colors.white,
  radius = radiusToken.card,
  offset = 3,
  style,
  children,
}: Props) {
  return (
    <HardShadow offset={offset} radius={radius} style={style}>
      <View
        style={[
          styles.card,
          { backgroundColor: color, borderRadius: radius },
        ]}
      >
        {children}
      </View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    padding: space.md,
  },
});
```

`src/ui/Badge.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly color?: string;
}

export function Badge({ label, color = colors.white }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  text: {
    color: colors.ink,
    fontSize: font.size.caption,
    fontWeight: '800',
  },
});
```

`src/ui/AdSlot.tsx`:

```tsx
/**
 * 광고 자리.
 * v1은 광고를 넣지 않지만 레이아웃 자리는 지금 확보해둔다.
 * 나중에 AdMob을 붙일 때 이 파일만 바꾸면 화면이 흔들리지 않는다.
 * 광고 도입 시 INTERNET 권한과 광고 ID 수집 신고가 함께 필요하다.
 */
export function AdSlot(): null {
  return null;
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/ui/Button.test.tsx && npx tsc --noEmit
```

Expected: PASS (6 tests), 타입 에러 0개

- [ ] **Step 7: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "UI: 네오브루탈 팝 디자인 시스템

토큰(색·테두리·반경·간격·타이포) + HardShadow + Button/Card/Badge/AdSlot.
하드 섀도우는 elevation 대신 뒤에 검정 View를 깔아 구현해
안드로이드 8부터 iOS까지 같은 모양이 나오게 했다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: 응시 세션 상태와 홈 화면

**Files:**
- Create: `src/store/session.ts`, `src/content/registry.ts`
- Modify: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`
- Create: `app/(tabs)/records.tsx`, `app/(tabs)/notes.tsx`, `app/(tabs)/settings.tsx`
- Test: `__tests__/store/session.test.ts`

**Interfaces:**
- Consumes: `Question` (Task 4), `assemble` (Task 6), `scoreTest` (Task 5), `gradeFor` (Task 4), UI 컴포넌트 (Task 9)
- Produces:
  - `useSession` (Zustand): `{ testId, variant, seed, questions, answers, start(), answer(), reset() }`
  - `src/content/registry.ts`: `getPool(testId, variant)`, `getGradeBands(tableId)`, `CATEGORIES`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/store/session.test.ts`:

```ts
import { useSession } from '@/store/session';

const questions = [
  { id: 'a', kind: 'scored' as const, prompt: 'a', choices: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }], answerIndex: 0, explanation: 'x', difficulty: 1 as const },
  { id: 'b', kind: 'scored' as const, prompt: 'b', choices: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }], answerIndex: 1, explanation: 'x', difficulty: 1 as const },
];

beforeEach(() => {
  useSession.getState().reset();
});

describe('useSession', () => {
  test('시작하면 문항이 담기고 응답은 비어 있다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    const s = useSession.getState();
    expect(s.testId).toBe('dialect');
    expect(s.variant).toBe('gyeongsang');
    expect(s.seed).toBe(123);
    expect(s.questions).toHaveLength(2);
    expect(s.answers).toEqual([]);
  });

  test('답을 고르면 순서대로 쌓인다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 2);
    expect(useSession.getState().answers).toEqual([
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 2 },
    ]);
  });

  test('같은 문항에 다시 답하면 덮어쓴다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('a', 3);
    expect(useSession.getState().answers).toEqual([{ questionId: 'a', chosenIndex: 3 }]);
  });

  test('reset하면 비워진다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 123, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().reset();
    expect(useSession.getState().questions).toEqual([]);
    expect(useSession.getState().answers).toEqual([]);
    expect(useSession.getState().testId).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/store/session.test.ts
```

Expected: FAIL — `Cannot find module '@/store/session'`

- [ ] **Step 3: 세션 스토어 구현**

`src/store/session.ts`:

```ts
import { create } from 'zustand';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

interface SessionState {
  testId: string | null;
  variant: string | null;
  seed: number;
  questions: readonly Question[];
  answers: readonly Answer[];
  start: (testId: string, variant: string, seed: number, questions: readonly Question[]) => void;
  answer: (questionId: string, chosenIndex: number) => void;
  reset: () => void;
}

const empty = {
  testId: null,
  variant: null,
  seed: 0,
  questions: [] as readonly Question[],
  answers: [] as readonly Answer[],
};

export const useSession = create<SessionState>((set) => ({
  ...empty,
  start: (testId, variant, seed, questions) =>
    set({ testId, variant, seed, questions, answers: [] }),
  answer: (questionId, chosenIndex) =>
    set((state) => {
      const exists = state.answers.some((a) => a.questionId === questionId);
      // 이미 답한 문항이면 원래 자리에서 값만 바꾼다 (순서 보존).
      const answers = exists
        ? state.answers.map((a) =>
            a.questionId === questionId ? { questionId, chosenIndex } : a
          )
        : [...state.answers, { questionId, chosenIndex }];
      return { answers };
    }),
  reset: () => set({ ...empty }),
}));
```

- [ ] **Step 4: 콘텐츠 레지스트리 작성**

`src/content/registry.ts`:

```ts
import type { GradeBand, GradeTable, Question } from '@/engine/types';
import gradesJson from './grades.json';
import gyeongsang from './dialect/gyeongsang.json';

const grades = gradesJson as unknown as Record<string, GradeTable>;

export interface CategoryMeta {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly emoji: string;
  readonly colorKey: 'iq' | 'personality' | 'mz' | 'dialect' | 'psych';
  readonly questionCount: number;
  /** 계획 1에서 실제로 응시 가능한지 */
  readonly available: boolean;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'iq', title: 'IQ 고사', subtitle: '도형·수열·유추', emoji: '🧠', colorKey: 'iq', questionCount: 20, available: false },
  { id: 'personality', title: '성격 16유형 고사', subtitle: '4개 축 × 6문항', emoji: '🎭', colorKey: 'personality', questionCount: 24, available: false },
  { id: 'mz', title: 'MZ 고사', subtitle: '신조어·밈 해독', emoji: '📱', colorKey: 'mz', questionCount: 15, available: false },
  { id: 'dialect', title: '사투리 고사', subtitle: '6개 지역 · 골라서 응시', emoji: '🗣️', colorKey: 'dialect', questionCount: 12, available: true },
  { id: 'psych', title: '심리 테스트', subtitle: '연애·스트레스 성향', emoji: '🔮', colorKey: 'psych', questionCount: 12, available: false },
];

export interface RegionMeta {
  readonly id: string;
  readonly title: string;
  readonly available: boolean;
}

export const DIALECT_REGIONS: readonly RegionMeta[] = [
  { id: 'gyeongsang', title: '경상도', available: true },
  { id: 'jeolla', title: '전라도', available: false },
  { id: 'chungcheong', title: '충청도', available: false },
  { id: 'gangwon', title: '강원도', available: false },
  { id: 'jeju', title: '제주도', available: false },
  { id: 'seoul', title: '서울·경기', available: false },
];

const POOLS: Record<string, readonly Question[]> = {
  'dialect:gyeongsang': gyeongsang as unknown as Question[],
};

/** 없는 조합이면 빈 배열을 준다 (호출부가 크래시하지 않게). */
export function getPool(testId: string, variant: string): readonly Question[] {
  return POOLS[`${testId}:${variant}`] ?? [];
}

export function gradeTableId(testId: string, variant: string): string {
  return `${testId}-${variant}`;
}

/** 없는 테이블이면 0~100을 덮는 최소 테이블을 준다. */
export function getGradeBands(tableId: string): readonly GradeBand[] {
  return (
    grades[tableId]?.bands ?? [
      { min: 100, grade: 1, title: '1급' },
      { min: 0, grade: 9, title: '9급' },
    ]
  );
}
```

- [ ] **Step 5: 루트 레이아웃과 탭 셸 작성**

안전영역은 `SafeAreaProvider` + react-navigation의 헤더/탭바가 처리한다. 화면 컴포넌트에서 `SafeAreaView`를 따로 쓰지 않는다 — 헤더가 있는 화면에 중복으로 넣으면 상단에 빈 띠가 생긴다. `app.json`의 `edgeToEdgeEnabled: true`와 조합해 안드로이드 15+ 의 강제 edge-to-edge에서도 콘텐츠가 시스템 바에 가리지 않는다.

`app/_layout.tsx`:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import {
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import { colors, font } from '@/ui/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BlackHanSans_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_900Black,
  });

  useEffect(() => {
    // 폰트 로딩이 실패해도 시스템 폰트로 앱을 띄운다. 스플래시에 갇히면 안 된다.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: font.family.black },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

`app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { colors } from '@/ui/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '900' },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 2.5,
          borderTopColor: colors.ink,
        },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '응시' }} />
      <Tabs.Screen name="records" options={{ title: '성적표' }} />
      <Tabs.Screen name="notes" options={{ title: '오답노트' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
```

- [ ] **Step 6: 홈 화면 작성**

`app/(tabs)/index.tsx`:

```tsx
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { AdSlot } from '@/ui/AdSlot';
import { CATEGORIES } from '@/content/registry';
import { categoryColor, colors, font, space } from '@/ui/tokens';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="home-scroll"
    >
      <Text style={styles.brand} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족
      </Text>
      <Text style={styles.brandSub} maxFontSizeMultiplier={font.maxScale}>
        오늘도 응시하셨습니다
      </Text>

      {CATEGORIES.map((c) => (
        <Pressable
          key={c.id}
          testID={`category-${c.id}`}
          accessibilityRole="button"
          onPress={() => {
            if (!c.available) {
              Alert.alert('준비 중입니다', `${c.title}은(는) 다음 업데이트에 열립니다.`);
              return;
            }
            router.push('/test/dialect/intro');
          }}
        >
          <Card color={categoryColor[c.colorKey]} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{c.emoji}</Text>
              <View style={styles.grow}>
                <Text style={styles.title} maxFontSizeMultiplier={font.maxScale}>
                  {c.title}
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={font.maxScale}>
                  {c.available ? c.subtitle : '준비 중'}
                </Text>
              </View>
              <Badge label={`${c.questionCount}문`} />
            </View>
          </Card>
        </Pressable>
      ))}

      <AdSlot />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  brand: { fontSize: font.size.display, fontWeight: '900', color: colors.ink },
  brandSub: {
    fontSize: font.size.caption,
    fontWeight: '700',
    color: colors.muted,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  card: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  emoji: { fontSize: 24 },
  title: { fontSize: font.size.lead, fontWeight: '900', color: colors.ink },
  subtitle: {
    fontSize: font.size.caption,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 2,
  },
});
```

- [ ] **Step 7: 나머지 탭 스텁 작성**

세 파일 모두 같은 구조다. `app/(tabs)/records.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '@/ui/tokens';

export default function RecordsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        아직 기록이 없습니다.{'\n'}응시하면 여기에 쌓입니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  text: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
```

`app/(tabs)/notes.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '@/ui/tokens';

export default function NotesScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        틀린 문제가 없습니다.{'\n'}응시하면 여기에 모입니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  text: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
```

`app/(tabs)/settings.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '@/ui/tokens';

export default function SettingsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.version} maxFontSizeMultiplier={font.maxScale}>
        테스트의 민족 v1.0.0
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        이 앱의 모든 테스트는 오락을 목적으로 만들어졌으며{'\n'}
        임상적·진단적 검사가 아닙니다.
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        모든 문항은 자체 제작했습니다.
      </Text>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        글꼴: Black Han Sans, Noto Sans KR{'\n'}
        (SIL Open Font License 1.1)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.lg,
  },
  version: { fontSize: font.size.lead, fontWeight: '900', color: colors.ink },
  text: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/store/session.test.ts && npx tsc --noEmit
```

Expected: PASS (4 tests), 타입 에러 0개

- [ ] **Step 9: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "화면: 4탭 셸 + 홈(5개 카테고리 카드)

응시 세션 Zustand 스토어와 콘텐츠 레지스트리 추가.
계획 1에서는 사투리만 진입 가능하고 나머지는 준비 중 안내.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: 지역 선택과 문항 진행 화면

**Files:**
- Create: `app/test/dialect/intro.tsx`, `app/test/dialect/quiz.tsx`
- Test: `__tests__/screens/quiz.test.tsx`

**Interfaces:**
- Consumes: `useSession` (Task 10), `getPool` (Task 10), `assemble` (Task 6), `hashSeed` (Task 3), UI 컴포넌트 (Task 9)
- Produces: 라우트 `/test/dialect/intro`, `/test/dialect/quiz`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/screens/quiz.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import QuizScreen from '../../app/test/dialect/quiz';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const push = jest.fn();
const replace = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push, replace, back: jest.fn() }),
  useLocalSearchParams: () => ({ region: 'gyeongsang' }),
}));

function q(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: '보기1' }, { text: '보기2' }, { text: '보기3' }, { text: '보기4' }],
    answerIndex: 0,
    explanation: '해설',
    difficulty: 1,
  };
}

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  useSession.getState().reset();
  useSession.getState().start('dialect', 'gyeongsang', 1, [q('a'), q('b')]);
});

describe('QuizScreen', () => {
  test('첫 문항의 질문과 선택지를 보여준다', () => {
    render(<QuizScreen />);
    expect(screen.getByText('a 질문')).toBeTruthy();
    expect(screen.getByText('보기1')).toBeTruthy();
    expect(screen.getByText('보기4')).toBeTruthy();
  });

  test('진행 상황을 보여준다', () => {
    render(<QuizScreen />);
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  test('선택지를 고르면 다음 문항으로 넘어간다', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByTestId('choice-0'));
    expect(screen.getByText('b 질문')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  test('고른 답이 세션에 기록된다', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByTestId('choice-2'));
    expect(useSession.getState().answers).toEqual([
      { questionId: 'a', chosenIndex: 2 },
    ]);
  });

  test('마지막 문항을 풀면 결과 화면으로 이동한다', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByTestId('choice-0'));
    fireEvent.press(screen.getByTestId('choice-1'));
    expect(replace).toHaveBeenCalledWith('/test/dialect/result');
  });

  test('세션이 비어 있으면 크래시하지 않고 안내를 보여준다', () => {
    useSession.getState().reset();
    render(<QuizScreen />);
    expect(screen.getByText('응시 중인 시험이 없습니다')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/screens/quiz.test.tsx
```

Expected: FAIL — `Cannot find module '../../app/test/dialect/quiz'`

- [ ] **Step 3: 지역 선택 화면 구현**

`app/test/dialect/intro.tsx`:

```tsx
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { DIALECT_REGIONS, getPool } from '@/content/registry';
import { useSession } from '@/store/session';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import { colors, font, space } from '@/ui/tokens';
import { useState } from 'react';

const QUESTION_COUNT = 12;
const DIFFICULTY_MIX = { 1: 4, 2: 5, 3: 3 } as const;

export default function DialectIntroScreen() {
  const router = useRouter();
  const start = useSession((s) => s.start);
  const [selected, setSelected] = useState('gyeongsang');

  const begin = () => {
    const pool = getPool('dialect', selected);
    if (pool.length === 0) {
      Alert.alert('준비 중입니다', '이 지역 문항은 다음 업데이트에 열립니다.');
      return;
    }
    const seed = hashSeed(`dialect:${selected}:${Date.now()}`);
    const questions = assemble(pool, seed, {
      count: QUESTION_COUNT,
      difficultyMix: DIFFICULTY_MIX,
    });
    start('dialect', selected, seed, questions);
    router.push('/test/dialect/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '사투리 고사' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.heading} maxFontSizeMultiplier={font.maxScale}>
          어느 지역으로{'\n'}응시하시겠습니까?
        </Text>

        <View style={styles.grid}>
          {DIALECT_REGIONS.map((r) => (
            <Pressable
              key={r.id}
              testID={`region-${r.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === r.id }}
              style={styles.cell}
              onPress={() => {
                if (!r.available) {
                  Alert.alert('준비 중입니다', `${r.title} 문항은 다음 업데이트에 열립니다.`);
                  return;
                }
                setSelected(r.id);
              }}
            >
              <Card
                color={selected === r.id ? colors.yellow : colors.white}
                offset={r.available ? 3 : 0}
              >
                <Text
                  style={[styles.cellText, !r.available && styles.dim]}
                  maxFontSizeMultiplier={font.maxScale}
                >
                  {r.title}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
          지역별로 급수가 따로 매겨집니다. 경상도 1급인데 제주도 9급인 게 이 시험의 재미입니다.
        </Text>

        <Button
          label="응시하기 →"
          color={colors.yellow}
          onPress={begin}
          testID="begin"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  heading: {
    fontSize: font.size.title,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 28,
    marginBottom: space.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: '47%' },
  cellText: {
    textAlign: 'center',
    fontSize: font.size.body,
    fontWeight: '900',
    color: colors.ink,
    paddingVertical: space.sm,
  },
  dim: { color: colors.muted },
  note: {
    fontSize: font.size.caption,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 18,
    marginVertical: space.lg,
  },
});
```

- [ ] **Step 4: 문항 진행 화면 구현**

`app/test/dialect/quiz.tsx`:

```tsx
import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { useSession } from '@/store/session';
import { colors, font, space } from '@/ui/tokens';

export default function QuizScreen() {
  const router = useRouter();
  const questions = useSession((s) => s.questions);
  const answer = useSession((s) => s.answer);
  const [index, setIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          응시 중인 시험이 없습니다
        </Text>
      </View>
    );
  }

  const current = questions[index];
  if (current === undefined) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          응시 중인 시험이 없습니다
        </Text>
      </View>
    );
  }

  const choose = (choiceIndex: number) => {
    answer(current.id, choiceIndex);
    if (index + 1 >= questions.length) {
      router.replace('/test/dialect/result');
      return;
    }
    setIndex(index + 1);
  };

  return (
    <>
      <Stack.Screen options={{ title: '사투리 고사', headerBackVisible: true }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Badge label={`${index + 1} / ${questions.length}`} color={colors.yellow} />

        <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
          {current.prompt}
        </Text>

        {current.choices.map((c, i) => (
          <Pressable
            key={`${current.id}-${i}`}
            testID={`choice-${i}`}
            accessibilityRole="button"
            onPress={() => choose(i)}
          >
            <Card style={styles.choice}>
              <Text style={styles.choiceText} maxFontSizeMultiplier={font.maxScale}>
                {c.text ?? ''}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  prompt: {
    fontSize: font.size.title,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 28,
    marginTop: space.md,
    marginBottom: space.lg,
  },
  choice: { marginBottom: space.md },
  choiceText: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.ink,
    paddingVertical: space.xs,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontWeight: '800', color: colors.muted },
});
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/screens/quiz.test.tsx && npx tsc --noEmit
```

Expected: PASS (6 tests), 타입 에러 0개

- [ ] **Step 6: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "화면: 지역 선택 + 문항 진행

시드로 12문항을 뽑아 세션에 담고 한 문항씩 진행한다.
난이도 분포는 쉬움4/보통5/어려움3으로 강제.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: 결과(합격증)와 문항별 해설 화면

**Files:**
- Create: `src/ui/Certificate.tsx`, `app/test/dialect/result.tsx`, `app/test/dialect/review.tsx`
- Test: `__tests__/screens/result.test.tsx`

**Interfaces:**
- Consumes: `useSession` (Task 10), `scoreTest` (Task 5), `getGradeBands`·`gradeTableId` (Task 10), UI 컴포넌트 (Task 9)
- Produces:
  - `<Certificate label, grade, title, detail, note />`
  - 라우트 `/test/dialect/result`, `/test/dialect/review`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/screens/result.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ResultScreen from '../../app/test/dialect/result';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const push = jest.fn();
const replace = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push, replace, back: jest.fn() }),
}));

function q(id: string, answerIndex: number): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions = [q('a', 0), q('b', 1), q('c', 2), q('d', 3)];

beforeEach(() => {
  push.mockClear();
  useSession.getState().reset();
});

describe('ResultScreen', () => {
  test('만점이면 1급과 칭호를 보여준다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 1);
    useSession.getState().answer('c', 2);
    useSession.getState().answer('d', 3);

    render(<ResultScreen />);
    expect(screen.getByText('1급')).toBeTruthy();
    expect(screen.getByText('부산 이모 인정')).toBeTruthy();
  });

  test('맞힌 개수와 총 개수를 보여준다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);
    useSession.getState().answer('d', 0);

    render(<ResultScreen />);
    expect(screen.getByText('4문항 중 1문항 정답')).toBeTruthy();
  });

  test('0점이면 최하 급수를 보여준다', () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 1);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);
    useSession.getState().answer('d', 0);

    render(<ResultScreen />);
    expect(screen.getByText('9급')).toBeTruthy();
  });

  test('세션이 비어 있으면 크래시하지 않는다', () => {
    render(<ResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd /c/workAndroid/TestMin && npx jest __tests__/screens/result.test.tsx
```

Expected: FAIL — `Cannot find module '../../app/test/dialect/result'`

- [ ] **Step 3: 합격증 컴포넌트 구현**

`src/ui/Certificate.tsx`:

```tsx
import { Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly grade: number;
  readonly title: string;
  readonly detail: string;
  readonly note?: string;
}

/** 공유 대상이 되는 급수 합격증. 계획 3에서 이 View를 그대로 이미지로 캡처한다. */
export function Certificate({ label, grade, title, detail, note }: Props) {
  return (
    <Card radius={radius.card} offset={4} style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.label} maxFontSizeMultiplier={font.maxScale}>
          {label}
        </Text>
        <Text style={styles.grade} maxFontSizeMultiplier={1}>
          {grade}급
        </Text>
        <Text style={styles.detail} maxFontSizeMultiplier={font.maxScale}>
          {detail}
        </Text>
        <View style={styles.seal}>
          <Text style={styles.sealText} maxFontSizeMultiplier={font.maxScale}>
            🏅 {title}
          </Text>
        </View>
        {note ? (
          <Text style={styles.note} maxFontSizeMultiplier={font.maxScale}>
            {note}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  inner: { alignItems: 'center', paddingVertical: space.md },
  label: {
    fontSize: font.size.caption,
    fontWeight: '900',
    letterSpacing: 3,
    color: colors.muted,
  },
  grade: {
    fontSize: font.size.grade,
    fontWeight: '900',
    color: colors.ink,
    marginVertical: space.xs,
  },
  detail: { fontSize: font.size.caption, fontWeight: '800', color: colors.muted },
  seal: {
    marginTop: space.md,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  sealText: { fontSize: font.size.body, fontWeight: '900', color: colors.ink },
  note: {
    marginTop: space.md,
    fontSize: font.size.caption,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
```

- [ ] **Step 4: 결과 화면 구현**

`app/test/dialect/result.tsx`:

```tsx
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Certificate } from '@/ui/Certificate';
import { Button } from '@/ui/Button';
import { AdSlot } from '@/ui/AdSlot';
import { useSession } from '@/store/session';
import { scoreTest } from '@/engine/score';
import { assemble } from '@/engine/assemble';
import { hashSeed } from '@/engine/rng';
import {
  DIALECT_REGIONS,
  getGradeBands,
  getPool,
  gradeTableId,
} from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

const QUESTION_COUNT = 12;
const DIFFICULTY_MIX = { 1: 4, 2: 5, 3: 3 } as const;

export default function ResultScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();
  const start = useSession((s) => s.start);

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          결과가 없습니다
        </Text>
      </View>
    );
  }

  const bands = getGradeBands(gradeTableId('dialect', variant));
  const result = scoreTest(questions, answers, bands);
  const regionTitle =
    DIALECT_REGIONS.find((r) => r.id === variant)?.title ?? variant;

  const retry = () => {
    const pool = getPool('dialect', variant);
    const seed = hashSeed(`dialect:${variant}:${Date.now()}`);
    const next = assemble(pool, seed, {
      count: QUESTION_COUNT,
      difficultyMix: DIFFICULTY_MIX,
      excludeIds: questions.map((q) => q.id),
    });
    start('dialect', variant, seed, next);
    router.replace('/test/dialect/quiz');
  };

  return (
    <>
      <Stack.Screen options={{ title: '채점 완료', headerBackVisible: false }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Certificate
          label={`사투리고사 · ${regionTitle}`}
          grade={result.grade}
          title={result.title}
          detail={`${result.total}문항 중 ${result.correct}문항 정답`}
          note={
            result.wrong.length === 0
              ? '틀린 문항이 없습니다.'
              : `틀린 ${result.wrong.length}문항의 해설을 확인해보세요.`
          }
        />

        {result.wrong.length > 0 ? (
          <Button
            label={`✎ 틀린 ${result.wrong.length}문항 해설 보기`}
            onPress={() => router.push('/test/dialect/review')}
            testID="go-review"
          />
        ) : null}

        <Button
          label="↻ 다시 응시 (새 문제)"
          color={colors.coral}
          onPress={retry}
          testID="retry"
        />
        <Button
          label="홈으로"
          onPress={() => router.replace('/')}
          testID="go-home"
        />

        <AdSlot />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontWeight: '800', color: colors.muted },
});
```

- [ ] **Step 5: 해설 화면 구현**

`app/test/dialect/review.tsx`:

```tsx
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useSession } from '@/store/session';
import { scoreTest } from '@/engine/score';
import { getGradeBands, gradeTableId } from '@/content/registry';
import { colors, font, space } from '@/ui/tokens';

export default function ReviewScreen() {
  const router = useRouter();
  const { questions, answers, variant } = useSession();

  if (questions.length === 0 || variant === null) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} maxFontSizeMultiplier={font.maxScale}>
          해설할 문항이 없습니다
        </Text>
      </View>
    );
  }

  const result = scoreTest(questions, answers, getGradeBands(gradeTableId('dialect', variant)));
  const wrongById = new Map(result.wrong.map((w) => [w.questionId, w]));

  return (
    <>
      <Stack.Screen options={{ title: '해설' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {questions.map((q, i) => {
          const wrong = wrongById.get(q.id);
          const answerIndex = q.answerIndex ?? 0;
          const chosen = wrong ? wrong.chosenIndex : answerIndex;

          return (
            <Card key={q.id} style={styles.card}>
              <View style={styles.head}>
                <Badge label={`${i + 1}번`} />
                <Badge
                  label={wrong ? '❌ 오답' : '⭕ 정답'}
                  color={wrong ? colors.coral : colors.mint}
                />
              </View>

              <Text style={styles.prompt} maxFontSizeMultiplier={font.maxScale}>
                {q.prompt}
              </Text>

              <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                정답: {q.choices[answerIndex]?.text ?? ''}
              </Text>

              {wrong ? (
                <Text style={styles.line} maxFontSizeMultiplier={font.maxScale}>
                  내가 고른 답:{' '}
                  {chosen >= 0 ? q.choices[chosen]?.text ?? '' : '응답 없음'}
                </Text>
              ) : null}

              <Text style={styles.why} maxFontSizeMultiplier={font.maxScale}>
                {q.explanation ?? ''}
              </Text>
            </Card>
          );
        })}

        <Button label="결과로 돌아가기" onPress={() => router.back()} testID="back" />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, paddingBottom: space.xxl },
  card: { marginBottom: space.md },
  head: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  prompt: {
    fontSize: font.size.lead,
    fontWeight: '900',
    color: colors.ink,
    lineHeight: 24,
    marginBottom: space.sm,
  },
  line: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  why: {
    marginTop: space.sm,
    fontSize: font.size.body,
    fontWeight: '600',
    color: colors.muted,
    lineHeight: 21,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyText: { fontSize: font.size.body, fontWeight: '800', color: colors.muted },
});
```

- [ ] **Step 6: 전체 테스트 통과 확인**

```bash
cd /c/workAndroid/TestMin && npx jest && npx tsc --noEmit && npm run validate:content
```

Expected: 전체 PASS, 타입 에러 0개, 콘텐츠 검증 통과

- [ ] **Step 7: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "화면: 급수 합격증 결과 + 문항별 해설

Certificate 컴포넌트는 계획 3에서 그대로 이미지 캡처 대상이 된다.
다시 응시하면 직전 문항을 후순위로 밀어 새 문제가 나온다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: 릴리스 빌드와 실기기 검증

**Files:**
- Modify: 없음 (검증만)
- Create: `docs/build-notes.md`

**Interfaces:**
- Consumes: Task 2의 빌드 파이프라인, Task 1~12의 전체 앱
- Produces: 권한 0개가 확인된 release APK, 빌드 절차 문서

- [ ] **Step 1: 릴리스 빌드**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\workAndroid\android-sdk-ascii"
cd C:\workAndroid\TestMin
npx expo prebuild --platform android --clean
cd C:\workAndroid\TestMin\android
.\gradlew.bat assembleRelease --no-daemon
```

Expected: BUILD SUCCESSFUL, `android/app/build/outputs/apk/release/app-release.apk` 생성

- [ ] **Step 2: 권한 0개 최종 검증**

```powershell
& C:\workAndroid\android-sdk-ascii\build-tools\37.0.0\aapt2.exe dump permissions C:\workAndroid\TestMin\android\app\build\outputs\apk\release\app-release.apk
```

Expected: `uses-permission` 줄이 0개. 한 줄이라도 나오면 Task 2의 플러그인을 고치고 다시 빌드한다.

- [ ] **Step 3: SDK 레벨 검증**

```powershell
& C:\workAndroid\android-sdk-ascii\build-tools\37.0.0\aapt2.exe dump badging C:\workAndroid\TestMin\android\app\build\outputs\apk\release\app-release.apk | Select-String "sdkVersion|targetSdkVersion|package"
```

Expected: `package: name='com.testmin.app'`, `sdkVersion:'24'`, `targetSdkVersion:'36'`

- [ ] **Step 4: 빌드 절차 문서화**

`docs/build-notes.md`:

```markdown
# 빌드 절차

## 환경
- JDK: `C:\Program Files\Android\Android Studio\jbr` (PATH의 java는 JDK 8이라 쓸 수 없다)
- Android SDK: `C:\workAndroid\android-sdk-ascii`
- 필요한 플랫폼: android-37, build-tools 37.0.0

## 릴리스 APK

    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    $env:ANDROID_HOME = "C:\workAndroid\android-sdk-ascii"
    cd C:\workAndroid\TestMin
    npx expo prebuild --platform android --clean
    cd android
    .\gradlew.bat assembleRelease --no-daemon

## 출시 전 필수 검증

권한이 0개인지 확인한다. 한 줄이라도 나오면 출시하지 않는다.

    aapt2 dump permissions app-release.apk

SDK 레벨을 확인한다. minSdk 24 / targetSdk 36이어야 한다.

    aapt2 dump badging app-release.apk

## 주의

- `android/`는 prebuild로 생성되는 디렉터리이며 git에 올리지 않는다. 직접 수정하지 말고 `plugins/`의 config plugin이나 `app.json`을 고친다.
- `expo-updates`를 설치하면 INTERNET 권한이 다시 붙는다. 설치하지 않는다.
```

- [ ] **Step 5: 실기기 확인은 사용자에게 요청**

APK를 자동으로 설치하지 않는다. 빌드 산출물 경로를 사용자에게 알리고, 설치를 원하는지 물어본다. 설치를 요청받으면 그때 `adb install -r`로 진행한다.

확인해야 할 것:
1. 홈에서 사투리 고사 카드를 누르면 지역 선택 화면이 뜬다
2. 경상도로 12문항을 끝까지 풀 수 있다
3. 결과 화면에 급수와 칭호가 뜬다
4. 해설 화면에서 정답·내가 고른 답·이유가 보인다
5. "다시 응시"를 누르면 직전과 다른 문항이 나온다
6. 앱 정보 화면에서 권한이 "권한 없음"으로 표시된다

- [ ] **Step 6: 커밋**

```bash
cd /c/workAndroid/TestMin && git add -A && git commit -m "빌드 절차 문서화 + 릴리스 검증

release APK에서 권한 0개, minSdk 24, targetSdk 36, 패키지명 확인.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 계획 1 완료 조건

- [ ] `npx jest` 전체 통과
- [ ] `npx tsc --noEmit` 타입 에러 0개
- [ ] `npm run validate:content` 통과
- [ ] release APK에서 `aapt2 dump permissions` 출력 0줄
- [ ] 실기기에서 경상도 사투리 고사를 끝까지 풀고 급수·해설 확인

## 다음 계획

- **계획 2** — 유형형 채점 2종(축 방식·득표 방식), IQ 생성기 10종, `SvgFigure` 렌더러
- **계획 3** — 기록 저장, 오답노트, 결과 카드 이미지 캡처·공유, 딥링크 도전장
- **계획 4** — 문항 366개 작성, 서명키, AAB, 개인정보처리방침, 스토어 등록, `docs/licenses/`에 폰트·라이브러리 라이선스 원문 보관

## 계획 1에서 의도적으로 미루는 것

혼동을 막기 위해 명시한다. 아래는 누락이 아니라 뒤 계획의 몫이다.

- 성격 16유형·심리·IQ·MZ 응시 (홈에 카드는 있으나 "준비 중" 안내)
- 사투리 경상도 외 5개 지역
- 기록 저장(AsyncStorage), 오답노트 누적, 결과 카드 이미지 공유, 딥링크 도전장
- 서명키, AAB, 스토어 등록 자료
- 문항 풀 30개까지 확장 (계획 1은 15개로 출제 12를 감당한다 — 재도전 다양성이 낮은 것은 알고 있는 상태)
