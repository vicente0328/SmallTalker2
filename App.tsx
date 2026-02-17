
import React, { useState, useEffect } from 'react';
import { Session } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import CalendarView from './components/CalendarView';
import MeetingDetailView from './components/MeetingDetailView';
import ContactProfileView from './components/ContactProfileView';
import ContactListView from './components/ContactListView';
import SettingView from './components/SettingView';
import AuthView from './components/AuthView';
import WelcomeTour from './components/WelcomeTour';
import { ViewState, Meeting, Contact, UserProfile, SmallTalkGuide } from './types';
import { CURRENT_USER } from './constants';
import { analyzeNoteForProfileUpdate, prefetchGuides } from './services/geminiService';

const mapContactFromDB = (data: any): Contact => ({
  id: String(data.id),
  name: data.name,
  company: data.company,
  role: data.role,
  phoneNumber: data.phone_number,
  email: data.email,
  tags: data.tags || [],
  interests: data.interests || { business: [], lifestyle: [] },
  personality: data.personality,
  contactFrequency: data.contact_frequency,
  avatarUrl: data.avatar_url,
  relationshipType: data.relationship_type || '',
  meetingFrequency: data.meeting_frequency || '',
});

const mapMeetingFromDB = (data: any): Meeting => ({
  id: String(data.id),
  contactIds: data.contact_ids || (data.contact_id ? [String(data.contact_id)] : []),
  title: data.title,
  date: data.date,
  location: data.location,
  userNote: data.user_note,
  aiGuide: data.ai_guide,
  pastContext: data.past_context || { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
});

const mapUserFromDB = (data: any): UserProfile => ({
  name: data.name,
  role: data.role || "",
  company: data.company || "",
  industry: data.industry || "",
  phoneNumber: data.phone_number || "",
  email: data.email || "",
  interests: data.interests || { business: [], lifestyle: [] },
  memo: data.memo || "",
  avatarUrl: data.avatar_url,
});

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setView] = useState<ViewState>(ViewState.HOME);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserProfile>(CURRENT_USER);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Onboarding state
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('smalltalker_dismissed_tips');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let { data: userData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!userData) {
          const meta = session.user.user_metadata;
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: session.user.id,
              name: meta?.full_name || meta?.name || "New User",
              email: session.user.email,
              avatar_url: meta?.avatar_url || "",
              role: "",
              company: "",
              industry: "",
              phone_number: "",
              interests: { business: [], lifestyle: [] },
              memo: "",
            }])
            .select()
            .single();
          if (insertError) console.error("User profile insert error:", insertError);
          if (newProfile) userData = newProfile;
        }

        const { data: contactsData } = await supabase.from('contacts').select('*');
        const { data: meetingsData } = await supabase.from('meetings').select('*').order('date', { ascending: true });

        if (contactsData) setContacts(contactsData.map(mapContactFromDB));
        if (meetingsData) setMeetings(meetingsData.map(mapMeetingFromDB));
        if (userData) setUser(mapUserFromDB(userData));
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // Welcome tour: show on first login
  useEffect(() => {
    if (loading || !session) return;
    const tourDone = localStorage.getItem('smalltalker_tour_done');
    if (!tourDone) {
      setShowWelcomeTour(true);
    }
  }, [loading, session]);

  const handleCompleteTour = () => {
    setShowWelcomeTour(false);
    localStorage.setItem('smalltalker_tour_done', 'true');
    if (!localStorage.getItem('smalltalker_signup_time')) {
      localStorage.setItem('smalltalker_signup_time', Date.now().toString());
    }
  };

  const handleRestartTour = () => {
    setShowWelcomeTour(true);
  };

  const handleDismissTip = (key: string) => {
    setDismissedTips(prev => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem('smalltalker_dismissed_tips', JSON.stringify([...next]));
      return next;
    });
  };

  // 프리페치: 데이터 로드 완료 후 오늘/내일 미팅 가이드를 백그라운드로 미리 생성 (1회만)
  const [prefetched, setPrefetched] = useState(false);
  useEffect(() => {
    if (loading || prefetched || !meetings.length || !contacts.length) return;
    setPrefetched(true);

    prefetchGuides(supabase, user, meetings, contacts, meetings, async (meetingId, guide) => {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, aiGuide: guide } : m));
      await supabase.from('meetings').update({ ai_guide: guide }).eq('id', meetingId);
    });
  }, [loading, prefetched, meetings.length]);

  if (!session) return <AuthView />;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-st-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-st-box border-t-st-ink rounded-full animate-spin"></div>
        <p className="text-sm text-st-muted font-medium">Loading...</p>
      </div>
    </div>
  );

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeetingId(meeting.id);
    const meetingContacts = meeting.contactIds
      .map(id => contacts.find(c => c.id === id))
      .filter((c): c is Contact => !!c);
    setSelectedContact(meetingContacts[0] || null);
    setView(ViewState.MEETING_DETAIL);
  };

  const handleSelectContact = (contact: Contact) => {
      setSelectedContact(contact);
      setView(ViewState.CONTACT_PROFILE);
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    if (session) {
      const { error } = await supabase.from('user_profiles').update({
        name: updatedUser.name,
        role: updatedUser.role,
        company: updatedUser.company,
        industry: updatedUser.industry,
        phone_number: updatedUser.phoneNumber,
        email: updatedUser.email,
        interests: updatedUser.interests,
        memo: updatedUser.memo,
      }).eq('id', session.user.id);
      if (error) console.error("User profile update error:", error);
    }
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setSelectedContact(prev => prev?.id === updatedContact.id ? updatedContact : prev);
    await supabase.from('contacts').update({
        name: updatedContact.name, company: updatedContact.company, role: updatedContact.role,
        phone_number: updatedContact.phoneNumber, email: updatedContact.email,
        tags: updatedContact.tags, interests: updatedContact.interests, personality: updatedContact.personality,
        relationship_type: updatedContact.relationshipType, meeting_frequency: updatedContact.meetingFrequency,
    }).eq('id', updatedContact.id);

    // 연락처 정보 변경 시, 해당 연락처의 미래 미팅 가이드 무효화
    const now = new Date();
    const futureMeetingIds = meetings
      .filter(m => m.contactIds.includes(updatedContact.id) && new Date(m.date) >= now && m.aiGuide)
      .map(m => m.id);
    if (futureMeetingIds.length > 0) {
      setMeetings(prev => prev.map(m => futureMeetingIds.includes(m.id) ? { ...m, aiGuide: undefined } : m));
      for (const id of futureMeetingIds) {
        await supabase.from('meetings').update({ ai_guide: null }).eq('id', id);
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setSelectedContact(null);
    setView(ViewState.CONTACT_LIST);
    await supabase.from('contacts').delete().eq('id', contactId);
  };

  const handleAddContact = async (newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
    await supabase.from('contacts').insert([{
        id: newContact.id, user_id: session.user.id, name: newContact.name, company: newContact.company, role: newContact.role,
        phone_number: newContact.phoneNumber, email: newContact.email, tags: newContact.tags,
        interests: newContact.interests, personality: newContact.personality, avatar_url: newContact.avatarUrl,
        relationship_type: newContact.relationshipType, meeting_frequency: newContact.meetingFrequency,
    }]);
  };

  const handleUpdateMeetingNote = async (meetingId: string, newNote: string) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, userNote: newNote } : m));
    await supabase.from('meetings').update({ user_note: newNote }).eq('id', meetingId);

    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        const meetingContacts = meeting.contactIds
          .map(id => contacts.find(c => c.id === id))
          .filter((c): c is Contact => !!c);
        const primaryContact = meetingContacts[0];

        if (primaryContact) {
            // 노트 변경 시, 이 미팅 이후의 같은 참석자 미래 미팅 가이드 무효화
            const meetingDate = new Date(meeting.date);
            const futureMeetingIds = meetings
              .filter(m => m.contactIds.some(id => meeting.contactIds.includes(id)) && new Date(m.date) > meetingDate && m.aiGuide)
              .map(m => m.id);
            if (futureMeetingIds.length > 0) {
              setMeetings(prev => prev.map(m => futureMeetingIds.includes(m.id) ? { ...m, aiGuide: undefined } : m));
              for (const id of futureMeetingIds) {
                await supabase.from('meetings').update({ ai_guide: null }).eq('id', id);
              }
            }

            try {
                const updates = await analyzeNoteForProfileUpdate(supabase, newNote, primaryContact);
                const updatedContact: Contact = {
                    ...primaryContact,
                    interests: {
                        business: Array.from(new Set([...primaryContact.interests.business, ...updates.businessInterests])),
                        lifestyle: Array.from(new Set([...primaryContact.interests.lifestyle, ...updates.lifestyleInterests])),
                    },
                    personality: updates.personality || primaryContact.personality
                };
                setContacts(prev => prev.map(c => c.id === primaryContact.id ? updatedContact : c));
                await supabase.from('contacts').update({ interests: updatedContact.interests, personality: updatedContact.personality }).eq('id', primaryContact.id);
            } catch (e) { console.error(e); }
        }
    }
  };

  const handleSaveAIGuide = async (meetingId: string, guide: SmallTalkGuide) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, aiGuide: guide } : m));
    await supabase.from('meetings').update({ ai_guide: guide }).eq('id', meetingId);
  };

  const handleClearAIGuide = async (meetingId: string) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, aiGuide: undefined } : m));
    await supabase.from('meetings').update({ ai_guide: null }).eq('id', meetingId);
  };

  const handleEditMeeting = async (updatedMeeting: Meeting, newContact?: Contact) => {
    if (newContact) await handleAddContact(newContact);
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    await supabase.from('meetings').update({
        contact_ids: updatedMeeting.contactIds, title: updatedMeeting.title,
        date: updatedMeeting.date, location: updatedMeeting.location
    }).eq('id', updatedMeeting.id);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    await supabase.from('meetings').delete().eq('id', meetingId);
  };

  const handleAddMeeting = async (newMeeting: Meeting, newContact?: Contact) => {
    if (newContact) await handleAddContact(newContact);
    setMeetings(prev => [...prev, newMeeting]);
    await supabase.from('meetings').insert([{
        id: newMeeting.id, user_id: session.user.id, contact_ids: newMeeting.contactIds, title: newMeeting.title,
        date: newMeeting.date, location: newMeeting.location
    }]);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView user={user} meetings={meetings} contacts={contacts} onSelectMeeting={handleSelectMeeting} onUpdateContact={handleUpdateContact} onAddContact={handleAddContact} onNavigateToCalendar={() => setView(ViewState.CALENDAR)} onNavigateToContacts={() => setView(ViewState.CONTACT_LIST)} onRestartTour={handleRestartTour} />;
      case ViewState.CALENDAR:
        return <CalendarView meetings={meetings} contacts={contacts} onSelectMeeting={handleSelectMeeting} onAddMeeting={handleAddMeeting} onEditMeeting={handleEditMeeting} onDeleteMeeting={handleDeleteMeeting} onAddContact={handleAddContact} dismissedTips={dismissedTips} onDismissTip={handleDismissTip} />;
      case ViewState.MEETING_DETAIL:
        const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
        if (!selectedMeeting) return null;
        const meetingContacts = selectedMeeting.contactIds
          .map(id => contacts.find(c => c.id === id))
          .filter((c): c is Contact => !!c);
        if (meetingContacts.length === 0) return null;
        return <MeetingDetailView supabase={supabase} meeting={selectedMeeting} contacts={meetingContacts} user={user} allMeetings={meetings} allContacts={contacts} onBack={() => setView(ViewState.CALENDAR)} onUpdateNote={handleUpdateMeetingNote} onSaveAIGuide={handleSaveAIGuide} onClearAIGuide={handleClearAIGuide} onNavigateToMeeting={handleSelectMeeting} onSelectContact={handleSelectContact} dismissedTips={dismissedTips} onDismissTip={handleDismissTip} />;
      case ViewState.CONTACT_LIST:
        return <ContactListView contacts={contacts} onSelectContact={handleSelectContact} onAddContact={handleAddContact} dismissedTips={dismissedTips} onDismissTip={handleDismissTip} />;
      case ViewState.CONTACT_PROFILE:
        if (!selectedContact) return null;
        return <ContactProfileView contact={selectedContact} meetings={meetings} onBack={() => setView(ViewState.CONTACT_LIST)} onSelectMeeting={handleSelectMeeting} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} />;
      case ViewState.SETTINGS:
        return <SettingView user={user} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} />;
      default: return null;
    }
  };

  return (
    <>
      <Layout currentView={currentView} setView={setView} user={user}>{renderContent()}</Layout>
      {showWelcomeTour && <WelcomeTour userName={user.name} onComplete={handleCompleteTour} setView={setView} />}
    </>
  );
};

export default App;
