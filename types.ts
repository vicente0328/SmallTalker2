
export interface UserProfile {
  name: string;
  role: string;
  industry: string;
  company: string;
  phoneNumber: string;
  email: string;
  interests: {
    business: string[];
    lifestyle: string[];
  };
  memo: string;
  avatarUrl?: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  phoneNumber: string;
  email: string;
  tags: string[];
  interests: {
    business: string[];
    lifestyle: string[];
  };
  personality: string;
  contactFrequency: string;
  avatarUrl: string;
  relationshipType: string;
  meetingFrequency: string;
}

export interface Meeting {
  id: string;
  contactIds: string[];
  title: string;
  date: string;
  location: string;
  userNote?: string;
  aiGuide?: SmallTalkGuide;
  pastContext: {
    lastMetDate: string;
    lastMetLocation: string;
    keywords: string[];
    summary: string;
  };
}

export interface PersonGuide {
  name: string;
  businessTip: {
    content: string;
    source?: string;
  };
  lifeTip: string;
}

export interface SmallTalkGuide {
  pastReview: string;
  businessTip: {
    content: string;
    source?: string;
  };
  lifeTip: string;
  attendees?: PersonGuide[];
}

export enum ViewState {
  HOME = 'HOME',
  CALENDAR = 'CALENDAR',
  MEETING_DETAIL = 'MEETING_DETAIL',
  CONTACT_LIST = 'CONTACT_LIST',
  CONTACT_PROFILE = 'CONTACT_PROFILE',
  SETTINGS = 'SETTINGS',
}
