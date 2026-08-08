# 결과 화면 래스터 일러스트 안내

결과 화면은 SVG 대신 정사각형 WebP 코믹 일러스트를 사용한다. 모든 이미지는
`src/content/resultIllustrations.ts`에서 정적으로 `require`해야 GitHub Pages의 정적
내보내기에도 포함된다.

## 현재 구성

| 결과군 | 경로 | 수량 |
|---|---|---:|
| 성격 16유형 | `assets/illustrations/comic/personality/<MBTI>.webp` | 16 |
| 심리 테스트 | `assets/illustrations/comic/psych/<testId>-<typeId>.webp` | 30 |
| 정답형 급수 | `assets/illustrations/comic/grade/<1-9>.webp` | 9 |
| IQ 구간 | `assets/illustrations/comic/iq-<구간>.webp` | 3 |

총 58장이며, 심리 테스트나 결과 유형을 추가할 때는 해당 결과만의 그림과 접근성
설명, 짧은 코믹 캡션을 함께 등록한다.

## 파일 규칙

- 480×480 WebP, 품질 80~85 권장
- 이미지 안에는 글자·로고·워터마크를 넣지 않는다.
- `#FFF8E1`, `#FFD43B`, `#FF8A5B`, `#4ECDC4`, `#B197FC`, `#74C0FC`, `#111111`
  중심의 앱 팔레트를 유지한다.
- 결과 화면 문구는 이미지에 굽지 않고 `ResultIllustration`의 캡션으로 표시한다.
- 원본 생성 시트나 임시 크롭 파일은 저장소에 커밋하지 않는다.
