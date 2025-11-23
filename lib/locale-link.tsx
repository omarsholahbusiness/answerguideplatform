"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getLocalizedPath } from "@/lib/locale-utils";
import { Locale } from "@/i18n";

interface LocaleLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const LocaleLink = ({ href, children, ...props }: LocaleLinkProps) => {
  const params = useParams();
  const locale = (params?.locale as Locale) || "ar";
  const localizedHref = getLocalizedPath(href, locale);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
};

