import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 결혼합니다 | Wedding Invitation",
  description: "소중한 분들을 결혼식에 초대합니다.",
  openGraph: {
    title: "우리 결혼합니다",
    description: "소중한 분들을 결혼식에 초대합니다.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f8f4ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@400;500;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Gowun+Dodum&family=Nanum+Pen+Script&family=Cute+Font&family=Gaegu:wght@400;700&family=East+Sea+Dokdo&family=Single+Day&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
          rel="stylesheet"
        />
        <link
          href="https://hangeul.pstatic.net/hangeul_static/css/gmarket-sans.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
