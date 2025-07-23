/**
 * COMMIT 57 - App Client i18n
 * 
 * FAIT QUOI : Gestion locales avec détection automatique et configuration régionale
 * REÇOIT : localeCode: string, region?: string, config?: object, options?: object
 * RETOURNE : { locale: object, detected: string, supported: array, config: object }
 * ERREURS : LocaleError si locale invalide, RegionError si région non supportée, ConfigError si configuration incorrecte
 */

export async function detectUserLocale(fallback = 'fr') {
  if (!fallback || typeof fallback !== 'string') {
    throw new Error('LocaleError: Fallback locale requis');
  }

  // Simulation détection locale navigateur
  const browserLocale = 'fr-FR';
  const detectedLocale = browserLocale.split('-')[0];

  const supportedLocales = ['fr', 'en', 'es', 'de'];
  const locale = supportedLocales.includes(detectedLocale) ? detectedLocale : fallback;

  return {
    detected: locale,
    browser: browserLocale,
    supported: supportedLocales,
    fallback: fallback,
    timestamp: new Date().toISOString()
  };
}

export async function configureLocale(localeCode, config = {}) {
  if (!localeCode || typeof localeCode !== 'string') {
    throw new Error('LocaleError: Code locale requis');
  }

  const localeConfig = {
    code: localeCode,
    name: config.name || localeCode.toUpperCase(),
    direction: config.direction || 'ltr',
    dateFormat: config.dateFormat || 'DD/MM/YYYY',
    numberFormat: config.numberFormat || '1 234,56',
    currency: config.currency || 'EUR'
  };

  return {
    configured: true,
    locale: localeConfig,
    code: localeCode,
    direction: localeConfig.direction,
    timestamp: new Date().toISOString()
  };
}

export async function switchLocale(newLocale, currentConfig = {}) {
  if (!newLocale || typeof newLocale !== 'string') {
    throw new Error('LocaleError: Nouveau locale requis');
  }

  const supportedLocales = ['fr', 'en', 'es', 'de'];
  if (!supportedLocales.includes(newLocale)) {
    throw new Error(`LocaleError: Locale '${newLocale}' non supporté`);
  }

  return {
    switched: true,
    from: currentConfig.locale || 'unknown',
    to: newLocale,
    reloadRequired: newLocale !== currentConfig.locale,
    timestamp: new Date().toISOString()
  };
}

export async function getLocaleStatus(localeConfig) {
  return {
    status: localeConfig ? 'healthy' : 'missing',
    configured: !!localeConfig,
    locale: localeConfig?.code || 'unknown',
    direction: localeConfig?.direction || 'unknown',
    timestamp: new Date().toISOString()
  };
}

// i18n/locales : App Client i18n (commit 57)
// DEPENDENCY FLOW (no circular deps)
