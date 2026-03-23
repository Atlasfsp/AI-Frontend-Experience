export type { Locale } from './config';
export {
  DEFAULT_LOCALE,
  detectLocaleFromHeader,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from './config';
export type { TranslationKeys } from './messages/en';
export { en } from './messages/en';
export { fr } from './messages/fr';
export { pt } from './messages/pt';
export type { TranslationKey } from './provider';
export { I18nProvider, useLocale, useTranslation } from './provider';
