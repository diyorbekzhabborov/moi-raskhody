import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';

export const PwaPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if on iOS Safari and not standalone
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shrink-0">
            <PlusSquare className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold leading-tight">
              Установите «Мои Расходы» на iPhone
            </h4>
            <p className="text-[11px] text-slate-300 leading-snug">
              Нажмите кнопку «Поделиться» <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> в Safari и выберите <strong>«На экран Домой»</strong> для работы без интернета.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
