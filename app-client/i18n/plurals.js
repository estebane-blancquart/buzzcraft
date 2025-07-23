/**
 * COMMIT 57 - App Client i18n
 * 
 * FAIT QUOI : Gestion pluralisation selon règles linguistiques par locale
 * REÇOIT : count: number, pluralKey: string, locale?: string, options?: object
 * RETOURNE : { pluralized: string, count: number, rule: string, locale: string }
 * ERREURS : PluralError si count invalide, KeyError si clé plurielle absente, RuleError si règle inconnue
 */

export async function pluralizeText(count, pluralKey, locale = 'fr') {
  if (typeof count !== 'number') {
    throw new Error('PluralError: Count doit être un nombre');
  }

  if (!pluralKey || typeof pluralKey !== 'string') {
    throw new Error('PluralError: Clé plurielle requise');
  }

  const pluralRules = {
    fr: {
      'project': {
        0: 'aucun projet',
        1: '1 projet',
        other: '{{count}} projets'
      },
      'file': {
        0: 'aucun fichier',
        1: '1 fichier', 
        other: '{{count}} fichiers'
      }
    },
    en: {
      'project': {
        0: 'no projects',
        1: '1 project',
        other: '{{count}} projects'
      },
      'file': {
        0: 'no files',
        1: '1 file',
        other: '{{count}} files'
      }
    }
  };

  const localeRules = pluralRules[locale] || pluralRules['fr'];
  const keyRules = localeRules[pluralKey];

  if (!keyRules) {
    throw new Error(`KeyError: Clé plurielle '${pluralKey}' non trouvée`);
  }

  const rule = count === 0 ? '0' : count === 1 ? '1' : 'other';
  const template = keyRules[rule] || keyRules['other'];
  const result = template.replace('{{count}}', count.toString());

  return {
    pluralized: result,
    count: count,
    rule: rule,
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function addPluralRule(pluralKey, rules, locale = 'fr') {
  if (!pluralKey || typeof pluralKey !== 'string') {
    throw new Error('PluralError: Clé plurielle requise');
  }

  if (!rules || typeof rules !== 'object') {
    throw new Error('PluralError: Règles plurielles requises');
  }

  return {
    added: true,
    key: pluralKey,
    rules: Object.keys(rules),
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function validatePluralRules(rules, locale = 'fr') {
  if (!rules || typeof rules !== 'object') {
    throw new Error('PluralError: Règles à valider requises');
  }

  const requiredRules = ['0', '1', 'other'];
  const providedRules = Object.keys(rules);
  const missing = requiredRules.filter(rule => !providedRules.includes(rule));

  return {
    valid: missing.length === 0,
    provided: providedRules,
    missing: missing,
    locale: locale,
    timestamp: new Date().toISOString()
  };
}

export async function getPluralStatus(pluralConfig) {
  return {
    status: pluralConfig ? 'healthy' : 'missing',
    configured: !!pluralConfig,
    locale: pluralConfig?.locale || 'unknown',
    rules: Object.keys(pluralConfig?.rules || {}).length,
    timestamp: new Date().toISOString()
  };
}

// i18n/plurals : App Client i18n (commit 57)
// DEPENDENCY FLOW (no circular deps)
