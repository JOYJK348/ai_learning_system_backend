import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/styles/base/globals.css";
import QueryProvider from "@/providers/QueryProvider";
// import ReduxProvider from "@/providers/ReduxProvider"; // To be created if needed
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Animated Learning Portal",
  description: "Next-generation animated learning platform for kids and students.",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={outfit.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <DataProvider>
                {children}
              </DataProvider>
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
