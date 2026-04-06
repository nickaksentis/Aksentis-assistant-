import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Calendar",
  description: "Family calendar with AI-powered SMS reminders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased overflow-x-hidden">
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">{children}</body>
    </html>
  );
}
