import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yolo - Liquid Glass Component",
  description: "A beautiful liquid glass effect component",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: 'transparent', backgroundColor: 'transparent' }}>
      <body style={{ 
        background: 'transparent', 
        backgroundColor: 'transparent',
        margin: 0, 
        padding: 0 
      }}>
        {children}
      </body>
    </html>
  );
}
