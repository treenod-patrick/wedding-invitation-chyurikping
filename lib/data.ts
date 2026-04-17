export const wedding = {
  groom: {
    name: "김신랑",
    nameEn: "Groom",
    father: "김아버지",
    mother: "이어머니",
    phone: "010-0000-0000",
    bank: "국민은행 123-456-789012",
    bankOwner: "김신랑",
  },
  bride: {
    name: "이신부",
    nameEn: "Bride",
    father: "이아버지",
    mother: "박어머니",
    phone: "010-1111-1111",
    bank: "신한은행 110-111-222333",
    bankOwner: "이신부",
  },
  date: new Date("2026-10-10T13:00:00+09:00"),
  venue: {
    name: "그랜드 볼룸 웨딩홀",
    address: "서울특별시 강남구 테헤란로 123, 5층",
    detail: "5층 그랜드홀",
    tel: "02-0000-0000",
    lat: 37.5065,
    lng: 127.0536,
  },
  greeting: {
    title: "결혼합니다",
    body: "서로 다른 두 사람이 만나\n같은 곳을 바라보게 되었습니다.\n저희 두 사람의 새로운 시작을\n함께 축복해 주시면 더없는 기쁨이겠습니다.",
  },
  gallery: [
    "https://picsum.photos/seed/w1/800/1000",
    "https://picsum.photos/seed/w2/800/1000",
    "https://picsum.photos/seed/w3/800/1000",
    "https://picsum.photos/seed/w4/800/1000",
    "https://picsum.photos/seed/w5/800/1000",
    "https://picsum.photos/seed/w6/800/1000",
  ],
};

export const fonts = [
  { id: "myeongjo", label: "나눔명조", cls: "font-myeongjo", cat: "명조" },
  { id: "gowun-batang", label: "고운바탕", cls: "font-gowun-batang", cat: "명조" },
  { id: "noto-serif", label: "본명조", cls: "font-noto-serif", cat: "명조" },
  { id: "pretendard", label: "프리텐다드", cls: "font-pretendard", cat: "고딕" },
  { id: "noto-sans", label: "본고딕", cls: "font-noto-sans", cat: "고딕" },
  { id: "gmarket", label: "지마켓산스", cls: "font-gmarket", cat: "고딕" },
  { id: "gowun-dodum", label: "고운돋움", cls: "font-gowun-dodum", cat: "필기" },
  { id: "nanum-pen", label: "나눔펜", cls: "font-nanum-pen", cat: "필기" },
  { id: "cute", label: "큐트폰트", cls: "font-cute", cat: "필기" },
  { id: "gaegu", label: "개구", cls: "font-gaegu", cat: "장식" },
  { id: "east-sea", label: "이스트씨", cls: "font-east-sea", cat: "장식" },
  { id: "single-day", label: "싱글데이", cls: "font-single-day", cat: "장식" },
] as const;

export type FontId = typeof fonts[number]["id"];
