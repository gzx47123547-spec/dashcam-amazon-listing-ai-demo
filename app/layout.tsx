import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "车载记录仪 Amazon Listing AI 优化助手",
  description: "DashCam Amazon Listing AI Workflow Demo"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
