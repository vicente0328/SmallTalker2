
import React from 'react';
import { ViewState, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: UserProfile;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, user }) => {
  const isTabActive = (tab: string) => {
    if (tab === 'HOME') return currentView === ViewState.HOME;
    if (tab === 'CALENDAR') return currentView === ViewState.CALENDAR || currentView === ViewState.MEETING_DETAIL;
    if (tab === 'CONTACTS') return currentView === ViewState.CONTACT_LIST || currentView === ViewState.CONTACT_PROFILE;
    if (tab === 'SETTINGS') return currentView === ViewState.SETTINGS;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-0 md:pl-64 transition-all duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-white border-r border-slate-200 md:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">SmallTalker<span className="text-slate-400 font-light">.ai</span></h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavButton 
              active={isTabActive('HOME')} 
              onClick={() => setView(ViewState.HOME)}
              icon={<HomeIcon />}
              label="Home"
            />
            <NavButton 
              active={isTabActive('CALENDAR')} 
              onClick={() => setView(ViewState.CALENDAR)}
              icon={<CalendarIcon />}
              label="Calendar"
            />
            <NavButton 
              active={isTabActive('CONTACTS')} 
              onClick={() => setView(ViewState.CONTACT_LIST)}
              icon={<UsersIcon />}
              label="Contacts"
            />
            <NavButton 
              active={isTabActive('SETTINGS')} 
              onClick={() => setView(ViewState.SETTINGS)}
              icon={<CogIcon />}
              label="Settings"
            />
          </nav>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`} className="w-8 h-8 rounded-full object-cover" alt={user.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.role || user.industry || '사용자'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 h-14 flex items-center justify-center px-4">
        <h1 className="text-lg font-bold text-indigo-600">SmallTalker<span className="text-slate-400 font-light">.ai</span></h1>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 md:pt-8 px-4 md:px-8 max-w-5xl mx-auto h-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 h-20 flex items-start justify-around pt-3 pb-safe">
        <MobileNavButton 
          active={isTabActive('HOME')} 
          onClick={() => setView(ViewState.HOME)}
          icon={<HomeIcon />}
          label="Home"
        />
        <MobileNavButton 
          active={isTabActive('CALENDAR')} 
          onClick={() => setView(ViewState.CALENDAR)}
          icon={<CalendarIcon />}
          label="Calendar"
        />
        <MobileNavButton 
          active={isTabActive('CONTACTS')} 
          onClick={() => setView(ViewState.CONTACT_LIST)}
          icon={<UsersIcon />}
          label="Contacts"
        />
        <MobileNavButton 
          active={isTabActive('SETTINGS')} 
          onClick={() => setView(ViewState.SETTINGS)}
          icon={<CogIcon />}
          label="Settings"
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
      active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 gap-1.5 transition-colors ${
      active ? 'text-indigo-600' : 'text-slate-400'
    }`}
  >
    {React.cloneElement(icon, { className: active ? "w-6 h-6 stroke-2" : "w-6 h-6 stroke-[1.5]" })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// Icons
const HomeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CalendarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CogIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default Layout;
