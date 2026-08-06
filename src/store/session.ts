import { create } from 'zustand';
import type { Question } from '@/engine/types';
import type { Answer } from '@/engine/score';

interface SessionState {
  testId: string | null;
  variant: string | null;
  seed: number;
  questions: readonly Question[];
  answers: readonly Answer[];
  start: (testId: string, variant: string, seed: number, questions: readonly Question[]) => void;
  answer: (questionId: string, chosenIndex: number) => void;
  reset: () => void;
}

const empty = {
  testId: null,
  variant: null,
  seed: 0,
  questions: [] as readonly Question[],
  answers: [] as readonly Answer[],
};

export const useSession = create<SessionState>((set) => ({
  ...empty,
  start: (testId, variant, seed, questions) =>
    set({ testId, variant, seed, questions, answers: [] }),
  answer: (questionId, chosenIndex) =>
    set((state) => {
      const exists = state.answers.some((a) => a.questionId === questionId);
      // 이미 답한 문항이면 원래 자리에서 값만 바꾼다 (순서 보존).
      const answers = exists
        ? state.answers.map((a) =>
            a.questionId === questionId ? { questionId, chosenIndex } : a
          )
        : [...state.answers, { questionId, chosenIndex }];
      return { answers };
    }),
  reset: () => set({ ...empty }),
}));
