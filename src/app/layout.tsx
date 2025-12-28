import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Flow Visualizer - 業務プロセス可視化ツール",
  description: "業務フローを可視化し、AIでボトルネックを検出・改善提案を行うDX支援ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
