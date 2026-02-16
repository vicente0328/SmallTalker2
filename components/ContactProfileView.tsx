
import React, { useState } from 'react';
import { Contact, Meeting } from '../types';
import { CURRENT_DATE } from '../constants';

interface ContactProfileViewProps {
  contact: Contact;
  meetings: Meeting[]; 
  onBack: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
  onUpdateContact?: (updatedContact: Contact) => void;
}

const ContactProfileView: React.FC<ContactProfileViewProps> = ({ 
    contact, 
    meetings,
    onBack, 
    onSelectMeeting,
    onUpdateContact 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      name: contact.name,
      role: contact.role,
      company: contact.company,
      tags: contact.tags.join(', '),
      businessInterests: contact.interests.business.join(', '),
      lifestyleInterests: contact.interests.lifestyle.join(', '),
      personality: contact.personality
  });

  const contactMeetings = meetings.filter(m => m.contactId === contact.id);

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
          personality: formData.personality
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
        <button onClick={onBack} className="text-indigo-600 flex items-center font-medium hover:underline">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
        </button>
        {!isEditing ? (
            <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            >
                편집하기
            </button>
        ) : (
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl"
                >
                    취소
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition shadow-md"
                >
                    저장
                </button>
            </div>
        )}
      </div>

      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-200 to-slate-200 mb-4 shadow-lg">
            <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full rounded-full object-cover border-4 border-white" />
        </div>
        
        {isEditing ? (
            <div className="w-full max-w-sm space-y-3">
                <input 
                    className="w-full text-center text-2xl font-bold text-slate-900 bg-slate-50 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none p-1"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="이름"
                />
                <div className="flex gap-2">
                    <input 
                        className="flex-1 text-center text-slate-600 bg-slate-50 border-b border-slate-200 focus:outline-none p-1"
                        value={formData.company}
                        onFocus={() => clearUnknownOnFocus('company')}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="회사"
                    />
                    <input 
                        className="flex-1 text-center text-slate-600 bg-slate-50 border-b border-slate-200 focus:outline-none p-1"
                        value={formData.role}
                        onFocus={() => clearUnknownOnFocus('role')}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="직함"
                    />
                </div>
            </div>
        ) : (
            <>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{contact.name}</h1>
                <p className="text-slate-500 font-medium">{contact.role}</p>
                <p className="text-slate-400 text-sm mb-6">{contact.company}</p>
            </>
        )}

        <div className="flex gap-4 w-full max-w-sm justify-center mt-6">
            <a href={`tel:${contact.phoneNumber}`} className="flex-1 flex flex-col items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Call</span>
            </a>
            <a href={`mailto:${contact.email}`} className="flex-1 flex flex-col items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Email</span>
            </a>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">Interests & Details</h3>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Business Interests
            </h4>
            {isEditing ? (
                <input 
                    className="w-full bg-slate-50 p-2 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={formData.businessInterests}
                    onFocus={() => clearUnknownOnFocus('businessInterests')}
                    onChange={(e) => setFormData({...formData, businessInterests: e.target.value})}
                    placeholder="관심사 (쉼표로 구분)"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {contact.interests.business.map(i => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">{i}</span>
                    ))}
                    {contact.interests.business.length === 0 && <span className="text-slate-300 text-sm italic">No data</span>}
                </div>
            )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Lifestyle Interests
            </h4>
            {isEditing ? (
                <input 
                    className="w-full bg-slate-50 p-2 rounded-lg text-base focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={formData.lifestyleInterests}
                    onFocus={() => clearUnknownOnFocus('lifestyleInterests')}
                    onChange={(e) => setFormData({...formData, lifestyleInterests: e.target.value})}
                    placeholder="취미 (쉼표로 구분)"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {contact.interests.lifestyle.map(i => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg">{i}</span>
                    ))}
                    {contact.interests.lifestyle.length === 0 && <span className="text-slate-300 text-sm italic">No data</span>}
                </div>
            )}
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl shadow-md text-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Personality & Note</h4>
            {isEditing ? (
                <textarea 
                    className="w-full bg-slate-700 p-3 rounded-lg text-base text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 min-h-[80px]"
                    value={formData.personality}
                    onFocus={() => clearUnknownOnFocus('personality')}
                    onChange={(e) => setFormData({...formData, personality: e.target.value})}
                    placeholder="성격이나 특징을 기록하세요"
                />
            ) : (
                <p className="text-sm leading-relaxed text-slate-200 italic">"{contact.personality || "기록된 성격 설명이 없습니다."}"</p>
            )}
        </div>
      </div>

      {!isEditing && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex justify-between items-center">
                Meeting History
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{contactMeetings.length} Total</span>
            </h3>
            
            <div className="space-y-4">
                {todayMeetings.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest pl-1">Today's Meeting</p>
                        {todayMeetings.map(meeting => (
                            <div 
                                key={meeting.id}
                                onClick={() => onSelectMeeting(meeting)}
                                className="flex flex-col gap-1 p-4 bg-green-50 rounded-xl border-2 border-green-100 cursor-pointer active:scale-[0.98] transition-all hover:bg-green-100 group shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide">오늘 (Today)</p>
                                    </div>
                                    <svg className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <div>
                                        <p className="text-base font-bold text-green-900">
                                            {new Date(meeting.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-green-800 font-medium mt-0.5">{meeting.title}</p>
                                    </div>
                                    <p className="text-xs text-green-600 font-medium mb-0.5">{meeting.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {nextMeeting && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">Upcoming</p>
                        <div 
                            onClick={() => onSelectMeeting(nextMeeting)}
                            className="flex flex-col gap-1 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer active:scale-[0.98] transition-all hover:bg-indigo-50 group"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Scheduled</p>
                                <svg className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div>
                                    <p className="text-base font-bold text-indigo-900">
                                        {formatDate(nextMeeting.date)}
                                    </p>
                                    <p className="text-sm text-indigo-700 font-medium mt-0.5">{nextMeeting.title}</p>
                                </div>
                                <p className="text-xs text-indigo-500 font-medium mb-0.5">{nextMeeting.location}</p>
                            </div>
                        </div>
                    </div>
                )}

                {lastMeeting && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">History</p>
                        <div 
                            onClick={() => onSelectMeeting(lastMeeting)}
                            className="flex flex-col gap-1 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer active:scale-[0.98] transition-all hover:border-indigo-200 hover:shadow-sm group"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Last Met</p>
                                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div>
                                    <p className="text-base font-bold text-slate-700">{formatDate(lastMeeting.date)}</p>
                                    <p className="text-sm text-slate-600 font-medium mt-0.5">{lastMeeting.title}</p>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">{lastMeeting.location}</p>
                            </div>
                        </div>
                    </div>
                )}

                {todayMeetings.length === 0 && !nextMeeting && !lastMeeting && (
                    <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
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
