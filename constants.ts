import { UserProfile, Contact, Meeting } from './types';

// 1. Set Current Date to February 28, 2026
export const CURRENT_DATE = new Date("2026-02-28T09:00:00");

export const CURRENT_USER: UserProfile = {
  name: "한수",
  role: "수출 매니저",
  company: "글로벌 뷰티 커넥트",
  industry: "K-Beauty & Cosmetics",
  phoneNumber: "010-1234-5678",
  email: "hansu.kim@beautyconnect.com",
  interests: {
    business: ["북미 시장 진출", "친환경 패키지 트렌드", "AI 물류 최적화"],
    lifestyle: ["위스키 시음", "크로스핏", "주말 드라이브"]
  },
  avatarUrl: "https://ui-avatars.com/api/?name=한수&background=6366f1&color=fff&bold=true",
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "이지은 팀장",
    company: "(주)네오뷰티",
    role: "상품기획팀장",
    phoneNumber: "010-1111-2222",
    email: "jieun.lee@neobeauty.com",
    tags: ["비건", "테니스"],
    interests: { business: ["비건 원료", "친환경 패키징"], lifestyle: ["테니스", "동호회 활동"] },
    personality: "트렌드에 민감하고 디테일 중시",
    contactFrequency: "2주 1회",
    avatarUrl: "https://picsum.photos/200/200?random=1",
  },
  {
    id: "c2",
    name: "최정우 변호사",
    company: "법무법인 율곡",
    role: "파트너 변호사",
    phoneNumber: "010-3333-4444",
    email: "jw.choi@yulgok.law",
    tags: ["M&A", "클래식", "LP"],
    interests: { business: ["기업 M&A", "공정거래법"], lifestyle: ["클래식 음악", "바이닐(LP) 수집"] },
    personality: "논리정연, 예술적 조예 깊음",
    contactFrequency: "수시",
    avatarUrl: "https://picsum.photos/200/200?random=2",
  },
  {
    id: "c3",
    name: "David Miller",
    company: "Global Retail Co.",
    role: "입점 담당자",
    phoneNumber: "010-5555-6666",
    email: "d.miller@globalretail.com",
    tags: ["비건", "사찰음식"],
    interests: { business: ["북미 진출 전략", "한국 스킨케어"], lifestyle: ["채식(Vegan)", "사찰 음식"] },
    personality: "한국 문화에 호기심 많음",
    contactFrequency: "1개월 1회",
    avatarUrl: "https://picsum.photos/200/200?random=3",
  },
  {
    id: "c4",
    name: "박서준 대표",
    company: "IT 스타트업 '커넥트'",
    role: "CEO",
    phoneNumber: "010-7777-8888",
    email: "sj.park@connect.ai",
    tags: ["AI", "반려견"],
    interests: { business: ["생성형 AI", "마케팅 자동화"], lifestyle: ["골든 리트리버", "유기견 봉사"] },
    personality: "열정적, 강아지 이야기 좋아함",
    contactFrequency: "1주 1회",
    avatarUrl: "https://picsum.photos/200/200?random=4",
  },
  {
    id: "c5",
    name: "한유리 과장",
    company: "신세계백화점",
    role: "MD",
    phoneNumber: "010-9999-0000",
    email: "yuri.han@shinsegae.com",
    tags: ["향수", "요가"],
    interests: { business: ["럭셔리 뷰티 팝업"], lifestyle: ["명상", "요가", "니치 향수"] },
    personality: "감각적, 웰니스 관심",
    contactFrequency: "3주 1회",
    avatarUrl: "https://picsum.photos/200/200?random=5",
  },
  {
    id: "c6",
    name: "정민호 상무",
    company: "유통 대기업",
    role: "물류 혁신팀",
    phoneNumber: "010-1212-3434",
    email: "mh.jung@logistics.com",
    tags: ["물류", "와인"],
    interests: { business: ["저온 물류(Cold Chain)", "자동화 설비"], lifestyle: ["프랑스 부르고뉴 와인"] },
    personality: "호탕함, 와인 애호가",
    contactFrequency: "1개월 1회",
    avatarUrl: "https://picsum.photos/200/200?random=6",
  },
  {
    id: "c7",
    name: "김태희 디렉터",
    company: "Freelance",
    role: "Creative Director",
    phoneNumber: "010-5656-7878",
    email: "th.kim@studio.kr",
    tags: ["영상", "필름카메라"],
    interests: { business: ["숏폼 광고", "브랜드 필름"], lifestyle: ["필름 카메라 출사", "제주도 여행"] },
    personality: "자유로움, 시각적 영감 중시",
    contactFrequency: "프로젝트 단위",
    avatarUrl: "https://picsum.photos/200/200?random=7",
  },
  {
    id: "c8",
    name: "이토 타케시",
    company: "일본 대형 드러그스토어",
    role: "바이어",
    phoneNumber: "+81-90-1234-5678",
    email: "takeshi.ito@drugstore.jp",
    tags: ["다도", "통관"],
    interests: { business: ["기능성 앰플", "일본 통관 규제"], lifestyle: ["일본 전통차", "한국 다도"] },
    personality: "꼼꼼함, 예의 중시",
    contactFrequency: "2개월 1회",
    avatarUrl: "https://picsum.photos/200/200?random=8",
  },
  {
    id: "c9",
    name: "조아라 부장",
    company: "홍보대행사",
    role: "PR Manager",
    phoneNumber: "010-4321-8765",
    email: "ara.cho@pragency.com",
    tags: ["캠핑", "위기관리"],
    interests: { business: ["인플루언서 협업", "위기 관리"], lifestyle: ["오토캠핑", "장비 업그레이드"] },
    personality: "사교적, 힐링 필요",
    contactFrequency: "수시",
    avatarUrl: "https://picsum.photos/200/200?random=9",
  },
  {
    id: "c10",
    name: "Thomas Brown",
    company: "German Logistics Startup",
    role: "Engineer",
    phoneNumber: "+49-151-2345-6789",
    email: "t.brown@robotics.de",
    tags: ["로봇", "마라톤"],
    interests: { business: ["자율주행 배송 로봇", "한국 시장 도입"], lifestyle: ["마라톤", "베를린 마라톤"] },
    personality: "직설적, 효율 추구",
    contactFrequency: "화상 미팅",
    avatarUrl: "https://picsum.photos/200/200?random=10",
  },
];

// 2. Updated Mock Meetings (Feb = Past with User Notes, Mar/Apr = Future)
export const MOCK_MEETINGS: Meeting[] = [
  // --- February (Past) ---
  {
    id: "m1", contactId: "c1", date: "2026-02-05T13:00:00", location: "성수동 카페",
    title: "네오뷰티 비건 라인 원료 미팅",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "(주)네오뷰티 상품기획팀장. 비건 원료 트렌드와 친환경 패키징에 관심이 큼. 최근 '테니스'에 빠져 주말마다 동호회 활동 중."
  },
  {
    id: "m2", contactId: "c2", date: "2026-02-06T10:00:00", location: "강남역 인근 법무법인",
    title: "수출 계약서 법률 자문",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "법무법인 율곡 파트너 변호사. 기업 M&A 및 공정거래법 전문. 클래식 음악 감상이 취미이며 최근 '바이닐(LP) 수집'을 시작함."
  },
  {
    id: "m3", contactId: "c3", date: "2026-02-09T16:00:00", location: "여의도 IFC몰",
    title: "북미 유통망 진출 전략 논의",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "글로벌 유통사 입점 담당자. 한국 스킨케어 브랜드의 북미 진출 전략 관심. 채식주의자(Vegan)이며 최근 한국의 '사찰 음식'에 관심이 생김."
  },
  {
    id: "m4", contactId: "c4", date: "2026-02-11T19:00:00", location: "판교역 이자카야",
    title: "커넥트 AI 마케팅 협업 식사",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "IT 스타트업 '커넥트' 대표. 생성형 AI를 활용한 마케팅 자동화 관심. 반려견(골든 리트리버)을 키우며 유기견 봉사활동에 열심임."
  },
  {
    id: "m5", contactId: "c5", date: "2026-02-13T14:00:00", location: "광화문 오피스",
    title: "백화점 봄 시즌 팝업 제안",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "신세계백화점 MD. 럭셔리 뷰티 팝업스토어 기획 중. 스트레스 해소법으로 '명상과 요가'를 즐기며 향수(Niche Perfume) 컬렉터임."
  },
  {
    id: "m6", contactId: "c6", date: "2026-02-16T12:00:00", location: "잠실 롯데월드몰",
    title: "물류 자동화 설비 도입 오찬",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "유통 대기업 물류 혁신팀. 저온 물류(Cold Chain) 및 자동화 설비 도입 검토 중. 와인 애호가로 특히 '프랑스 부르고뉴' 와인을 좋아함."
  },
  {
    id: "m7", contactId: "c7", date: "2026-02-18T11:00:00", location: "홍대역 인근 스튜디오",
    title: "브랜드 필름 제작 킥오프",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "프리랜서 영상 크리에이티브 디렉터. 숏폼 광고 및 브랜드 필름 제작 관심. 최근 '필름 카메라' 출사에 재미를 붙였으며 제주도 여행 계획 중."
  },
  {
    id: "m8", contactId: "c8", date: "2026-02-20T15:00:00", location: "부산 벡스코(BEXCO)",
    title: "기능성 앰플 일본 통관 관련",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "일본 대형 드러그스토어 바이어. K-뷰티 기능성 앰플의 일본 통관 규제 관심. 일본 전통차(茶) 전문가이며 최근 '한국 다도'를 배우고 싶어 함."
  },
  {
    id: "m9", contactId: "c9", date: "2026-02-23T18:00:00", location: "신사동 가로수길",
    title: "상반기 인플루언서 PR 전략",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "홍보대행사 PR 매니저. 인플루언서 협업 및 위기 관리 커뮤니케이션 전문. 캠핑 마니아로 주말마다 '오토캠핑'을 떠나며 캠핑 장비 업그레이드 중."
  },
  {
    id: "m10", contactId: "c10", date: "2026-02-25T09:00:00", location: "온라인 줌(Zoom) 미팅",
    title: "배송 로봇 한국 시장 조사",
    pastContext: { lastMetDate: "", lastMetLocation: "", keywords: [], summary: "" },
    userNote: "독일 물류 스타트업 엔지니어. 자율주행 배송 로봇의 한국 시장 도입 관심. '마라톤'이 취미이며 올해 가을 베를린 마라톤 대회 참가를 준비 중."
  },

  // --- March/April (Future) ---
  // Note: pastContext for these is derived from the Feb meetings above.
  {
    id: "m11", contactId: "c1", date: "2026-03-12T14:00:00", location: "코엑스 박람회장",
    title: "뷰티 엑스포 동반 참관",
    pastContext: { lastMetDate: "2026-02-05", lastMetLocation: "성수동 카페", keywords: ["비건", "테니스"], summary: "비건 원료 트렌드와 친환경 패키징에 관심이 큼. 최근 '테니스'에 빠져 주말마다 동호회 활동 중." }
  },
  {
    id: "m12", contactId: "c2", date: "2026-03-25T18:00:00", location: "서초동 와인바",
    title: "자문 보고서 리뷰 및 석식",
    pastContext: { lastMetDate: "2026-02-06", lastMetLocation: "강남역 법무법인", keywords: ["M&A", "LP수집"], summary: "기업 M&A 및 공정거래법 전문. 클래식 음악 감상이 취미이며 최근 '바이닐(LP) 수집'을 시작함." }
  },
  {
    id: "m13", contactId: "c3", date: "2026-04-02T11:00:00", location: "인천공항 라운지",
    title: "최종 입점 계약 체결 및 배웅",
    pastContext: { lastMetDate: "2026-02-09", lastMetLocation: "여의도 IFC몰", keywords: ["북미진출", "사찰음식"], summary: "한국 스킨케어 북미 진출 전략 관심. 채식주의자(Vegen)이며 최근 한국의 '사찰 음식'에 관심이 생김." }
  },
  {
    id: "m14", contactId: "c4", date: "2026-03-18T15:00:00", location: "판교 사옥 회의실",
    title: "솔루션 시연 및 투자 논의",
    pastContext: { lastMetDate: "2026-02-11", lastMetLocation: "판교역 이자카야", keywords: ["AI마케팅", "반려견"], summary: "생성형 AI를 활용한 마케팅 자동화 관심. 반려견(골든 리트리버)을 키우며 유기견 봉사활동에 열심임." }
  },
  {
    id: "m15", contactId: "c5", date: "2026-04-08T16:00:00", location: "명동 롯데호텔",
    title: "팝업스토어 최종 브랜드 확정",
    pastContext: { lastMetDate: "2026-02-13", lastMetLocation: "광화문 오피스", keywords: ["팝업기획", "요가"], summary: "럭셔리 뷰티 팝업스토어 기획 중. 스트레스 해소법으로 '명상과 요가'를 즐기며 향수(Niche Perfume) 컬렉터임." }
  },
  {
    id: "m16", contactId: "c6", date: "2026-03-30T13:00:00", location: "의왕 물류센터",
    title: "스마트 물류 현장 실사",
    pastContext: { lastMetDate: "2026-02-16", lastMetLocation: "잠실 롯데월드몰", keywords: ["콜드체인", "와인"], summary: "저온 물류 및 자동화 설비 도입 검토 중. 와인 애호가로 특히 '프랑스 부르고뉴' 와인을 좋아함." }
  },
  {
    id: "m17", contactId: "c7", date: "2026-04-15T14:00:00", location: "한남동 카페",
    title: "광고 영상 1차 가편집본 리뷰",
    pastContext: { lastMetDate: "2026-02-18", lastMetLocation: "홍대역 스튜디오", keywords: ["숏폼광고", "필름카메라"], summary: "숏폼 광고 및 브랜드 필름 제작 관심. 최근 '필름 카메라' 출사에 재미를 붙였으며 제주도 여행 계획 중." }
  },
  {
    id: "m18", contactId: "c8", date: "2026-03-20T12:00:00", location: "도쿄 긴자(출장)",
    title: "현지 드러그스토어 매장 답사",
    pastContext: { lastMetDate: "2026-02-20", lastMetLocation: "부산 벡스코", keywords: ["통관규제", "다도"], summary: "일본 통관 규제 관심. 일본 전통차(茶) 전문가이며 최근 '한국 다도'를 배우고 싶어 함." }
  },
  {
    id: "m19", contactId: "c9", date: "2026-04-22T19:00:00", location: "가평 캠핑장",
    title: "미디어 업계 네트워킹 데이",
    pastContext: { lastMetDate: "2026-02-23", lastMetLocation: "신사동 가로수길", keywords: ["위기관리", "오토캠핑"], summary: "인플루언서 협업 및 위기 관리 커뮤니케이션 전문. 캠핑 마니아로 주말마다 '오토캠핑'을 떠나며 캠핑 장비 업그레이드 중." }
  },
  {
    id: "m20", contactId: "c10", date: "2026-04-28T17:00:00", location: "온라인 줌(Zoom)",
    title: "로봇 운영 결과 및 후속 미팅",
    pastContext: { lastMetDate: "2026-02-25", lastMetLocation: "온라인 줌", keywords: ["로봇배송", "마라톤"], summary: "자율주행 배송 로봇의 한국 시장 도입 관심. '마라톤'이 취미이며 올해 가을 베를린 마라톤 대회 참가를 준비 중." }
  },
];