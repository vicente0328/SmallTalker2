import React from 'react';

interface ChipGroupProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  customValue?: string;
  onCustomChange?: (v: string) => void;
  customPlaceholder?: string;
  isTextInput?: boolean;
  textValue?: string;
  onTextChange?: (v: string) => void;
  textPlaceholder?: string;
}

const ChipGroup: React.FC<ChipGroupProps> = ({ label, options, selected, onSelect, customValue, onCustomChange, customPlaceholder, isTextInput, textValue, onTextChange, textPlaceholder }) => (
  <div className="space-y-2">
    <p className="text-xs font-bold text-st-muted uppercase tracking-wider">{label}</p>
    {isTextInput ? (
      <input
        type="text"
        value={textValue || ''}
        onChange={(e) => onTextChange?.(e.target.value)}
        placeholder={textPlaceholder}
        className="w-full px-4 py-2.5 bg-st-bg border border-st-box/50 rounded-xl text-sm text-st-ink placeholder-st-muted focus:outline-none focus:ring-2 focus:ring-st-box focus:border-transparent transition"
      />
    ) : (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              selected === opt
                ? 'bg-st-blue text-white shadow-sm'
                : 'bg-st-bg text-st-ink hover:bg-st-box/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )}
    {selected === '기타' && onCustomChange && (
      <input
        type="text"
        value={customValue || ''}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={customPlaceholder}
        className="w-full mt-1 px-4 py-2.5 bg-st-bg border border-st-box rounded-xl text-sm text-st-ink placeholder-st-muted focus:outline-none focus:ring-2 focus:ring-st-box focus:border-transparent transition"
      />
    )}
  </div>
);

export default ChipGroup;
