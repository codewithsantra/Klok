import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Single typeface — Inter, used for both body and (tightly-tracked) headlines.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = "https://klok.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Klok — Plan Your Day. Own Your Reality.",
    template: "%s · Klok",
  },
  description:
    "Klok is the honest daily tracker. Plan your day in time blocks, track what actually happened, and reflect on the gap — without the guilt. Free to start.",
  keywords: [
    "daily planner",
    "time blocking",
    "productivity tracker",
    "habit tracker",
    "daily log",
    "time management app",
  ],
  authors: [{ name: "Klok" }],
  creator: "Klok",
  applicationName: "Klok",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Klok",
    title: "Klok — Plan Your Day. Own Your Reality.",
    description:
      "The honest daily tracker. Plan in time blocks, track reality, reflect without guilt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klok — Plan Your Day. Own Your Reality.",
    description:
      "The honest daily tracker. Plan in time blocks, track reality, reflect without guilt.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
        <head>
          {/* Default to light mode; user can opt in to dark via toggle. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('klok-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-full antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
