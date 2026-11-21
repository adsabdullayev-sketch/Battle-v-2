import React from 'react';
import { Award, RotateCcw, ShieldAlert } from 'lucide-react';
import { BattleStats, TurnOwner } from '../types/game';

interface VictoryModalProps {
  winner: TurnOwner;
  stats: BattleStats;
  onPlayAgain: () => void;
  onOpenSetup: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  stats,
  onPlayAgain,
  onOpenSetup,
}) => {
  const playerWon = winner === 'player';
  const accuracy =
    stats.questionsAsked > 0
      ? Math.round((stats.correctAnswers / stats.questionsAsked) * 100)
      : 0;
  const hitRate =
    stats.shotsFired > 0 ? Math.round((stats.hitsLanded / stats.shotsFired) * 100) : 0;

  const topicEntries = Object.keys(stats.topicTotal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030A16]/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-lg bg-[#0D213F] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div
          className={`px-6 py-6 text-center border-b ${
            playerWon
              ? 'bg-emerald-950/50 border-emerald-500/40'
              : 'bg-red-950/50 border-red-500/40'
          }`}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#08172E] border border-blue-500/30 flex items-center justify-center mb-3">
            {playerWon ? (
              <Award className="w-8 h-8 text-amber-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-400" />
            )}
          </div>
          <h2 id="victory-title" className="font-display text-2xl font-extrabold text-white">
            {playerWon ? 'Qələbə! Düşmən donanması məhv edildi' : 'Məğlubiyyət — Donanman batırıldı'}
          </h2>
          <p className="text-sm text-blue-200/85 mt-1">
            {playerWon
              ? 'Fizika biliklərin dənizdə sənə tam üstünlük qazandırdı!'
              : 'Fizika suallarını təkrar edib növbəti döyüşdə qalib gələ bilərsən.'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Quantitative Performance Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#08172E] border border-blue-800/60 rounded-xl p-3">
              <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                {accuracy}%
              </div>
              <div className="text-[11px] text-blue-200/80 mt-0.5">
                Fizika dəqiqliyi ({stats.correctAnswers}/{stats.questionsAsked})
              </div>
            </div>
            <div className="bg-[#08172E] border border-blue-800/60 rounded-xl p-3">
              <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                {stats.bestStreak}
              </div>
              <div className="text-[11px] text-blue-200/80 mt-0.5">Ən uzun doğru seriya</div>
            </div>
            <div className="bg-[#08172E] border border-blue-800/60 rounded-xl p-3">
              <div className="font-mono text-xl font-bold text-sky-400 tabular-nums">
                {hitRate}%
              </div>
              <div className="text-[11px] text-blue-200/80 mt-0.5">
                Atəş dəqiqliyi ({stats.hitsLanded}/{stats.shotsFired})
              </div>
            </div>
          </div>

          {/* Topic Breakdown */}
          {topicEntries.length > 0 && (
            <div className="bg-[#08172E] border border-blue-800/60 rounded-xl p-4">
              <h3 className="font-display font-bold text-xs text-blue-200 mb-2.5">
                Bölmələr üzrə nəticən
              </h3>
              <div className="space-y-2">
                {topicEntries.map((topicName) => {
                  const total = stats.topicTotal[topicName] || 0;
                  const right = stats.topicCorrect[topicName] || 0;
                  const pct = total > 0 ? Math.round((right / total) * 100) : 0;
                  return (
                    <div key={topicName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200">{topicName}</span>
                        <span className="font-mono tabular-nums text-blue-200">
                          {right}/{total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-blue-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenSetup}
              className="flex-1 py-2.5 px-4 rounded-xl border border-blue-700/70 bg-[#11284B] hover:bg-[#173564] text-blue-100 font-display font-semibold text-sm transition-colors whitespace-nowrap"
            >
              Ayarları Dəyiş
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yenidən Oyna</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
