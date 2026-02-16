
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

// 스트리밍 가이드 생성 - 텍스트가 생성되는 즉시 onChunk 콜백 호출
export const generateGuideStreaming = async (
  supabase: SupabaseClient,
  user: UserProfile,
  contact: Contact,
  meeting: Meeting,
  historyNotes: string,
  onChunk: (partialText: string) => void,
): Promise<SmallTalkGuide> => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: 'generateGuide',
      payload: { user, contact, meeting, historyNotes, stream: true },
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
          onChunk(fullText);
        }
        if (event.error) {
          throw new Error(event.error);
        }
      } catch (e: any) {
        if (e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }

  // 스트리밍 완료 후 JSON 파싱
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
  historyNotes: string
): Promise<SmallTalkGuide> => {
  const result = await callEdgeFunction({
    action: 'generateGuide',
    payload: { user, contact, meeting, historyNotes },
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
    const contact = contacts.find(c => c.id === meeting.contactId);
    if (!contact) continue;

    const historyNotes = allMeetings
      .filter(m => m.contactId === contact.id && new Date(m.date) < new Date(meeting.date) && m.userNote?.trim())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => `[${new Date(m.date).toLocaleDateString('ko-KR')}] ${m.userNote}`)
      .join("\n---\n");

    try {
      const guide = await generateGuide(supabase, user, contact, meeting, historyNotes);
      onGuideReady(meeting.id, guide);
    } catch (e) {
      console.error(`Prefetch failed for meeting ${meeting.id}:`, e);
    }
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
