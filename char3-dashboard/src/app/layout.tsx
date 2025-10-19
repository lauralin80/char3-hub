import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Char3 Dashboard",
  description: "Team collaboration dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <ClientProviders>
          <AppLayout>
            {children}
          </AppLayout>
        </ClientProviders>
      </body>
    </html>
  );
}