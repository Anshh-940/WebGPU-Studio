import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

// AUTH DISABLED: Auth0Provider/session lookup removed so the app renders without
// any Auth0 configuration. Original wiring preserved in comments below.
// import { Auth0Provider } from "@auth0/nextjs-auth0/client";
// import { auth0 } from "@/lib/auth0";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebGPU Studio - Local-First AI Playground",
  description: "WebGPU Studio: your sleek local-first AI copilot for chat, vision, embeddings, and structured output.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const session = await auth0.getSession();
  // const user = session?.user ?? undefined;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* <Auth0Provider user={user}> */}
        <ThemeProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        {/* </Auth0Provider> */}
      </body>
    </html>
  );
}
