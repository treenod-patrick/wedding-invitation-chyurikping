export const wedding = {
  groom: {
    name: "채종현",
    nameEn: "Jonghyun Chae",
    father: "채승우",
    mother: "김미경",
    phone: "010-0000-0000",
    bank: "국민은행 123-456-789012",
    bankOwner: "채종현",
  },
  bride: {
    name: "최수빈",
    nameEn: "Subin Choi",
    father: "최원영",
    mother: "김영미",
    phone: "010-1111-1111",
    bank: "신한은행 110-111-222333",
    bankOwner: "최수빈",
  },
  date: new Date("2026-11-15T11:00:00+09:00"),
  venue: {
    name: "테라리움 서울",
    address: "서울특별시 노원구 노원로 247 서울온천 7~8층",
    addressJibun: "서울 노원구 하계동 251-7",
    detail: "7~8층",
    tel: "02-6316-7700",
    lat: 37.6372,
    lng: 127.0694,
    naverMapUrl: "https://map.naver.com/p/search/%ED%85%8C%EB%9D%BC%EB%A6%AC%EC%9B%80%20%EC%84%9C%EC%9A%B8/place/1618264201?c=15.00,0,0,0,dh&placePath=/home",
  },
  greeting: {
    title: "결혼합니다",
    body: "서로의 계절을 함께 걸으며\n같은 풍경을 바라보게 되었습니다.\n\n작은 시작 위에\n귀한 발걸음 더해 주시면\n오래도록 따뜻한 기억으로 간직하겠습니다.",
  },
  transport: {
    subway: [
      { line: "7호선", station: "하계역", exit: "2번 출구", walk: "도보 약 7분" },
    ],
    parking: {
      capacity: "건물 내 4개 주차장 운영 (약 700대 규모)",
      time: "결혼식 하객 무료 주차 안내 (식장 안내 데스크에서 확인)",
      tip: "주말 주변 정체가 있을 수 있어, 가급적 대중교통 이용을 부탁드립니다.",
      detail: "만차 시 인근 대진고등학교 보조 주차장 이용 가능",
    },
    bus: "노원구청·하계역 정류장 환승 후 도보 5분",
    shuttle: "하계역 ↔ 식장 간 단거리, 별도 셔틀 미운영",
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
