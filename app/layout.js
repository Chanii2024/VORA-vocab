import { Playfair_Display, Inter, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "VORA | Elevate Your Lexicon",
  description: "A premium, editorial-style vocabulary learning platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${outfit.variable}`}>
      <body className="antialiased bg-[#FBF9F7] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
