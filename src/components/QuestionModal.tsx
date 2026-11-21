import React, { useEffect, useState } from 'react';
import { CheckCircle2, Crosshair, Lightbulb, XCircle, Zap } from 'lucide-react';
import { PhysicsQuestion } from '../types/game';

interface QuestionModalProps {
  question: PhysicsQuestion;
  targetLabel: string;
  isGuidedStrike: boolean;
  playerName: string;
  onResolve: (isCorrect: boolean) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const DIFFICULTY_LABEL: Record<PhysicsQuestion['difficulty'], string> = {
  easy: 'Asan (6-7-ci sinif)',
  medium: 'Orta (7-9-cu sinif)',
  hard: 'Çətin (9-11-ci sinif)',
};

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  targetLabel,
  isGuidedStrike,
  playerName,
  onResolve,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!answered) {
        if (e.key === '1' || e.key.toLowerCase() === 'a') setSelectedIndex(0);
        if (e.key === '2' || e.key.toLowerCase() === 'b') setSelectedIndex(1);
        if (e.key === '3' || e.key.toLowerCase() === 'c') setSelectedIndex(2);
        if (e.key === '4' || e.key.toLowerCase() === 'd') setSelectedIndex(3);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onResolve(isCorrect);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answered, isCorrect, onResolve]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030A16]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="physics-question-title"
    >
      <div className="w-full max-w-xl bg-[#0D213F] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#08172E] border-b border-blue-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-blue-200/85 font-medium">
            <span>{playerName}</span>
            <span aria-hidden="true">·</span>
            <span>{question.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABEL[question.difficulty]}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300 whitespace-nowrap shrink-0">
            {isGuidedStrike ? <Zap className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
            <span>{targetLabel}</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <h3
            id="physics-question-title"
            className="font-display text-lg sm:text-xl font-semibold text-white leading-snug mb-5"
          >
            {question.question}
          </h3>

          {/* Answer Options */}
          <div className="space-y-2.5">
            {question.options.map((opt, idx) => {
              const isOptionCorrect = idx === question.correctIndex;
              const isOptionSelected = idx === selectedIndex;

              let buttonStyle =
                'bg-[#132C52] border-blue-700/60 hover:bg-[#193868] hover:border-sky-400/70 text-slate-100';
              if (answered) {
                if (isOptionCorrect) {
                  buttonStyle = 'bg-emerald-900/50 border-emerald-400 text-emerald-50';
                } else if (isOptionSelected && !isOptionCorrect) {
                  buttonStyle = 'bg-red-900/50 border-red-400 text-red-50';
                } else {
                  buttonStyle = 'bg-[#0F2342] border-blue-900/50 text-slate-400 opacity-65';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={answered}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#08172E] border border-blue-500/30 flex items-center justify-center font-mono text-xs font-bold text-sky-300 shrink-0">
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="text-sm sm:text-base font-medium leading-snug">{opt}</span>
                  </div>
                  {answered && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {answered && isOptionSelected && !isOptionCorrect && (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint or Explanation Area */}
          {!answered ? (
            <div className="mt-4 pt-3 border-t border-blue-800/50 flex items-start justify-between gap-4">
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors py-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Fizika ipucuna bax</span>
                </button>
              ) : (
                <p className="text-xs sm:text-sm text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg px-3.5 py-2.5 w-full">
                  <span className="font-semibold text-amber-300">İpucu: </span>
                  {question.hint}
                </p>
              )}
              {!showHint && (
                <span className="text-[11px] text-blue-300/70 font-mono whitespace-nowrap">
                  Klaviatura: A-D / 1-4
                </span>
              )}
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t border-blue-800/50 space-y-4">
              <div
                className={`rounded-xl px-4 py-3 border ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-100'
                    : 'bg-red-950/50 border-red-500/50 text-red-100'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-bold text-sm mb-1">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Doğru cavab! Top atəşə hazırdır.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Cavab yanlışdır — mərmi hədəfə çatmadı!</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{question.explanation}</p>
              </div>

              <button
                type="button"
                onClick={() => onResolve(isCorrect)}
                className={`w-full py-3 px-5 rounded-xl font-display font-bold text-sm sm:text-base transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-200 hover:bg-white text-slate-950'
                }`}
              >
                {isCorrect ? 'Atəşi Aç!' : 'Növbəni Ötür'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
