import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Providers } from "@/components/providers";
import { Footer } from "@/components/footer";
import { LocaleHTML } from "@/components/locale-html";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: resolvedLocale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(resolvedLocale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale: resolvedLocale });

  const isRTL = resolvedLocale === 'ar';

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHTML />
      <Providers>
        <div className={`min-h-screen flex flex-col ${isRTL ? "font-playpen-sans-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}

