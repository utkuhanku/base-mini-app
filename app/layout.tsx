import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import Header from "./components/Header";
import { AddToFavorites } from "./components/AddToFavorites";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
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
    <RootProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <AddToFavorites />
          <div style={{ paddingTop: '80px' }}>
            {children}
          </div>
        </body>
      </html>
    </RootProvider>
  );
}
