export type Locale = 'en' | 'fr' | 'pt';

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'pt'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Fran\u00e7ais',
  pt: 'Portugu\u00eas',
};

/**
 * Detect locale from an Accept-Language header string.
 * Returns the best match from SUPPORTED_LOCALES, falling back to DEFAULT_LOCALE.
 */
export function detectLocaleFromHeader(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header into weighted locale tags.
  const entries = acceptLanguage
    .split(',')
    .map((segment) => {
      const [tag, qValue] = segment.trim().split(';q=');
      const quality = qValue !== undefined ? parseFloat(qValue) : 1.0;
      return { tag: tag!.trim().toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const entry of entries) {
    // Exact match
    const exact = SUPPORTED_LOCALES.find((locale) => locale === entry.tag);
    if (exact) {
      return exact;
    }

    // Language-only match (e.g., "pt-BR" -> "pt")
    const langOnly = entry.tag.split('-')[0];
    const partial = SUPPORTED_LOCALES.find((locale) => locale === langOnly);
    if (partial) {
      return partial;
    }
  }

  return DEFAULT_LOCALE;
}
