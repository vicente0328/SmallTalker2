
import React, { useState, useMemo } from 'react';
import { Meeting, Contact } from '../types';
import { CURRENT_DATE } from '../constants';
import ContextualTip from './ContextualTip';
import Avatar from './Avatar';

interface CalendarViewProps {
  meetings: Meeting[];
  contacts: Contact[];
  onSelectMeeting: (meeting: Meeting) => void;
  onAddMeeting: (meeting: Meeting, newContact?: Contact) => void;
  onEditMeeting: (meeting: Meeting, newContact?: Contact) => void;
  onDeleteMeeting?: (meetingId: string) => void;
  onAddContact?: (contact: Contact) => void;
  dismissedTips?: Set<string>;
  onDismissTip?: (key: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  meetings,
  contacts,
  onSelectMeeting,
  onAddMeeting,
  onEditMeeting,
  onDeleteMeeting,
  onAddContact,
  dismissedTips = new Set(),
  onDismissTip = () => {}
}) => {
  const [currentDate, setCurrentDate] = useState(CURRENT_DATE);
  const [selectedDate, setSelectedDate] = useState<Date | null>(CURRENT_DATE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContactIds, setFormContactIds] = useState<string[]>([]);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formLocation, setFormLocation] = useState("");

  const [manualPartnerName, setManualPartnerName] = useState("");
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Wizard state for new meeting creation
  const [wizardStep, setWizardStep] = useState(1);
  const [formAgenda, setFormAgenda] = useState("");
  const [formKeywords, setFormKeywords] = useState("");

  const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getNameOnly = (fullName: string) => {
    return fullName.replace(/(팀장|부장|과장|상무|이사|대표|변호사|디렉터|바이어|매니저|엔지니어|MD|사원|대리|주임|본부장|실장|회장|사장)/g, '').trim().toLowerCase();
  };

  const existingContactMatch = useMemo(() => {
    const inputName = manualPartnerName.trim();
    const cleanedInput = getNameOnly(inputName);

    if (!showAddPartner || cleanedInput.length < 2) return null;

    return contacts.find(c => {
        if (formContactIds.includes(c.id)) return false;
        const contactCleanedName = getNameOnly(c.name);
        if (contactCleanedName === cleanedInput || contactCleanedName.includes(cleanedInput) || cleanedInput.includes(contactCleanedName)) {
            return true;
        }

        const inputChars = cleanedInput.split('');
        const contactChars = contactCleanedName.split('');

        let matchCount = 0;
        const tempContactChars = [...contactChars];

        for (const char of inputChars) {
            const index = tempContactChars.indexOf(char);
            if (index !== -1) {
                matchCount++;
                tempContactChars.splice(index, 1);
            }
        }
        return matchCount >= 2;
    });
  }, [manualPartnerName, showAddPartner, contacts, formContactIds]);

  const openCreateModal = () => {
    setEditingMeetingId(null);
    setFormTitle("");
    setFormContactIds([]);
    setManualPartnerName("");
    setShowAddPartner(false);
    setShowDeleteConfirm(false);
    const dateToUse = selectedDate || CURRENT_DATE;
    setFormDate(formatDateForInput(dateToUse));
    setFormTime("10:00");
    setFormLocation("");
    setWizardStep(1);
    setFormAgenda("");
    setFormKeywords("");
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMeetingId(meeting.id);
    setFormTitle(meeting.title);
    setFormContactIds([...meeting.contactIds]);
    setManualPartnerName("");
    setShowAddPartner(false);
    setShowDeleteConfirm(false);
    const d = new Date(meeting.date);
    setFormDate(formatDateForInput(d));
    setFormTime(d.toTimeString().slice(0, 5));
    setFormLocation(meeting.location);
    setIsModalOpen(true);
  };

  const handleAddExistingContact = (contactId: string) => {
    if (!formContactIds.includes(contactId)) {
      setFormContactIds(prev => [...prev, contactId]);
    }
    setShowAddPartner(false);
    setManualPartnerName("");
  };

  const handleRemoveContact = (contactId: string) => {
    setFormContactIds(prev => prev.filter(id => id !== contactId));
  };

  const handleLinkExisting = () => {
      if (existingContactMatch) {
          handleAddExistingContact(existingContactMatch.id);
      }
  };

  const handleQuickAddContact = () => {
    if (!manualPartnerName.trim() || !onAddContact) return;

    const newContactId = `c-${Date.now()}`;
    const newContact: Contact = {
        id: newContactId,
        name: manualPartnerName.trim(),
        company: "Unknown",
        role: "Unknown",
        phoneNumber: "",
        email: "",
        tags: [],
        interests: { business: [], lifestyle: [] },
        personality: "",
        contactFrequency: "Unknown",
        avatarUrl: '',
        relationshipType: "",
        meetingFrequency: "",
    };

    onAddContact(newContact);
    setFormContactIds(prev => [...prev, newContactId]);
    setManualPartnerName("");
    setShowAddPartner(false);
  };

  const handleSubmit = (e?: React.FormEvent | Event) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!formTitle || !formDate || !formTime) {
      alert("Please fill in required fields (Title, Date, Time).");
      return;
    }

    let finalContactIds = [...formContactIds];
    let newContact: Contact | undefined;

    // If manual name is typed but not yet added, add it
    if (showAddPartner && manualPartnerName.trim()) {
      const newContactId = `c-${Date.now()}`;
      newContact = {
          id: newContactId,
          name: manualPartnerName.trim(),
          company: "Unknown",
          role: "Unknown",
          phoneNumber: "",
          email: "",
          tags: [],
          interests: { business: [], lifestyle: [] },
          personality: "",
          contactFrequency: "Unknown",
          avatarUrl: '',
          relationshipType: "",
          meetingFrequency: "",
      };
      finalContactIds.push(newContactId);
    }

    if (finalContactIds.length === 0) {
      alert("참석자를 한 명 이상 추가해주세요.");
      return;
    }

    // Include local timezone offset so Supabase stores the correct absolute moment
    const tempDate = new Date(`${formDate}T${formTime}`);
    const offset = -tempDate.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const tzH = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const tzM = String(Math.abs(offset) % 60).padStart(2, '0');
    const dateTimeString = `${formDate}T${formTime}:00${sign}${tzH}:${tzM}`;

    if (editingMeetingId) {
        const original = meetings.find(m => m.id === editingMeetingId);
        if (original) {
            const updated: Meeting = {
                ...original,
                title: formTitle,
                contactIds: finalContactIds,
                date: dateTimeString,
                location: formLocation
            };
            onEditMeeting(updated, newContact);
        }
    } else {
        const newMeeting: Meeting = {
            id: Date.now().toString(),
            contactIds: finalContactIds,
            title: formTitle,
            date: dateTimeString,
            location: formLocation,
            pastContext: {
              lastMetDate: "",
              lastMetLocation: "",
              keywords: formKeywords.split(',').map(s => s.trim()).filter(Boolean),
              summary: formAgenda,
            }
        };
        onAddMeeting(newMeeting, newContact);
    }
    setIsModalOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentDate);
  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const hasMeeting = (day: number) => {
    const checkDate = new Date(year, month, day);
    return meetings.some(m => isSameDay(new Date(m.date), checkDate));
  };
  const filteredMeetings = selectedDate ? meetings.filter(m => isSameDay(new Date(m.date), selectedDate)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  const handlePrevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null); };
  const handleNextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null); };

  const gridCells = [];
  for (let i = 0; i < firstDay; i++) gridCells.push(<div key={`empty-${i}`} className="h-10 w-10" />);
  for (let day = 1; day <= days; day++) {
    const dateObj = new Date(year, month, day);
    const isSelected = selectedDate ? isSameDay(dateObj, selectedDate) : false;
    const isSimulatedToday = isSameDay(dateObj, CURRENT_DATE);
    const meetingExists = hasMeeting(day);
    gridCells.push(
      <div key={day} onClick={() => setSelectedDate(dateObj)} className="h-10 w-10 mx-auto flex flex-col items-center justify-center cursor-pointer relative">
        <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-st-ink text-white shadow-md' : isSimulatedToday ? 'bg-st-blue text-white font-semibold' : 'text-st-ink hover:bg-st-box/50'}`}>
          {day}
        </div>
        {meetingExists && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-st-blue rounded-full"></div>}
        {meetingExists && isSelected && <div className="absolute bottom-1 w-1 h-1 bg-white/70 rounded-full"></div>}
      </div>
    );
  }

  // Helper to get contacts for a meeting
  const getMeetingContacts = (meeting: Meeting) => {
    return meeting.contactIds
      .map(id => contacts.find(c => c.id === id))
      .filter((c): c is Contact => !!c);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col relative">
       <div className="flex justify-between items-center px-1 shrink-0">
         <div className="flex items-center gap-2">
           <h2 className="text-3xl font-bold text-st-ink">Calendar</h2>
           <ContextualTip tipKey="calendar-add" message="미팅을 추가하면 AI가 상대방의 관심사와 과거 만남을 분석하여 맞춤 스몰토크 가이드를 준비합니다." position="bottom" dismissedTips={dismissedTips} onDismiss={onDismissTip} />
         </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm p-4 shrink-0">
         <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-lg text-st-ink">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-st-box/50 rounded-full text-st-muted hover:text-st-ink transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-st-box/50 rounded-full text-st-muted hover:text-st-ink transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
         </div>
         <div className="grid grid-cols-7 text-center text-xs font-semibold text-st-muted mb-2"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
         <div className="grid grid-cols-7 gap-y-1">{gridCells}</div>
       </div>

       <div className="flex-1 overflow-y-auto min-h-[200px] pb-24">
          <div className="bg-white rounded-2xl shadow-sm p-3 space-y-2">
            {/* Header with date and add button */}
            <div className="flex items-center justify-between px-1">
              {selectedDate ? (
                <h3 className="text-xs font-semibold text-st-muted">{selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</h3>
              ) : (
                <h3 className="text-xs font-semibold text-st-muted">오늘의 일정</h3>
              )}
              <button onClick={openCreateModal} className="inline-flex items-center gap-1 px-3 py-1.5 bg-st-blue text-white text-[11px] font-bold rounded-lg hover:bg-st-blue/80 transition-all shadow-sm active:scale-95">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                추가하기
              </button>
            </div>

            {/* Global empty state when no meetings exist at all */}
            {meetings.length === 0 && !selectedDate && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-st-box rounded-xl flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-st-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-st-ink mb-0.5">아직 등록된 미팅이 없습니다</h3>
                <p className="text-xs text-st-muted leading-relaxed">첫 미팅을 추가하면 AI가 맞춤형<br/>스몰토크 가이드를 준비합니다.</p>
              </div>
            )}

            {selectedDate ? (
              <>
                {filteredMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-st-muted">
                     <svg className="w-8 h-8 mb-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     <p className="text-xs">등록된 일정이 없습니다</p>
                  </div>
                ) : (
                  filteredMeetings.map((meeting) => {
                      const meetingContacts = getMeetingContacts(meeting);
                      if (meetingContacts.length === 0) return null;
                      const primaryContact = meetingContacts[0];
                      const date = new Date(meeting.date);
                      return (
                          <div key={meeting.id} onClick={() => onSelectMeeting(meeting)} className="flex items-center bg-st-bg rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all hover:bg-st-bg group relative">
                              <div className="shrink-0 w-12 text-center mr-3">
                                  <span className="text-[11px] font-bold text-st-muted group-hover:text-st-ink transition-colors">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-sm text-st-ink group-hover:text-st-ink transition-colors truncate">{meeting.title}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                       <div className="flex -space-x-1">
                                         {meetingContacts.slice(0, 3).map(c => (
                                           <Avatar key={c.id} src={c.avatarUrl} name={c.name} size={16} className="border border-st-card" />
                                         ))}
                                       </div>
                                       <p className="text-xs text-st-muted truncate">
                                         {primaryContact.name}
                                         {meetingContacts.length > 1 && ` 외 ${meetingContacts.length - 1}명`}
                                       </p>
                                       <span className="text-st-muted text-xs">·</span>
                                       <p className="text-xs text-st-muted truncate flex items-center gap-0.5"><svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{meeting.location}</p>
                                  </div>
                              </div>
                              <button onClick={(e) => openEditModal(meeting, e)} className="shrink-0 ml-2 p-1.5 text-st-muted hover:text-st-ink hover:bg-st-box/50 rounded-full transition-colors z-10"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          </div>
                      );
                  })
                )}
              </>
            ) : (
               !meetings.length ? null : (
                 <p className="text-xs text-st-muted text-center py-3">날짜를 선택하면 일정을 확인할 수 있습니다.</p>
               )
            )}
          </div>
       </div>

       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4 animate-fade-in">
           <div className="glass rounded-2xl w-full max-w-sm p-5 shadow-2xl max-h-[90vh] overflow-y-auto">

             {/* ===== EDIT MODE: flat form ===== */}
             {editingMeetingId ? (
               <>
                 <h3 className="text-xl font-bold text-st-ink mb-4">일정 수정</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-st-muted uppercase mb-1">Title</label>
                     <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-base" placeholder="Meeting Topic" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-st-muted uppercase mb-1">참석자</label>
                     <div className="space-y-2">
                       {formContactIds.length > 0 && (
                         <div className="flex flex-wrap gap-2">
                           {formContactIds.map(cId => { const c = contacts.find(ct => ct.id === cId); if (!c) return null; return (
                             <div key={cId} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-st-box border border-st-box rounded-lg animate-fade-in">
                               <Avatar src={c.avatarUrl} name={c.name} size={20} />
                               <span className="text-xs font-medium text-st-ink">{c.name}</span>
                               <button type="button" onClick={() => handleRemoveContact(cId)} className="ml-0.5 text-st-muted hover:text-st-red transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                             </div>
                           ); })}
                         </div>
                       )}
                       {!showAddPartner ? (
                         <button type="button" onClick={() => setShowAddPartner(true)} className="w-full p-2.5 bg-st-bg rounded-xl border border-dashed border-st-box text-st-muted text-sm font-medium hover:bg-st-box/50 hover:border-st-muted hover:text-st-ink transition-all flex items-center justify-center gap-1.5">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>참석자 추가하기
                         </button>
                       ) : (
                         <div className="space-y-2 animate-slide-up">
                           <select value="" onChange={(e) => { if (e.target.value && e.target.value !== 'manual') handleAddExistingContact(e.target.value); }} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted appearance-none text-base">
                             <option value="">기존 연락처에서 선택...</option>
                             {contacts.filter(c => !formContactIds.includes(c.id)).map(c => (<option key={c.id} value={c.id}>{c.name} ({c.company})</option>))}
                           </select>
                           <div className="relative">
                             <input type="text" value={manualPartnerName} onChange={(e) => setManualPartnerName(e.target.value)} className="w-full p-2.5 bg-st-box rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-st-ink placeholder-st-muted text-base" placeholder="또는 이름을 직접 입력하세요" autoFocus />
                             {existingContactMatch ? (
                               <div className="mt-2 p-3 bg-st-bg border border-st-box rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                 <div className="flex items-center gap-2 overflow-hidden"><Avatar src={existingContactMatch.avatarUrl} name={existingContactMatch.name} size={24} /><p className="text-[11px] text-st-muted truncate">이미 등록된 <strong>{existingContactMatch.name}</strong>님이 있습니다.</p></div>
                                 <button type="button" onClick={handleLinkExisting} className="shrink-0 text-[10px] font-bold text-white bg-st-ink px-2 py-1 rounded-md hover:bg-st-muted ml-2">연동하기</button>
                               </div>
                             ) : manualPartnerName.trim().length >= 1 && (
                               <div className="mt-2 p-3 bg-st-bg border border-st-box rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                 <p className="text-[11px] text-st-muted truncate">신규 인물입니다. 연락처에 추가할까요?</p>
                                 <button type="button" onClick={handleQuickAddContact} className="shrink-0 text-[10px] font-bold text-st-ink bg-st-box px-2 py-1 rounded-md hover:bg-st-box/50 ml-2">추가하기</button>
                               </div>
                             )}
                           </div>
                           <button type="button" onClick={() => { setShowAddPartner(false); setManualPartnerName(""); }} className="text-xs text-st-muted hover:text-st-ink font-medium">취소</button>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div><label className="block text-xs font-bold text-st-muted uppercase mb-1">Date</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-sm" /></div>
                     <div><label className="block text-xs font-bold text-st-muted uppercase mb-1">Time</label><input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-sm text-left" /></div>
                   </div>
                   <div><label className="block text-xs font-bold text-st-muted uppercase mb-1">Location</label><input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-base" placeholder="Place" /></div>
                   <div className="space-y-2 pt-2">
                     <div className="flex gap-3">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-st-box text-st-muted font-bold rounded-xl hover:bg-st-box/50 transition-colors">취소</button>
                       <button type="submit" className="flex-1 py-3 bg-st-blue text-white font-bold rounded-xl hover:bg-st-blue/80 transition-colors">저장</button>
                     </div>
                     {onDeleteMeeting && (
                       showDeleteConfirm ? (
                         <div className="flex gap-3 animate-fade-in">
                           <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-st-box text-st-muted font-bold rounded-xl hover:bg-st-box/50 transition-colors text-sm">취소</button>
                           <button type="button" onClick={() => { onDeleteMeeting(editingMeetingId); setIsModalOpen(false); setShowDeleteConfirm(false); }} className="flex-1 py-3 bg-st-red text-white font-bold rounded-xl hover:bg-st-red/80 transition-colors text-sm">정말 삭제하기</button>
                         </div>
                       ) : (
                         <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-st-bg text-st-red font-bold rounded-xl border border-st-red/50 hover:bg-st-red/20 transition-colors text-sm flex items-center justify-center gap-2">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           이 일정 삭제하기
                         </button>
                       )
                     )}
                   </div>
                 </form>
               </>
             ) : (
               /* ===== CREATE MODE: conversational wizard ===== */
               <>
                 {/* Header: back + step dots + close */}
                 <div className="flex items-center justify-between mb-5">
                   {wizardStep > 1 ? (
                     <button onClick={() => setWizardStep(wizardStep - 1)} className="p-1 text-st-muted hover:text-st-ink transition-colors">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     </button>
                   ) : <div className="w-7" />}
                   <div className="flex items-center gap-2">
                     {[1, 2, 3].map(s => (
                       <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === wizardStep ? 'w-6 bg-st-blue' : s < wizardStep ? 'w-1.5 bg-st-ink' : 'w-1.5 bg-st-box'}`} />
                     ))}
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-1 text-st-muted hover:text-st-ink transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>

                 {/* Step 1: What & Who */}
                 {wizardStep === 1 && (
                   <div className="animate-fade-in space-y-4">
                     <div className="mb-2">
                       <h3 className="text-xl font-bold text-st-ink">어떤 미팅을 준비하시나요?</h3>
                       <p className="text-sm text-st-muted mt-1">미팅 제목과 참석자를 알려주세요.</p>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-st-muted uppercase mb-1">미팅 제목</label>
                       <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="예: 프로젝트 킥오프 미팅" autoFocus />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-st-muted uppercase mb-1">참석자</label>
                       <div className="space-y-2">
                         {formContactIds.length > 0 && (
                           <div className="flex flex-wrap gap-2">
                             {formContactIds.map(cId => { const c = contacts.find(ct => ct.id === cId); if (!c) return null; return (
                               <div key={cId} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-st-blue/8 border border-st-blue/20 rounded-lg animate-fade-in">
                                 <Avatar src={c.avatarUrl} name={c.name} size={20} />
                                 <span className="text-xs font-medium text-st-ink">{c.name}</span>
                                 <button type="button" onClick={() => handleRemoveContact(cId)} className="ml-0.5 text-st-muted hover:text-st-red transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                               </div>
                             ); })}
                           </div>
                         )}
                         {!showAddPartner ? (
                           <button type="button" onClick={() => setShowAddPartner(true)} className="w-full p-2.5 bg-st-bg rounded-xl border border-dashed border-st-box text-st-muted text-sm font-medium hover:bg-st-box/50 hover:border-st-muted hover:text-st-ink transition-all flex items-center justify-center gap-1.5">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>참석자 추가하기
                           </button>
                         ) : (
                           <div className="space-y-2 animate-slide-up">
                             <select value="" onChange={(e) => { if (e.target.value && e.target.value !== 'manual') handleAddExistingContact(e.target.value); }} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted appearance-none text-base">
                               <option value="">기존 연락처에서 선택...</option>
                               {contacts.filter(c => !formContactIds.includes(c.id)).map(c => (<option key={c.id} value={c.id}>{c.name} ({c.company})</option>))}
                             </select>
                             <div className="relative">
                               <input type="text" value={manualPartnerName} onChange={(e) => setManualPartnerName(e.target.value)} className="w-full p-2.5 bg-st-box rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-muted text-st-ink placeholder-st-muted text-base" placeholder="또는 이름을 직접 입력하세요" autoFocus />
                               {existingContactMatch ? (
                                 <div className="mt-2 p-3 bg-st-bg border border-st-box rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                   <div className="flex items-center gap-2 overflow-hidden"><Avatar src={existingContactMatch.avatarUrl} name={existingContactMatch.name} size={24} /><p className="text-[11px] text-st-muted truncate">이미 등록된 <strong>{existingContactMatch.name}</strong>님이 있습니다.</p></div>
                                   <button type="button" onClick={handleLinkExisting} className="shrink-0 text-[10px] font-bold text-white bg-st-ink px-2 py-1 rounded-md hover:bg-st-muted ml-2">연동하기</button>
                                 </div>
                               ) : manualPartnerName.trim().length >= 1 && (
                                 <div className="mt-2 p-3 bg-st-bg border border-st-box rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                   <p className="text-[11px] text-st-muted truncate">신규 인물입니다. 연락처에 추가할까요?</p>
                                   <button type="button" onClick={handleQuickAddContact} className="shrink-0 text-[10px] font-bold text-st-ink bg-st-box px-2 py-1 rounded-md hover:bg-st-box/50 ml-2">추가하기</button>
                                 </div>
                               )}
                             </div>
                             <button type="button" onClick={() => { setShowAddPartner(false); setManualPartnerName(""); }} className="text-xs text-st-muted hover:text-st-ink font-medium">취소</button>
                           </div>
                         )}
                       </div>
                     </div>

                     <button
                       type="button"
                       onClick={() => { setShowAddPartner(false); setWizardStep(2); }}
                       disabled={!formTitle.trim() || (formContactIds.length === 0 && !manualPartnerName.trim())}
                       className={`w-full py-3 font-bold rounded-xl transition-all ${
                         formTitle.trim() && (formContactIds.length > 0 || manualPartnerName.trim())
                           ? 'bg-st-blue text-white hover:bg-st-blue/80'
                           : 'bg-st-box text-st-muted cursor-not-allowed'
                       }`}
                     >
                       다음
                     </button>
                   </div>
                 )}

                 {/* Step 2: When & Where */}
                 {wizardStep === 2 && (
                   <div className="animate-fade-in space-y-4">
                     <div className="mb-2">
                       <h3 className="text-xl font-bold text-st-ink">언제, 어디에서 만나시나요?</h3>
                       <p className="text-sm text-st-muted mt-1">날짜와 시간을 정해주세요.</p>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="block text-xs font-bold text-st-muted uppercase mb-1">날짜</label>
                         <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-st-muted uppercase mb-1">시간</label>
                         <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-sm text-left" />
                       </div>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-st-muted uppercase mb-1">장소</label>
                       <input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-base" placeholder="예: 강남역 스타벅스" />
                       <p className="text-[11px] text-st-muted mt-1.5">장소를 입력하면 AI가 더 맞춤형 대화 주제를 준비해요.</p>
                     </div>

                     <button
                       type="button"
                       onClick={() => setWizardStep(3)}
                       disabled={!formDate || !formTime}
                       className={`w-full py-3 font-bold rounded-xl transition-all ${
                         formDate && formTime
                           ? 'bg-st-blue text-white hover:bg-st-blue/80'
                           : 'bg-st-box text-st-muted cursor-not-allowed'
                       }`}
                     >
                       다음
                     </button>
                   </div>
                 )}

                 {/* Step 3: Enrichment */}
                 {wizardStep === 3 && (
                   <div className="animate-fade-in space-y-4">
                     <div className="mb-2">
                       <h3 className="text-xl font-bold text-st-ink">이 미팅에 대해 더 알려주실래요?</h3>
                       <p className="text-sm text-st-muted mt-1">메모를 남겨주시면 AI가 더 정확한 스몰토크 가이드를 준비합니다.</p>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-st-muted uppercase mb-1">미팅 안건 / 목적</label>
                       <textarea
                         value={formAgenda}
                         onChange={(e) => setFormAgenda(e.target.value)}
                         className="w-full p-3 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-sm min-h-[80px] resize-none"
                         placeholder="예: 신규 프로젝트 제안, 분기 실적 논의..."
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-st-muted uppercase mb-1">키워드</label>
                       <input
                         type="text"
                         value={formKeywords}
                         onChange={(e) => setFormKeywords(e.target.value)}
                         className="w-full p-2.5 bg-st-bg rounded-xl border border-st-box focus:outline-none focus:ring-2 focus:ring-st-blue/30 focus:border-st-blue/30 text-sm"
                         placeholder="쉼표로 구분 (예: 골프, 투자, AI)"
                       />
                     </div>

                     <button
                       type="button"
                       onClick={() => handleSubmit()}
                       className="w-full py-3 bg-st-blue text-white font-bold rounded-xl hover:bg-st-blue/80 transition-all"
                     >
                       저장하기
                     </button>
                     <button
                       type="button"
                       onClick={() => { setFormAgenda(""); setFormKeywords(""); handleSubmit(); }}
                       className="w-full py-2 text-st-muted font-semibold text-sm hover:text-st-ink transition-colors"
                     >
                       건너뛰기
                     </button>
                   </div>
                 )}
               </>
             )}
           </div>
         </div>
       )}
    </div>
  );
};

export default CalendarView;
