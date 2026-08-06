# 빌드 절차

## 빌드 환경 (반드시 같은 셸 호출 안에서 아래 값을 모두 지정할 것)

셸 상태는 도구 호출 사이에 유지되지 않으므로, Gradle 명령을 실행하는 **매 호출마다** 아래 환경변수를 함께 설정한다.

    JAVA_HOME        = C:\Program Files\Android\Android Studio\jbr
    ANDROID_HOME     = C:\workAndroid\android-sdk-ascii
    ANDROID_SDK_ROOT = C:\workAndroid\android-sdk-ascii
    GRADLE_USER_HOME = C:\workAndroid\gradle-home-ascii
    TEMP             = C:\workAndroid\tmp-ascii
    TMP              = C:\workAndroid\tmp-ascii

### 왜 TEMP/TMP가 ASCII 경로여야 하는가

Windows 프로필 경로에 한글(`C:\Users\사용자`)이 들어 있다. AGP는 `prefab_command.bat`을 UTF-8로 쓰는데 `cmd.exe`는 시스템 코드페이지로 읽으므로, 명령 안에 한글 바이트가 섞이면 `cmd`의 바이트 오프셋이 밀린다. 그 결과 이어지는 줄의 앞부분 글자를 먹어버려 `'Program' is not recognized`, `'lass-path' is not recognized` 같은 에러가 난다. 이 증상을 보면 `TEMP`/`TMP`(또는 `GRADLE_USER_HOME`) 중 하나가 실제로 적용되지 않은 것이다. 선택 사항이 아니라 필수 설정이다.

### gradle-user-ascii 함정

`C:\workAndroid\gradle-user-ascii`는 이름이 `gradle-home-ascii`와 비슷해 보이지만, 실제로는 한글이 포함된 프로필 경로로 되돌아가는 junction이다. 반드시 진짜 디렉터리인 `gradle-home-ascii`를 `GRADLE_USER_HOME`으로 써야 한다.

### 공유 디렉터리 주의

`gradle-home-ascii`, `tmp-ascii`, `android-sdk-ascii`는 이 머신에서 동시에 빌드 중인 다른 프로젝트와 공유한다. 읽고 쓰는 것은 되지만, 안의 내용을 정리(clean)하거나 삭제하면 안 된다. 이 저장소(`C:\workAndroid\TestMin`) 밖으로는 아무것도 쓰지 않는다.

## 릴리스 APK 빌드

    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    $env:ANDROID_HOME = "C:\workAndroid\android-sdk-ascii"
    $env:ANDROID_SDK_ROOT = "C:\workAndroid\android-sdk-ascii"
    $env:GRADLE_USER_HOME = "C:\workAndroid\gradle-home-ascii"
    $env:TEMP = "C:\workAndroid\tmp-ascii"
    $env:TMP = "C:\workAndroid\tmp-ascii"
    cd C:\workAndroid\TestMin
    npx expo prebuild --platform android --clean
    cd android
    .\gradlew.bat --stop
    .\gradlew.bat assembleRelease --no-daemon

빌드 산출물: `android/app/build/outputs/apk/release/app-release.apk`

## 권한 제거 방식 — config plugin이 유일하게 durable한 자리

`expo prebuild`는 `android/` 디렉터리를 매번 새로 생성한다(`--clean`이 아니어도 다시 만든다). 즉 `android/app/src/main/AndroidManifest.xml`을 손으로 고쳐도 다음 prebuild에서 사라진다. 권한을 지우는 유일한 durable한 위치는 `plugins/withNoPermissions.js` (Expo config plugin)이며, `app.json`의 `plugins` 배열에 `"./plugins/withNoPermissions"`로 등록되어 있다.

이 플러그인은 `withAndroidManifest` 훅에서 `manifest['uses-permission']`을 순회하며, 아래 다섯 개 이름과 일치하는 항목마다 `tools:node="remove"`를 추가한 엔트리로 치환한다. `app.json`의 `android.permissions` 설정만으로는 prebuild 템플릿이 기본으로 넣는 권한을 지우지 못하므로 이 방식을 쓴다.

지우는 다섯 개(모두 prebuild 템플릿이나 라이브러리 매니페스트 병합이 기본으로 넣는 것이고, 이 앱 소스는 실제로 쓰지 않는다):

- `android.permission.INTERNET` — 네트워크 호출이 전혀 없는 오프라인 앱.
- `android.permission.SYSTEM_ALERT_WINDOW` — 오버레이를 그리지 않는다.
- `android.permission.VIBRATE` — 햅틱을 쓰지 않는다.
- `android.permission.READ_EXTERNAL_STORAGE` — `expo.modules.filesystem`이 병합하지만 `maxSdkVersion=32`라 Android 13+에서는 원래도 비활성.
- `android.permission.WRITE_EXTERNAL_STORAGE` — 위와 동일.

## 최종 권한 상태 — 의도적으로 남기는 예외 1건

    package: com.testmin.app
    permission: com.testmin.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
    uses-permission: name='com.testmin.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'

`com.testmin.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`은 지우지 않는다. `androidx.core:core:1.18.0`이 자체 브로드캐스트 리시버 보호를 위해 내부적으로 선언하는 `signature` 보호수준 권한이며, 사용자 노출 권한이 아니고 스토어 데이터 안전/권한 목록에도 나타나지 않는다. 지우면 AndroidX의 리시버 보호가 깨진다. "권한 0개"가 아니라 "사용자 노출 권한 0개"가 목표이며, 이 두 줄이 남는 것이 의도한 최종 상태다.

## 출시 전 필수 검증

권한이 위 두 줄(DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION)만 남았는지 확인한다. 그 외의 `uses-permission` 줄이 하나라도 나오면 출시하지 않는다.

    & C:\workAndroid\android-sdk-ascii\build-tools\37.0.0\aapt2.exe dump permissions app-release.apk

SDK 레벨과 패키지명을 확인한다. minSdk 24 / targetSdk 36 / `com.testmin.app`이어야 한다.

    & C:\workAndroid\android-sdk-ascii\build-tools\37.0.0\aapt2.exe dump badging app-release.apk | Select-String "sdkVersion|targetSdkVersion|package: name"

## 주의

- `android/`는 prebuild로 생성되는 디렉터리이며 git에 올리지 않는다(`.gitignore` 처리됨). 직접 수정하지 말고 `plugins/`의 config plugin이나 `app.json`을 고친 뒤 다시 prebuild한다.
- `expo-updates`를 설치하면 INTERNET 권한이 다시 붙는다. 설치하지 않는다.
