/**
 * Test COMMIT 8 - System Validation
 */

import { validateSchema } from '../../app-server/systems/validation/schemas.js';
import { checkBusinessRules } from '../../app-server/systems/validation/rules.js';
import { sanitizeData } from '../../app-server/systems/validation/sanitizer.js';

describe('COMMIT 8 - System Validation', () => {
  
  describe('validateSchema', () => {
    test('valid true pour schema projet avec champs requis', () => {
      const data = { name: 'test-project', id: 'proj-123' };
      const result = validateSchema(data, 'project');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('valid false pour schema projet sans champs requis', () => {
      const data = { name: 'test-project' }; // manque 'id'
      const result = validateSchema(data, 'project');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('structure');
    });

    test('valid false pour schema inexistant', () => {
      const data = { test: 'data' };
      const result = validateSchema(data, 'unknown-schema');
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('schemaType');
    });

    test('valid true pour schema user avec email et id', () => {
      const data = { id: 'user-123', email: 'test@example.com' };
      const result = validateSchema(data, 'user');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('checkBusinessRules', () => {
    test('valid true pour nom projet valide', () => {
      const data = { name: 'valid-project-name' };
      const result = checkBusinessRules(data, 'project-naming');
      
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    test('valid false pour nom projet trop court', () => {
      const data = { name: 'ab' }; // < 3 caractères
      const result = checkBusinessRules(data, 'project-naming');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe('min-length');
      expect(result.score).toBe(75);
    });

    test('valid false pour ruleset inexistant', () => {
      const data = { name: 'test' };
      const result = checkBusinessRules(data, 'unknown-rules');
      
      expect(result.valid).toBe(false);
      expect(result.violations[0].rule).toBe('unknown-rules');
      expect(result.score).toBe(0);
    });

    test('valid true avec exception', () => {
      const data = { name: 'ab' };
      const result = checkBusinessRules(data, 'project-naming', {}, ['naming']);
      
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('sanitizeData', () => {
    test('remove empty values par défaut', () => {
      const data = { name: 'test', empty: '', nullValue: null, valid: 'ok' };
      const result = sanitizeData(data);
      
      expect(result.sanitized).toEqual({ name: 'test', valid: 'ok' });
      expect(result.removed).toContain('empty');
      expect(result.removed).toContain('nullValue');
      expect(result.safe).toBe(true);
    });

    test('trim strings par défaut', () => {
      const data = { name: '  test  ', description: 'normal' };
      const result = sanitizeData(data);
      
      expect(result.sanitized.name).toBe('test');
      expect(result.sanitized.description).toBe('normal');
      expect(result.safe).toBe(true);
    });

    test('remove scripts avec warning', () => {
      const data = { content: 'Hello <script>alert("hack")</script> World' };
      const result = sanitizeData(data);
      
      expect(result.sanitized.content).toBe('Hello  World');
      expect(result.warnings).toContain('Removed script from content');
      expect(result.safe).toBe(false);
    });

    test('règles personnalisées', () => {
      const data = { name: '', value: 'test' };
      const rules = { removeEmpty: false };
      const result = sanitizeData(data, rules);
      
      expect(result.sanitized).toHaveProperty('name');
      expect(result.removed).toHaveLength(0);
    });
  });

  describe('Validation entrées invalides', () => {
    test('toutes les fonctions rejettent les entrées invalides', () => {
      expect(() => validateSchema(null, 'project')).toThrow('ValidationError');
      expect(() => validateSchema({}, '')).toThrow('ValidationError');
      
      expect(() => checkBusinessRules(null, 'rules')).toThrow('ValidationError');
      expect(() => checkBusinessRules({}, '')).toThrow('ValidationError');
      
      expect(() => sanitizeData(null)).toThrow('ValidationError');
      expect(() => sanitizeData({}, 'invalid')).toThrow('ValidationError');
    });
  });

});