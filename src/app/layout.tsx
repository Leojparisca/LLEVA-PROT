import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Keep existing fonts
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { siteConfig } from "@/config/site";
import { AppShell } from "@/components/layout/app-shell"; // Import AppShell
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // Add more metadata as needed, e.g., icons, openGraph
  // icons: {
  //   icon: "/favicon.ico", // Example
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans text-foreground`}
      >
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
