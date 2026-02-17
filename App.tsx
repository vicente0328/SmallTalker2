
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
});

const mapMeetingFromDB = (data: any): Meeting => ({
  id: String(data.id),
  contactId: String(data.contact_id),
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
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert([{
              id: session.user.id,
              name: meta?.full_name || meta?.name || "New User",
              email: session.user.email,
              avatar_url: meta?.avatar_url || "",
              interests: { business: [], lifestyle: [] }
            }])
            .select()
            .single();
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

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeetingId(meeting.id);
    const contact = contacts.find(c => c.id === meeting.contactId);
    setSelectedContact(contact || null);
    setView(ViewState.MEETING_DETAIL);
  };

  const handleSelectContact = (contact: Contact) => {
      setSelectedContact(contact);
      setView(ViewState.CONTACT_PROFILE);
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setSelectedContact(prev => prev?.id === updatedContact.id ? updatedContact : prev);
    await supabase.from('contacts').update({
        name: updatedContact.name, company: updatedContact.company, role: updatedContact.role,
        phone_number: updatedContact.phoneNumber, email: updatedContact.email,
        tags: updatedContact.tags, interests: updatedContact.interests, personality: updatedContact.personality
    }).eq('id', updatedContact.id);
  };

  const handleAddContact = async (newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
    await supabase.from('contacts').insert([{ 
        id: newContact.id, user_id: session.user.id, name: newContact.name, company: newContact.company, role: newContact.role,
        phone_number: newContact.phoneNumber, email: newContact.email, tags: newContact.tags,
        interests: newContact.interests, personality: newContact.personality, avatar_url: newContact.avatarUrl
    }]);
  };

  const handleUpdateMeetingNote = async (meetingId: string, newNote: string) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, userNote: newNote } : m));
    await supabase.from('meetings').update({ user_note: newNote }).eq('id', meetingId);

    const meeting = meetings.find(m => m.id === meetingId);
    const contact = contacts.find(c => c.id === meeting?.contactId);
    if (meeting && contact) {
        try {
            const updates = await analyzeNoteForProfileUpdate(supabase, newNote, contact);
            const updatedContact: Contact = {
                ...contact,
                interests: {
                    business: Array.from(new Set([...contact.interests.business, ...updates.businessInterests])),
                    lifestyle: Array.from(new Set([...contact.interests.lifestyle, ...updates.lifestyleInterests])),
                },
                personality: updates.personality || contact.personality
            };
            setContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
            await supabase.from('contacts').update({ interests: updatedContact.interests, personality: updatedContact.personality }).eq('id', contact.id);
        } catch (e) { console.error(e); }
    }
  };

  const handleSaveAIGuide = async (meetingId: string, guide: SmallTalkGuide) => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, aiGuide: guide } : m));
    await supabase.from('meetings').update({ ai_guide: guide }).eq('id', meetingId);
  };

  const handleAddMeeting = async (newMeeting: Meeting, newContact?: Contact) => {
    if (newContact) await handleAddContact(newContact);
    setMeetings(prev => [...prev, newMeeting]);
    await supabase.from('meetings').insert([{
        id: newMeeting.id, user_id: session.user.id, contact_id: newMeeting.contactId, title: newMeeting.title,
        date: newMeeting.date, location: newMeeting.location
    }]);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView user={user} meetings={meetings} contacts={contacts} onSelectMeeting={handleSelectMeeting} />;
      case ViewState.CALENDAR:
        return <CalendarView meetings={meetings} contacts={contacts} onSelectMeeting={handleSelectMeeting} onAddMeeting={handleAddMeeting} onEditMeeting={()=>{}} onAddContact={handleAddContact} />;
      case ViewState.MEETING_DETAIL:
        const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
        if (!selectedMeeting || !selectedContact) return null;
        return <MeetingDetailView supabase={supabase} meeting={selectedMeeting} contact={selectedContact} user={user} allMeetings={meetings} onBack={() => setView(ViewState.CALENDAR)} onUpdateNote={handleUpdateMeetingNote} onSaveAIGuide={handleSaveAIGuide} onNavigateToMeeting={handleSelectMeeting} onSelectContact={handleSelectContact} />;
      case ViewState.CONTACT_LIST:
        return <ContactListView contacts={contacts} onSelectContact={handleSelectContact} onAddContact={handleAddContact} />;
      case ViewState.CONTACT_PROFILE:
        if (!selectedContact) return null;
        return <ContactProfileView contact={selectedContact} meetings={meetings} onBack={() => setView(ViewState.CONTACT_LIST)} onSelectMeeting={handleSelectMeeting} onUpdateContact={handleUpdateContact} />;
      case ViewState.SETTINGS:
        return <SettingView user={user} onUpdateUser={(u) => setUser(u)} onLogout={() => supabase.auth.signOut()} />;
      default: return null;
    }
  };

  return <Layout currentView={currentView} setView={setView} user={user}>{renderContent()}</Layout>;
};

export default App;
