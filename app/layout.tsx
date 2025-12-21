// Vercel deployment fix
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import Header from "./components/Header";
import { AddToFavorites } from "./components/AddToFavorites";
import "./globals.css";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Identity 🔵",
    description: "Your onchain identity and event history.",
    openGraph: {
      title: "Identity 🔵",
      description: "Your onchain identity and event history.",
      images: [minikitConfig.frame.imageUrl],
    },
    appleWebApp: {
      title: "Identity",
      statusBarStyle: "black-translucent",
      capable: true,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: minikitConfig.frame.imageUrl,
        button: minikitConfig.frame.button,
      }),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider>
          <RootProvider>
            <Header />
            <AddToFavorites />
            <div style={{ paddingTop: '80px' }}>
              {children}
            </div>
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
