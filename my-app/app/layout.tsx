import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import CustomCursor from "@/components/CustomCursor";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1jour1film",
  description: "Soft pop neo-brutalist Next.js starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} bg-background text-ink antialiased`}
      >
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
