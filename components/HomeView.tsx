import React, { useState, useRef, useCallback } from 'react';
import { UserProfile, Meeting, Contact } from '../types';
import { CURRENT_DATE } from '../constants';
import Avatar from './Avatar';
import ChipGroup from './ChipGroup';

interface HomeViewProps {
  user: UserProfile;
  meetings: Meeting[];
  contacts: Contact[];
  onSelectMeeting: (meeting: Meeting) => void;
  onUpdateContact?: (updatedContact: Contact) => void;
  onAddContact?: (newContact: Contact) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToContacts?: () => void;
  onRestartTour?: () => void;
  onUpdateMeetingNote?: (meetingId: string, note: string) => void;
}

interface QuickProfile {
  name: string;
  ageRange: string;
  gender: string;
  industry: string;
  hobby: string;
  hobbyCustom: string;
  relationship: string;
  relationshipCustom: string;
}

const INITIAL_PROFILE: QuickProfile = {
  name: '',
  ageRange: '',
  gender: '',
  industry: '',
  hobby: '',
  hobbyCustom: '',
  relationship: '',
  relationshipCustom: '',
};

const AGE_OPTIONS = ['20대', '30대', '40대', '50대', '그 외'];
const GENDER_OPTIONS = ['남성', '여성'];
const HOBBY_OPTIONS = ['골프', '테니스', '위스키', '기타'];
const RELATION_OPTIONS = ['비즈니스', '가족', '친구', '기타'];

// Helper: detect already-known fields from a contact
const detectExisting = (contact: Contact | null | undefined) => {
  if (!contact) return { ageRange: '', gender: '', industry: '', hobby: '', relationship: '' };
  const tags = contact.tags || [];
  const lifestyle = contact.interests?.lifestyle || [];
  return {
    ageRange: AGE_OPTIONS.find(o => tags.includes(o)) || '',
    gender: GENDER_OPTIONS.find(o => tags.includes(o)) || '',
    industry: (contact.role && contact.role !== 'Unknown') ? contact.role : '',
    hobby: HOBBY_OPTIONS.filter(o => o !== '기타').find(o => lifestyle.includes(o))
           || (lifestyle.length > 0 ? lifestyle[0] : ''),
    relationship: RELATION_OPTIONS.filter(o => o !== '기타').find(o => tags.includes(o))
                  || '',
  };
};

// Web Speech API support check
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

const HomeView: React.FC<HomeViewProps> = ({ user, meetings, contacts, onSelectMeeting, onUpdateContact, onAddContact, onNavigateToCalendar, onNavigateToContacts, onRestartTour, onUpdateMeetingNote }) => {
  const [profile, setProfile] = useState<QuickProfile>(INITIAL_PROFILE);
  const [submitted, setSubmitted] = useState(false);

  // Voice memo states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [showVoiceMemo, setShowVoiceMemo] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 가입 후 7일 이내인지 확인
  const isNewUser = (() => {
    const signupTime = localStorage.getItem('smalltalker_signup_time');
    if (!signupTime) return true; // 투어 완료 전이면 신규 유저
    const elapsed = Date.now() - parseInt(signupTime, 10);
    return elapsed < 7 * 24 * 60 * 60 * 1000; // 7일
  })();

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (final) setVoiceText(prev => (prev + final).trim());
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setShowVoiceMemo(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
  }, []);

  const handleSaveVoiceMemo = useCallback((meetingId: string, existingNote?: string) => {
    if (!voiceText.trim() || !onUpdateMeetingNote) return;
    const newNote = existingNote
      ? `${existingNote}\n\n${voiceText.trim()}`
      : voiceText.trim();
    onUpdateMeetingNote(meetingId, newNote);
    setVoiceSaved(true);
    setTimeout(() => {
      setShowVoiceMemo(false);
      setVoiceText('');
      setVoiceSaved(false);
    }, 1500);
  }, [voiceText, onUpdateMeetingNote]);

  const handleCancelVoiceMemo = useCallback(() => {
    stopRecording();
    setShowVoiceMemo(false);
    setVoiceText('');
    setInterimText('');
  }, [stopRecording]);

  const upcomingMeetings = meetings
    .filter(m => new Date(m.date) >= CURRENT_DATE)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingMeeting = upcomingMeetings[0];
  const upcomingContact = upcomingMeeting ? contacts.find(c => upcomingMeeting.contactIds.includes(c.id)) : null;

  // Most recent past meeting
  const pastMeetings = meetings
    .filter(m => new Date(m.date) < CURRENT_DATE)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastMeeting = pastMeetings[0];
  const lastMeetingContact = lastMeeting ? contacts.find(c => lastMeeting.contactIds.includes(c.id)) : null;

  const isToday = upcomingMeeting &&
    new Date(upcomingMeeting.date).toDateString() === CURRENT_DATE.toDateString();

  // The contact for today's meeting (if any)
  const todayContact = isToday ? upcomingContact : null;

  // Detect which fields are already filled for today's contact
  const existing = detectExisting(todayContact);
  const needAgeRange = !existing.ageRange;
  const needGender = !existing.gender;
  const needIndustry = !existing.industry;
  const needHobby = !existing.hobby;
  const needRelation = !existing.relationship;
  const allFilled = todayContact && !needAgeRange && !needGender && !needIndustry && !needHobby && !needRelation;

  const getHobbyValue = () => profile.hobby === '기타' ? profile.hobbyCustom.trim() : profile.hobby;
  const getRelationValue = () => profile.relationship === '기타' ? profile.relationshipCustom.trim() : profile.relationship;

  const isFormValid = () => {
    // Only validate fields that are actually shown
    if (todayContact) {
      const validAge = !needAgeRange || profile.ageRange;
      const validGender = !needGender || profile.gender;
      const validIndustry = !needIndustry || profile.industry.trim();
      const validHobby = !needHobby || (profile.hobby && (profile.hobby !== '기타' || profile.hobbyCustom.trim()));
      const validRelation = !needRelation || (profile.relationship && (profile.relationship !== '기타' || profile.relationshipCustom.trim()));
      return validAge && validGender && validIndustry && validHobby && validRelation;
    }
    // New contact: all fields required + name
    const hasBasics = profile.ageRange && profile.gender && profile.industry.trim();
    const hasHobby = profile.hobby && (profile.hobby !== '기타' || profile.hobbyCustom.trim());
    const hasRelation = profile.relationship && (profile.relationship !== '기타' || profile.relationshipCustom.trim());
    return profile.name.trim() && hasBasics && hasHobby && hasRelation;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    const hobby = getHobbyValue();
    const relation = getRelationValue();
    const tags = [profile.ageRange, profile.gender, relation].filter(Boolean);

    if (todayContact && onUpdateContact) {
      // Update existing contact — only merge new info
      const updated: Contact = {
        ...todayContact,
        role: (needIndustry && profile.industry.trim()) ? profile.industry.trim() : todayContact.role,
        tags: Array.from(new Set([...todayContact.tags, ...tags])),
        interests: {
          ...todayContact.interests,
          lifestyle: Array.from(new Set([...todayContact.interests.lifestyle, ...(hobby ? [hobby] : [])])),
        },
        personality: todayContact.personality
          ? `${todayContact.personality} / ${[profile.ageRange, profile.gender].filter(Boolean).join(', ')}`
          : [profile.ageRange, profile.gender].filter(Boolean).join(', '),
      };
      onUpdateContact(updated);
    } else if (onAddContact) {
      // Create new contact
      const newContact: Contact = {
        id: `c-${Date.now()}`,
        name: profile.name.trim(),
        company: 'Unknown',
        role: profile.industry.trim() || 'Unknown',
        phoneNumber: '',
        email: '',
        tags,
        interests: {
          business: [],
          lifestyle: hobby ? [hobby] : [],
        },
        personality: `${profile.ageRange}, ${profile.gender}`,
        contactFrequency: '',
        avatarUrl: '',
        relationshipType: relation || '',
        meetingFrequency: '',
      };
      onAddContact(newContact);
    }

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col h-full pt-2 md:pt-12 animate-fade-in pb-20 md:pb-0">

      {/* Date & Greeting */}
      <div className="space-y-1 md:space-y-4 px-2 mb-4 md:mb-8 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-st-muted font-semibold text-sm md:text-lg">
            {CURRENT_DATE.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          {isNewUser && onRestartTour && (
            <button
              onClick={onRestartTour}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-st-bg text-st-muted text-xs font-bold rounded-lg hover:bg-st-box transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              사용 가이드
            </button>
          )}
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-st-ink leading-[1.15] tracking-tight">
          안녕하세요,<br/>
          <span className="text-st-ink">{user.name}님.</span>
        </h2>
      </div>

      {/* Main Action Card */}
      <section
        onClick={() => upcomingMeeting && onSelectMeeting(upcomingMeeting)}
        className="relative w-full min-h-[380px] bg-st-ink rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-st-box/50 cursor-pointer active:scale-[0.98] transition-all group flex flex-col justify-between shrink-0"
      >
        <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-st-blue/15 rounded-full blur-[60px] md:blur-[80px] -mr-16 -mt-16 mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 md:w-64 md:h-64 bg-st-blue/10 rounded-full blur-[50px] md:blur-[60px] -ml-16 -mb-8 mix-blend-screen"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between p-6 md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/8 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-bold text-st-muted mb-4 md:mb-6 tracking-wide">
               <span className="w-1.5 h-1.5 rounded-full bg-st-box animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
               UPCOMING SCHEDULE
            </div>

            <h3 className="text-2xl md:text-4xl font-bold leading-snug break-keep whitespace-pre-wrap text-white">
              {upcomingContact
                ? (isToday
                    ? `오늘,\n${upcomingContact.name}님과의\n일정을 준비해보세요.`
                    : `곧 다가올\n${upcomingContact.name}님과의\n만남을 준비해보세요.`)
                : "예정된 미팅이 없습니다.\n새로운 일정을 잡아보세요."
              }
            </h3>

            {upcomingMeeting && (
                <div className="mt-4 md:mt-6 flex flex-col gap-0.5 md:gap-1">
                    <p className="text-st-muted text-xs md:text-sm font-semibold uppercase tracking-wider">Date & Time</p>
                    <p className="text-white text-lg md:text-2xl font-medium tracking-tight">
                        {new Date(upcomingMeeting.date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric' })}
                    </p>
                </div>
            )}

            {!upcomingMeeting && (
                <p className="mt-3 text-st-muted text-sm font-medium">
                    캘린더에서 미팅을 추가하고<br/>AI 스몰토크 가이드를 받아보세요.
                </p>
            )}
          </div>

          {upcomingMeeting ? (
            <div className="w-full mt-4 md:mt-0">
                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6 bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                    {upcomingContact && (
                        <Avatar src={upcomingContact.avatarUrl} name={upcomingContact.name} size={40} className="md:!w-12 md:!h-12 border-2 border-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-base md:text-lg truncate">{upcomingMeeting.title}</p>
                        <p className="text-st-muted text-xs md:text-sm truncate">{upcomingMeeting.location}</p>
                    </div>
                </div>

                <button
                    className="w-full bg-white text-st-blue text-base md:text-lg font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-st-ink/30 flex items-center justify-center gap-2 group-hover:bg-white/90"
                >
                    일정 준비하기
                    <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
          ) : (
            <div className="w-full mt-8">
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigateToCalendar?.(); }}
                    className="w-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-base md:text-lg font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all hover:bg-white/25 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    첫 미팅 추가하기
                </button>
            </div>
          )}
        </div>
      </section>

      {/* Previous Schedule Card */}
      {lastMeeting && lastMeetingContact && (
      <section className="mt-6 relative w-full bg-white rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="p-5 md:p-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-st-bg text-[10px] md:text-xs font-bold text-st-muted mb-3 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-st-muted"></span>
            PREVIOUS SCHEDULE
          </div>

          <p className="text-sm md:text-base text-st-muted leading-relaxed mb-4">
            지난 만남은 어떠셨나요? 공유해주시는 내용을 바탕으로 다음 만남을 더욱 세심하게 준비하겠습니다.
          </p>

          {/* Voice Memo Section */}
          {SpeechRecognition && onUpdateMeetingNote && !showVoiceMemo && (
            <button
              onClick={(e) => { e.stopPropagation(); startRecording(); }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 mb-4 bg-st-blue/8 text-st-blue text-sm font-semibold rounded-xl hover:bg-st-blue/15 active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-16a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3z" />
              </svg>
              음성으로 기록하기
            </button>
          )}

          {showVoiceMemo && (
            <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              {voiceSaved ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="w-10 h-10 bg-st-green rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-st-ink">저장되었습니다!</p>
                </div>
              ) : (
                <>
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-st-red/8 rounded-xl">
                      <span className="w-3 h-3 rounded-full bg-st-red animate-pulse"></span>
                      <span className="text-sm font-semibold text-st-red">듣고 있습니다...</span>
                      <button
                        onClick={stopRecording}
                        className="ml-auto px-3.5 py-1.5 bg-st-red text-white text-xs font-bold rounded-lg hover:bg-st-red/80 transition-all"
                      >
                        정지
                      </button>
                    </div>
                  )}

                  {/* Transcribed text area */}
                  <textarea
                    className="w-full bg-st-bg border border-st-box/50 p-4 rounded-xl min-h-[100px] text-sm text-st-ink placeholder-st-muted focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 transition resize-none"
                    value={voiceText + (interimText ? (voiceText ? ' ' : '') + interimText : '')}
                    onChange={(e) => { setVoiceText(e.target.value); setInterimText(''); }}
                    placeholder={isRecording ? '음성이 여기에 텍스트로 변환됩니다...' : '변환된 텍스트를 확인하고 수정할 수 있습니다.'}
                  />

                  {/* Action buttons */}
                  {!isRecording && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelVoiceMemo}
                        className="flex-1 py-2.5 text-sm font-semibold text-st-muted bg-st-bg rounded-xl hover:bg-st-box/50 transition-all"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => startRecording()}
                        className="px-4 py-2.5 text-sm font-semibold text-st-blue bg-st-blue/8 rounded-xl hover:bg-st-blue/15 transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-16a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3z" />
                        </svg>
                        다시 녹음
                      </button>
                      <button
                        onClick={() => handleSaveVoiceMemo(lastMeeting.id, lastMeeting.userNote)}
                        disabled={!voiceText.trim()}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                          voiceText.trim()
                            ? 'bg-st-blue text-white hover:bg-st-blue/80'
                            : 'bg-st-box text-st-muted cursor-not-allowed'
                        }`}
                      >
                        저장하기
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Meeting info — clickable to detail */}
          <div
            onClick={() => onSelectMeeting(lastMeeting)}
            className="flex items-center gap-3 bg-st-bg p-3 md:p-4 rounded-xl cursor-pointer hover:bg-st-box/50 active:scale-[0.98] transition-all group"
          >
            <Avatar src={lastMeetingContact.avatarUrl} name={lastMeetingContact.name} size={40} className="md:!w-11 md:!h-11 border-2 border-white shadow-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-st-ink font-bold text-sm md:text-base truncate">{lastMeeting.title}</p>
              <p className="text-st-muted text-xs md:text-sm truncate">
                {lastMeetingContact.name} · {new Date(lastMeeting.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </p>
            </div>
            <svg className="w-5 h-5 text-st-muted group-hover:text-st-ink group-hover:translate-x-1 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </section>
      )}

      {/* Empty State: No Contacts */}
      {contacts.length === 0 && (
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-dashed border-st-box/50 p-6 text-center shrink-0">
          <div className="w-14 h-14 bg-st-bg rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-st-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-st-ink mb-1">연락처를 추가해보세요</h3>
          <p className="text-sm text-st-muted mb-4">자주 만나는 분들의 정보를 등록하면<br/>AI가 맞춤형 대화 주제를 준비합니다.</p>
          <button
            onClick={() => onNavigateToContacts?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-st-blue text-white text-sm font-bold rounded-xl hover:bg-st-blue/80 transition-all shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            연락처 추가하기
          </button>
        </section>
      )}

      {/* Quick Profile Questionnaire — hide entirely if all info is already filled */}
      {!allFilled && (
      <section className="mt-6 bg-white rounded-2xl shadow-sm p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-st-green rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-st-ink mb-1">저장 완료!</p>
            <p className="text-sm text-st-muted">연락처 정보가 업데이트되었습니다.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-st-ink mb-1">
              {todayContact
                ? `오늘 만나는 ${todayContact.name}님은 어떤 분이신가요?`
                : '오늘은 어떤 분을 만나시나요?'}
            </h3>
            <p className="text-sm text-st-muted mb-5">간단한 키워드로 알려주세요.</p>

            <div className="space-y-5">
              {/* Name input (only when no today contact) */}
              {!todayContact && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-st-muted uppercase tracking-wider">이름</p>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="만나는 분의 이름을 입력해주세요"
                    className="w-full px-4 py-2.5 bg-st-bg border border-st-box/50 rounded-xl text-sm text-st-ink placeholder-st-muted focus:outline-none focus:ring-2 focus:ring-st-box focus:border-transparent transition"
                  />
                </div>
              )}

              {needAgeRange && (
              <ChipGroup
                label="연령대"
                options={AGE_OPTIONS}
                selected={profile.ageRange}
                onSelect={(v) => setProfile(p => ({ ...p, ageRange: v }))}
              />
              )}

              {needGender && (
              <ChipGroup
                label="성별"
                options={GENDER_OPTIONS}
                selected={profile.gender}
                onSelect={(v) => setProfile(p => ({ ...p, gender: v }))}
              />
              )}

              {needIndustry && (
              <ChipGroup
                label="직군"
                options={[]}
                selected=""
                onSelect={() => {}}
                isTextInput
                textValue={profile.industry}
                onTextChange={(v) => setProfile(p => ({ ...p, industry: v }))}
                textPlaceholder="산업/직군을 입력해주세요 (예: IT, 금융, 유통)"
              />
              )}

              {needHobby && (
              <ChipGroup
                label="취미"
                options={HOBBY_OPTIONS}
                selected={profile.hobby}
                onSelect={(v) => setProfile(p => ({ ...p, hobby: v, hobbyCustom: v !== '기타' ? '' : p.hobbyCustom }))}
                customValue={profile.hobbyCustom}
                onCustomChange={(v) => setProfile(p => ({ ...p, hobbyCustom: v }))}
                customPlaceholder="취미를 직접 입력해주세요"
              />
              )}

              {needRelation && (
              <ChipGroup
                label="나와의 관계"
                options={RELATION_OPTIONS}
                selected={profile.relationship}
                onSelect={(v) => setProfile(p => ({ ...p, relationship: v, relationshipCustom: v !== '기타' ? '' : p.relationshipCustom }))}
                customValue={profile.relationshipCustom}
                onCustomChange={(v) => setProfile(p => ({ ...p, relationshipCustom: v }))}
                customPlaceholder="관계를 직접 입력해주세요"
              />
              )}

              <button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className={`w-full py-3 rounded-xl text-base font-bold transition-all ${
                  isFormValid()
                    ? 'bg-st-blue text-white hover:bg-st-blue/80 shadow-lg shadow-st-box'
                    : 'bg-st-box text-st-muted cursor-not-allowed'
                }`}
              >
                저장하기
              </button>
            </div>
          </>
        )}
      </section>
      )}
    </div>
  );
};

export default HomeView;
