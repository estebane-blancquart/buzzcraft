/**
 * TESTS COMMIT 57 - App Client i18n
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Translations
import {
  loadTranslations, translateKey, addTranslation, getTranslationStatus
} from '../../app-client/i18n/translations.js';

// Locales
import {
  detectUserLocale, configureLocale, switchLocale, getLocaleStatus
} from '../../app-client/i18n/locales.js';

// Formatters
import {
  formatDate, formatNumber, formatCurrency, getFormatterStatus
} from '../../app-client/i18n/formatters.js';

// Plurals
import {
  pluralizeText, addPluralRule, validatePluralRules, getPluralStatus
} from '../../app-client/i18n/plurals.js';

describe('COMMIT 57 - App Client i18n', () => {

  describe('Translations', () => {
    test('loadTranslations charge locale par défaut', async () => {
      const result = await loadTranslations();
      expect(result.loaded).toBe(true);
      expect(result.locale).toBe('fr');
      expect(result.keys).toBeGreaterThan(0);
    });

    test('translateKey traduit clé existante', async () => {
      const result = await translateKey('button.save');
      expect(result.translated).toBe(true);
      expect(result.value).toBe('Enregistrer');
    });

    test('translateKey retourne fallback si manquante', async () => {
      const result = await translateKey('missing.key');
      expect(result.translated).toBe(false);
      expect(result.missing).toBe(true);
    });

    test('rejette clé vide', async () => {
      await expect(translateKey('')).rejects.toThrow('TranslationError');
    });
  });

  describe('Locales', () => {
    test('detectUserLocale détecte locale', async () => {
      const result = await detectUserLocale();
      expect(result.detected).toBe('fr');
      expect(result.supported).toContain('fr');
    });

    test('configureLocale configure locale', async () => {
      const result = await configureLocale('en');
      expect(result.configured).toBe(true);
      expect(result.code).toBe('en');
    });

    test('switchLocale change locale', async () => {
      const result = await switchLocale('en');
      expect(result.switched).toBe(true);
      expect(result.to).toBe('en');
    });
  });

  describe('Formatters', () => {
    test('formatDate formate date', async () => {
      const result = await formatDate('2025-01-01');
      expect(result.formatted).toBeDefined();
      expect(result.type).toBe('date');
    });

    test('formatNumber formate nombre', async () => {
      const result = await formatNumber(1234.56);
      expect(result.formatted).toBeDefined();
      expect(result.type).toBe('number');
    });

    test('formatCurrency formate devise', async () => {
      const result = await formatCurrency(99.99);
      expect(result.formatted).toContain('€');
    });
  });

  describe('Plurals', () => {
    test('pluralizeText pluralise selon count', async () => {
      const result = await pluralizeText(0, 'project');
      expect(result.pluralized).toBe('aucun projet');
      expect(result.rule).toBe('0');
    });

    test('pluralizeText avec count > 1', async () => {
      const result = await pluralizeText(5, 'project');
      expect(result.pluralized).toBe('5 projets');
      expect(result.rule).toBe('other');
    });

    test('validatePluralRules valide règles', async () => {
      const rules = { '0': 'zero', '1': 'one', 'other': 'many' };
      const result = await validatePluralRules(rules);
      expect(result.valid).toBe(true);
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Translations
      expect(typeof loadTranslations).toBe('function');
      expect(typeof translateKey).toBe('function');
      expect(typeof addTranslation).toBe('function');
      expect(typeof getTranslationStatus).toBe('function');

      // Locales
      expect(typeof detectUserLocale).toBe('function');
      expect(typeof configureLocale).toBe('function');
      expect(typeof switchLocale).toBe('function');
      expect(typeof getLocaleStatus).toBe('function');

      // Formatters
      expect(typeof formatDate).toBe('function');
      expect(typeof formatNumber).toBe('function');
      expect(typeof formatCurrency).toBe('function');
      expect(typeof getFormatterStatus).toBe('function');

      // Plurals
      expect(typeof pluralizeText).toBe('function');
      expect(typeof addPluralRule).toBe('function');
      expect(typeof validatePluralRules).toBe('function');
      expect(typeof getPluralStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(loadTranslations('')).rejects.toThrow('TranslationError');
      await expect(detectUserLocale('')).rejects.toThrow('LocaleError');
      await expect(formatDate(null)).rejects.toThrow('FormatterError');
      await expect(pluralizeText('invalid', 'key')).rejects.toThrow('PluralError');
    });

    test('structure retour avec timestamp', async () => {
      const translationResult = await loadTranslations();
      expect(translationResult.timestamp).toBeDefined();

      const localeResult = await detectUserLocale();
      expect(localeResult.timestamp).toBeDefined();
    });
  });

});
