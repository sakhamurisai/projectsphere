import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://projectsphere.io";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ProjectSphere — Project Management for Teams",
    template: "%s | ProjectSphere",
  },
  description:
    "ProjectSphere is a modern project management tool for high-performing teams. Kanban boards, sprint tracking, real-time collaboration, and more.",
  keywords: [
    "project management",
    "kanban board",
    "team collaboration",
    "sprint planning",
    "task tracking",
    "agile",
    "projectsphere",
  ],
  authors: [{ name: "ProjectSphere" }],
  creator: "ProjectSphere",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "ProjectSphere",
    title: "ProjectSphere — Project Management for Teams",
    description:
      "Kanban boards, sprint tracking, real-time collaboration, and more — all in one place.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ProjectSphere" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectSphere — Project Management for Teams",
    description: "Kanban boards, sprint tracking, and real-time collaboration.",
    images: ["/og-image.png"],
    creator: "@projectsphere",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
