export interface ResultJournal {
  readonly title: string;
  readonly habitLabel: string;
  readonly charmLabel: string;
  readonly tipLabel: string;
  readonly disclaimer: string;
}
export interface PsychRelationCopy {
  readonly goodHeading: string;
  readonly hardHeading: string;
  readonly disclaimer: string;
}

export interface IqAnimalFriend {
  readonly id: 'octopus' | 'raccoon' | 'corvid' | 'chimpanzee';
  readonly name: string;
  readonly nickname: string;
  readonly fact: string;
  readonly connection: string;
}

const PERSONALITY_JOURNAL: ResultJournal = {
  title: '캐릭터 사용 설명서',
  habitLabel: '자주 나오는 장면',
  charmLabel: '이럴 때 빛나요',
  tipLabel: '편해지는 요령',
  disclaimer: '성격은 네 글자에 갇히지 않아요. 오늘 자주 보인 경향을 재미로 풀어봤습니다.',
};

const PSYCH_JOURNALS: Record<string, ResultJournal> = {
  love: {
    title: '연애 장면 리플레이',
    habitLabel: '마음이 움직일 때',
    charmLabel: '관계에서 좋은 점',
    tipLabel: '덜 꼬이는 한 수',
    disclaimer: '연애 방식은 상대와 상황에 따라 달라져요. 지금의 표현 습관을 가볍게 살펴보세요.',
  },
  stress: {
    title: '스트레스 대피 매뉴얼',
    habitLabel: '압력이 올라갈 때',
    charmLabel: '회복에 쓰는 힘',
    tipLabel: '온도 낮추는 한 수',
    disclaimer: '반응 방식에는 우열이 없어요. 내 압력계가 언제 움직이는지 알아보는 결과입니다.',
  },
  comm: {
    title: '대화 자막 해설',
    habitLabel: '말을 꺼낼 때',
    charmLabel: '대화에서 빛나는 점',
    tipLabel: '오해 줄이는 한 수',
    disclaimer: '소통 방식은 사람과 상황에 따라 바뀌어요. 자주 쓰는 채널을 재미로 정리했습니다.',
  },
  recharge: {
    title: '배터리 충전 설명서',
    habitLabel: '방전 신호가 오면',
    charmLabel: '잘 차는 방식',
    tipLabel: '충전 예약 한 수',
    disclaimer: '휴식에는 정답이 없어요. 지금 내 배터리에 잘 맞는 충전법을 찾아보세요.',
  },
  procrastination: {
    title: '시동 버튼 설명서',
    habitLabel: '손이 멈출 때',
    charmLabel: '움직이게 하는 힘',
    tipLabel: '5분짜리 한 수',
    disclaimer: '미루기는 의지 점수가 아니에요. 나에게 잘 걸리는 시동 장치를 찾는 결과입니다.',
  },
  travel: {
    title: '여행 모드 안내서',
    habitLabel: '여행지에서',
    charmLabel: '동행에게 좋은 점',
    tipLabel: '일정 살리는 한 수',
    disclaimer: '여행 취향은 목적지와 동행에 따라 달라져요. 자주 켜지는 여행 모드를 골라봤습니다.',
  },
};

const SCORED_JOURNALS: Record<string, ResultJournal> = {
  mz: {
    title: '밈 레이더 리포트',
    habitLabel: '현재 수신 상태',
    charmLabel: '이미 잡은 신호',
    tipLabel: '다음 업데이트',
    disclaimer: '유행어는 매일 바뀌어요. 세대 감각이 아니라 오늘의 밈 수신 상태를 본 결과입니다.',
  },
  dialect: {
    title: '말씨 수신 리포트',
    habitLabel: '현재 수신 상태',
    charmLabel: '이미 들리는 결',
    tipLabel: '다음 말씨 산책',
    disclaimer: '지역 안에서도 말씨는 다양해요. 출신지를 판정하지 않는 재미 퀴즈입니다.',
  },
  spelling: {
    title: '교정실 리포트',
    habitLabel: '이번 원고 장면',
    charmLabel: '이미 잡은 감각',
    tipLabel: '다음 한 문장',
    disclaimer: '맞춤법 실수는 실력 전체가 아니에요. 헷갈린 규칙을 찾기 위한 오늘의 기록입니다.',
  },
  purekorean: {
    title: '우리말 탐험 기록',
    habitLabel: '이번 산책 장면',
    charmLabel: '이미 찾은 낱말',
    tipLabel: '다음 단어 한 알',
    disclaimer: '낯선 순우리말은 모르는 게 자연스러워요. 오늘 새로 만난 말이 수확입니다.',
  },
  idiom: {
    title: '고전 탐험 기록',
    habitLabel: '이번 두루마리',
    charmLabel: '이미 이은 이야기',
    tipLabel: '다음 네 글자',
    disclaimer: '고사성어는 한자 암기보다 이야기의 맥락이 먼저예요. 오늘의 탐험 기록으로 봐주세요.',
  },
};

export const IQ_JOURNAL: ResultJournal = {
  title: '퍼즐 연구소 기록',
  habitLabel: '이번 풀이 장면',
  charmLabel: '이번에 잡은 힘',
  tipLabel: '다음 실험',
  disclaimer: '한 번의 퍼즐 결과는 지능 전체를 설명하지 않아요. 오늘의 풀이 컨디션만 가볍게 기록했습니다.',
};

const PSYCH_RELATIONS: Record<string, PsychRelationCopy> = {
  love: {
    goodHeading: '이 연애 리듬과 호흡이 좋아요',
    hardHeading: '속도를 맞추면 더 편해져요',
    disclaimer: '연애 판결문이 아니라 리듬 체크예요. 실제 호흡은 둘이 맞춰가는 쪽이 훨씬 정확합니다.',
  },
  stress: {
    goodHeading: '함께 쓰면 회복에 도움 되는 방식',
    hardHeading: '동시에 쓰면 엇갈릴 수 있는 방식',
    disclaimer: '회복법 조합을 본 것이지 사람이나 건강에 점수를 매긴 건 아니에요. 오늘의 압력계는 내일 달라질 수 있습니다.',
  },
  comm: {
    goodHeading: '대화가 잘 이어지는 방식',
    hardHeading: '한 번 더 번역이 필요한 방식',
    disclaimer: '대화 습관의 번역 난이도를 본 거예요. 누가 더 훌륭한 소통가인지 뽑는 시험은 아닙니다.',
  },
  recharge: {
    goodHeading: '충전 리듬을 지켜주는 방식',
    hardHeading: '휴식 시간이 엇갈리기 쉬운 방식',
    disclaimer: '쉬는 박자를 비교한 것이지 사람 사이 합격표는 아니에요. 오늘 배터리 잔량에 따라 모드는 달라집니다.',
  },
  procrastination: {
    goodHeading: '함께 쓰면 시동이 잘 걸리는 방식',
    hardHeading: '압박으로 느껴질 수 있는 방식',
    disclaimer: '시동 버튼이 다른 것뿐, 의지나 성실함의 등수표가 아니에요.',
  },
  travel: {
    goodHeading: '같이 떠나면 합이 좋은 여행 모드',
    hardHeading: '일정 합의가 먼저 필요한 모드',
    disclaimer: '여행 모드를 비교한 것이지 동행 금지 명단은 아니에요. 합의 한 줄이면 일정은 꽤 잘 굴러갑니다.',
  },
};

const IQ_ANIMALS: readonly IqAnimalFriend[] = [
  {
    id: 'octopus',
    name: '문어',
    nickname: '팔로 만져가며 길을 찾는 탐색가',
    fact: '문어는 팔의 촉각과 움직임 정보를 모아 미로에서 방향을 학습하는 능력이 연구됐어요.',
    connection: '이번 결과도 정답 숫자보다 여러 규칙을 끝까지 만져본 탐색 경험에 더 가깝습니다.',
  },
  {
    id: 'raccoon',
    name: '라쿤',
    nickname: '다시 열어보며 방법을 바꾸는 해결사',
    fact: '야생 라쿤은 퍼즐 상자를 반복해서 만나며 성공률을 높이고 여러 해결법을 시도했어요.',
    connection: '한 번 막혀도 다른 문을 눌러보는 끈기가 다음 퍼즐에서 강한 무기가 됩니다.',
  },
  {
    id: 'corvid',
    name: '까마귀류',
    nickname: '도구를 골라 순서대로 쓰는 발명가',
    fact: '까마귀류는 알맞은 도구를 고르고, 도구를 바꾸거나 여러 개를 순서대로 써 문제를 풀기도 해요.',
    connection: '조건을 나눠 보고 필요한 단서를 조합하는 이번 풀이 방식과 닮은 점이 있습니다.',
  },
  {
    id: 'chimpanzee',
    name: '침팬지',
    nickname: '보이는 순서를 빠르게 붙잡는 관제사',
    fact: '침팬지는 화면의 숫자 순서를 익히고 가려진 뒤에도 순서를 기억하는 과제에 참여해 왔어요.',
    connection: '여러 규칙과 위치를 짧은 시간에 묶어두는 이번 퍼즐 장면과 연결해 볼 수 있습니다.',
  },
];

export function personalityJournal(): ResultJournal {
  return PERSONALITY_JOURNAL;
}

export function psychJournal(testId: string): ResultJournal {
  return PSYCH_JOURNALS[testId] ?? PSYCH_JOURNALS.recharge!;
}

export function scoredJournal(testId: string): ResultJournal {
  return SCORED_JOURNALS[testId] ?? SCORED_JOURNALS.spelling!;
}

export function psychRelationCopy(testId: string): PsychRelationCopy {
  return PSYCH_RELATIONS[testId] ?? PSYCH_RELATIONS.comm!;
}

export function iqAnimalFriend(estimatedScore: number): IqAnimalFriend {
  if (estimatedScore >= 125) return IQ_ANIMALS[3]!;
  if (estimatedScore >= 110) return IQ_ANIMALS[2]!;
  if (estimatedScore >= 95) return IQ_ANIMALS[1]!;
  return IQ_ANIMALS[0]!;
}
