import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface PhysicsGuideModalProps {
  onClose: () => void;
}

const FORMULA_CARDS = [
  {
    topic: 'Mexanika və Gəmiçilik',
    items: [
      { label: 'Sürət', formula: 'v = s / t', unit: 'm/san' },
      { label: 'Nyutonun 2-ci qanunu', formula: 'F = m · a', unit: 'N (Nyuton)' },
      { label: 'Arximed qüvvəsi', formula: 'F_A = ρ · g · V', unit: 'N (gəminin üzməsi)' },
      { label: 'Təzyiq', formula: 'p = F / S', unit: 'Pa (Paskal)' },
      { label: 'Kinetik enerji', formula: 'E_k = m · v² / 2', unit: 'C (Coul)' },
    ],
  },
  {
    topic: 'Elektrik və Maqnetizm',
    items: [
      { label: 'Om qanunu', formula: 'I = U / R', unit: 'A (Amper)' },
      { label: 'Elektrik gücü', formula: 'P = U · I', unit: 'Vt (Vatt)' },
      { label: 'Coul-Lens qanunu', formula: 'Q = I² · R · t', unit: 'C (Coul)' },
      { label: 'Ardıcıl müqavimət', formula: 'R = R₁ + R₂', unit: 'Ω (Om)' },
    ],
  },
  {
    topic: 'İstilik və Optika',
    items: [
      { label: 'İstilik miqdarı', formula: 'Q = c · m · Δt', unit: 'C (Coul)' },
      { label: 'Kelvin şkalası', formula: 'T = t(°C) + 273', unit: 'K (Kelvin)' },
      { label: 'Dalğa sürəti', formula: 'v = λ · ν', unit: 'm/san' },
      { label: 'Linzanın optik qüvvəsi', formula: 'D = 1 / F', unit: 'dptr (dioptriya)' },
    ],
  },
];

export const PhysicsGuideModal: React.FC<PhysicsGuideModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030A16]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0D213F] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#08172E] border-b border-blue-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 id="guide-modal-title" className="font-display text-lg font-bold text-white">
              Oyun Qaydaları və Fizika Düsturları
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-[#08172E] border border-blue-800/60 rounded-xl p-4 space-y-2 text-sm text-blue-100 leading-relaxed">
            <h3 className="font-display font-bold text-white text-base">Necə Oynamalı?</h3>
            <p>
              1. Döyüş başlamazdan əvvəl öz gəmilərini <strong className="text-white">Gəmiləri Qarışdır</strong> düyməsi ilə dəyişə bilərsən (və ya gəminin üstünə klikləyib fırlada bilərsən).
            </p>
            <p>
              2. <strong className="text-sky-300">Taktiki Rejimdə</strong> düşmən lövhəsindən bir xana seçib fizika sualını cavabla. Doğru cavab atəş açır! Gəmiyə dəysən, növbə səndə qalır.
            </p>
            <p>
              3. Ardıcıl <strong className="text-amber-300">3 doğru cavab</strong> verdikdə <strong className="text-amber-300">Dəqiq Zərbə</strong> açılır — növbəti doğru cavabın avtomatik olaraq gizli düşmən gəmisini vurur!
            </p>
            <p>
              4. <strong className="text-amber-300">Radar İpucu</strong> düyməsi düşmən gəmisinin yerləşdiyi 3×3 zonanı işıqlandırır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORMULA_CARDS.map((card) => (
              <div
                key={card.topic}
                className="bg-[#08172E] border border-blue-800/60 rounded-xl p-4"
              >
                <h3 className="font-display font-bold text-sm text-sky-300 mb-3">
                  {card.topic}
                </h3>
                <div className="space-y-2">
                  {card.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2 text-xs border-b border-blue-900/40 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="text-blue-100">{item.label}</span>
                      <div className="text-right font-mono">
                        <span className="font-bold text-white">{item.formula}</span>
                        <span className="text-blue-300/70 ml-1.5">[{item.unit}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#08172E] border-t border-blue-800/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm transition-colors"
          >
            Başa Düşdüm
          </button>
        </div>
      </div>
    </div>
  );
};
