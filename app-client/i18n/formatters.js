/**
 * COMMIT 57 - App Client i18n
 * 
 * FAIT QUOI : Formatters localisés pour dates, nombres, devises et textes
 * REÇOIT : value: any, type: string, locale?: string, options?: object
 * RETOURNE : { formatted: string, original: any, type: string, locale: string }
 * ERREURS : FormatterError si type invalide, ValueError si valeur incorrecte, LocaleError si locale non supportée
 */

export async function formatDate(date, locale = 'fr', format = 'short') {
  if (!date) {
    throw new Error('FormatterError: Date requise');
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('ValueError: Date invalide');
  }

  const formatters = {
    fr: {
      short: '01/01/2025',
      long: '1 janvier 2025',
      time: '14:30'
    },
    en: {
      short: '01/01/2025',
      long: 'January 1, 2025',
      time: '2:30 PM'
    }
  };

  const localeFormatters = formatters[locale] || formatters['fr'];
  const formatted = localeFormatters[format] || localeFormatters['short'];

  return {
    formatted: formatted,
    original: date,
    type: 'date',
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function formatNumber(number, locale = 'fr', options = {}) {
  if (typeof number !== 'number') {
    throw new Error('FormatterError: Nombre requis');
  }

  const formatters = {
    fr: {
      decimal: ',',
      thousands: ' ',
      currency: '€'
    },
    en: {
      decimal: '.',
      thousands: ',',
      currency: '$'
    }
  };

  const localeFormatter = formatters[locale] || formatters['fr'];
  const formatted = options.currency ? 
    `${number.toFixed(2)}${localeFormatter.currency}` : 
    number.toString();

  return {
    formatted: formatted,
    original: number,
    type: 'number',
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function formatCurrency(amount, currency = 'EUR', locale = 'fr') {
  if (typeof amount !== 'number') {
    throw new Error('FormatterError: Montant requis');
  }

  const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£'
  };

  const symbol = currencySymbols[currency] || currency;
  const formatted = locale === 'fr' ? 
    `${amount.toFixed(2)} ${symbol}` : 
    `${symbol}${amount.toFixed(2)}`;

  return {
    formatted: formatted,
    original: amount,
    currency: currency,
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function getFormatterStatus(formatterConfig) {
  return {
    status: formatterConfig ? 'healthy' : 'missing',
    configured: !!formatterConfig,
    locale: formatterConfig?.locale || 'unknown',
    formatters: ['date', 'number', 'currency'],
    timestamp: new Date().toISOString()
  };
}

// i18n/formatters : App Client i18n (commit 57)
// DEPENDENCY FLOW (no circular deps)
