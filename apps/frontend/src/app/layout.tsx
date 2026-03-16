import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { WishlistDrawer } from "@/components/WishlistDrawer";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import PageTransition from "@/components/PageTransition";

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
  title: "Gocal.co | Premium B2B Commerce",
  description: "Experience the future of B2B commerce with Gocal.co",
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
            <main className="flex-1 flex flex-col">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
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


