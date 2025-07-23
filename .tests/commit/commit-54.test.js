/**
 * TESTS COMMIT 54 - App Client Utils
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

import { 
  createFormatter, validateFormatter, updateFormatterConfig, getFormatterStatus 
} from '../../app-client/utils/formatters.js';
import { 
  createValidator, validateData, updateValidatorRules, getValidatorStatus 
} from '../../app-client/utils/validators.js';
import { 
  createHelper, validateHelper, updateHelperConfig, getHelperStatus 
} from '../../app-client/utils/helpers.js';
import { 
  createConstantStore, validateConstant, updateConstant, getConstantStatus, STATES 
} from '../../app-client/utils/constants.js';

describe('COMMIT 54 - App Client Utils', () => {
  
  describe('Formatters', () => {
    test('createFormatter crée formatter basique', async () => {
      const result = await createFormatter('text', { locale: 'fr-FR' });
      
      expect(result.formatter.type).toBe('text');
      expect(result.formatter.config.locale).toBe('fr-FR');
      expect(result.formatter.created).toBe(true);
      expect(result.status).toBe('created');
    });

    test('validateFormatter valide config', async () => {
      const config = { type: 'text', created: true };
      const result = await validateFormatter(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejette type manquant', async () => {
      await expect(createFormatter('')).rejects.toThrow('FormatterError');
    });
  });

  describe('Validators', () => {
    test('createValidator crée validator basique', async () => {
      const result = await createValidator('basic', { required: true });
      
      expect(result.validator.type).toBe('basic');
      expect(result.validator.rules.required).toBe(true);
      expect(result.status).toBe('created');
    });

    test('validateData valide avec règles', async () => {
      const validator = await createValidator('basic', { required: true });
      const result = await validateData('test', validator.validator);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Helpers', () => {
    test('createHelper crée helper basique', async () => {
      const result = await createHelper('generic', { enabled: true });
      
      expect(result.helper.type).toBe('generic');
      expect(result.helper.config.enabled).toBe(true);
      expect(result.status).toBe('created');
    });
  });

  describe('Constants', () => {
    test('createConstantStore crée store', async () => {
      const result = await createConstantStore('test', { key1: 'value1' });
      
      expect(result.store.category).toBe('test');
      expect(result.store.constants.key1).toBe('value1');
      expect(result.status).toBe('created');
    });

    test('STATES export disponible', () => {
      expect(STATES.VOID).toBe('void');
      expect(STATES.ONLINE).toBe('online');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Formatters
      expect(typeof createFormatter).toBe('function');
      expect(typeof validateFormatter).toBe('function'); 
      expect(typeof updateFormatterConfig).toBe('function');
      expect(typeof getFormatterStatus).toBe('function');

      // Validators
      expect(typeof createValidator).toBe('function');
      expect(typeof validateData).toBe('function');
      expect(typeof updateValidatorRules).toBe('function');
      expect(typeof getValidatorStatus).toBe('function');

      // Helpers
      expect(typeof createHelper).toBe('function');
      expect(typeof validateHelper).toBe('function');
      expect(typeof updateHelperConfig).toBe('function');
      expect(typeof getHelperStatus).toBe('function');

      // Constants
      expect(typeof createConstantStore).toBe('function');
      expect(typeof validateConstant).toBe('function');
      expect(typeof updateConstant).toBe('function');
      expect(typeof getConstantStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createFormatter('')).rejects.toThrow('FormatterError:');
      await expect(createValidator('')).rejects.toThrow('ValidatorError:');
      await expect(createHelper('')).rejects.toThrow('HelperError:');
      await expect(createConstantStore('')).rejects.toThrow('ConstantError:');
    });

    test('structures retour cohérentes avec timestamp', async () => {
      const formatter = await createFormatter('text');
      const validator = await createValidator('basic');
      const helper = await createHelper('generic');
      const constants = await createConstantStore('test');

      expect(formatter).toHaveProperty('timestamp');
      expect(validator).toHaveProperty('timestamp');
      expect(helper).toHaveProperty('timestamp');
      expect(constants).toHaveProperty('timestamp');
    });
  });
});
