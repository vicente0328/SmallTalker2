
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';
import { Contact, Meeting, UserProfile, SmallTalkGuide } from "../types";

const FUNCTION_URL = "https://vrzjyckllqjcbvtmktus.supabase.co/functions/v1/gemini-proxy";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyemp5Y2tsbHFqY2J2dG1rdHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI1NDcsImV4cCI6MjA4NTc4ODU0N30.dIP0wE6Nw8xrwUX6SlOW5FEdikHvgx9XW1AYeDbIYZs";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${ANON_KEY}`,
  "apikey": ANON_KEY,
};

async function callEdgeFunction(body: Record<string, unknown>): Promise<any> {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Edge Function 오류 (${response.status}): ${text}`);
  }

  const result = JSON.parse(text);
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result;
}

// 부분 JSON에서 완성된 필드를 추출
function tryParsePartialGuide(raw: string): Partial<SmallTalkGuide> {
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const guide: Partial<SmallTalkGuide> = {};

  // pastReview 추출
  const prMatch = cleaned.match(/"pastReview"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (prMatch) guide.pastReview = prMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

  // businessTip.content 추출
  const btMatch = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const srcMatch = cleaned.match(/"source"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (btMatch) {
    guide.businessTip = {
      content: btMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
      source: srcMatch ? srcMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : undefined,
    };
  }

  // lifeTip 추출
  const ltMatch = cleaned.match(/"lifeTip"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (ltMatch) guide.lifeTip = ltMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

  return guide;
}

// 스트리밍 가이드 생성 - 필드가 완성될 때마다 점진적으로 가이드 업데이트
export const generateGuideStreaming = async (
  supabase: SupabaseClient,
  user: UserProfile,
  contact: Contact,
  meeting: Meeting,
  historyNotes: string,
  onPartialGuide: (partial: Partial<SmallTalkGuide>) => void,
  additionalContacts?: Contact[],
): Promise<SmallTalkGuide> => {
  const allContacts = additionalContacts && additionalContacts.length > 0
    ? [contact, ...additionalContacts]
    : [contact];
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: 'generateGuide',
      payload: { user, contact, contacts: allContacts, meeting, historyNotes, stream: true },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Edge Function 오류 (${response.status}): ${text}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;

      try {
        const event = JSON.parse(data);
        if (event.text) {
          fullText += event.text;
          const partial = tryParsePartialGuide(fullText);
          if (partial.pastReview || partial.businessTip || partial.lifeTip) {
            onPartialGuide(partial);
          }
        }
        if (event.error) {
          throw new Error(event.error);
        }
      } catch (e: any) {
        if (e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }

  // 최종 파싱
  const cleaned = fullText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const result = JSON.parse(cleaned);

  return {
    pastReview: result.pastReview || "만남의 기록이 분석되었습니다.",
    businessTip: {
      content: result.businessTip?.content || "상대방의 최근 성과나 업계 이슈로 대화를 시작해보세요.",
      source: result.businessTip?.source
    },
    lifeTip: result.lifeTip || "상대방의 개인적인 관심사나 가벼운 주제가 분위기를 풀어줄 것입니다."
  };
};

// 일반 호출 (프리페치용)
export const generateGuide = async (
  supabase: SupabaseClient,
  user: UserProfile,
  contact: Contact,
  meeting: Meeting,
  historyNotes: string,
  additionalContacts?: Contact[],
): Promise<SmallTalkGuide> => {
  const allContacts = additionalContacts && additionalContacts.length > 0
    ? [contact, ...additionalContacts]
    : [contact];
  const result = await callEdgeFunction({
    action: 'generateGuide',
    payload: { user, contact, contacts: allContacts, meeting, historyNotes },
  });

  return {
    pastReview: result.pastReview || "만남의 기록이 분석되었습니다.",
    businessTip: {
      content: result.businessTip?.content || "상대방의 최근 성과나 업계 이슈로 대화를 시작해보세요.",
      source: result.businessTip?.source
    },
    lifeTip: result.lifeTip || "상대방의 개인적인 관심사나 가벼운 주제가 분위기를 풀어줄 것입니다."
  };
};

// 프리페치: 오늘/내일 미팅 가이드를 백그라운드로 미리 생성
export const prefetchGuides = async (
  supabase: SupabaseClient,
  user: UserProfile,
  meetings: Meeting[],
  contacts: Contact[],
  allMeetings: Meeting[],
  onGuideReady: (meetingId: string, guide: SmallTalkGuide) => void,
) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const upcomingMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    return d >= now && d <= tomorrow && !m.aiGuide;
  });

  for (const meeting of upcomingMeetings) {
    const primaryContact = contacts.find(c => meeting.contactIds.includes(c.id));
    if (!primaryContact) continue;

    const additionalContacts = meeting.contactIds
      .filter(id => id !== primaryContact.id)
      .map(id => contacts.find(c => c.id === id))
      .filter((c): c is Contact => !!c);

    const historyNotes = allMeetings
      .filter(m => m.contactIds.some(id => meeting.contactIds.includes(id)) && new Date(m.date) < new Date(meeting.date) && m.userNote?.trim())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => `[${new Date(m.date).toLocaleDateString('ko-KR')}] ${m.userNote}`)
      .join("\n---\n");

    try {
      const guide = await generateGuide(supabase, user, primaryContact, meeting, historyNotes, additionalContacts);
      onGuideReady(meeting.id, guide);
    } catch (e) {
      console.error(`Prefetch failed for meeting ${meeting.id}:`, e);
    }
  }
};

export interface RelatedArticle {
  title: string;
  url: string;
}

export const searchRelatedArticles = async (
  tipContent: string,
  tipType: 'business' | 'lifestyle'
): Promise<RelatedArticle[]> => {
  try {
    const result = await callEdgeFunction({
      action: 'searchRelated',
      payload: { tipContent, tipType },
    });

    const items = result?.results || [];
    return items.map((item: { title: string; query: string }) => ({
      title: item.title,
      url: `https://www.google.com/search?q=${encodeURIComponent(item.query)}&tbm=nws`,
    }));
  } catch (error) {
    console.error("Search related articles failed:", error);
    return [];
  }
};

export const askAssistant = async (
  query: string,
  user: UserProfile,
  meetings: Meeting[],
  contacts: Contact[],
): Promise<string> => {
  try {
    const result = await callEdgeFunction({
      action: 'assistantChat',
      payload: { query, user, meetings, contacts },
    });
    return result?.answer || '죄송합니다, 잠시 후 다시 시도해주세요.';
  } catch (error) {
    console.error('AI Assistant error:', error);
    return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};

export const analyzeNoteForProfileUpdate = async (
    supabase: SupabaseClient,
    note: string,
    currentContact: Contact
): Promise<{ businessInterests: string[], lifestyleInterests: string[], personality: string }> => {
    try {
        const result = await callEdgeFunction({
          action: 'analyzeNote',
          payload: { note },
        });

        return {
            businessInterests: result?.businessInterests || [],
            lifestyleInterests: result?.lifestyleInterests || [],
            personality: result?.personality || currentContact.personality
        };
    } catch (error) {
        console.error("AI Profile Analysis Failed:", error);
        return {
            businessInterests: [],
            lifestyleInterests: [],
            personality: currentContact.personality
        };
    }
};
