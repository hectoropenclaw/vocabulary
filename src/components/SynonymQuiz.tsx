"use client";

import { useCallback, useEffect, useReducer } from "react";
import { WORDS, buildQuizQuestion } from "@/lib/words";
import type { Word } from "@/lib/words";

const ROUND_SIZE = 10;

type QuizState =
  | { phase: "idle" }
  | { phase: "question"; word: Word; correct: string; options: string[]; questionIndex: number; score: number }
  | { phase: "answered"; word: Word; correct: string; options: string[]; chosen: string; questionIndex: number; score: number }
  | { phase: "finished"; score: number; total: number };

type Action =
  | { type: "start" }
  | { type: "answer"; chosen: string }
  | { type: "next" }
  | { type: "restart" };

function nextQuestion(index: number, score: number, seenWords: Word[]): Extract<QuizState, { phase: "question" }> {
  const pool = WORDS.filter((w) => !seenWords.find((s) => s.word === w.word));
  const source = pool.length > 0 ? pool : WORDS;
  const word = source[Math.floor(Math.random() * source.length)];
  const { correct, options } = buildQuizQuestion(word);
  return { phase: "question", word, correct, options, questionIndex: index, score };
}

function reducer(state: QuizState, action: Action): QuizState {
  if (action.type === "start" || action.type === "restart") {
    return nextQuestion(0, 0, []);
  }

  if (action.type === "answer" && state.phase === "question") {
    const newScore = action.chosen === state.correct ? state.score + 1 : state.score;
    return { ...state, phase: "answered", chosen: action.chosen, score: newScore };
  }

  if (action.type === "next" && state.phase === "answered") {
    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= ROUND_SIZE) {
      return { phase: "finished", score: state.score, total: ROUND_SIZE };
    }
    const seenWords: Word[] = [state.word];
    return nextQuestion(nextIndex, state.score, seenWords);
  }

  return state;
}

export function SynonymQuiz() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  useEffect(() => {
    dispatch({ type: "start" });
  }, []);

  const handleAnswer = useCallback((option: string) => {
    if (state.phase === "question") dispatch({ type: "answer", chosen: option });
  }, [state.phase]);

  const handleNext = useCallback(() => dispatch({ type: "next" }), []);
  const handleRestart = useCallback(() => dispatch({ type: "restart" }), []);

  if (state.phase === "idle") {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  if (state.phase === "finished") {
    const pct = Math.round((state.score / state.total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📚"}</div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{state.score}/{state.total} correct</p>
          <p className="text-gray-400 mt-1">{pct}% accuracy</p>
        </div>
        <button
          onClick={handleRestart}
          className="w-full max-w-xs rounded-2xl bg-[#7aa37a] py-4 text-base font-bold text-gray-950 active:scale-95 transition-transform"
        >
          Practice Again
        </button>
      </div>
    );
  }

  const { word, correct, options, questionIndex, score } = state;
  const isAnswered = state.phase === "answered";
  const chosen = isAnswered ? state.chosen : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{questionIndex + 1} / {ROUND_SIZE}</span>
        <span>{score} correct</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7aa37a] rounded-full transition-all"
          style={{ width: `${((questionIndex) / ROUND_SIZE) * 100}%` }}
        />
      </div>

      {/* Word card */}
      <div className="flex items-center justify-center rounded-3xl bg-[#1a1a1a] border border-white/8 py-12 px-6 min-h-[160px]">
        <p className="text-3xl font-semibold text-gray-200 tracking-wide">{word.word}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isCorrect = option === correct;
          const isChosen = option === chosen;
          let cls = "w-full rounded-2xl border py-4 px-5 text-base font-semibold text-left transition-all active:scale-[0.98]";
          if (!isAnswered) {
            cls += " border-white/10 bg-[#1e1e1e] text-gray-200";
          } else if (isCorrect) {
            cls += " border-[#7aa37a]/60 bg-[#7aa37a]/20 text-[#c5e6c5]";
          } else if (isChosen) {
            cls += " border-red-500/40 bg-red-500/10 text-red-300";
          } else {
            cls += " border-white/5 bg-[#1a1a1a] text-gray-500";
          }

          return (
            <button
              key={option}
              className={cls}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
            >
              <span className="flex items-center gap-3">
                {isAnswered && isCorrect && <span className="text-[#7aa37a]">✓</span>}
                {isAnswered && isChosen && !isCorrect && <span className="text-red-400">✗</span>}
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {isAnswered && (
        <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#7aa37a] text-lg">{chosen === correct ? "✓" : "✗"}</span>
            <span className="font-bold text-white text-base">
              {chosen === correct ? "That's correct!" : "Not quite"}
            </span>
          </div>
          <p className="text-gray-400 text-sm font-semibold">{word.word}</p>
          <p className="text-gray-300 text-sm mt-0.5">{word.definition}</p>
          {chosen !== correct && (
            <p className="text-[#c5e6c5] text-sm mt-1">
              Correct answer: <strong>{correct}</strong>
            </p>
          )}
          <button
            onClick={handleNext}
            className="mt-4 w-full rounded-2xl bg-[#6b9e8b] py-3.5 text-sm font-bold text-gray-950 active:scale-95 transition-transform"
          >
            {questionIndex + 1 >= ROUND_SIZE ? "Finish" : "Start practicing"}
          </button>
        </div>
      )}
    </div>
  );
}
