
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 일반 호출 (analyzeNote용)
async function callClaude(apiKey: string, prompt: string, jsonSchema: Record<string, unknown>): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt + "\n\nJSON만 출력. 마크다운 금지.\nSchema: " + JSON.stringify(jsonSchema),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API 오류 (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  return result.content?.[0]?.text || "";
}

// 스트리밍 호출 (generateGuide용)
function streamClaude(apiKey: string, prompt: string, jsonSchema: Record<string, unknown>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            stream: true,
            messages: [
              {
                role: "user",
                content: prompt + "\n\nJSON만 출력. 마크다운 금지.\nSchema: " + JSON.stringify(jsonSchema),
              },
            ],
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: errBody })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
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
              if (event.type === "content_block_delta" && event.delta?.text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
              }
            } catch { /* skip unparseable lines */ }
          }
        }

        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: any) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY가 설정되지 않았습니다.");
    }

    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === "") {
      throw new Error("요청 본문이 비어 있습니다.");
    }

    const { action, payload } = JSON.parse(bodyText);

    if (action === 'generateGuide') {
      const { user, contact, contacts, meeting, historyNotes } = payload;
      const hasHistory = historyNotes && historyNotes.trim() !== "";

      // Build multi-contact info if available
      const allContacts = contacts && contacts.length > 0 ? contacts : [contact];
      const contactInfoLines = allContacts.map((c: any, i: number) => {
        const label = allContacts.length > 1 ? `파트너${i + 1}` : '파트너';
        return `[${label}] 이름: ${c.name}, 직책: ${c.role}, 회사: ${c.company}
  - 성격: ${c.personality || '정보 없음'}
  - 비즈니스 관심사: ${(c.interests?.business || []).join(', ') || '정보 없음'}
  - 라이프스타일 관심사: ${(c.interests?.lifestyle || []).join(', ') || '정보 없음'}
  - 나(${user.name})와의 관계: ${c.relationshipType || '정보 없음'}, 만남 횟수: ${c.meetingFrequency || '정보 없음'}`;
      }).join('\n');

      const isMultiPerson = allContacts.length > 1;

      const prompt = `비즈니스 미팅 전 스몰토크에서 꺼낼 수 있는 구체적인 대화 주제를 추천하세요. 반드시 존댓말(~합니다, ~하세요, ~드립니다)로 작성하세요.

중요 규칙:
- 톤앤매너, 말투, 태도에 대한 조언은 하지 마세요.
- 대신 실제로 꺼낼 수 있는 구체적인 화제/주제를 추천하세요.
- businessTip: 파트너의 업계, 회사, 직무와 관련된 최신 이슈나 트렌드 기반의 구체적 대화 주제를 추천하세요. (예: "최근 OO업계의 XX 트렌드에 대해 이야기해보세요")
- lifeTip: 파트너의 관심사/취미/라이프스타일과 관련된 구체적 대화 주제를 추천하세요. (예: "요즘 인기 있는 XX 맛집/여행지/취미 이야기를 꺼내보세요")
- 각 팁은 반드시 구체적인 주제명이나 키워드를 포함해야 합니다.

=== 핵심 원칙: 상대방(파트너) 중심의 가이드 ===
- 이 가이드는 미팅에 참석하는 상대방(파트너)에 대한 정보를 중심으로 작성해야 합니다.
- 사용자(나) 본인의 정보(직업, 관심사 등)를 가이드에 포함하지 마세요.
- 사용자 정보는 참고용으로만 제공되며, 가이드 내용에는 파트너의 정보만 반영하세요.
- 파트너의 관심사, 성격, 직업, 회사 정보를 기반으로 대화 주제를 추천하세요.

=== 절대 준수 사항: 사용자(나)와 파트너(상대방) 정보 구분 ===
아래 "나(사용자) 정보"는 대화 가이드를 받는 사용자 본인의 정보입니다.
아래 "파트너(상대방) 정보"는 미팅 상대방의 정보입니다.
- 파트너의 관심사, 직업, 특징을 사용자의 것으로 혼동하지 마세요.
- 사용자의 관심사, 직업, 특징을 파트너의 것으로 혼동하지 마세요.
- 예: 파트너가 유튜브 채널을 운영한다면, "상대방의 유튜브 채널"이라고 표현해야 하며, 사용자가 유튜브를 운영한다고 오해하면 안 됩니다.
- 대화 주제 추천 시 파트너의 특성을 기반으로 하되, 사용자가 파트너에게 물어보거나 대화할 주제로 추천하세요.
- 가이드 출력에 사용자 본인의 직업, 관심사, 회사명 등을 언급하지 마세요. 오직 파트너에 대한 내용만 포함하세요.

=== 히스토리 노트 해석 규칙 ===
- 히스토리 노트는 "나(${user.name})"가 "파트너"와의 미팅 후 기록한 메모입니다.
- 노트에서 주어가 생략된 문장은 대부분 파트너에 대한 이야기입니다.
- 예: "골프를 좋아한다" → 파트너가 골프를 좋아한다는 뜻
- 예: "유튜브 채널을 운영한다" → 파트너가 유튜브 채널을 운영한다는 뜻
- 예: "최근 승진했다" → 파트너가 최근 승진했다는 뜻
- 나(${user.name}) 자신에 대한 이야기와 절대 혼동하지 마세요.

=== 나(사용자) 정보 (참고용, 가이드에 포함하지 마세요) ===
이름: ${user.name}, 직책: ${user.role}, 회사: ${user.company}, 업종: ${user.industry || '정보 없음'}

=== 파트너(상대방) 정보 ===
${contactInfoLines}
${isMultiPerson ? `
=== 다수 참석자 규칙 ===
이 미팅에는 ${allContacts.length}명의 파트너가 참석합니다.
- pastReview: 전체 관계 맥락을 종합적으로 요약하세요.
- attendees 배열에 각 파트너별로 개별 businessTip과 lifeTip을 작성하세요.
- 각 파트너의 name, 관심사, 직업, 성격을 정확히 반영하여 개인화된 대화 주제를 추천하세요.
- businessTip과 lifeTip의 최상위 필드에는 전체 참석자를 아우르는 공통 주제를 작성하세요.` : ''}

=== 미팅 정보 ===
제목: ${meeting.title}
${hasHistory ? `히스토리:\n${historyNotes}` : "첫 만남"}
${hasHistory ? "주의: 이미 아는 사이. 초면 인사 금지. 지난 대화 연속성 강조." : ""}`;

      const schema = isMultiPerson ? {
        pastReview: "전체 관계 맥락 요약 (string)",
        businessTip: { content: "전체 참석자 공통 비즈니스 스몰토크 주제 (string)", source: "출처나 근거 (string)" },
        lifeTip: "전체 참석자 공통 라이프스타일 스몰토크 주제 (string)",
        attendees: [{ name: "파트너 이름 (string)", businessTip: { content: "개인별 비즈니스 주제 (string)", source: "출처 (string)" }, lifeTip: "개인별 라이프스타일 주제 (string)" }]
      } : {
        pastReview: "관계 맥락 요약 (string)",
        businessTip: { content: "구체적인 비즈니스 스몰토크 주제 추천 (string)", source: "출처나 근거 (string)" },
        lifeTip: "구체적인 라이프스타일 스몰토크 주제 추천 (string)"
      };

      // 스트리밍 여부 확인
      const useStream = payload.stream === true;

      if (useStream) {
        const stream = streamClaude(apiKey, prompt, schema);
        return new Response(stream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
      }

      // 일반 호출 (프리페치 등)
      const text = await callClaude(apiKey, prompt, schema);
      const json = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      return new Response(json, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyzeNote') {
      const { note } = payload;
      const text = await callClaude(apiKey,
        `미팅 노트에서 상대방(미팅 파트너)의 관심사와 성격을 추출하세요. 이 노트는 사용자가 상대방과의 미팅 후 기록한 것이며, 주어가 생략된 문장은 모두 상대방에 대한 내용입니다. 사용자 본인에 대한 내용이 아닌 상대방의 특성만 추출하세요: "${note}"`,
        { businessInterests: ["string"], lifestyleInterests: ["string"], personality: "string" }
      );
      const json = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      return new Response(json, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'searchRelated') {
      const { tipContent, tipType } = payload;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const text = await callClaude(apiKey,
        `다음 ${tipType === 'business' ? '비즈니스' : '라이프스타일'} 스몰토크 주제와 관련된 최신 뉴스 기사를 찾을 수 있는 구체적인 검색 키워드를 5개 생성하세요.

현재 시점: ${currentYear}년 ${currentMonth}월

규칙:
- 각 키워드는 Google 뉴스 검색에 바로 사용할 수 있는 형태여야 합니다.
- 최신 트렌드, 뉴스, 업계 동향을 찾을 수 있는 키워드를 생성하세요.
- 한국어 키워드 위주로 생성하되, 필요시 영어를 섞으세요.
- title은 "OO 관련 최신 뉴스", "XX 업계 동향" 등 사용자가 이해하기 쉬운 형태로 작성하세요.
- query에는 반드시 "${currentYear}년" 또는 "${currentYear}년 ${currentMonth}월"을 포함하여 최신 결과가 나오도록 하세요.

주제 내용: "${tipContent}"

각 항목에 title(사용자에게 보여줄 간결한 설명)과 query(실제 Google 뉴스 검색 쿼리)를 포함하세요.`,
        { results: [{ title: "string", query: "string" }] }
      );
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
