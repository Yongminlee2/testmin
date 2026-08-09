import type { ImageSourcePropType } from 'react-native';
import { gradeStory, iqStory, typeStory, type ResultStory } from './resultStories';
import {
  IQ_JOURNAL,
  iqAnimalFriend,
  personalityJournal,
  psychJournal,
  scoredJournal,
  type ResultJournal,
} from './resultPresentation';

export interface ResultComic {
  /** 자동 검사에서 같은 파일을 두 결과가 공유하는지 확인하는 안정적인 식별자. */
  readonly assetId: string;
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
  readonly story: ResultStory;
  readonly journal: ResultJournal;
}

const MBTI_COMICS = {
  INTJ: typedComic('personality:INTJ', require('../../assets/illustrations/comic/personality/INTJ.webp'), '작전판을 펼치고 커피를 마시는 전략가', '커피 한 잔에도 작전명부터 붙입니다'),
  INTP: typedComic('personality:INTP', require('../../assets/illustrations/comic/personality/INTP.webp'), '생각에 빠져 토스트를 날려버린 연구가', '토스트는 날아갔고 생각은 아직 진행 중'),
  ENTJ: typedComic('personality:ENTJ', require('../../assets/illustrations/comic/personality/ENTJ.webp'), '봉제인형 이사회를 지휘하는 리더', '봉제인형 이사회도 성과는 내야 합니다'),
  ENTP: typedComic('personality:ENTP', require('../../assets/illustrations/comic/personality/ENTP.webp'), '거울 속 자신들과 토론하는 발명가', '오늘의 토론 상대: 나, 나, 그리고 나'),
  INFJ: typedComic('personality:INFJ', require('../../assets/illustrations/comic/personality/INFJ.webp'), '친구에게 우산과 휴지를 미리 내미는 사람', '말하기 전에 이미 우산과 휴지 준비 완료'),
  INFP: typedComic('personality:INFP', require('../../assets/illustrations/comic/personality/INFP.webp'), '찻잔 속 작은 왕국을 바라보는 몽상가', '찻잔 속 왕국은 오늘도 평화롭습니다'),
  ENFJ: typedComic('personality:ENFJ', require('../../assets/illustrations/comic/personality/ENFJ.webp'), '모두의 짐을 챙기다 자기 가방을 놓친 사람', '모두 챙겼고 내 가방만 비상사태'),
  ENFP: typedComic('personality:ENFP', require('../../assets/illustrations/comic/personality/ENFP.webp'), '여러 취미를 동시에 벌인 사람', '취미 네 개 시작, 손은 두 개'),
  ISTJ: typedComic('personality:ISTJ', require('../../assets/illustrations/comic/personality/ISTJ.webp'), '완벽한 아침상에서 완두콩 하나를 발견한 사람', '완벽한 아침상에서 완두콩 하나 이탈'),
  ISFJ: typedComic('personality:ISFJ', require('../../assets/illustrations/comic/personality/ISFJ.webp'), '혹시 몰라 온갖 비상용품을 챙긴 사람', '혹시 몰라서 양말까지 챙겨왔습니다'),
  ESTJ: typedComic('personality:ESTJ', require('../../assets/illustrations/comic/personality/ESTJ.webp'), '오리와 택배 상자까지 줄 세우는 사람', '오리도 택배도 줄부터 서세요'),
  ESFJ: typedComic('personality:ESFJ', require('../../assets/illustrations/comic/personality/ESFJ.webp'), '손님맞이 간식과 담요를 산처럼 준비한 사람', '손님보다 간식과 담요가 더 많습니다'),
  ISTP: typedComic('personality:ISTP', require('../../assets/illustrations/comic/personality/ISTP.webp'), '선풍기를 완전히 분해해 고치는 기술자', '선풍기 소리 하나에 나사 서른 개'),
  ISFP: typedComic('personality:ISFP', require('../../assets/illustrations/comic/personality/ISFP.webp'), '자기 주변 한 평을 예쁘게 꾸민 사람', '내가 보는 한 평만큼은 완벽'),
  ESTP: typedComic('personality:ESTP', require('../../assets/illustrations/comic/personality/ESTP.webp'), '사무실 의자를 타고 질주하는 모험가', '의자 하나면 이 정도는 길입니다'),
  ESFP: typedComic('personality:ESFP', require('../../assets/illustrations/comic/personality/ESFP.webp'), '마트 통로를 런웨이처럼 걷는 사람', '장보기였는데 런웨이가 열렸습니다'),
} as const satisfies Record<string, ResultComic>;

export function personalityComic(code: string): ResultComic {
  return MBTI_COMICS[code as keyof typeof MBTI_COMICS] ?? MBTI_COMICS.ENFP;
}

const PSYCH_COMICS = {
  'love:flame': typedComic('psych:love:flame', require('../../assets/illustrations/comic/psych-v2/love-flame.webp'), '하트 로켓으로 먼저 출발하는 사람', '설명서는 나중에, 하트 로켓 먼저'),
  'love:slow': typedComic('psych:love:slow', require('../../assets/illustrations/comic/psych-v2/love-slow.webp'), '화분에 한 방울씩 물을 주는 사람', '마음도 물 한 방울씩 천천히'),
  'love:giver': typedComic('psych:love:giver', require('../../assets/illustrations/comic/psych-v2/love-giver.webp'), '선물을 가득 챙기다 자기 신발을 잃은 사람', '선물은 가득, 내 신발은 실종'),
  'love:space': typedComic('psych:love:space', require('../../assets/illustrations/comic/psych-v2/love-space.webp'), '각자의 창가에서 연결을 유지하는 두 사람', '각자 창가에서 연결은 유지 중'),
  'love:wave': typedComic('psych:love:wave', require('../../assets/illustrations/comic/psych-v2/love-wave.webp'), '하트 파도를 함께 타는 두 사람', '오늘의 연애 온도는 파도 높음'),
  'stress:burst': typedComic('psych:stress:burst', require('../../assets/illustrations/comic/psych-v2/stress-burst.webp'), '압력솥에서 색종이가 터지는 장면', '참고 참다 축제처럼 터졌습니다'),
  'stress:sink': typedComic('psych:stress:sink', require('../../assets/illustrations/comic/psych-v2/stress-sink.webp'), '소파 속으로 파묻힌 사람과 쿠션을 든 고양이', '소파와 한 몸이 되는 중'),
  'stress:dodge': typedComic('psych:stress:dodge', require('../../assets/illustrations/comic/psych-v2/stress-dodge.webp'), '작은 먹구름을 피해 달리는 사람', '스트레스 구름과 오늘도 추격전'),
  'stress:plan': typedComic('psych:stress:plan', require('../../assets/illustrations/comic/psych-v2/stress-plan.webp'), '엉킨 구름을 색깔별 서랍에 정리하는 사람', '엉킨 마음도 색깔별로 분류'),
  'stress:talk': typedComic('psych:stress:talk', require('../../assets/illustrations/comic/psych-v2/stress-talk.webp'), '무거운 말풍선을 풍선처럼 띄우는 두 사람', '무거운 말은 밖으로, 가벼운 풍선은 위로'),
  'comm:direct': typedComic('psych:comm:direct', require('../../assets/illustrations/comic/psych-v2/comm-direct.webp'), '미로를 가로질러 목표로 직진하는 사람', '미로를 무시하고 목표로 직진'),
  'comm:gentle': typedComic('psych:comm:gentle', require('../../assets/illustrations/comic/psych-v2/comm-gentle.webp'), '말풍선을 부드럽게 완충 포장하는 사람', '말 한마디도 완충 포장 완료'),
  'comm:listen': typedComic('psych:comm:listen', require('../../assets/illustrations/comic/psych-v2/comm-listen.webp'), '커다란 귀 수신기로 이야기를 듣는 사람', '이야기 수신 감도 최상'),
  'comm:humor': typedComic('psych:comm:humor', require('../../assets/illustrations/comic/psych-v2/comm-humor.webp'), '진지한 회의에 바나나 농담을 꺼낸 사람', '회의가 무거우면 바나나를 투입'),
  'comm:text': typedComic('psych:comm:text', require('../../assets/illustrations/comic/psych-v2/comm-text.webp'), '메시지 말풍선을 탑처럼 쌓는 사람', '말 대신 메시지 탑을 쌓았습니다'),
  'recharge:sprint': typedComic('psych:recharge:sprint', require('../../assets/illustrations/comic/psych-v2/recharge-sprint.webp'), '작은 배터리 정비소로 달려가는 사람', '인간 피트스톱, 10초 충전 완료'),
  'recharge:nest': typedComic('psych:recharge:nest', require('../../assets/illustrations/comic/psych-v2/recharge-nest.webp'), '담요 둥지에서 쉬는 사람과 시계를 보는 달팽이', '달팽이도 기다리다 시계를 봅니다'),
  'recharge:chat': typedComic('psych:recharge:chat', require('../../assets/illustrations/comic/psych-v2/recharge-chat.webp'), '대화 주전자로 배터리 컵을 채우는 두 사람', '대화 한 잔에 배터리 채우는 중'),
  'recharge:vanish': typedComic('psych:recharge:vanish', require('../../assets/illustrations/comic/psych-v2/recharge-vanish.webp'), '파티 간식 테이블 아래 숨은 사람', '파티 참석 완료, 위치는 테이블 아래'),
  'recharge:hobby': typedComic('psych:recharge:hobby', require('../../assets/illustrations/comic/psych-v2/recharge-hobby.webp'), '여러 취미를 동시에 즐기며 쉬는 사람', '쉬는 중인데 취미는 다섯 개'),
  'procrastination:spark': typedComic('psych:procrastination:spark', require('../../assets/illustrations/comic/psych-v2/procrastination-spark.webp'), '준비보다 먼저 시작 버튼을 누르는 사람', '앞치마보다 시작 버튼이 먼저'),
  'procrastination:steps': typedComic('psych:procrastination:steps', require('../../assets/illustrations/comic/psych-v2/procrastination-steps.webp'), '거대한 블록 계단을 한 칸씩 오르는 사람', '거대한 계단도 한 칸씩'),
  'procrastination:planner': typedComic('psych:procrastination:planner', require('../../assets/illustrations/comic/psych-v2/procrastination-planner.webp'), '거대한 계획 성 입구에 선 사람', '계획 성은 완성, 일은 아직 입구'),
  'procrastination:buddy': typedComic('psych:procrastination:buddy', require('../../assets/illustrations/comic/psych-v2/procrastination-buddy.webp'), '친구와 우정 안전로프로 연결해 걷는 사람', '딴길 방지용 우정 로프 장착'),
  'procrastination:pressure': typedComic('psych:procrastination:pressure', require('../../assets/illustrations/comic/psych-v2/procrastination-pressure.webp'), '마감 파도 앞에서 여러 팔로 일하는 사람', '마감 파도 앞에서 팔이 여덟 개'),
  'travel:explorer': typedComic('psych:travel:explorer', require('../../assets/illustrations/comic/psych-v2/travel-explorer.webp'), '가방 밖으로 펼쳐진 골목을 탐험하는 여행자', '길을 잃은 게 아니라 새 길을 찾은 것'),
  'travel:relaxer': typedComic('psych:travel:relaxer', require('../../assets/illustrations/comic/psych-v2/travel-relaxer.webp'), '발코니에서 움직이는 관광지를 바라보는 여행자', '관광지가 나에게 오면 됩니다'),
  'travel:foodie': typedComic('psych:travel:foodie', require('../../assets/illustrations/comic/psych-v2/travel-foodie.webp'), '랜드마크보다 커다란 음식을 먼저 찍는 여행자', '랜드마크보다 한입이 먼저'),
  'travel:planner': typedComic('psych:travel:planner', require('../../assets/illustrations/comic/psych-v2/travel-planner.webp'), '일정표를 텐트처럼 펼친 여행자', '일정표가 숙소보다 큽니다'),
  'travel:memory': typedComic('psych:travel:memory', require('../../assets/illustrations/comic/psych-v2/travel-memory.webp'), '노을 앞 단체 사진을 연출하는 여행자', '여행의 마지막 한 장까지 연출 완료'),
} as const satisfies Record<string, ResultComic>;

export function psychComic(testId: string, typeId: string): ResultComic {
  return PSYCH_COMICS[`${testId}:${typeId}` as keyof typeof PSYCH_COMICS] ?? PSYCH_COMICS['recharge:hobby'];
}

const GRADE_ASSETS = {
  mz: [
    require('../../assets/illustrations/comic/grade/mz/1.webp'),
    require('../../assets/illustrations/comic/grade/mz/2.webp'),
    require('../../assets/illustrations/comic/grade/mz/3.webp'),
    require('../../assets/illustrations/comic/grade/mz/4.webp'),
    require('../../assets/illustrations/comic/grade/mz/5.webp'),
    require('../../assets/illustrations/comic/grade/mz/6.webp'),
    require('../../assets/illustrations/comic/grade/mz/7.webp'),
    require('../../assets/illustrations/comic/grade/mz/8.webp'),
    require('../../assets/illustrations/comic/grade/mz/9.webp'),
  ],
  'dialect-gyeongsang': [
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gyeongsang/9.webp'),
  ],
  'dialect-jeolla': [
    require('../../assets/illustrations/comic/grade/dialect/jeolla/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeolla/9.webp'),
  ],
  'dialect-chungcheong': [
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/chungcheong/9.webp'),
  ],
  'dialect-gangwon': [
    require('../../assets/illustrations/comic/grade/dialect/gangwon/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/gangwon/9.webp'),
  ],
  'dialect-jeju': [
    require('../../assets/illustrations/comic/grade/dialect/jeju/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/jeju/9.webp'),
  ],
  'dialect-seoul': [
    require('../../assets/illustrations/comic/grade/dialect/seoul/1.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/2.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/3.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/4.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/5.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/6.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/7.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/8.webp'),
    require('../../assets/illustrations/comic/grade/dialect/seoul/9.webp'),
  ],
  spelling: [
    require('../../assets/illustrations/comic/grade/spelling/1.webp'),
    require('../../assets/illustrations/comic/grade/spelling/2.webp'),
    require('../../assets/illustrations/comic/grade/spelling/3.webp'),
    require('../../assets/illustrations/comic/grade/spelling/4.webp'),
    require('../../assets/illustrations/comic/grade/spelling/5.webp'),
    require('../../assets/illustrations/comic/grade/spelling/6.webp'),
    require('../../assets/illustrations/comic/grade/spelling/7.webp'),
    require('../../assets/illustrations/comic/grade/spelling/8.webp'),
    require('../../assets/illustrations/comic/grade/spelling/9.webp'),
  ],
  purekorean: [
    require('../../assets/illustrations/comic/grade/purekorean/1.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/2.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/3.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/4.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/5.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/6.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/7.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/8.webp'),
    require('../../assets/illustrations/comic/grade/purekorean/9.webp'),
  ],
  idiom: [
    require('../../assets/illustrations/comic/grade/idiom/1.webp'),
    require('../../assets/illustrations/comic/grade/idiom/2.webp'),
    require('../../assets/illustrations/comic/grade/idiom/3.webp'),
    require('../../assets/illustrations/comic/grade/idiom/4.webp'),
    require('../../assets/illustrations/comic/grade/idiom/5.webp'),
    require('../../assets/illustrations/comic/grade/idiom/6.webp'),
    require('../../assets/illustrations/comic/grade/idiom/7.webp'),
    require('../../assets/illustrations/comic/grade/idiom/8.webp'),
    require('../../assets/illustrations/comic/grade/idiom/9.webp'),
  ],
} as const satisfies Record<string, readonly ImageSourcePropType[]>;

const GRADE_LABELS = {
  mz: 'MZ 고사',
  'dialect-gyeongsang': '경상도 사투리 고사',
  'dialect-jeolla': '전라도 사투리 고사',
  'dialect-chungcheong': '충청도 사투리 고사',
  'dialect-gangwon': '강원도 사투리 고사',
  'dialect-jeju': '제주도 사투리 고사',
  'dialect-seoul': '서울·경기 사투리 고사',
  spelling: '맞춤법 고사',
  purekorean: '순우리말 고사',
  idiom: '고사성어 고사',
} as const satisfies Record<keyof typeof GRADE_ASSETS, string>;

const DIALECT_REGION_LABELS = {
  gyeongsang: '경상도',
  jeolla: '전라도',
  chungcheong: '충청도',
  gangwon: '강원도',
  jeju: '제주도',
  seoul: '서울·경기',
} as const;

type DialectRegion = keyof typeof DIALECT_REGION_LABELS;

const GRADE_CAPTIONS = {
  mz: ['알림 파도까지 서핑 완료', '밈 왕좌에 자연스럽게 착석', '이모지 비도 전부 수신', '단톡방 암호 해독 중', '폴더폰과 스마트폰 사이 줄타기', '도망가는 해시태그 검거 작전', '유행 열차 방향만 살짝 반대', '낯선 밈을 유물처럼 감정 중', '오늘의 트렌드는 베개 모드'],
  dialect: ['말씨 탐험대 오늘의 우승', '낯선 억양도 차분히 포착', '말풍선 메달 정식 수여', '날아가는 표현까지 채집 중', '두 표현 사이 균형 잡기', '말풍선 길 따라 한 걸음', '새 억양 신호에 안테나 번쩍', '말씨 지도 펼치고 복습 중', '오늘은 귀도 포근하게 휴식'],
  spelling: ['교정 연필 오늘도 우승', '원고 산 정상에 깃발 꽂기', '교정 메달이 연필보다 큼', '도망가는 문장부호 포획 중', '닮은 표현 두 장 균형 잡기', '초고 미로도 점선 따라 전진', '빈칸은 틀렸지만 표정은 정답', '돋보기 수사대 야근 중', '원고 이불과 따뜻한 차'],
  purekorean: ['우리말 새싹에 꽃관 왕관', '이야기책 언덕 정상 도착', '꽃메달이 몸보다 풍성', '잊힌 물건 바구니 한가득', '닮은 잎도 차분히 구별', '시냇길 따라 단어 산책', '잘못 탄 잎배에서 반딧불 발견', '옛 물건 보물상자 탐험', '큰 잎 아래 새싹 낮잠'],
  idiom: ['먹빛 용 타고 이야기 출발', '구름 정상에 네 칸 도착', '옥메달 바람으로 여유 만점', '날아가는 두루마리 포획 중', '옛이야기 두 폭 균형 잡기', '먹길 따라 대숲 산책', '배는 반대여도 폭포는 장관', '청동 유물 확대 수사', '두루마리 베개와 학 경비원'],
} as const;

export function gradeComic(testId: string, grade: number, variant?: string): ResultComic {
  const dialectRegion = variant && variant in DIALECT_REGION_LABELS
    ? (variant as DialectRegion)
    : 'gyeongsang';
  const dialectAssetId = `dialect-${dialectRegion}` as keyof typeof GRADE_ASSETS;
  const id = testId === 'dialect'
    ? dialectAssetId
    : testId in GRADE_ASSETS
      ? (testId as keyof typeof GRADE_ASSETS)
      : 'spelling';
  const captionId = (testId === 'dialect' ? 'dialect' : id) as keyof typeof GRADE_CAPTIONS;
  const safeGrade = grade >= 1 && grade <= 9 ? grade : 9;
  return comic(
    `grade:${id}:${safeGrade}`,
    GRADE_ASSETS[id][safeGrade - 1]!,
    `${GRADE_LABELS[id]} ${safeGrade}급 전용 코믹 일러스트`,
    `${GRADE_LABELS[id]} · ${GRADE_CAPTIONS[captionId][safeGrade - 1]!}`,
    gradeStory(testId === 'dialect' ? 'dialect' : id, safeGrade, testId === 'dialect' ? dialectRegion : undefined),
    scoredJournal(testId === 'dialect' ? 'dialect' : id)
  );
}

const IQ_ASSETS = {
  octopus: {
    assetId: 'iq:octopus',
    source: require('../../assets/illustrations/comic/iq-animals/octopus.webp'),
    accessibilityLabel: '문어가 여러 팔로 미로와 퍼즐 조각을 탐색하는 클레이 장면',
    caption: '여러 갈래를 만져보는 문어 탐색가',
  },
  raccoon: {
    assetId: 'iq:raccoon',
    source: require('../../assets/illustrations/comic/iq-animals/raccoon.webp'),
    accessibilityLabel: '라쿤이 여러 잠금장치가 달린 퍼즐 상자를 여는 클레이 장면',
    caption: '다른 문도 눌러보는 라쿤 해결사',
  },
  corvid: {
    assetId: 'iq:corvid',
    source: require('../../assets/illustrations/comic/iq-animals/corvid.webp'),
    accessibilityLabel: '까마귀가 여러 도구를 골라 투명관의 토큰을 꺼내는 클레이 장면',
    caption: '도구 순서를 조립하는 까마귀 발명가',
  },
  chimpanzee: {
    assetId: 'iq:chimpanzee',
    source: require('../../assets/illustrations/comic/iq-animals/chimpanzee.webp'),
    accessibilityLabel: '침팬지가 가려진 색 타일의 순서를 기억하는 클레이 장면',
    caption: '순서를 붙잡는 침팬지 관제사',
  },
} as const;

export function iqComic(estimatedScore: number): ResultComic {
  const friend = iqAnimalFriend(estimatedScore);
  const raw = IQ_ASSETS[friend.id];
  return comic(raw.assetId, raw.source, raw.accessibilityLabel, raw.caption, iqStory(estimatedScore), IQ_JOURNAL);
}

/** 테스트가 추가될 때 총수와 assetId 중복 검사가 함께 깨지도록 전체 목록을 공개한다. */
export function resultIllustrationAssetIds(): readonly string[] {
  const gradeIds = Object.keys(GRADE_ASSETS).flatMap((testId) =>
    Array.from({ length: 9 }, (_, index) => `grade:${testId}:${index + 1}`)
  );
  return [
    ...Object.values(MBTI_COMICS).map((item) => item.assetId),
    ...Object.values(PSYCH_COMICS).map((item) => item.assetId),
    ...Object.values(IQ_ASSETS).map((item) => item.assetId),
    ...gradeIds,
  ];
}

function typedComic(
  assetId: string,
  source: ImageSourcePropType,
  accessibilityLabel: string,
  caption: string
): ResultComic {
  const journal = assetId.startsWith('personality:')
    ? personalityJournal()
    : psychJournal(assetId.split(':')[1] ?? 'recharge');
  return comic(assetId, source, accessibilityLabel, caption, typeStory(assetId), journal);
}

function comic(
  assetId: string,
  source: ImageSourcePropType,
  accessibilityLabel: string,
  caption: string,
  story: ResultStory,
  journal: ResultJournal
): ResultComic {
  return { assetId, source, accessibilityLabel, caption, story, journal };
}
