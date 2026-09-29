import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
// Variable font with optical sizing, so large headlines get the tighter display cut.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventPulse — Create, sell, and manage events",
  description: "The easiest way to create, sell tickets, and manage attendees for any event.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            theme="system"
            position="bottom-right"
            toastOptions={{ style: { borderRadius: 10, fontFamily: "var(--font-sans)", fontSize: 13 } }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
