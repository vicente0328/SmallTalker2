
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';
import { Contact, Meeting, UserProfile, SmallTalkGuide } from "../types";

const FUNCTION_URL = "https://vrzjyckllqjcbvtmktus.supabase.co/functions/v1/gemini-proxy";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyemp5Y2tsbHFqY2J2dG1rdHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI1NDcsImV4cCI6MjA4NTc4ODU0N30.dIP0wE6Nw8xrwUX6SlOW5FEdikHvgx9XW1AYeDbIYZs";

async function callEdgeFunction(body: Record<string, unknown>): Promise<any> {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
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

export const generateGuide = async (
  supabase: SupabaseClient,
  user: UserProfile,
  contact: Contact,
  meeting: Meeting,
  historyNotes: string
): Promise<SmallTalkGuide> => {
  try {
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

  } catch (error: any) {
    console.error("AI Guide Critical Error:", error);
    throw error;
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
