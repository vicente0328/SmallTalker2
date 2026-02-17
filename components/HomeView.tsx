import React, { useState } from 'react';
import { UserProfile, Meeting, Contact } from '../types';
import { CURRENT_DATE } from '../constants';

interface HomeViewProps {
  user: UserProfile;
  meetings: Meeting[];
  contacts: Contact[];
  onSelectMeeting: (meeting: Meeting) => void;
  onUpdateContact?: (updatedContact: Contact) => void;
  onAddContact?: (newContact: Contact) => void;
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

const ChipGroup: React.FC<{
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
}> = ({ label, options, selected, onSelect, customValue, onCustomChange, customPlaceholder, isTextInput, textValue, onTextChange, textPlaceholder }) => (
  <div className="space-y-2">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    {isTextInput ? (
      <input
        type="text"
        value={textValue || ''}
        onChange={(e) => onTextChange?.(e.target.value)}
        placeholder={textPlaceholder}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
      />
    ) : (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              selected === opt
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
        className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
      />
    )}
  </div>
);

const HomeView: React.FC<HomeViewProps> = ({ user, meetings, contacts, onSelectMeeting, onUpdateContact, onAddContact }) => {
  const [profile, setProfile] = useState<QuickProfile>(INITIAL_PROFILE);
  const [submitted, setSubmitted] = useState(false);

  const upcomingMeetings = meetings
    .filter(m => new Date(m.date) >= CURRENT_DATE)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingMeeting = upcomingMeetings[0];
  const upcomingContact = upcomingMeeting ? contacts.find(c => c.id === upcomingMeeting.contactId) : null;

  const isToday = upcomingMeeting &&
    new Date(upcomingMeeting.date).toDateString() === CURRENT_DATE.toDateString();

  // The contact for today's meeting (if any)
  const todayContact = isToday ? upcomingContact : null;

  const getHobbyValue = () => profile.hobby === '기타' ? profile.hobbyCustom.trim() : profile.hobby;
  const getRelationValue = () => profile.relationship === '기타' ? profile.relationshipCustom.trim() : profile.relationship;

  const isFormValid = () => {
    const hasBasics = profile.ageRange && profile.gender && profile.industry.trim();
    const hasHobby = profile.hobby && (profile.hobby !== '기타' || profile.hobbyCustom.trim());
    const hasRelation = profile.relationship && (profile.relationship !== '기타' || profile.relationshipCustom.trim());
    const hasName = todayContact || profile.name.trim();
    return hasBasics && hasHobby && hasRelation && hasName;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    const hobby = getHobbyValue();
    const relation = getRelationValue();
    const tags = [profile.ageRange, profile.gender, relation].filter(Boolean);

    if (todayContact && onUpdateContact) {
      // Update existing contact
      const updated: Contact = {
        ...todayContact,
        role: profile.industry.trim() || todayContact.role,
        tags: Array.from(new Set([...todayContact.tags, ...tags])),
        interests: {
          ...todayContact.interests,
          lifestyle: Array.from(new Set([...todayContact.interests.lifestyle, ...(hobby ? [hobby] : [])])),
        },
        personality: todayContact.personality
          ? `${todayContact.personality} / ${profile.ageRange}, ${profile.gender}`
          : `${profile.ageRange}, ${profile.gender}`,
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
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name.trim())}&background=6366f1&color=fff&bold=true`,
      };
      onAddContact(newContact);
    }

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col h-full pt-2 md:pt-12 animate-fade-in pb-20 md:pb-0">

      {/* Date & Greeting */}
      <div className="space-y-1 md:space-y-4 px-2 mb-4 md:mb-8 shrink-0">
        <p className="text-slate-500 font-semibold text-sm md:text-lg">
          {CURRENT_DATE.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-[1.15] tracking-tight">
          안녕하세요,<br/>
          <span className="text-indigo-600">{user.name}님.</span>
        </h2>
      </div>

      {/* Main Action Card */}
      <section
        onClick={() => upcomingMeeting && onSelectMeeting(upcomingMeeting)}
        className="relative w-full min-h-[380px] bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 cursor-pointer active:scale-[0.98] transition-all group flex flex-col justify-between shrink-0"
      >
        <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-indigo-600/30 rounded-full blur-[60px] md:blur-[80px] -mr-16 -mt-16 mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 md:w-64 md:h-64 bg-violet-600/20 rounded-full blur-[50px] md:blur-[60px] -ml-16 -mb-8 mix-blend-screen"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between p-6 md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-bold text-indigo-200 mb-4 md:mb-6 tracking-wide">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
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
                    <p className="text-indigo-200 text-xs md:text-sm font-semibold uppercase tracking-wider">Date & Time</p>
                    <p className="text-white text-lg md:text-2xl font-medium tracking-tight">
                        {new Date(upcomingMeeting.date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric' })}
                    </p>
                </div>
            )}
          </div>

          {upcomingMeeting && (
            <div className="w-full mt-4 md:mt-0">
                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6 bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                    {upcomingContact && (
                        <img src={upcomingContact.avatarUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/10 shrink-0 object-cover" alt={upcomingContact.name} />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-base md:text-lg truncate">{upcomingMeeting.title}</p>
                        <p className="text-slate-400 text-xs md:text-sm truncate">{upcomingMeeting.location}</p>
                    </div>
                </div>

                <button
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-base md:text-lg font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:shadow-indigo-500/20"
                >
                    일정 준비하기
                    <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Profile Questionnaire */}
      <section className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">저장 완료!</p>
            <p className="text-sm text-slate-500">연락처 정보가 업데이트되었습니다.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {todayContact
                ? `오늘 만나는 ${todayContact.name}님은 어떤 분이신가요?`
                : '오늘은 어떤 분을 만나시나요?'}
            </h3>
            <p className="text-sm text-slate-400 mb-5">간단한 키워드로 알려주세요.</p>

            <div className="space-y-5">
              {/* Name input (only when no today contact) */}
              {!todayContact && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">이름</p>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="만나는 분의 이름을 입력해주세요"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                  />
                </div>
              )}

              <ChipGroup
                label="연령대"
                options={AGE_OPTIONS}
                selected={profile.ageRange}
                onSelect={(v) => setProfile(p => ({ ...p, ageRange: v }))}
              />

              <ChipGroup
                label="성별"
                options={GENDER_OPTIONS}
                selected={profile.gender}
                onSelect={(v) => setProfile(p => ({ ...p, gender: v }))}
              />

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

              <ChipGroup
                label="취미"
                options={HOBBY_OPTIONS}
                selected={profile.hobby}
                onSelect={(v) => setProfile(p => ({ ...p, hobby: v, hobbyCustom: v !== '기타' ? '' : p.hobbyCustom }))}
                customValue={profile.hobbyCustom}
                onCustomChange={(v) => setProfile(p => ({ ...p, hobbyCustom: v }))}
                customPlaceholder="취미를 직접 입력해주세요"
              />

              <ChipGroup
                label="나와의 관계"
                options={RELATION_OPTIONS}
                selected={profile.relationship}
                onSelect={(v) => setProfile(p => ({ ...p, relationship: v, relationshipCustom: v !== '기타' ? '' : p.relationshipCustom }))}
                customValue={profile.relationshipCustom}
                onCustomChange={(v) => setProfile(p => ({ ...p, relationshipCustom: v }))}
                customPlaceholder="관계를 직접 입력해주세요"
              />

              <button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className={`w-full py-3 rounded-xl text-base font-bold transition-all ${
                  isFormValid()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                저장하기
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default HomeView;
