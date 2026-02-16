
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function callClaude(apiKey: string, prompt: string, jsonSchema: Record<string, unknown>): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt + "\n\n반드시 아래 JSON 스키마에 맞는 순수 JSON만 응답하세요. 마크다운이나 설명 없이 JSON만 출력하세요.\nJSON Schema: " + JSON.stringify(jsonSchema),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API 오류 (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || "";
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY가 Edge Function 설정에 누락되었습니다. 'supabase secrets set CLAUDE_API_KEY=...' 명령어로 설정해주세요.");
    }

    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === "") {
      throw new Error("요청 본문이 비어 있습니다.");
    }

    const { action, payload } = JSON.parse(bodyText);

    if (action === 'generateGuide') {
      const { user, contact, meeting, historyNotes } = payload;

      const prompt = `당신은 세계 최고의 비즈니스 관계 관리 전문가입니다.
사용자(${user.name}, ${user.role})가 파트너(${contact.name}, ${contact.role})와 미팅을 가집니다.

[파트너 정보]
회사: ${contact.company}, 성격: ${contact.personality}, 관심사: ${JSON.stringify(contact.interests)}.
이번 미팅 주제: ${meeting.title}.

[관계 히스토리]
${historyNotes && historyNotes.trim() !== "" ? historyNotes : "기존 기록 없음 (이번이 첫 만남일 가능성이 높음)"}

[필수 지시 사항]
1. **관계 히스토리가 존재한다면 절대로 '처음 뵙겠습니다', '반갑습니다(초면 인사)', '자기소개' 등의 멘트를 하지 마세요.** 파트너와는 이미 아는 사이입니다.
2. 히스토리가 있다면 "지난번에 말씀하신 ~는 어떻게 되었나요?" 또는 "지난 미팅 이후 ~ 분야에서 어떤 진전이 있었는지 궁금합니다"와 같이 **대화의 연속성**을 보여주는 전략을 제시하세요.
3. 파트너의 성격과 관심사에 맞춰 품격 있고 자연스러운 스몰토크 주제를 제안하세요.
4. 응답은 반드시 지정된 JSON 형식으로만 작성하세요.`;

      const schema = {
        pastReview: "과거 맥락 복기 및 관계 정의 (string)",
        businessTip: {
          content: "비즈니스 대화 팁 (string)",
          source: "참고할만한 소식/출처 (string, optional)"
        },
        lifeTip: "라이프스타일/취미 기반 친밀도 향상 팁 (string)"
      };

      const text = await callClaude(apiKey, prompt, schema);
      const json = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

      return new Response(json, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyzeNote') {
      const { note } = payload;

      const prompt = `다음 비즈니스 미팅 노트를 분석하여 상대방의 새로운 관심사(Business/Lifestyle)와 성격적 특징을 추출하세요: "${note}"`;

      const schema = {
        businessInterests: ["string"],
        lifestyleInterests: ["string"],
        personality: "string"
      };

      const text = await callClaude(apiKey, prompt, schema);
      const json = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

      return new Response(json, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('정의되지 않은 액션입니다.');

  } catch (error: any) {
    console.error("Claude Proxy Error:", error.message);

    return new Response(JSON.stringify({
        error: error.message || "서버 내부 오류가 발생했습니다."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
