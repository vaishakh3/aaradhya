import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aaradhya.co.in"),
  title: "Aaradhya — Where Elegance Becomes an Identity",
  description: "Aaradhya celebrates confidence, grace and individuality through timeless Indian womenswear.",
  icons: {
    icon: "/brand/aaradhya-stamp.svg",
    shortcut: "/brand/aaradhya-stamp.svg",
  },
  openGraph: {
    title: "Aaradhya — Where Elegance Becomes an Identity",
    description: "Timeless Indian womenswear, shaped by heritage and made for the woman becoming entirely her own.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Aaradhya women's clothing brand" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aaradhya — Where Elegance Becomes an Identity",
    description: "Timeless Indian womenswear, shaped by heritage and made for the woman becoming entirely her own.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
