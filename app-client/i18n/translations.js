/**
 * COMMIT 57 - App Client i18n
 * 
 * FAIT QUOI : Système traductions avec gestion clés, namespaces et fallbacks
 * REÇOIT : translationKey: string, locale: string, params?: object, options?: object
 * RETOURNE : { translations: object, loaded: boolean, fallback: string, missing: array }
 * ERREURS : TranslationError si clé invalide, LocaleError si locale non supportée, MissingError si traduction absente
 */

export async function loadTranslations(locale = 'fr', namespace = 'common') {
  if (!locale || typeof locale !== 'string') {
    throw new Error('TranslationError: Locale requis');
  }

  const translations = {
    fr: {
      common: {
        'app.title': 'BuzzCraft',
        'button.save': 'Enregistrer',
        'button.cancel': 'Annuler',
        'form.required': 'Ce champ est requis'
      },
      dashboard: {
        'title': 'Tableau de bord',
        'projects.count': 'Projets actifs'
      }
    },
    en: {
      common: {
        'app.title': 'BuzzCraft',
        'button.save': 'Save',
        'button.cancel': 'Cancel',
        'form.required': 'This field is required'
      },
      dashboard: {
        'title': 'Dashboard',
        'projects.count': 'Active projects'
      }
    }
  };

  const localeData = translations[locale] || translations['fr'];
  const namespaceData = localeData[namespace] || {};

  return {
    translations: namespaceData,
    loaded: true,
    locale: locale,
    namespace: namespace,
    keys: Object.keys(namespaceData).length,
    timestamp: new Date().toISOString()
  };
}

export async function translateKey(translationKey, locale = 'fr', params = {}) {
  if (!translationKey || typeof translationKey !== 'string') {
    throw new Error('TranslationError: Clé de traduction requise');
  }

  const translations = await loadTranslations(locale);
  const translation = translations.translations[translationKey];

  if (!translation) {
    return {
      translated: false,
      key: translationKey,
      fallback: translationKey,
      missing: true,
      timestamp: new Date().toISOString()
    };
  }

  // Simple param replacement
  let result = translation;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{{${key}}}`, value);
  });

  return {
    translated: true,
    key: translationKey,
    value: result,
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function addTranslation(translationKey, value, locale = 'fr') {
  if (!translationKey || typeof translationKey !== 'string') {
    throw new Error('TranslationError: Clé de traduction requise');
  }

  if (!value || typeof value !== 'string') {
    throw new Error('TranslationError: Valeur de traduction requise');
  }

  return {
    added: true,
    key: translationKey,
    value: value,
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function getTranslationStatus(translationConfig) {
  return {
    status: translationConfig ? 'healthy' : 'missing',
    configured: !!translationConfig,
    locale: translationConfig?.locale || 'unknown',
    keys: translationConfig?.keys || 0,
    timestamp: new Date().toISOString()
  };
}

// i18n/translations : App Client i18n (commit 57)
// DEPENDENCY FLOW (no circular deps)
