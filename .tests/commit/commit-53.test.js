/**
 * TESTS COMMIT 53 - App Client Hooks
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

import {
  createStateHook, validateStateHook, updateStateHookConfig, getStateHookStatus
} from '../../app-client/hooks/state.js';
import {
  createEffectHook, validateEffectHook, updateEffectDeps, getEffectHookStatus
} from '../../app-client/hooks/effects.js';
import {
  createContextHook, validateContextHook, updateContextOptimization, getContextHookStatus
} from '../../app-client/hooks/context.js';
import {
  createPerformanceHook, validatePerformanceHook, updatePerformanceThresholds, getPerformanceHookStatus
} from '../../app-client/hooks/performance.js';

describe('COMMIT 53 - App Client Hooks', () => {
  
  describe('State Hooks', () => {
    test('createStateHook crée hook basique', async () => {
      const result = await createStateHook({ count: 0 });
      expect(result.initialState).toEqual({ count: 0 });
      expect(result.created).toBe(true);
      expect(typeof result.hook).toBe('function');
    });

    test('validateStateHook valide config', async () => {
      const config = await createStateHook('test');
      const result = await validateStateHook(config);
      expect(result.valid).toBe(true);
    });

    test('rejette state undefined', async () => {
      await expect(createStateHook(undefined)).rejects.toThrow('StateError');
    });
  });

  describe('Effect Hooks', () => {
    test('createEffectHook crée hook basique', async () => {
      const effect = () => {};
      const result = await createEffectHook(effect, ['dep1']);
      expect(result.effect).toBe(effect);
      expect(result.deps).toEqual(['dep1']);
      expect(result.created).toBe(true);
    });

    test('rejette effect non-function', async () => {
      await expect(createEffectHook('not-function')).rejects.toThrow('EffectError');
    });
  });

  describe('Context Hooks', () => {
    test('createContextHook crée hook basique', async () => {
      const config = { theme: 'dark', user: null };
      const result = await createContextHook(config);
      expect(result.contexts).toEqual(config);
      expect(result.created).toBe(true);
    });

    test('rejette config non-object', async () => {
      await expect(createContextHook(null)).rejects.toThrow('ContextError');
    });
  });

  describe('Performance Hooks', () => {
    test('createPerformanceHook crée hook basique', async () => {
      const result = await createPerformanceHook(['render', 'paint']);
      expect(result.metrics).toEqual(['render', 'paint']);
      expect(result.created).toBe(true);
    });

    test('rejette metrics non-array', async () => {
      await expect(createPerformanceHook('not-array')).rejects.toThrow('PerformanceError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // State
      expect(typeof createStateHook).toBe('function');
      expect(typeof validateStateHook).toBe('function');
      expect(typeof updateStateHookConfig).toBe('function');
      expect(typeof getStateHookStatus).toBe('function');

      // Effects
      expect(typeof createEffectHook).toBe('function');
      expect(typeof validateEffectHook).toBe('function');
      expect(typeof updateEffectDeps).toBe('function');
      expect(typeof getEffectHookStatus).toBe('function');

      // Context
      expect(typeof createContextHook).toBe('function');
      expect(typeof validateContextHook).toBe('function');
      expect(typeof updateContextOptimization).toBe('function');
      expect(typeof getContextHookStatus).toBe('function');

      // Performance
      expect(typeof createPerformanceHook).toBe('function');
      expect(typeof validatePerformanceHook).toBe('function');
      expect(typeof updatePerformanceThresholds).toBe('function');
      expect(typeof getPerformanceHookStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createStateHook(undefined)).rejects.toThrow('StateError:');
      await expect(createEffectHook('invalid')).rejects.toThrow('EffectError:');
      await expect(createContextHook(null)).rejects.toThrow('ContextError:');
      await expect(createPerformanceHook('invalid')).rejects.toThrow('PerformanceError:');
    });

    test('structures retour cohérentes avec timestamp', async () => {
      const state = await createStateHook({ test: 1 });
      const effect = await createEffectHook(() => {});
      const context = await createContextHook({ theme: 'dark' });
      const performance = await createPerformanceHook(['render']);

      expect(state).toHaveProperty('timestamp');
      expect(effect).toHaveProperty('timestamp');
      expect(context).toHaveProperty('timestamp');
      expect(performance).toHaveProperty('timestamp');
    });
  });
});
