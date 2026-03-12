import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getCurrentLocale, getMessages } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiderMeter",
  description:
    "Delivery rider analytics for profitable shifts, operational insight, and reliable cost tracking.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
