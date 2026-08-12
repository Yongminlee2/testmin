import { create } from 'zustand';
import type { Question } from '@/engine/types';
import type { WrongItem } from '@/engine/score';
import { addRecord, parseRecords } from '@/engine/records';
import type { RecordResult, TestRecord } from '@/engine/records';
import { addNotes, parseNotes } from '@/engine/notes';
import type { WrongNote } from '@/engine/notes';
import { getPool } from '@/content/registry';
import { GENERATORS } from '@/engine/iq/generators';
import { parseIqQuestionId } from '@/engine/iq/questionId';
import { loadNotesRaw, loadRecordsRaw, saveNotesRaw, saveRecordsRaw } from './storage';

/**
 * 오답노트 항목에서 원래 문항을 복원한다. 여기 두는 이유: 정적 풀(POOLS)과
 * IQ 생성기 레지스트리(GENERATORS)를 둘 다 봐야 하는데, 그건 content/registry에
 * 의존하므로 순수 엔진(src/engine/notes.ts)에 두면 의존 방향이 뒤집힌다.
 *
 * - testId === 'iq' → questionId를 `parseIqQuestionId`로 풀어 생성기를 찾고
 *   generate(seed)로 다시 만든다. iqQuestionId ↔ parseIqQuestionId 왕복 계약은
 *   src/engine/iq/questionId.ts에서 이미 검증됐다 — 여기서는 그 계약을 쓰기만 한다.
 * - 그 외 → getPool(testId, variant)에서 id로 찾는다.
 *
 * 생성기가 없거나(구버전 노트가 삭제된 생성기를 가리킴), id 파싱이 실패하거나,
 * 풀에 그 id가 없으면 undefined. 호출부(화면)가 그 항목을 건너뛴다 — 절대 throw
 * 하지 않는다. "복원 실패"는 오래된 콘텐츠가 남긴 흔적일 뿐, 앱 오류가 아니다.
 */
export function restoreQuestion(note: WrongNote): Question | undefined {
  return restoreQuestionByRef(note.testId, note.variant, note.questionId);
}

function restoreQuestionByRef(
  testId: string,
  variant: string,
  questionId: string
): Question | undefined {
  if (testId === 'iq') {
    const parsed = parseIqQuestionId(questionId);
    if (parsed === undefined) return undefined;
    const generator = GENERATORS.find((g) => g.id === parsed.generatorId);
    if (generator === undefined) return undefined;
    return generator.generate(parsed.seed).question;
  }

  const pool = getPool(testId, variant);
  return pool.find((q) => q.id === questionId);
}

/** JSON 데이터인 Choice를 원본 보기와 비교하기 위한 안정적인 값 키. */
function choiceKey(choice: Question['choices'][number] | undefined): string | undefined {
  return choice === undefined ? undefined : JSON.stringify(choice);
}

function canonicalChoiceIndex(
  displayed: Question,
  canonical: Question,
  displayedIndex: number
): number | undefined {
  if (displayedIndex === -1) return -1;
  const key = choiceKey(displayed.choices[displayedIndex]);
  if (key === undefined) return undefined;
  const index = canonical.choices.findIndex((choice) => choiceKey(choice) === key);
  return index >= 0 ? index : undefined;
}

/**
 * 화면에서 섞인 선택지 번호를 오답노트가 복원하는 원본 문항 번호로 되돌린다.
 * 하나라도 확실히 대응하지 못하면 그 항목은 저장하지 않는다. 틀린 보기를
 * 자신 있게 표시하는 것보다 항목 하나를 생략하는 편이 안전하다.
 */
export function canonicalizeWrongItems(
  testId: string,
  variant: string,
  displayedQuestions: readonly Question[],
  wrong: readonly WrongItem[]
): WrongItem[] {
  const displayedById = new Map(displayedQuestions.map((question) => [question.id, question]));
  const normalized: WrongItem[] = [];

  for (const item of wrong) {
    const displayed = displayedById.get(item.questionId);
    const canonical = restoreQuestionByRef(testId, variant, item.questionId);
    if (displayed === undefined || canonical === undefined) continue;

    const chosenIndex = canonicalChoiceIndex(displayed, canonical, item.chosenIndex);
    const answerIndex = canonicalChoiceIndex(displayed, canonical, item.answerIndex);
    if (chosenIndex === undefined || answerIndex === undefined) continue;

    normalized.push({ questionId: item.questionId, chosenIndex, answerIndex });
  }

  return normalized;
}

function makeRecordId(testId: string, seed: number): string {
  return `${testId}-${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SaveResultBase {
  readonly testId: string;
  readonly variant: string;
  readonly seed: number;
  readonly result: RecordResult;
}

/**
 * 정답형 결과는 오답과 사용자가 실제로 본 문항을 반드시 한 쌍으로 넘긴다.
 * 한쪽을 빼먹으면 다시 인덱스만 저장하는 결함이 생기므로 타입 단계에서 막는다.
 */
export type SaveResultInput = SaveResultBase &
  (
    | {
        readonly wrong: readonly WrongItem[];
        readonly questions: readonly Question[];
      }
    | {
        readonly wrong?: undefined;
        readonly questions?: undefined;
      }
  );

interface HistoryState {
  readonly records: readonly TestRecord[];
  readonly notes: readonly WrongNote[];
  readonly loaded: boolean;
  /** 앱 시작 시(app/_layout.tsx) 한 번 부른다. */
  load: () => Promise<void>;
  /** 결과 화면이 채점 직후 한 번만 부른다. */
  saveResult: (input: SaveResultInput) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useHistory = create<HistoryState>((set, get) => ({
  records: [],
  notes: [],
  loaded: false,

  load: async () => {
    const [rawRecords, rawNotes] = await Promise.all([loadRecordsRaw(), loadNotesRaw()]);
    // parseRecords/parseNotes는 raw가 무엇이든(깨진 JSON은 storage.ts가 이미 null로
    // 바꿔줬지만, 혹시 모를 이상한 모양도) 절대 throw하지 않는다 — 여기서 앱이
    // 죽으면 사용자는 앱을 아예 못 연다.
    set({
      records: parseRecords(rawRecords),
      notes: parseNotes(rawNotes),
      loaded: true,
    });
  },

  saveResult: async (input) => {
    const state = get();

    const rec: TestRecord = {
      id: makeRecordId(input.testId, input.seed),
      testId: input.testId,
      variant: input.variant,
      seed: input.seed,
      completedAt: Date.now(),
      result: input.result,
    };
    const records = addRecord(state.records, rec);

    let notes = state.notes;
    if (input.wrong !== undefined && input.wrong.length > 0) {
      const addedAt = Date.now();
      const normalizedWrong = canonicalizeWrongItems(
        input.testId,
        input.variant,
        input.questions,
        input.wrong
      );
      const newNotes: WrongNote[] = normalizedWrong.map((w) => ({
        testId: input.testId,
        variant: input.variant,
        questionId: w.questionId,
        chosenIndex: w.chosenIndex,
        answerIndex: w.answerIndex,
        choiceOrder: 'canonical',
        addedAt,
      }));
      notes = addNotes(state.notes, newNotes);
    }

    set({ records, notes });
    await Promise.all([saveRecordsRaw(records), saveNotesRaw(notes)]);
  },

  clearAll: async () => {
    set({ records: [], notes: [] });
    await Promise.all([saveRecordsRaw([]), saveNotesRaw([])]);
  },
}));
