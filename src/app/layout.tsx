import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Akash Gohil — Product Designer",
  description:
    "Product Designer building intuitive B2B SaaS and computer vision platforms. Design systems, AI-ready codebases, and the rare overlap of design and code.",
  authors: [{ name: "Akash Gohil" }],
  creator: "Akash Gohil",
  metadataBase: new URL("https://akashgohil.com"),
  openGraph: {
    title: "Akash Gohil — Product Designer",
    description:
      "Product Designer building intuitive B2B SaaS and computer vision platforms.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akash Gohil — Product Designer",
    description:
      "Product Designer building intuitive B2B SaaS and computer vision platforms.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ebe8e1",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
