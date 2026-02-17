
import React, { useState } from 'react';

interface ContextualTipProps {
  tipKey: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  dismissedTips: Set<string>;
  onDismiss: (key: string) => void;
}

const ContextualTip: React.FC<ContextualTipProps> = ({ tipKey, message, position = 'bottom', dismissedTips, onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (dismissedTips.has(tipKey)) return null;

  const positionClasses: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-slate-800',
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-5 h-5 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-xs font-bold hover:bg-indigo-200 transition-colors flex-shrink-0"
        aria-label="도움말"
      >
        ?
      </button>

      {isOpen && (
        <div className={`absolute z-[80] ${positionClasses[position]} w-56 animate-fade-in`} onClick={(e) => e.stopPropagation()}>
          <div className="relative bg-slate-800 text-white text-xs leading-relaxed p-3 rounded-xl shadow-xl">
            <p>{message}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(tipKey); setIsOpen(false); }}
              className="mt-2 text-[10px] text-indigo-300 hover:text-indigo-200 font-bold"
            >
              다시 보지 않기
            </button>
            <div className={`absolute ${arrowClasses[position]} w-0 h-0`} />
          </div>
        </div>
      )}
    </span>
  );
};

export default ContextualTip;
