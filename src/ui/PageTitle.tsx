import Head from 'expo-router/head';

interface Props {
  /** 브라우저 탭·공유 링크에 뜨는 이름. 앱 이름은 여기서 붙이므로 넘기지 않는다. */
  readonly title?: string;
}

const APP = '테스트의 민족';
const HOME_TITLE = '테스트의 민족 | 코믹 심리테스트·IQ·MBTI식 16유형';

/**
 * 웹에서 문서 제목을 채운다. 네이티브에서는 expo-router/head가 아무것도 그리지 않으므로
 * 화면에 영향이 없다.
 *
 * 정적 내보내기 껍데기(app/+html.tsx)에는 제목을 둘 수 없다 — 렌더러가 helmet용
 * 빈 <title>을 먼저 넣어서, 껍데기에 또 쓰면 브라우저가 빈 쪽을 골라 버린다.
 */
export function PageTitle({ title }: Props) {
  const text = title === undefined || title === '' ? HOME_TITLE : `${title} | ${APP}`;
  return (
    <Head>
      <title>{text}</title>
    </Head>
  );
}
