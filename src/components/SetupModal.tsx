import React, { useState } from 'react';
import { Crosshair, Play, X, Zap } from 'lucide-react';
import { Difficulty, PhysicsTopic, PlayMode } from '../types/game';

interface SetupModalProps {
  currentDifficulty: Difficulty;
  currentTopic: PhysicsTopic;
  currentMode: PlayMode;
  onStart: (difficulty: Difficulty, topic: PhysicsTopic, mode: PlayMode) => void;
  onClose: () => void;
}

const TOPICS: PhysicsTopic[] = [
  'Hamısı',
  'Mexanika',
  'Elektrik',
  'Optika və Dalğalar',
  'İstilik',
  'Maqnetizm və Kosmos',
];

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Asan', desc: '6–7-ci sinif · Əsas anlayışlar' },
  { id: 'medium', label: 'Orta', desc: '7–9-cu sinif · Düsturlar və qanunlar' },
  { id: 'hard', label: 'Çətin', desc: '9–11-ci sinif · Məsələlər və təhlil' },
];

export const SetupModal: React.FC<SetupModalProps> = ({
  currentDifficulty,
  currentTopic,
  currentMode,
  onStart,
  onClose,
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(currentDifficulty);
  const [topic, setTopic] = useState<PhysicsTopic>(currentTopic);
  const [mode, setMode] = useState<PlayMode>(currentMode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030A16]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <div className="w-full max-w-xl bg-[#0D213F] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#08172E] border-b border-blue-800/60 flex items-center justify-between">
          <h2 id="setup-modal-title" className="font-display text-lg font-bold text-white">
            Yeni Döyüş Ayarları
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Play Mode */}
          <div>
            <label className="block text-sm font-semibold text-blue-100 mb-2.5">
              Atəş Rejimi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('tactical')}
                className={`p-3.5 rounded-xl border text-left transition-colors ${
                  mode === 'tactical'
                    ? 'bg-sky-500/15 border-sky-400 text-white'
                    : 'bg-[#11284B] border-blue-800/60 text-blue-200 hover:border-blue-600'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-bold text-sm mb-1">
                  <Crosshair className="w-4 h-4 text-sky-400" />
                  <span>Taktiki Döyüş</span>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Xananı seç, fizika sualını cavabla və atəş aç. 3 ardıcıl doğru cavab Dəqiq Zərbə verir.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('direct')}
                className={`p-3.5 rounded-xl border text-left transition-colors ${
                  mode === 'direct'
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-[#11284B] border-blue-800/60 text-blue-200 hover:border-blue-600'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-bold text-sm mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Birbaşa Zərbə (Sürətli)</span>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Hər doğru fizika cavabı birbaşa düşmən gəmisinin bir bölməsini vurur!
                </p>
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-blue-100 mb-2.5">
              Çətinlik Səviyyəsi
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                    difficulty === d.id
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-[#11284B] border-blue-800/60 text-blue-200 hover:border-blue-600'
                  }`}
                >
                  <div className="font-display font-bold text-sm">{d.label}</div>
                  <div className="text-[11px] text-blue-200/75 mt-0.5 leading-tight">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-blue-100 mb-2.5">
              Fizika Bölməsi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium text-center transition-colors truncate ${
                    topic === t
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                      : 'bg-[#11284B] border-blue-800/60 text-blue-100 hover:border-blue-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-800/40 transition-colors"
            >
              Ləğv et
            </button>
            <button
              type="button"
              onClick={() => onStart(difficulty, topic, mode)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Yeni Oyuna Başla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
