import { TEMPLATES, PROJECT_ID_PATTERN, VALIDATION_LIMITS, ERROR_MESSAGES } from '../app-api/config/constants.js';

/*
 * FAIT QUOI : Tests unitaires des constantes API
 * REÇOIT : Rien (tests)
 * RETOURNE : Validation cohérence des constantes
 * ERREURS : Assertions qui échouent si constantes incohérentes
 */

describe('API constants', () => {
  
  describe('TEMPLATES', () => {
    test('contient basic et test-button', () => {
      expect(TEMPLATES).toContain('basic');
      expect(TEMPLATES).toContain('test-button');
      expect(Array.isArray(TEMPLATES)).toBe(true);
    });

    test('tous les templates sont des strings', () => {
      TEMPLATES.forEach(template => {
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
      });
    });
  });

  describe('PROJECT_ID_PATTERN', () => {
    test('accepte IDs valides', () => {
      expect(PROJECT_ID_PATTERN.test('test-project')).toBe(true);
      expect(PROJECT_ID_PATTERN.test('project123')).toBe(true);
      expect(PROJECT_ID_PATTERN.test('my-app-2024')).toBe(true);
    });

    test('rejette IDs invalides', () => {
      expect(PROJECT_ID_PATTERN.test('Test-Project')).toBe(false); // Majuscules
      expect(PROJECT_ID_PATTERN.test('test_project')).toBe(false); // Underscore
      expect(PROJECT_ID_PATTERN.test('test project')).toBe(false); // Espaces
      expect(PROJECT_ID_PATTERN.test('test.project')).toBe(false); // Points
    });
  });

  describe('VALIDATION_LIMITS', () => {
    test('limites cohérentes', () => {
      expect(VALIDATION_LIMITS.PROJECT_ID_MIN_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH).toBeGreaterThan(0);
      expect(typeof VALIDATION_LIMITS.PROJECT_ID_MIN_LENGTH).toBe('number');
      expect(typeof VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH).toBe('number');
    });
  });

  describe('ERROR_MESSAGES', () => {
    test('tous les messages sont des strings', () => {
      const requiredMessages = [
        'PROJECT_ID_REQUIRED',
        'PROJECT_ID_INVALID', 
        'CONFIG_REQUIRED',
        'CONFIG_NAME_REQUIRED',
        'TEMPLATE_INVALID'
      ];

      requiredMessages.forEach(key => {
        expect(typeof ERROR_MESSAGES[key]).toBe('string');
        expect(ERROR_MESSAGES[key].length).toBeGreaterThan(0);
      });
    });

    test('template error contient liste des templates', () => {
      expect(ERROR_MESSAGES.TEMPLATE_INVALID).toContain('basic');
      expect(ERROR_MESSAGES.TEMPLATE_INVALID).toContain('test-button');
    });
  });
});