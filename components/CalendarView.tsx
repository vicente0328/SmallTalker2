
import React, { useState, useMemo } from 'react';
import { Meeting, Contact } from '../types';
import { CURRENT_DATE } from '../constants';

interface CalendarViewProps {
  meetings: Meeting[];
  contacts: Contact[];
  onSelectMeeting: (meeting: Meeting) => void;
  onAddMeeting: (meeting: Meeting, newContact?: Contact) => void;
  onEditMeeting: (meeting: Meeting, newContact?: Contact) => void;
  onAddContact?: (contact: Contact) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  meetings, 
  contacts, 
  onSelectMeeting,
  onAddMeeting,
  onEditMeeting,
  onAddContact
}) => {
  const [currentDate, setCurrentDate] = useState(CURRENT_DATE); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(CURRENT_DATE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContactId, setFormContactId] = useState("");
  const [formDate, setFormDate] = useState(""); 
  const [formTime, setFormTime] = useState(""); 
  const [formLocation, setFormLocation] = useState("");
  
  const [manualPartnerName, setManualPartnerName] = useState("");

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
    
    if (formContactId !== 'manual' || cleanedInput.length < 2) return null;
    
    return contacts.find(c => {
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
  }, [manualPartnerName, formContactId, contacts]);

  const openCreateModal = () => {
    setEditingMeetingId(null);
    setFormTitle("");
    setFormContactId("");
    setManualPartnerName("");
    const dateToUse = selectedDate || CURRENT_DATE;
    setFormDate(formatDateForInput(dateToUse));
    setFormTime("10:00");
    setFormLocation("");
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMeetingId(meeting.id);
    setFormTitle(meeting.title);
    setFormContactId(meeting.contactId);
    setManualPartnerName("");
    const d = new Date(meeting.date);
    setFormDate(formatDateForInput(d));
    setFormTime(d.toTimeString().slice(0, 5));
    setFormLocation(meeting.location);
    setIsModalOpen(true);
  };

  const handleLinkExisting = () => {
      if (existingContactMatch) {
          setFormContactId(existingContactMatch.id);
          setManualPartnerName("");
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
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualPartnerName)}&background=random`
    };
    
    // 1. 부모 상태에 연락처 추가
    onAddContact(newContact);
    
    // 2. 현재 모달의 드롭다운 선택값을 새 ID로 변경
    setFormContactId(newContactId);
    
    // 3. 수동 입력값을 비워 메시지를 사라지게 함
    setManualPartnerName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formTime) {
      alert("Please fill in required fields (Title, Date, Time).");
      return;
    }
    if (!formContactId && !manualPartnerName) {
        alert("Please select a partner or enter a name.");
        return;
    }

    const dateTimeString = `${formDate}T${formTime}:00`;
    let finalContactId = formContactId;
    let newContact: Contact | undefined;

    if (formContactId === 'manual') {
        finalContactId = `c-${Date.now()}`;
        newContact = {
            id: finalContactId,
            name: manualPartnerName,
            company: "Unknown",
            role: "Unknown",
            phoneNumber: "",
            email: "",
            tags: [],
            interests: { business: [], lifestyle: [] },
            personality: "",
            contactFrequency: "Unknown",
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualPartnerName)}&background=random`
        };
    }

    if (editingMeetingId) {
        const original = meetings.find(m => m.id === editingMeetingId);
        if (original) {
            const updated: Meeting = {
                ...original,
                title: formTitle,
                contactId: finalContactId,
                date: dateTimeString,
                location: formLocation
            };
            onEditMeeting(updated, newContact);
        }
    } else {
        const newMeeting: Meeting = {
            id: Date.now().toString(),
            contactId: finalContactId,
            title: formTitle,
            date: dateTimeString,
            location: formLocation,
            pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" }
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
        <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' : isSimulatedToday ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'}`}>
          {day}
        </div>
        {meetingExists && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-slate-400 rounded-full"></div>}
        {meetingExists && isSelected && <div className="absolute bottom-1 w-1 h-1 bg-white/70 rounded-full"></div>}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col relative">
       <div className="flex justify-between items-center px-1 shrink-0">
         <h2 className="text-3xl font-bold text-slate-900">Calendar</h2>
         <button onClick={openCreateModal} className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-colors">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
         </button>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 shrink-0">
         <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-lg text-slate-900">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
         </div>
         <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
         <div className="grid grid-cols-7 gap-y-1">{gridCells}</div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] pb-24">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })}</h3>
                 <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredMeetings.length} Events</span>
              </div>
              {filteredMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                   <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <p className="text-sm">No meetings scheduled</p>
                </div>
              ) : (
                filteredMeetings.map((meeting) => {
                    const contact = contacts.find(c => c.id === meeting.contactId);
                    if (!contact) return null;
                    const date = new Date(meeting.date);
                    return (
                        <div key={meeting.id} onClick={() => onSelectMeeting(meeting)} className="flex bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md group relative pr-12">
                            <div className="flex-col items-center justify-center pr-4 border-r border-slate-100 min-w-[60px] hidden md:flex group-hover:border-indigo-100 transition-colors">
                                <span className="text-xs font-bold text-slate-400 uppercase group-hover:text-indigo-400 transition-colors">{date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            </div>
                            <div className="flex-1 pl-0 md:pl-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{meeting.title}</h4>
                                    <span className="md:hidden text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                     <img src={contact.avatarUrl} className="w-5 h-5 rounded-full" />
                                     <p className="text-sm text-slate-500">{contact.name} · {contact.company}</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{meeting.location}</p>
                            </div>
                            <button onClick={(e) => openEditModal(meeting, e)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors z-10"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        </div>
                    );
                })
              )}
            </>
          ) : (
             <div className="flex-1 h-full"></div>
          )}
       </div>

       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
             <h3 className="text-xl font-bold text-slate-900 mb-4">{editingMeetingId ? 'Edit Meeting' : 'New Meeting'}</h3>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                 <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="Meeting Topic" />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Partner</label>
                 <div className="space-y-2">
                    <select value={formContactId} onChange={(e) => { setFormContactId(e.target.value); if (e.target.value !== 'manual') setManualPartnerName(""); }} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-base">
                        <option value="manual" className="font-bold text-indigo-600">[직접 입력] New Contact</option>
                        <option value="" disabled>Select a contact</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                    </select>

                    {formContactId === 'manual' && (
                        <div className="relative">
                            <input type="text" value={manualPartnerName} onChange={(e) => setManualPartnerName(e.target.value)} className="w-full p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-900 placeholder-indigo-300 animate-slide-up text-base" placeholder="Enter partner name" autoFocus />
                            
                            {existingContactMatch ? (
                                <div className="mt-2 p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <img src={existingContactMatch.avatarUrl} className="w-6 h-6 rounded-full shrink-0" />
                                        <p className="text-[11px] text-slate-600 truncate">이미 등록된 <strong>{existingContactMatch.name}</strong>님이 있습니다.</p>
                                    </div>
                                    <button type="button" onClick={handleLinkExisting} className="shrink-0 text-[10px] font-bold text-white bg-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-700 ml-2">연동하기</button>
                                </div>
                            ) : (
                                manualPartnerName.trim().length >= 1 && (
                                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                                        <p className="text-[11px] text-slate-500 truncate">신규 인물입니다. 연락처에 추가할까요?</p>
                                        <button type="button" onClick={handleQuickAddContact} className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 ml-2">연락처에 추가하기</button>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                    <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-left" />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                 <input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base" placeholder="Place" />
               </div>

               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors">Save</button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default CalendarView;
