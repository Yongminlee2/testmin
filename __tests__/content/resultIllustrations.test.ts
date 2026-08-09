import fs from 'node:fs';
import path from 'node:path';
import typeNames from '@/content/typeNames.json';
import { PSYCH_TESTS } from '@/content/registry';
import {
  gradeComic,
  iqComic,
  personalityComic,
  psychComic,
  resultIllustrationAssetIds,
} from '@/content/resultIllustrations';

describe('결과 전용 일러스트', () => {
  const comics = [
    ...typeNames.map((type) => personalityComic(type.code)),
    ...PSYCH_TESTS.flatMap((test) =>
      test.types.map((type) => psychComic(test.id, type.id))
    ),
    ...['mz', 'dialect', 'spelling', 'purekorean', 'idiom'].flatMap((testId) =>
      Array.from({ length: 9 }, (_, index) => gradeComic(testId, index + 1))
    ),
    iqComic(80),
    iqComic(110),
    iqComic(140),
  ];

  test('모든 테스트×결과 조합 94개가 서로 다른 assetId를 쓴다', () => {
    expect(comics).toHaveLength(94);
    expect(new Set(comics.map((comic) => comic.assetId)).size).toBe(94);
    expect(resultIllustrationAssetIds()).toHaveLength(94);
    expect(new Set(resultIllustrationAssetIds()).size).toBe(94);
  });

  test('코드에 선언된 실제 WebP 경로도 94개이고 중복되지 않는다', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/content/resultIllustrations.ts'),
      'utf8'
    );
    const files = [...source.matchAll(/require\('([^']+\.webp)'\)/g)].map(
      (match) => match[1]!
    );
    expect(files).toHaveLength(94);
    expect(new Set(files).size).toBe(94);
  });

  test('캡션과 상세 관찰일지도 결과마다 고유하고 비어 있지 않다', () => {
    expect(new Set(comics.map((comic) => comic.caption)).size).toBe(94);
    const stories = comics.map((comic) =>
      [comic.story.habit, comic.story.charm, comic.story.tip].join('|')
    );
    expect(new Set(stories).size).toBe(94);
    for (const comic of comics) {
      expect(comic.accessibilityLabel.length).toBeGreaterThan(8);
      expect(comic.story.habit.length).toBeGreaterThan(20);
      expect(comic.story.charm.length).toBeGreaterThan(20);
      expect(comic.story.tip.length).toBeGreaterThan(20);
    }
  });
});
