import { locales, type Locale } from '@/i18n';

export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path already starts with a locale, remove it
  const pathWithoutLocale = locales.reduce((acc, loc) => {
    if (acc.startsWith(`${loc}/`)) {
      return acc.slice(loc.length + 1);
    }
    return acc;
  }, cleanPath);
  
  return `/${locale}${pathWithoutLocale.startsWith('/') ? '' : '/'}${pathWithoutLocale}`;
}

export function getPathWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, '') || '/';
    }
  }
  return pathname;
}

