
import React, { useState } from 'react';
import { Contact, Meeting } from '../types';
import { CURRENT_DATE } from '../constants';
import Avatar from './Avatar';

interface ContactProfileViewProps {
  contact: Contact;
  meetings: Meeting[];
  onBack: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
  onUpdateContact?: (updatedContact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
}

const ContactProfileView: React.FC<ContactProfileViewProps> = ({
    contact,
    meetings,
    onBack,
    onSelectMeeting,
    onUpdateContact,
    onDeleteContact
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
      name: contact.name,
      role: contact.role === 'Unknown' ? '' : contact.role,
      company: contact.company === 'Unknown' ? '' : contact.company,
      tags: contact.tags.join(', '),
      businessInterests: contact.interests.business.join(', '),
      lifestyleInterests: contact.interests.lifestyle.join(', '),
      personality: contact.personality,
      relationshipType: contact.relationshipType || '',
      meetingFrequency: contact.meetingFrequency || '',
      avatarUrl: contact.avatarUrl || '',
  });

  const contactMeetings = meetings.filter(m => m.contactIds.includes(contact.id));

  const isTodayDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.getFullYear() === CURRENT_DATE.getFullYear() &&
           d.getMonth() === CURRENT_DATE.getMonth() &&
           d.getDate() === CURRENT_DATE.getDate();
  };

  const todayMeetings = contactMeetings
    .filter(m => isTodayDate(m.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastMeetings = contactMeetings
    .filter(m => !isTodayDate(m.date) && new Date(m.date) < CURRENT_DATE)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const futureMeetings = contactMeetings
    .filter(m => !isTodayDate(m.date) && new Date(m.date) > CURRENT_DATE)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lastMeeting = pastMeetings[0];
  const nextMeeting = futureMeetings[0];

  const formatDate = (dateString: string) => {
    if (isTodayDate(dateString)) return "오늘 (Today)";
    return new Date(dateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short'});
  };

  const handleSave = () => {
      if (!onUpdateContact) return;
      const updated: Contact = {
          ...contact,
          name: formData.name,
          role: formData.role.trim() || "Unknown",
          company: formData.company.trim() || "Unknown",
          tags: formData.tags.split(',').map(s => s.trim()).filter(s => s),
          interests: {
              business: formData.businessInterests.split(',').map(s => s.trim()).filter(s => s),
              lifestyle: formData.lifestyleInterests.split(',').map(s => s.trim()).filter(s => s),
          },
          personality: formData.personality,
          relationshipType: formData.relationshipType,
          meetingFrequency: formData.meetingFrequency,
          avatarUrl: formData.avatarUrl,
      };
      onUpdateContact(updated);
      setIsEditing(false);
  };

  // Helper to clear "Unknown" values on focus
  const clearUnknownOnFocus = (field: keyof typeof formData) => {
      if (formData[field] === 'Unknown') {
          setFormData(prev => ({ ...prev, [field]: '' }));
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-12">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-st-ink flex items-center font-medium hover:underline">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
        </button>
        {!isEditing && (
            <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-st-box text-st-ink font-bold rounded-xl hover:bg-st-box transition"
            >
                편집하기
            </button>
        )}
      </div>

      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-st-box to-st-bg mb-4 shadow-lg">
            <Avatar
              src={isEditing ? formData.avatarUrl : contact.avatarUrl}
              name={contact.name}
              size={104}
              className="border-4 border-white"
              editable={isEditing}
              onChangePhoto={(url) => setFormData({...formData, avatarUrl: url})}
            />
        </div>

        {isEditing ? (
            <div className="w-full max-w-sm space-y-3">
                <input
                    className="w-full text-center text-2xl font-bold text-st-ink bg-st-bg border-b-2 border-st-box focus:border-st-ink focus:outline-none p-1"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="이름"
                />
                <div className="flex gap-2">
                    <input
                        className="flex-1 text-center text-st-muted bg-st-bg border-b border-st-box focus:outline-none p-1"
                        value={formData.company}
                        onFocus={() => clearUnknownOnFocus('company')}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="회사/소속"
                    />
                    <input
                        className="flex-1 text-center text-st-muted bg-st-bg border-b border-st-box focus:outline-none p-1"
                        value={formData.role}
                        onFocus={() => clearUnknownOnFocus('role')}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="직책"
                    />
                </div>
            </div>
        ) : (
            <>
                <h1 className="text-2xl font-bold text-st-ink mb-1">{contact.name}</h1>
                {contact.role && contact.role !== 'Unknown' ? (
                  <p className="text-st-muted font-medium">{contact.role}</p>
                ) : (
                  <p className="text-st-muted font-medium italic cursor-pointer hover:text-st-ink transition-colors" onClick={() => setIsEditing(true)}>직책</p>
                )}
                {contact.company && contact.company !== 'Unknown' ? (
                  <p className="text-st-muted text-sm mb-6">{contact.company}</p>
                ) : (
                  <p className="text-st-muted text-sm mb-6 italic cursor-pointer hover:text-st-ink transition-colors" onClick={() => setIsEditing(true)}>회사/소속</p>
                )}
            </>
        )}

        <div className="flex gap-4 w-full max-w-sm justify-center mt-6">
            <a href={`tel:${contact.phoneNumber}`} className="flex-1 flex flex-col items-center gap-2 bg-st-card p-3 rounded-xl shadow-sm border border-st-box hover:bg-st-bg transition">
                <div className="w-8 h-8 bg-st-green text-st-ink rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="text-xs font-medium text-st-muted">Call</span>
            </a>
            <a href={`mailto:${contact.email}`} className="flex-1 flex flex-col items-center gap-2 bg-st-card p-3 rounded-xl shadow-sm border border-st-box hover:bg-st-bg transition">
                <div className="w-8 h-8 bg-st-blue text-st-ink rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-xs font-medium text-st-muted">Email</span>
            </a>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-st-ink px-1">나(User)와의 관계</h3>

        <div className="bg-st-card p-5 rounded-2xl shadow-sm border-l-[3px] border-l-st-purple">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-st-purple uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-st-purple"></span>
                    관계 유형
                </h4>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-[11px] font-semibold text-st-muted hover:text-st-ink transition-colors px-2 py-1 rounded-lg hover:bg-st-box/50">편집하기</button>
                )}
            </div>
            {isEditing ? (
                <div className="flex flex-wrap gap-2">
                    {['비즈니스', '친구', '가족', '지인', '멘토/멘티'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, relationshipType: formData.relationshipType === type ? '' : type})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.relationshipType === type ? 'bg-st-ink text-white shadow-sm' : 'bg-st-box text-st-muted hover:bg-st-box'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            ) : (
                <div>
                    {contact.relationshipType ? (
                        <span className="px-3 py-1.5 bg-st-box text-st-ink text-sm font-medium rounded-lg">{contact.relationshipType}</span>
                    ) : (
                        <span className="text-st-muted text-sm italic cursor-pointer hover:text-st-ink" onClick={() => setIsEditing(true)}>관계를 설정하세요</span>
                    )}
                </div>
            )}
        </div>

        <div className="bg-st-card p-5 rounded-2xl shadow-sm border-l-[3px] border-l-st-green">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-st-green uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-st-green"></span>
                    지난 만남 횟수
                </h4>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-[11px] font-semibold text-st-muted hover:text-st-ink transition-colors px-2 py-1 rounded-lg hover:bg-st-box/50">편집하기</button>
                )}
            </div>
            {isEditing ? (
                <div className="flex flex-wrap gap-2">
                    {['0회 (첫 만남)', '1~3회', '4회 이상'].map(freq => (
                        <button
                            key={freq}
                            type="button"
                            onClick={() => setFormData({...formData, meetingFrequency: formData.meetingFrequency === freq ? '' : freq})}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.meetingFrequency === freq ? 'bg-st-ink text-white shadow-sm' : 'bg-st-box text-st-muted hover:bg-st-box'}`}
                        >
                            {freq}
                        </button>
                    ))}
                </div>
            ) : (
                <div>
                    {contact.meetingFrequency ? (
                        <span className="px-3 py-1.5 bg-st-box text-st-ink text-sm font-medium rounded-lg">{contact.meetingFrequency}</span>
                    ) : (
                        <span className="text-st-muted text-sm italic cursor-pointer hover:text-st-ink" onClick={() => setIsEditing(true)}>만남 횟수를 설정하세요</span>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-st-ink px-1">Interests & Details</h3>

        <div className="bg-st-card p-5 rounded-2xl shadow-sm border-l-[3px] border-l-st-blue">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-st-blue uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-st-blue"></span>
                    Business Interests
                </h4>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-[11px] font-semibold text-st-muted hover:text-st-ink transition-colors px-2 py-1 rounded-lg hover:bg-st-box/50">편집하기</button>
                )}
            </div>
            {isEditing ? (
                <input
                    className="w-full bg-st-bg p-2 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-st-muted"
                    value={formData.businessInterests}
                    onFocus={() => clearUnknownOnFocus('businessInterests')}
                    onChange={(e) => setFormData({...formData, businessInterests: e.target.value})}
                    placeholder="관심사 (쉼표로 구분)"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {contact.interests.business.map(i => (
                        <span key={i} className="px-3 py-1.5 bg-st-box text-st-ink text-sm font-medium rounded-lg">{i}</span>
                    ))}
                    {contact.interests.business.length === 0 && <span className="text-st-muted text-sm italic">No data</span>}
                </div>
            )}
        </div>

        <div className="bg-st-card p-5 rounded-2xl shadow-sm border-l-[3px] border-l-st-yellow">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-st-yellow uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-st-yellow"></span>
                    Lifestyle Interests
                </h4>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-[11px] font-semibold text-st-muted hover:text-st-ink transition-colors px-2 py-1 rounded-lg hover:bg-st-box/50">편집하기</button>
                )}
            </div>
            {isEditing ? (
                <input
                    className="w-full bg-st-bg p-2 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-st-muted"
                    value={formData.lifestyleInterests}
                    onFocus={() => clearUnknownOnFocus('lifestyleInterests')}
                    onChange={(e) => setFormData({...formData, lifestyleInterests: e.target.value})}
                    placeholder="취미 (쉼표로 구분)"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {contact.interests.lifestyle.map(i => (
                        <span key={i} className="px-3 py-1.5 bg-st-box text-st-ink text-sm font-medium rounded-lg">{i}</span>
                    ))}
                    {contact.interests.lifestyle.length === 0 && <span className="text-st-muted text-sm italic">No data</span>}
                </div>
            )}
        </div>

        <div className="bg-st-ink p-5 rounded-2xl shadow-md text-white">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-st-muted uppercase tracking-wide">Personality & Note</h4>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-[11px] font-semibold text-st-muted hover:text-st-card transition-colors px-2 py-1 rounded-lg hover:bg-white/10">편집하기</button>
                )}
            </div>
            {isEditing ? (
                <textarea
                    className="w-full bg-white/10 p-3 rounded-lg text-base text-white focus:outline-none focus:ring-1 focus:ring-st-muted min-h-[80px]"
                    value={formData.personality}
                    onFocus={() => clearUnknownOnFocus('personality')}
                    onChange={(e) => setFormData({...formData, personality: e.target.value})}
                    placeholder="성격이나 특징을 기록하세요"
                />
            ) : (
                <p className="text-sm leading-relaxed text-st-card italic">"{contact.personality || "기록된 성격 설명이 없습니다."}"</p>
            )}
        </div>
      </div>

      {isEditing && (
        <div className="sticky bottom-0 z-10 glass border-t border-st-box -mx-4 px-4 py-4 mt-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3.5 bg-st-box text-st-muted font-bold rounded-xl hover:bg-st-box transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 bg-st-green text-white font-bold rounded-xl hover:bg-st-green/80 transition-all shadow-lg active:scale-95"
            >
              저장하기
            </button>
          </div>
          {onDeleteContact && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full mt-3 py-2.5 text-st-red text-sm font-medium hover:text-st-red transition-colors"
            >
              이 연락처 삭제하기
            </button>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-st-red text-st-ink rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-st-ink mb-1">연락처 삭제</h3>
              <p className="text-sm text-st-muted">
                <span className="font-semibold text-st-ink">{contact.name}</span> 님의 연락처를 삭제하시겠습니까?<br/>삭제 후에는 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex border-t border-st-box">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 text-st-muted font-semibold text-sm hover:bg-st-bg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onDeleteContact?.(contact.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3.5 bg-st-red text-white font-bold text-sm hover:bg-st-red/80 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="bg-st-card rounded-2xl p-5 shadow-sm border border-st-box">
            <h3 className="text-sm font-bold text-st-ink mb-4 flex justify-between items-center">
                Meeting History
                <span className="text-xs font-medium text-st-muted bg-st-bg px-2 py-0.5 rounded-full">{contactMeetings.length} Total</span>
            </h3>

            <div className="space-y-4">
                {todayMeetings.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-st-ink uppercase tracking-widest pl-1">Today's Meeting</p>
                        {todayMeetings.map(meeting => (
                            <div
                                key={meeting.id}
                                onClick={() => onSelectMeeting(meeting)}
                                className="flex flex-col gap-1 p-4 bg-st-card rounded-xl border-l-[3px] border-l-st-green cursor-pointer active:scale-[0.98] transition-all hover:bg-st-box/30 group shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-st-green animate-pulse"></span>
                                        <p className="text-xs font-bold text-st-ink uppercase tracking-wide">오늘 (Today)</p>
                                    </div>
                                    <svg className="w-4 h-4 text-st-muted group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <div>
                                        <p className="text-base font-bold text-st-ink">
                                            {new Date(meeting.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-st-ink font-medium mt-0.5">{meeting.title}</p>
                                    </div>
                                    <p className="text-xs text-st-muted font-medium mb-0.5">{meeting.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {nextMeeting && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-st-muted uppercase tracking-widest pl-1">Upcoming</p>
                        <div
                            onClick={() => onSelectMeeting(nextMeeting)}
                            className="flex flex-col gap-1 p-4 bg-st-box/50 rounded-xl border border-st-box cursor-pointer active:scale-[0.98] transition-all hover:bg-st-box/50 group"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-st-muted uppercase tracking-wide">Scheduled</p>
                                <svg className="w-4 h-4 text-st-muted group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div>
                                    <p className="text-base font-bold text-st-ink">
                                        {formatDate(nextMeeting.date)}
                                    </p>
                                    <p className="text-sm text-st-ink font-medium mt-0.5">{nextMeeting.title}</p>
                                </div>
                                <p className="text-xs text-st-muted font-medium mb-0.5">{nextMeeting.location}</p>
                            </div>
                        </div>
                    </div>
                )}

                {lastMeeting && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-st-muted uppercase tracking-widest pl-1">History</p>
                        <div
                            onClick={() => onSelectMeeting(lastMeeting)}
                            className="flex flex-col gap-1 p-4 bg-st-card rounded-xl border border-st-box cursor-pointer active:scale-[0.98] transition-all hover:border-st-muted hover:shadow-sm group"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-st-muted uppercase tracking-wide">Last Met</p>
                                <svg className="w-4 h-4 text-st-muted group-hover:text-st-ink group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div>
                                    <p className="text-base font-bold text-st-ink">{formatDate(lastMeeting.date)}</p>
                                    <p className="text-sm text-st-muted font-medium mt-0.5">{lastMeeting.title}</p>
                                </div>
                                <p className="text-xs text-st-muted font-medium mb-0.5">{lastMeeting.location}</p>
                            </div>
                        </div>
                    </div>
                )}

                {todayMeetings.length === 0 && !nextMeeting && !lastMeeting && (
                    <div className="p-8 bg-st-bg rounded-xl border border-dashed border-st-box text-center text-st-muted text-sm">
                        No meetings recorded.
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ContactProfileView;
