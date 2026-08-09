import grades from '@/content/grades.json';
import { gradeStory } from '@/content/resultStories';
import {
  iqAnimalFriend,
  psychJournal,
  psychRelationCopy,
  scoredJournal,
} from '@/content/resultPresentation';

describe('테스트별 결과 표현', () => {
  const psychIds = ['love', 'stress', 'comm', 'recharge', 'procrastination', 'travel'];
  const scoredIds = ['mz', 'dialect', 'spelling', 'purekorean', 'idiom'];

  test('심리 테스트마다 관찰 항목과 관계 카드 문구가 따로 있다', () => {
    const journalTitles = psychIds.map((id) => psychJournal(id).title);
    expect(new Set(journalTitles).size).toBe(psychIds.length);

    for (const id of psychIds) {
      const relation = psychRelationCopy(id);
      expect(relation.goodHeading.length).toBeGreaterThan(8);
      expect(relation.hardHeading.length).toBeGreaterThan(8);
      expect(relation.disclaimer).not.toContain('네 글자');
    }
  });

  test('정답형 테스트마다 결과 리포트 이름이 다르다', () => {
    const titles = scoredIds.map((id) => scoredJournal(id).title);
    expect(new Set(titles).size).toBe(scoredIds.length);
  });

  test('급수 장면은 테스트 내용과 실제 그림 장면에 맞는다', () => {
    expect(gradeStory('spelling', 7).habit).toContain('빈칸');
    expect(gradeStory('purekorean', 7).habit).toContain('낱말');
    expect(gradeStory('idiom', 7).habit).toContain('유래');
    expect(gradeStory('mz', 7).habit).toContain('유행 열차');
    expect(gradeStory('dialect', 7, 'jeju').habit).toContain('제주도 말씨');
  });

  test('낮은 급수 칭호도 출신이나 능력을 조롱하지 않는다', () => {
    const banned = /찍|사람 확정|토박이 인정|외가가|포기했다|몰랐다|전부 처음|한글은 읽|다 같아/;
    for (const table of Object.values(grades)) {
      for (const band of table.bands) {
        expect(band.title).not.toMatch(banned);
      }
    }
  });

  test('IQ의 네 점수대는 서로 다른 동물 인지 강점을 소개한다', () => {
    const friends = [80, 100, 115, 130].map(iqAnimalFriend);
    expect(new Set(friends.map((friend) => friend.id)).size).toBe(4);
    for (const friend of friends) {
      expect(friend.fact.length).toBeGreaterThan(25);
      expect(friend.connection.length).toBeGreaterThan(25);
    }
  });
});
