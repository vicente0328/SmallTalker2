
import React, { useState, useEffect } from 'react';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';
import { Contact, Meeting, UserProfile, SmallTalkGuide } from '../types';
import { generateGuideStreaming, searchRelatedArticles, RelatedArticle } from '../services/geminiService';
import { CURRENT_DATE } from '../constants';
import ContextualTip from './ContextualTip';
import Avatar from './Avatar';

interface MeetingDetailViewProps {
  supabase: SupabaseClient;
  meeting: Meeting;
  contacts: Contact[];
  user: UserProfile;
  allMeetings: Meeting[];
  allContacts: Contact[];
  onBack: () => void;
  onUpdateNote?: (meetingId: string, note: string) => Promise<void> | void;
  onSaveAIGuide?: (meetingId: string, guide: SmallTalkGuide) => Promise<void> | void;
  onClearAIGuide?: (meetingId: string) => Promise<void> | void;
  onNavigateToMeeting?: (meeting: Meeting) => void;
  onSelectContact?: (contact: Contact) => void;
  dismissedTips?: Set<string>;
  onDismissTip?: (key: string) => void;
}

const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  supabase,
  meeting,
  contacts,
  user,
  allMeetings = [],
  allContacts = [],
  onBack,
  onUpdateNote,
  onSaveAIGuide,
  onClearAIGuide,
  onNavigateToMeeting,
  onSelectContact,
  dismissedTips = new Set(),
  onDismissTip = () => {}
}) => {
  const contact = contacts[0];
  const additionalContacts = contacts.slice(1);
  const [guide, setGuide] = useState<SmallTalkGuide | null>(meeting.aiGuide || null);
  const [partialGuide, setPartialGuide] = useState<Partial<SmallTalkGuide>>({});
  const [loading, setLoading] = useState(!meeting.aiGuide);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState(meeting.userNote || "");
  const [businessArticles, setBusinessArticles] = useState<RelatedArticle[]>([]);
  const [lifeArticles, setLifeArticles] = useState<RelatedArticle[]>([]);
  const [loadingBusinessArticles, setLoadingBusinessArticles] = useState(false);
  const [loadingLifeArticles, setLoadingLifeArticles] = useState(false);
  const [showBusinessArticles, setShowBusinessArticles] = useState(false);
  const [showLifeArticles, setShowLifeArticles] = useState(false);

  const meetingDate = new Date(meeting.date);
  const isPastMeeting = meetingDate < CURRENT_DATE;
  const isToday = meetingDate.toDateString() === CURRENT_DATE.toDateString();
  const showAIGuide = !isPastMeeting || isToday;

  // 히스토리 추출 로직: 이 미팅의 모든 참석자와 관련된 '과거'의 모든 노트를 취합하여 연속성 확보
  const meetingContactIds = meeting.contactIds;
  const historyNotes = allMeetings
    .filter(m => m.contactIds.some(id => meetingContactIds.includes(id)) && new Date(m.date) < meetingDate && m.userNote && m.userNote.trim() !== "")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(m => `[${new Date(m.date).toLocaleDateString('ko-KR')}] ${m.userNote}`)
    .join("\n---\n");

  const contactMeetings = allMeetings.filter(m => m.contactIds.some(id => meetingContactIds.includes(id)) && m.id !== meeting.id);
  const pastMeetings = contactMeetings.filter(m => new Date(m.date) < new Date(meeting.date)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const futureMeetings = contactMeetings.filter(m => new Date(m.date) > new Date(meeting.date)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [regenerateKey, setRegenerateKey] = useState(0);

  const handleRegenerate = async () => {
    setGuide(null);
    setPartialGuide({});
    setError(null);
    if (onClearAIGuide) await onClearAIGuide(meeting.id);
    setRegenerateKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!showAIGuide || (meeting.aiGuide && regenerateKey === 0)) {
        setLoading(false);
        return;
    }

    let mounted = true;
    let stageInterval: any;

    const fetchGuide = async () => {
      setLoading(true);
      setError(null);
      setLoadingStage(0);

      stageInterval = setInterval(() => {
          setLoadingStage(prev => (prev < 2 ? prev + 1 : prev));
      }, 2500);

      try {
        const data = await generateGuideStreaming(
          supabase, user, contact, meeting, historyNotes,
          (partial) => { if (mounted) setPartialGuide(partial); },
          additionalContacts,
        );
        if (mounted) {
            setGuide(data);
            setPartialGuide({});
            if (onSaveAIGuide) onSaveAIGuide(meeting.id, data);
        }
      } catch (err: any) {
        if (mounted) {
            setError(err.message || "가이드를 생성하는 중 예기치 못한 오류가 발생했습니다.");
        }
      } finally {
        if (mounted) {
            setLoading(false);
            clearInterval(stageInterval);
        }
      }
    };

    fetchGuide();
    return () => {
        mounted = false;
        if (stageInterval) clearInterval(stageInterval);
    };
  }, [meeting.id, showAIGuide, regenerateKey]);

  const handleExportToICS = () => {
    const dtStart = new Date(meeting.date).toISOString().replace(/-|:|\.\d+/g, "");
    const dtEnd = new Date(new Date(meeting.date).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${meeting.title} (${contact.name})`,
      `LOCATION:${meeting.location}`,
      `DESCRIPTION:${meeting.userNote || "SmallTalker AI Meeting"}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${meeting.title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNote = async () => {
    setIsEditing(false);
    if (onUpdateNote) {
        await onUpdateNote(meeting.id, noteContent);
    }
  };

  const handleSearchBusiness = async (content: string) => {
    setShowBusinessArticles(true);
    if (businessArticles.length > 0) return;
    setLoadingBusinessArticles(true);
    const articles = await searchRelatedArticles(content, 'business');
    setBusinessArticles(articles);
    setLoadingBusinessArticles(false);
  };

  const handleSearchLife = async (content: string) => {
    setShowLifeArticles(true);
    if (lifeArticles.length > 0) return;
    setLoadingLifeArticles(true);
    const articles = await searchRelatedArticles(content, 'lifestyle');
    setLifeArticles(articles);
    setLoadingLifeArticles(false);
  };

  const renderArticleList = (articles: RelatedArticle[], isLoading: boolean) => (
    <div className="mt-4 pt-3 border-t border-st-box space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-st-muted rounded-full border-t-transparent animate-spin"></div>
          <span className="text-xs text-st-muted">관련 기사를 검색하고 있습니다...</span>
        </div>
      ) : articles.length > 0 ? (
        articles.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-st-box/30 transition-colors group"
          >
            <div className="bg-st-box p-1 rounded-md text-st-muted flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </div>
            <span className="text-xs font-medium text-st-muted group-hover:text-st-ink transition-colors flex-1">{article.title}</span>
            <svg className="w-3.5 h-3.5 text-st-muted group-hover:text-st-ink flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        ))
      ) : (
        <p className="text-xs text-st-muted py-2">검색 결과를 찾을 수 없습니다.</p>
      )}
    </div>
  );

  const loadingMessages = [
      "과거 미팅 히스토리를 정밀 분석하고 있습니다...",
      "업계 트렌드와 파트너의 관심사를 매칭하는 중입니다...",
      "품격 있고 자연스러운 대화 시나리오를 완성하고 있습니다..."
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-12">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-st-ink flex items-center font-medium hover:underline">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Calendar
        </button>
        <button
            onClick={handleExportToICS}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-st-card border border-st-box text-st-muted rounded-lg text-xs font-bold hover:bg-st-box/30 transition-all"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            시스템 캘린더에 추가
        </button>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-semibold text-st-ink uppercase tracking-wide">
          {meetingDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
        </span>
        <h1 className="text-3xl font-bold text-st-ink leading-tight">{meeting.title}</h1>
        <p className="text-st-muted flex items-center gap-1.5">
            <svg className="w-4 h-4 text-st-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {meeting.location}
        </p>
      </div>

      <div className="space-y-2">
        {contacts.map(c => (
          <section
            key={c.id}
            onClick={() => onSelectContact && onSelectContact(c)}
            className="bg-st-card rounded-2xl p-4 shadow-sm border border-st-box flex items-center gap-4 cursor-pointer hover:border-st-muted transition-all active:scale-[0.99] group"
          >
            <Avatar src={c.avatarUrl} name={c.name} size={56} className="border border-st-box group-hover:ring-2 group-hover:ring-st-box transition-all" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-st-ink group-hover:text-st-ink transition-colors">{c.name}</h2>
              <p className="text-sm text-st-muted">{c.company} · {c.role}</p>
              {c.relationshipType && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-st-box text-st-ink text-[10px] font-medium rounded">{c.relationshipType}</span>
              )}
            </div>
            <svg className="w-5 h-5 text-st-muted group-hover:text-st-ink group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </section>
        ))}
      </div>

      {showAIGuide && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 bg-st-ink text-white rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-bold text-st-ink text-lg tracking-tight flex-1">AI 미팅 서포트 가이드</h3>
            <ContextualTip tipKey="ai-guide" message="AI가 상대방의 관심사, 과거 만남 기록, 최신 트렌드를 분석하여 자연스러운 대화 주제를 제안합니다." position="bottom" dismissedTips={dismissedTips} onDismiss={onDismissTip} />
            {guide && !loading && (
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-st-muted hover:text-st-ink hover:bg-st-box/50 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                새로 생성하기
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
                {/* 아직 아무 필드도 없으면 스피너 표시 */}
                {!partialGuide.pastReview && (
                    <div className="bg-st-card p-6 rounded-3xl border border-st-box shadow-xl flex items-center gap-3">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div className="absolute inset-0 border-3 border-st-box rounded-full"></div>
                            <div className="absolute inset-0 border-3 border-st-ink rounded-full border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-sm font-bold text-st-muted animate-pulse">{loadingMessages[loadingStage]}</p>
                    </div>
                )}

                {/* pastReview 카드 - 첫 번째로 나타남 */}
                {partialGuide.pastReview && (
                    <div className="bg-st-card p-5 rounded-2xl shadow-sm border border-st-box animate-fade-in">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-st-muted"></span>
                            <h4 className="text-xs font-bold text-st-muted uppercase tracking-widest">만남 복기 및 관계 맥락</h4>
                        </div>
                        <p className="text-st-ink text-sm leading-relaxed font-medium">{partialGuide.pastReview}</p>
                    </div>
                )}

                {/* businessTip 카드 - 두 번째로 나타남 */}
                {partialGuide.businessTip ? (
                    <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-st-blue p-1.5 rounded-lg text-st-ink">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <h4 className="text-sm font-bold text-st-ink">Business Conversation Tip</h4>
                        </div>
                        <p className="text-st-ink font-semibold text-base leading-relaxed">{partialGuide.businessTip.content}</p>
                    </div>
                ) : partialGuide.pastReview && (
                    <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box flex items-center gap-3 animate-pulse">
                        <div className="relative w-6 h-6 flex-shrink-0">
                            <div className="absolute inset-0 border-2 border-st-ink rounded-full border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-xs text-st-muted">비즈니스 대화 팁을 작성하고 있습니다...</p>
                    </div>
                )}

                {/* lifeTip 로딩 표시 */}
                {partialGuide.businessTip && !partialGuide.lifeTip && (
                    <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box flex items-center gap-3 animate-pulse">
                        <div className="relative w-6 h-6 flex-shrink-0">
                            <div className="absolute inset-0 border-2 border-st-ink rounded-full border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-xs text-st-muted">라이프스타일 인사이트를 작성하고 있습니다...</p>
                    </div>
                )}
            </div>
          ) : error ? (
            <div className="bg-st-red/30 p-6 rounded-3xl border border-st-red flex flex-col items-center text-center space-y-3">
                <div className="bg-st-red p-2 rounded-full text-st-ink">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="font-bold text-st-ink">분석에 실패했습니다</h4>
                <p className="text-sm text-st-muted leading-relaxed">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-st-red text-st-ink text-xs font-bold rounded-xl shadow-md hover:bg-st-red/80 transition-all"
                >
                    다시 시도하기
                </button>
            </div>
          ) : guide && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-st-card p-5 rounded-2xl shadow-sm border border-st-box">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-st-muted"></span>
                    <h4 className="text-xs font-bold text-st-muted uppercase tracking-widest">만남 복기 및 관계 맥락</h4>
                </div>
                <p className="text-st-ink text-sm leading-relaxed font-medium">{guide.pastReview}</p>
              </div>

              {guide.attendees && guide.attendees.length > 0 ? (
                <>
                  {/* 공통 팁 (간략) */}
                  <div className="bg-st-box p-4 rounded-2xl border border-st-box">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-st-muted"></span>
                      <h4 className="text-xs font-bold text-st-muted uppercase tracking-widest">공통 대화 주제</h4>
                    </div>
                    <p className="text-st-ink text-sm leading-relaxed font-medium mb-1">{guide.businessTip.content}</p>
                    <p className="text-st-muted text-sm leading-relaxed">{guide.lifeTip}</p>
                  </div>

                  {/* 참석자별 개별 가이드 */}
                  {guide.attendees.map((attendee, idx) => {
                    const attendeeContact = contacts.find(c => c.name === attendee.name);
                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-2 px-1 pt-2">
                          <Avatar src={attendeeContact?.avatarUrl} name={attendee.name} size={24} className="border border-st-box" />
                          <h4 className="text-sm font-bold text-st-ink">{attendee.name}</h4>
                          {attendeeContact?.relationshipType && (
                            <span className="px-2 py-0.5 bg-st-box text-st-ink text-[10px] font-medium rounded">{attendeeContact.relationshipType}</span>
                          )}
                        </div>

                        <div className="bg-st-card p-5 rounded-2xl shadow-sm border border-st-box relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-st-blue p-1.5 rounded-lg text-st-ink">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <h4 className="text-sm font-bold text-st-ink">Business Tip</h4>
                          </div>
                          <p className="text-st-ink font-semibold text-sm leading-relaxed">{attendee.businessTip.content}</p>
                          {attendee.businessTip.source && (
                            <div className="flex items-center gap-1 text-[10px] text-st-muted border-t border-st-box pt-2 mt-2">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              출처: {attendee.businessTip.source}
                            </div>
                          )}
                        </div>

                        <div className="bg-st-card p-5 rounded-2xl shadow-sm border border-st-box relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-st-purple p-1.5 rounded-lg text-st-ink">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h4 className="text-sm font-bold text-st-ink">Life Style Insight</h4>
                          </div>
                          <p className="text-st-ink font-semibold text-sm leading-relaxed">{attendee.lifeTip}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-st-blue p-1.5 rounded-lg text-st-ink">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <h4 className="text-sm font-bold text-st-ink">Business Conversation Tip</h4>
                    </div>
                    <p className="text-st-ink font-semibold text-base leading-relaxed mb-3">{guide.businessTip.content}</p>
                    {guide.businessTip.source && (
                        <div className="flex items-center gap-1 text-[10px] text-st-muted border-t border-st-box pt-3">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            출처: {guide.businessTip.source}
                        </div>
                    )}
                    <button
                      onClick={() => handleSearchBusiness(guide.businessTip.content)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-st-blue text-st-ink rounded-xl text-sm font-bold hover:bg-st-muted shadow-md hover:shadow-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      관련 뉴스 더 알아보기
                    </button>
                    {showBusinessArticles && renderArticleList(businessArticles, loadingBusinessArticles)}
                  </div>

                  <div className="bg-st-card p-6 rounded-2xl shadow-sm border border-st-box relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-st-purple p-1.5 rounded-lg text-st-ink">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h4 className="text-sm font-bold text-st-ink">Life Style Insight</h4>
                    </div>
                    <p className="text-st-ink font-semibold text-base leading-relaxed">{guide.lifeTip}</p>
                    <button
                      onClick={() => handleSearchLife(guide.lifeTip)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-st-purple text-st-ink rounded-xl text-sm font-bold hover:bg-st-muted shadow-md hover:shadow-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      관련 뉴스 더 알아보기
                    </button>
                    {showLifeArticles && renderArticleList(lifeArticles, loadingLifeArticles)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {(pastMeetings.length > 0 || futureMeetings.length > 0) && (
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-st-muted uppercase tracking-widest px-1">Partner Meeting Timeline</h3>
              <div className="space-y-2">
                  {futureMeetings.slice(0, 1).map(m => (
                      <div key={m.id} onClick={() => onNavigateToMeeting && onNavigateToMeeting(m)} className="bg-st-box/50 p-4 rounded-2xl border border-st-box cursor-pointer hover:bg-st-box transition-all group flex justify-between items-center">
                          <div>
                              <p className="text-[10px] font-bold text-st-ink uppercase tracking-wide">Next Meeting</p>
                              <p className="text-sm font-bold text-st-ink mt-0.5">{m.title}</p>
                              <p className="text-xs text-st-muted">{new Date(m.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
                          </div>
                          <svg className="w-4 h-4 text-st-muted group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                  ))}
                  {pastMeetings.slice(0, 1).map(m => (
                      <div key={m.id} onClick={() => onNavigateToMeeting && onNavigateToMeeting(m)} className="bg-st-card p-4 rounded-2xl border border-st-box cursor-pointer hover:border-st-muted transition-all group flex justify-between items-center">
                          <div>
                              <p className="text-[10px] font-bold text-st-muted uppercase tracking-wide">Last Met</p>
                              <p className="text-sm font-bold text-st-ink mt-0.5">{m.title}</p>
                              <p className="text-xs text-st-muted">{new Date(m.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
                          </div>
                          <svg className="w-4 h-4 text-st-muted group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {(isPastMeeting || isToday) && (
        <div className="bg-st-ink p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-white/8 p-1.5 rounded-lg text-st-muted"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                <h3 className="font-bold text-white tracking-tight">오늘의 만남 기록</h3>
                <ContextualTip tipKey="meeting-note" message="미팅 후 메모를 남기면 AI가 내용을 분석하여 연락처 프로필에 자동 반영합니다. 다음 만남 준비에 활용됩니다." position="bottom" dismissedTips={dismissedTips} onDismiss={onDismissTip} />
            </div>
            <button onClick={() => isEditing ? handleSaveNote() : setIsEditing(true)} className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all ${isEditing ? 'bg-st-card text-st-ink' : 'bg-white/10 text-st-muted hover:bg-white/20'}`}>
              {isEditing ? '저장하기' : '기록 수정'}
            </button>
          </div>
          {isEditing ? (
            <textarea className="w-full bg-white/5 p-4 rounded-2xl min-h-[140px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-st-muted/50 border border-white/8" value={noteContent} onChange={(e)=>setNoteContent(e.target.value)} placeholder="미팅의 주요 내용이나 새로 알게 된 사실을 기록하세요..." />
          ) : (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{meeting.userNote || "기록된 미팅 노트가 없습니다."}</p>
            </div>
          )}
          {!isEditing && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center pt-2">AI가 기록을 분석하여 인맥 프로필에 자동으로 반영합니다.</p>}
        </div>
      )}
    </div>
  );
};

export default MeetingDetailView;
