import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K12英语课件智能拆解与练习题生成审核系统",
  description: "面向英语教培机构的 AI 课件解析、题目生成与内容质检工作流 Demo"
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
