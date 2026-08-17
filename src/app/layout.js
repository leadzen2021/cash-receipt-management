import localFont from "next/font/local";
import "./globals.scss";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata = {
  title: {
    default: "리드젠 현금영수증 기록부",
    template: "%s | 리드젠 현금영수증 기록부",
  },
  description: "리드젠 학원 현금영수증 처리 및 기록 관리 시스템",

  icons: {
    icon: "/logo-circle.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={pretendard.variable}>{children}</body>
    </html>
  );
}
