import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { WishlistDrawer } from "@/components/WishlistDrawer";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vanij.co | Premium B2B Commerce",
  description: "Experience the future of B2B commerce with Vanij.co",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${playfair.variable} antialiased bg-luxury-cream text-luxury-black font-sans`}
      >
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WishlistDrawer />
            <AuthModal />
            <LoginRequiredModal />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}


