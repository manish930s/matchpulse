import type { Metadata, Viewport } from "next";
import "@fontsource/red-hat-text/400.css";
import "@fontsource/red-hat-text/500.css";
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchPulse 🏏 | Live Cricket AI Explainer — Ab Kya Hoga?",
  description: "Answers 'Ab kya hoga?' for live cricket matches in under 5 seconds. Transform complex cricket math into plain Hinglish/English shareable cards.",
  keywords: ["cricket", "match explainer", "live score", "ab kya hoga", "cricket ai", "dream11"],
  authors: [{ name: "MatchPulse Team" }],
  openGraph: {
    title: "MatchPulse 🏏 | Live Cricket AI Explainer",
    description: "Instant plain Hinglish & English explanations for live cricket chases and playoff scenarios.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fef5e4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-mp-paper text-mp-ink antialiased selection:bg-mp-red/20 selection:text-mp-ink"
      >
        {children}
      </body>
    </html>
  );
}
