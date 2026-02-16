
import { Meeting } from "../types";

export const fetchGoogleEvents = async (accessToken: string): Promise<Partial<Meeting>[]> => {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&orderBy=startTime&singleEvents=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) throw new Error("Google Calendar API 호출 실패");

    const data = await response.json();
    
    return data.items.map((event: any) => ({
      id: `google-${event.id}`,
      title: event.summary || "제목 없는 일정",
      date: event.start.dateTime || event.start.date,
      location: event.location || "장소 미지정",
      pastContext: {
        lastMetDate: "",
        lastMetLocation: "",
        keywords: [],
        summary: "Google Calendar에서 가져온 일정입니다."
      }
    }));
  } catch (error) {
    console.error("Google Events Fetch Error:", error);
    return [];
  }
};
