import React from 'react';
import { UserProfile, Meeting, Contact } from '../types';
import { CURRENT_DATE } from '../constants';

interface HomeViewProps {
  user: UserProfile;
  meetings: Meeting[];
  contacts: Contact[];
  onSelectMeeting: (meeting: Meeting) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, meetings, contacts, onSelectMeeting }) => {
  // Filter for future or today's meetings based on CURRENT_DATE
  const upcomingMeetings = meetings
    .filter(m => new Date(m.date) >= CURRENT_DATE)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingMeeting = upcomingMeetings[0];
  const upcomingContact = upcomingMeeting ? contacts.find(c => c.id === upcomingMeeting.contactId) : null;

  // Check if the meeting is actually "today" (ignoring time)
  const isToday = upcomingMeeting && 
    new Date(upcomingMeeting.date).toDateString() === CURRENT_DATE.toDateString();

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
        className="relative w-full flex-1 min-h-[380px] bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 cursor-pointer active:scale-[0.98] transition-all group flex flex-col justify-between"
      >
        {/* Abstract Background Shapes (Clipped) */}
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
                {/* Meeting Context Snippet */}
                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6 bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                    {upcomingContact && (
                        <img src={upcomingContact.avatarUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/10 shrink-0 object-cover" alt={upcomingContact.name} />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-base md:text-lg truncate">{upcomingMeeting.title}</p>
                        <p className="text-slate-400 text-xs md:text-sm truncate">{upcomingMeeting.location}</p>
                    </div>
                </div>

                {/* Main Button */}
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
    </div>
  );
};

export default HomeView;