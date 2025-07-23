/**
 * TESTS COMMIT 59 - App Client Error
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Boundaries
import {
  createErrorBoundary, wrapWithBoundary, handleBoundaryError, getBoundaryStatus
} from '../../app-client/error/boundaries.js';

// Handlers
import {
  registerErrorHandler, handleError, classifyError, getHandlerStatus
} from '../../app-client/error/handlers.js';

// Recovery
import {
  createRecoveryStrategy, executeRecovery, retryOperation, getRecoveryStatus
} from '../../app-client/error/recovery.js';

// Logging
import {
  logError, formatErrorLog, sendErrorReport, getLoggingStatus
} from '../../app-client/error/logging.js';

describe('COMMIT 59 - App Client Error', () => {

  describe('Boundaries', () => {
    test('createErrorBoundary crée boundary', async () => {
      const TestComponent = function() { return '<div>Test</div>'; };
      const result = await createErrorBoundary(TestComponent);
      expect(result.hasError).toBe(false);
      expect(typeof result.boundary).toBe('function');
    });

    test('wrapWithBoundary wrappe composant', async () => {
      const TestComponent = function() { return '<div>Test</div>'; };
      const result = await wrapWithBoundary(TestComponent);
      expect(result.wrapped).toBe(true);
      expect(result.original).toBe('TestComponent');
    });

    test('handleBoundaryError traite erreur', async () => {
      const error = new Error('Test error');
      const result = await handleBoundaryError(error, {});
      expect(result.handled).toBe(true);
      expect(result.recovery.canRecover).toBe(true);
    });

    test('rejette composant invalide', async () => {
      await expect(createErrorBoundary(null)).rejects.toThrow('BoundaryError');
    });
  });

  describe('Handlers', () => {
    test('registerErrorHandler enregistre handler', async () => {
      const handler = () => {};
      const result = await registerErrorHandler('test', handler);
      expect(result.registered).toBe(true);
      expect(result.type).toBe('test');
    });

    test('handleError traite erreur avec classification', async () => {
      const error = new TypeError('Test type error');
      const result = await handleError(error);
      expect(result.handled).toBe(true);
      expect(result.type).toBe('TypeError');
      expect(result.severity).toBe('low');
    });

    test('classifyError classifie erreur réseau', async () => {
      const error = new Error('fetch failed network error');
      const result = await classifyError(error);
      expect(result.classified).toBe(true);
      expect(result.category).toBe('network');
    });
  });

  describe('Recovery', () => {
    test('createRecoveryStrategy crée stratégie retry', async () => {
      const result = await createRecoveryStrategy('retry', { maxAttempts: 5 });
      expect(result.created).toBe(true);
      expect(result.strategy).toBe('retry');
      expect(result.config.maxAttempts).toBe(5);
    });

    test('executeRecovery exécute stratégie', async () => {
      const error = new Error('Test error');
      const strategy = await createRecoveryStrategy('fallback');
      const result = await executeRecovery(error, strategy);
      expect(result.recovered).toBe(true);
      expect(result.success).toBe(true);
    });

    test('retryOperation retry opération', async () => {
      const operation = function testOp() { return 'success'; };
      const result = await retryOperation(operation, { maxAttempts: 2 });
      expect(result.retried).toBe(true);
      expect(result.success).toBe(true);
    });

    test('rejette stratégie inconnue', async () => {
      await expect(createRecoveryStrategy('unknown')).rejects.toThrow('RecoveryError');
    });
  });

  describe('Logging', () => {
    test('logError log erreur avec niveau', async () => {
      const error = new Error('Test logging');
      const result = await logError(error, 'warn');
      expect(result.logged).toBe(true);
      expect(result.level).toBe('warn');
      expect(result.logId).toBeDefined();
    });

    test('formatErrorLog formate en JSON', async () => {
      const error = new Error('Format test');
      const result = await formatErrorLog(error, 'json');
      expect(result.format).toBe('json');
      expect(typeof result.formatted).toBe('string');
    });

    test('sendErrorReport envoie vers destinations', async () => {
      const errorData = { id: 'test', message: 'test error' };
      const result = await sendErrorReport(errorData, ['console', 'localStorage']);
      expect(result.sent).toBe(true);
      expect(result.destinations).toEqual(['console', 'localStorage']);
    });

    test('rejette niveau invalide', async () => {
      const error = new Error('Test');
      await expect(logError(error, 'invalid')).rejects.toThrow('LevelError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Boundaries
      expect(typeof createErrorBoundary).toBe('function');
      expect(typeof wrapWithBoundary).toBe('function');
      expect(typeof handleBoundaryError).toBe('function');
      expect(typeof getBoundaryStatus).toBe('function');

      // Handlers
      expect(typeof registerErrorHandler).toBe('function');
      expect(typeof handleError).toBe('function');
      expect(typeof classifyError).toBe('function');
      expect(typeof getHandlerStatus).toBe('function');

      // Recovery
      expect(typeof createRecoveryStrategy).toBe('function');
      expect(typeof executeRecovery).toBe('function');
      expect(typeof retryOperation).toBe('function');
      expect(typeof getRecoveryStatus).toBe('function');

      // Logging
      expect(typeof logError).toBe('function');
      expect(typeof formatErrorLog).toBe('function');
      expect(typeof sendErrorReport).toBe('function');
      expect(typeof getLoggingStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createErrorBoundary(null)).rejects.toThrow('BoundaryError');
      await expect(registerErrorHandler('')).rejects.toThrow('HandlerError');
      await expect(createRecoveryStrategy('')).rejects.toThrow('RecoveryError');
      await expect(logError(null)).rejects.toThrow('LoggingError');
    });

    test('structure retour avec timestamp', async () => {
      const TestComponent = function() { return '<div>Test</div>'; };
      const boundaryResult = await createErrorBoundary(TestComponent);
      expect(boundaryResult.timestamp).toBeDefined();

      const strategyResult = await createRecoveryStrategy('retry');
      expect(strategyResult.timestamp).toBeDefined();
    });
  });

});
