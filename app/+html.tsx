import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * 웹(정적 내보내기) 전용 HTML 껍데기. 네이티브 앱에는 영향을 주지 않는다.
 *
 * 기본 껍데기는 lang이 en이고 <title>이 비어 있다 — 한국어 페이지가 영어로
 * 선언되면 브라우저 번역 안내가 뜨고, 제목이 없으면 공유 링크에 URL만 찍힌다.
 */
export default function Root({ children }: PropsWithChildren) {
  const adsenseClient = getAdsenseClient();

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover: 노치 있는 폰에서 배경이 화면 끝까지 찬다 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* <title>은 여기 두지 않는다. 정적 렌더러가 이미 helmet용 빈 <title>을
            먼저 넣기 때문에, 여기에 하나 더 쓰면 브라우저가 앞의 빈 것을 골라
            탭 이름이 URL로 나온다. 제목은 화면마다 expo-router/head로 채운다. */}
        <meta
          name="description"
          content="IQ·MBTI식 16유형·MZ·사투리·맞춤법·순우리말·고사성어·심리 테스트를 한곳에서. 문항마다 정답과 이유를 함께 보여줍니다."
        />
        <meta name="theme-color" content="#FFF8E1" />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href="https://yongminlee2.github.io/testmin/" />
        <link rel="icon" href="/testmin/favicon.png" />
        <link rel="apple-touch-icon" href="/testmin/apple-touch-icon.png" />
        <link rel="manifest" href="/testmin/site.webmanifest" />

        {/* 링크 공유용 미리보기 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="테스트의 민족" />
        <meta
          property="og:description"
          content="오늘도 응시하셨습니다 — 8가지 고사를 웹에서 바로."
        />
        <meta
          property="og:image"
          content="https://yongminlee2.github.io/legal/testmin/social-preview-1200x630.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ko_KR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="테스트의 민족" />
        <meta
          name="twitter:description"
          content="IQ·성격·사투리·심리 테스트를 코믹 결과와 함께."
        />
        <meta
          name="twitter:image"
          content="https://yongminlee2.github.io/legal/testmin/social-preview-1200x630.png"
        />

        {adsenseClient ? (
          <>
            <meta name="google-adsense-account" content={adsenseClient} />
            <script
              async
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            />
          </>
        ) : null}

        {/* 배경색을 body에 직접 준다. 앱이 뜨기 전 흰 화면이 번쩍이는 걸 막는다. */}
        <style dangerouslySetInnerHTML={{ __html: BODY_STYLE }} />

        {/* expo-router가 요구하는 스크롤 리셋. 이걸 빼면 웹에서 본문 스크롤이 어긋난다. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

const BODY_STYLE = `
  body { background-color: #FFF8E1; }
  a[role="tab"]:focus { outline: none; }
  a[role="tab"]:focus-visible {
    outline: 2px solid #111111;
    outline-offset: -4px;
    border-radius: 14px !important;
  }
`;

function getAdsenseClient(): string | undefined {
  const value = process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  return value && /^ca-pub-\d+$/.test(value) ? value : undefined;
}
