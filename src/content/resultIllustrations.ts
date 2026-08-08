import type { ImageSourcePropType } from 'react-native';

export interface ResultComic {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
}

const MBTI_COMICS = {
  INTJ: comic(require('../../assets/illustrations/comic/personality/INTJ.webp'), '작전판을 펼치고 커피를 마시는 전략가', '커피 한 잔에도 작전명부터 붙입니다'),
  INTP: comic(require('../../assets/illustrations/comic/personality/INTP.webp'), '생각에 빠져 토스트를 날려버린 연구가', '토스트는 날아갔고 생각은 아직 진행 중'),
  ENTJ: comic(require('../../assets/illustrations/comic/personality/ENTJ.webp'), '봉제인형 이사회를 지휘하는 리더', '봉제인형 이사회도 성과는 내야 합니다'),
  ENTP: comic(require('../../assets/illustrations/comic/personality/ENTP.webp'), '거울 속 자신들과 토론하는 발명가', '오늘의 토론 상대: 나, 나, 그리고 나'),
  INFJ: comic(require('../../assets/illustrations/comic/personality/INFJ.webp'), '친구에게 우산과 휴지를 미리 내미는 사람', '말하기 전에 이미 우산과 휴지 준비 완료'),
  INFP: comic(require('../../assets/illustrations/comic/personality/INFP.webp'), '찻잔 속 작은 왕국을 바라보는 몽상가', '찻잔 속 왕국은 오늘도 평화롭습니다'),
  ENFJ: comic(require('../../assets/illustrations/comic/personality/ENFJ.webp'), '모두의 짐을 챙기다 자기 가방을 놓친 사람', '모두 챙겼고 내 가방만 비상사태'),
  ENFP: comic(require('../../assets/illustrations/comic/personality/ENFP.webp'), '여러 취미를 동시에 벌인 사람', '취미 네 개 시작, 손은 두 개'),
  ISTJ: comic(require('../../assets/illustrations/comic/personality/ISTJ.webp'), '완벽한 아침상에서 완두콩 하나를 발견한 사람', '완벽한 아침상에서 완두콩 하나 이탈'),
  ISFJ: comic(require('../../assets/illustrations/comic/personality/ISFJ.webp'), '혹시 몰라 온갖 비상용품을 챙긴 사람', '혹시 몰라서 양말까지 챙겨왔습니다'),
  ESTJ: comic(require('../../assets/illustrations/comic/personality/ESTJ.webp'), '오리와 택배 상자까지 줄 세우는 사람', '오리도 택배도 줄부터 서세요'),
  ESFJ: comic(require('../../assets/illustrations/comic/personality/ESFJ.webp'), '손님맞이 간식과 담요를 산처럼 준비한 사람', '손님보다 간식과 담요가 더 많습니다'),
  ISTP: comic(require('../../assets/illustrations/comic/personality/ISTP.webp'), '선풍기를 완전히 분해해 고치는 기술자', '선풍기 소리 하나에 나사 서른 개'),
  ISFP: comic(require('../../assets/illustrations/comic/personality/ISFP.webp'), '자기 주변 한 평을 예쁘게 꾸민 사람', '내가 보는 한 평만큼은 완벽'),
  ESTP: comic(require('../../assets/illustrations/comic/personality/ESTP.webp'), '사무실 의자를 타고 질주하는 모험가', '의자 하나면 이 정도는 길입니다'),
  ESFP: comic(require('../../assets/illustrations/comic/personality/ESFP.webp'), '마트 통로를 런웨이처럼 걷는 사람', '장보기였는데 런웨이가 열렸습니다'),
} as const satisfies Record<string, ResultComic>;

export function personalityComic(code: string): ResultComic {
  return MBTI_COMICS[code as keyof typeof MBTI_COMICS] ?? MBTI_COMICS.ENFP;
}

const PSYCH_COMICS = {
  'love:flame': comic(require('../../assets/illustrations/comic/psych/love-flame.webp'), '하트 로켓으로 먼저 출발하는 사람', '설명서는 나중에, 하트 로켓 먼저'),
  'love:slow': comic(require('../../assets/illustrations/comic/psych/love-slow.webp'), '화분에 한 방울씩 물을 주는 사람', '마음도 물 한 방울씩 천천히'),
  'love:giver': comic(require('../../assets/illustrations/comic/psych/love-giver.webp'), '선물을 가득 챙기다 자기 신발을 잃은 사람', '선물은 가득, 내 신발은 실종'),
  'love:space': comic(require('../../assets/illustrations/comic/psych/love-space.webp'), '각자의 동굴에서 연결을 유지하는 두 사람', '각자 동굴에서 연결은 유지 중'),
  'love:wave': comic(require('../../assets/illustrations/comic/psych/love-wave.webp'), '하트 파도를 타는 연인', '오늘의 연애 온도는 파도 높음'),
  'stress:burst': comic(require('../../assets/illustrations/comic/psych/stress-burst.webp'), '참았던 감정이 색종이처럼 터진 사람', '참고 참다 축제처럼 터졌습니다'),
  'stress:sink': comic(require('../../assets/illustrations/comic/psych/stress-sink.webp'), '소파 속으로 깊이 파묻힌 사람', '소파와 한 몸이 되는 중'),
  'stress:dodge': comic(require('../../assets/illustrations/comic/psych/stress-dodge.webp'), '스트레스 구름을 피해 달리는 사람', '스트레스 구름과 오늘도 추격전'),
  'stress:plan': comic(require('../../assets/illustrations/comic/psych/stress-plan.webp'), '엉킨 마음을 색깔별로 정리하는 사람', '엉킨 마음도 색깔별로 분류'),
  'stress:talk': comic(require('../../assets/illustrations/comic/psych/stress-talk.webp'), '무거운 말을 풍선처럼 띄우며 대화하는 사람', '무거운 말은 밖으로, 가벼운 풍선은 위로'),
  'comm:direct': comic(require('../../assets/illustrations/comic/psych/comm-direct.webp'), '미로를 가로질러 목표로 직진하는 사람', '미로를 무시하고 목표로 직진'),
  'comm:gentle': comic(require('../../assets/illustrations/comic/psych/comm-gentle.webp'), '말풍선을 부드럽게 완충 포장하는 사람', '말 한마디도 완충 포장 완료'),
  'comm:listen': comic(require('../../assets/illustrations/comic/psych/comm-listen.webp'), '커다란 귀로 이야기를 듣는 사람', '이야기 수신 감도 최상'),
  'comm:humor': comic(require('../../assets/illustrations/comic/psych/comm-humor.webp'), '진지한 회의에 바나나 농담을 꺼낸 사람', '회의가 무거우면 바나나를 투입'),
  'comm:text': comic(require('../../assets/illustrations/comic/psych/comm-text.webp'), '메시지 말풍선을 탑처럼 쌓은 사람', '말 대신 메시지 탑을 쌓았습니다'),
  'recharge:sprint': comic(require('../../assets/illustrations/comic/psych/recharge-sprint.webp'), '빠르게 에너지를 충전하는 사람', '인간 피트스톱, 10초 충전 완료'),
  'recharge:nest': comic(require('../../assets/illustrations/comic/psych/recharge-nest.webp'), '포근한 둥지에서 오래 쉬는 사람', '달팽이도 기다리다 시계를 봅니다'),
  'recharge:chat': comic(require('../../assets/illustrations/comic/psych/recharge-chat.webp'), '대화 한 잔으로 배터리를 채우는 사람', '대화 한 잔에 배터리 채우는 중'),
  'recharge:vanish': comic(require('../../assets/illustrations/comic/psych/recharge-vanish.webp'), '파티 테이블 아래로 숨은 사람', '파티 참석 완료, 위치는 테이블 아래'),
  'recharge:hobby': comic(require('../../assets/illustrations/comic/psych/recharge-hobby.webp'), '여러 취미를 동시에 즐기며 쉬는 사람', '쉬는 중인데 취미는 다섯 개'),
  'procrastination:spark': comic(require('../../assets/illustrations/comic/psych/procrastination-spark.webp'), '준비보다 먼저 시작 버튼을 누르는 사람', '앞치마보다 시작 버튼이 먼저'),
  'procrastination:steps': comic(require('../../assets/illustrations/comic/psych/procrastination-steps.webp'), '거대한 계단을 한 칸씩 오르는 사람', '거대한 계단도 한 칸씩'),
  'procrastination:planner': comic(require('../../assets/illustrations/comic/psych/procrastination-planner.webp'), '거대한 계획 성의 입구에 선 사람', '계획 성은 완성, 일은 아직 입구'),
  'procrastination:buddy': comic(require('../../assets/illustrations/comic/psych/procrastination-buddy.webp'), '친구와 우정 로프로 연결해 걷는 사람', '딴길 방지용 우정 로프 장착'),
  'procrastination:pressure': comic(require('../../assets/illustrations/comic/psych/procrastination-pressure.webp'), '마감 파도 앞에서 여러 팔로 일하는 사람', '마감 파도 앞에서 팔이 여덟 개'),
  'travel:explorer': comic(require('../../assets/illustrations/comic/psych/travel-explorer.webp'), '골목의 새 길을 탐험하는 여행자', '길을 잃은 게 아니라 새 길을 찾은 것'),
  'travel:relaxer': comic(require('../../assets/illustrations/comic/psych/travel-relaxer.webp'), '숙소에 누워 여유를 즐기는 여행자', '관광지가 나에게 오면 됩니다'),
  'travel:foodie': comic(require('../../assets/illustrations/comic/psych/travel-foodie.webp'), '음식을 먼저 맛보는 여행자', '랜드마크보다 한입이 먼저'),
  'travel:planner': comic(require('../../assets/illustrations/comic/psych/travel-planner.webp'), '커다란 일정표를 펼친 여행자', '일정표가 숙소보다 큽니다'),
  'travel:memory': comic(require('../../assets/illustrations/comic/psych/travel-memory.webp'), '마지막 사진까지 연출하는 여행자', '여행의 마지막 한 장까지 연출 완료'),
} as const satisfies Record<string, ResultComic>;

export function psychComic(testId: string, typeId: string): ResultComic {
  return PSYCH_COMICS[`${testId}:${typeId}` as keyof typeof PSYCH_COMICS] ?? PSYCH_COMICS['recharge:hobby'];
}

const GRADE_COMICS = {
  1: comic(require('../../assets/illustrations/comic/grade/1.webp'), '커다란 축하 속에서 우승한 마스코트', '축하가 너무 커서 마스코트가 묻힘'),
  2: comic(require('../../assets/illustrations/comic/grade/2.webp'), '로켓을 타고 정상에 도착한 마스코트', '정상 도착, 로켓은 반칙 같은데요'),
  3: comic(require('../../assets/illustrations/comic/grade/3.webp'), '커다란 메달을 든 마스코트', '메달 무게도 실력의 일부'),
  4: comic(require('../../assets/illustrations/comic/grade/4.webp'), '연필과 함께 날아오르는 마스코트', '연필까지 날아오르는 안정권'),
  5: comic(require('../../assets/illustrations/comic/grade/5.webp'), '시소 가운데서 균형 잡은 마스코트', '정확히 가운데, 균형 감각 만점'),
  6: comic(require('../../assets/illustrations/comic/grade/6.webp'), '구불구불한 길 끝 책상에 도착한 마스코트', '길은 좀 돌았지만 책상은 보입니다'),
  7: comic(require('../../assets/illustrations/comic/grade/7.webp'), '반대 방향 기차를 탄 마스코트', '기차는 탔고 방향만 반대'),
  8: comic(require('../../assets/illustrations/comic/grade/8.webp'), '커피를 기다리는 졸린 마스코트', '두뇌가 아직 커피를 못 받았습니다'),
  9: comic(require('../../assets/illustrations/comic/grade/9.webp'), '시험지를 이불처럼 덮은 마스코트', '시험지를 이불로 쓰는 대범함'),
} as const satisfies Record<number, ResultComic>;

export function gradeComic(grade: number): ResultComic {
  return GRADE_COMICS[grade as keyof typeof GRADE_COMICS] ?? GRADE_COMICS[9];
}

const IQ_COMICS = {
  warmup: comic(require('../../assets/illustrations/comic/iq-warmup.webp'), '잠옷 입은 뇌가 손잡이를 돌리며 시동을 거는 모습', '두뇌가 아직 커피를 못 받았습니다'),
  workshop: comic(require('../../assets/illustrations/comic/iq-workshop.webp'), '뇌 정비공이 퍼즐 기계를 조립하는 모습', '두뇌 공방 정상 영업 중'),
  mission: comic(require('../../assets/illustrations/comic/iq-mission.webp'), '선글라스를 쓴 뇌가 관제실에서 축하하는 모습', '문제 풀이를 우주 임무처럼 해버림'),
} as const satisfies Record<string, ResultComic>;

export function iqComic(estimatedScore: number): ResultComic {
  if (estimatedScore >= 130) return IQ_COMICS.mission;
  if (estimatedScore >= 100) return IQ_COMICS.workshop;
  return IQ_COMICS.warmup;
}

function comic(
  source: ImageSourcePropType,
  accessibilityLabel: string,
  caption: string
): ResultComic {
  return { source, accessibilityLabel, caption };
}
