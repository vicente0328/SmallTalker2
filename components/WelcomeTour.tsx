
import React, { useState, useRef, useCallback } from 'react';
import { ViewState } from '../types';

interface WelcomeTourProps {
  userName: string;
  onComplete: () => void;
  setView: (view: ViewState) => void;
}

const STEPS = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: '먼저, 내 프로필을 설정하세요',
    description: '회사/소속, 직책, 관심사를 입력하면\nAI가 나에게 맞는 대화 주제를 추천합니다.\n프로필이 정확할수록 추천이 정교해져요!',
    action: '프로필 설정하기',
    targetView: ViewState.SETTINGS,
    color: 'violet',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: '캘린더에 첫 미팅을 등록하세요',
    description: '캘린더에서 날짜를 선택한 뒤\n"추가하기" 버튼을 눌러 미팅을 등록하세요.\n미팅 제목, 상대방, 장소를 입력하면\nAI가 맞춤형 스몰토크 가이드를 준비합니다.',
    action: '캘린더 바로가기',
    targetView: ViewState.CALENDAR,
    color: 'indigo',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '연락처를 추가하세요',
    description: '자주 만나는 분들의 정보를 등록하면,\n만남의 맥락을 AI가 기억합니다.',
    action: '연락처 바로가기',
    targetView: ViewState.CONTACT_LIST,
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'AI 스몰토크 가이드를 확인하세요',
    description: '등록한 미팅을 클릭하면 AI가 준비한\n비즈니스 팁과 라이프스타일 인사이트를\n확인할 수 있습니다.',
    action: '시작하기',
    targetView: null,
    color: 'amber',
  },
];

const COLOR_MAP: Record<string, { bg: string; iconBg: string; iconText: string; dot: string; btn: string; btnHover: string }> = {
  indigo: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', dot: 'bg-indigo-600', btn: 'bg-indigo-600', btnHover: 'hover:bg-indigo-500' },
  violet: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600', dot: 'bg-violet-600', btn: 'bg-violet-600', btnHover: 'hover:bg-violet-500' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', dot: 'bg-emerald-600', btn: 'bg-emerald-600', btnHover: 'hover:bg-emerald-500' },
  amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-600', dot: 'bg-amber-600', btn: 'bg-amber-600', btnHover: 'hover:bg-amber-500' },
};

const SWIPE_THRESHOLD = 50;

const WelcomeTour: React.FC<WelcomeTourProps> = ({ userName, onComplete, setView }) => {
  const [step, setStep] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const current = STEPS[step];
  const colors = COLOR_MAP[current.color];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const goNext = useCallback(() => {
    if (isLast) return;
    setSlideDir('left');
    setTimeout(() => {
      setStep(s => s + 1);
      setSlideDir(null);
    }, 200);
  }, [isLast]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    setSlideDir('right');
    setTimeout(() => {
      setStep(s => s - 1);
      setSlideDir(null);
    }, 200);
  }, [isFirst]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    setDragX(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only track horizontal swipes
    if (Math.abs(dx) > Math.abs(dy)) {
      setDragX(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragX < -SWIPE_THRESHOLD && !isLast) {
      goNext();
    } else if (dragX > SWIPE_THRESHOLD && !isFirst) {
      goPrev();
    }
    setDragX(0);
  }, [dragX, isLast, isFirst, goNext, goPrev]);

  const handleAction = () => {
    if (isLast) {
      onComplete();
    } else {
      goNext();
    }
  };

  const handleActionWithNav = () => {
    onComplete();
    if (current.targetView) {
      setView(current.targetView);
    }
  };

  const slideClass = slideDir === 'left'
    ? 'translate-x-[-100%] opacity-0'
    : slideDir === 'right'
    ? 'translate-x-[100%] opacity-0'
    : 'translate-x-0 opacity-100';

  const dragOpacity = dragX !== 0 ? Math.max(0.3, 1 - Math.abs(dragX) / 300) : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipeable content area */}
        <div
          className={`transition-all duration-200 ease-out ${slideDir ? slideClass : ''}`}
          style={!slideDir ? { transform: `translateX(${dragX * 0.4}px)`, opacity: dragOpacity } : undefined}
        >
          {/* Header area with icon */}
          <div className={`${colors.bg} px-6 pt-10 pb-8 flex flex-col items-center text-center transition-colors duration-200`}>
            <div className={`${colors.iconBg} ${colors.iconText} p-4 rounded-2xl mb-5 shadow-sm`}>
              {current.icon}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{current.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{current.description}</p>
          </div>
        </div>

        {/* Actions (not affected by swipe animation) */}
        <div className="p-6 space-y-3">
          {/* Main action button — navigates to the target view */}
          {current.targetView ? (
            <button
              onClick={handleActionWithNav}
              className={`w-full py-3.5 ${colors.btn} text-white font-bold rounded-xl ${colors.btnHover} transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {current.action}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleAction}
              className={`w-full py-3.5 ${colors.btn} text-white font-bold rounded-xl ${colors.btnHover} transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {current.action}
            </button>
          )}

          {/* Swipe hint + Skip */}
          {!isLast ? (
            <p className="w-full py-2 text-slate-300 font-medium text-xs text-center">
              밀어서 다음으로
              <span className="inline-block ml-1 animate-pulse">→</span>
            </p>
          ) : (
            <button
              onClick={onComplete}
              className="w-full py-3 text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors"
            >
              건너뛰기
            </button>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-2 pt-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? `w-6 ${colors.dot}` : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Skip tour link at very bottom */}
        {step === 0 && (
          <div className="px-6 pb-5 -mt-2">
            <button
              onClick={onComplete}
              className="w-full text-xs text-slate-300 hover:text-slate-500 transition-colors"
            >
              투어 건너뛰기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeTour;
