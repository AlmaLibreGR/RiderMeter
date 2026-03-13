import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getCurrentLocale, getMessages } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiderMeter",
  description:
    "Delivery rider analytics for profitable shifts, operational insight, and reliable cost tracking.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ef5a29",
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
