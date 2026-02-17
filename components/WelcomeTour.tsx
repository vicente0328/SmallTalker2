
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
  indigo: { bg: 'bg-white', iconBg: 'bg-st-blue/10', iconText: 'text-st-blue', dot: 'bg-st-blue', btn: 'bg-st-blue', btnHover: 'hover:bg-st-blue/80' },
  violet: { bg: 'bg-white', iconBg: 'bg-st-purple/10', iconText: 'text-st-purple', dot: 'bg-st-blue', btn: 'bg-st-blue', btnHover: 'hover:bg-st-blue/80' },
  emerald: { bg: 'bg-white', iconBg: 'bg-st-green/10', iconText: 'text-st-green', dot: 'bg-st-blue', btn: 'bg-st-blue', btnHover: 'hover:bg-st-blue/80' },
  amber: { bg: 'bg-white', iconBg: 'bg-st-yellow/10', iconText: 'text-st-yellow', dot: 'bg-st-blue', btn: 'bg-st-blue', btnHover: 'hover:bg-st-blue/80' },
};

const SWIPE_THRESHOLD = 40;

const WelcomeTour: React.FC<WelcomeTourProps> = ({ userName, onComplete, setView }) => {
  const [step, setStep] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionOn, setTransitionOn] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const directionLocked = useRef<'h' | 'v' | null>(null);

  const current = STEPS[step];
  const colors = COLOR_MAP[current.color];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const animateToStep = useCallback((newStep: number, direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionOn(true);
    // Slide out current card
    setDragX(direction === 'left' ? -400 : 400);
    setTimeout(() => {
      // Disable transition for instant reposition
      setTransitionOn(false);
      setStep(newStep);
      setDragX(direction === 'left' ? 400 : -400);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Re-enable transition for smooth slide-in
          setTransitionOn(true);
          setDragX(0);
          setTimeout(() => setIsAnimating(false), 350);
        });
      });
    }, 300);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    if (isLast || isAnimating) return;
    animateToStep(step + 1, 'left');
  }, [isLast, isAnimating, step, animateToStep]);

  const goPrev = useCallback(() => {
    if (isFirst || isAnimating) return;
    animateToStep(step - 1, 'right');
  }, [isFirst, isAnimating, step, animateToStep]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    directionLocked.current = null;
    setTransitionOn(false);
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Lock direction after a small movement
    if (!directionLocked.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (directionLocked.current === 'h') {
      // Prevent background page from scrolling during horizontal swipe
      e.preventDefault();
      // Clamp: don't allow dragging right on first step or left on last step
      let clampedDx = dx;
      if (isFirst && dx > 0) clampedDx = dx * 0.15; // rubber band effect
      if (isLast && dx < 0) clampedDx = dx * 0.15;
      setDragX(clampedDx * 0.6);
    }
  }, [isAnimating, isFirst, isLast]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    directionLocked.current = null;
    setTransitionOn(true);

    if (dragX < -SWIPE_THRESHOLD && !isLast) {
      goNext();
    } else if (dragX > SWIPE_THRESHOLD && !isFirst) {
      goPrev();
    } else {
      // Snap back to center
      setDragX(0);
    }
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

  const dragOpacity = Math.max(0.5, 1 - Math.abs(dragX) / 600);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay p-4 animate-fade-in" style={{ touchAction: 'none', overscrollBehavior: 'contain' }}>
      <div
        className="glass rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden select-none"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipeable content area — fixed height to prevent layout shift */}
        <div className="overflow-hidden" style={{ minHeight: 280 }}>
          <div
            style={{
              transform: `translateX(${dragX}px)`,
              opacity: dragOpacity,
              transition: transitionOn ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s ease-out' : 'none',
              willChange: 'transform, opacity',
            }}
          >
            {/* Header area with icon */}
            <div className={`${colors.bg} px-6 pt-10 pb-8 flex flex-col items-center text-center transition-colors duration-200`} style={{ minHeight: 280 }}>
              <div className={`${colors.iconBg} ${colors.iconText} p-4 rounded-2xl mb-5 shadow-sm`}>
                {current.icon}
              </div>
              <p className="text-xs font-bold text-st-muted uppercase tracking-widest mb-2">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-st-ink mb-2">{current.title}</h2>
              <p className="text-sm text-st-muted leading-relaxed whitespace-pre-line">{current.description}</p>
            </div>
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
            <p className="w-full py-2 text-st-muted font-medium text-xs text-center">
              밀어서 다음으로
              <span className="inline-block ml-1 animate-pulse">→</span>
            </p>
          ) : (
            <button
              onClick={onComplete}
              className="w-full py-3 text-st-muted font-semibold text-sm hover:text-st-ink transition-colors"
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
                  i === step ? `w-6 ${colors.dot}` : 'w-1.5 bg-st-box'
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
              className="w-full text-xs text-st-muted hover:text-st-ink transition-colors"
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
