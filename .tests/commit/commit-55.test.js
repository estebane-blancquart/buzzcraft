/**
 * TESTS COMMIT 55 - App Client Services
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

import { 
  createApiClient, validateApiClient, updateApiClientConfig, getApiClientStatus 
} from '../../app-client/services/api-client.js';
import { 
  createStorage, validateStorage, updateStorageConfig, getStorageStatus 
} from '../../app-client/services/storage.js';
import { 
  createCache, validateCache, updateCacheConfig, getCacheStatus 
} from '../../app-client/services/cache.js';
import { 
  createSync, validateSync, updateSyncConfig, getSyncStatus 
} from '../../app-client/services/sync.js';

describe('COMMIT 55 - App Client Services', () => {
  
  describe('Api Client', () => {
    test('createApiClient crée client basique', async () => {
      const result = await createApiClient('http://localhost:3000/api', { timeout: 5000 });
      
      expect(result.client.baseUrl).toBe('http://localhost:3000/api');
      expect(result.client.config.timeout).toBe(5000);
      expect(result.client.created).toBe(true);
      expect(result.status).toBe('created');
    });

    test('validateApiClient valide config', async () => {
      const config = { baseUrl: 'http://localhost:3000/api', created: true };
      const result = await validateApiClient(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejette URL manquante', async () => {
      await expect(createApiClient('')).rejects.toThrow('ApiClientError');
    });
  });

  describe('Storage', () => {
    test('createStorage crée stockage basique', async () => {
      const result = await createStorage('memory', { namespace: 'test' });
      
      expect(result.storage.type).toBe('memory');
      expect(result.storage.config.namespace).toBe('test');
      expect(result.status).toBe('created');
    });

    test('rejette type invalide', async () => {
      await expect(createStorage('invalid')).rejects.toThrow('StorageError');
    });
  });

  describe('Cache', () => {
    test('createCache crée cache basique', async () => {
      const result = await createCache('lru', { maxSize: 500 });
      
      expect(result.cache.strategy).toBe('lru');
      expect(result.cache.config.maxSize).toBe(500);
      expect(result.status).toBe('created');
    });

    test('rejette stratégie invalide', async () => {
      await expect(createCache('invalid')).rejects.toThrow('CacheError');
    });
  });

  describe('Sync', () => {
    test('createSync crée sync basique', async () => {
      const result = await createSync('auto', { interval: 60000 });
      
      expect(result.sync.mode).toBe('auto');
      expect(result.sync.config.interval).toBe(60000);
      expect(result.status).toBe('created');
    });

    test('rejette mode invalide', async () => {
      await expect(createSync('invalid')).rejects.toThrow('SyncError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Api Client
      expect(typeof createApiClient).toBe('function');
      expect(typeof validateApiClient).toBe('function'); 
      expect(typeof updateApiClientConfig).toBe('function');
      expect(typeof getApiClientStatus).toBe('function');

      // Storage
      expect(typeof createStorage).toBe('function');
      expect(typeof validateStorage).toBe('function');
      expect(typeof updateStorageConfig).toBe('function');
      expect(typeof getStorageStatus).toBe('function');

      // Cache
      expect(typeof createCache).toBe('function');
      expect(typeof validateCache).toBe('function');
      expect(typeof updateCacheConfig).toBe('function');
      expect(typeof getCacheStatus).toBe('function');

      // Sync
      expect(typeof createSync).toBe('function');
      expect(typeof validateSync).toBe('function');
      expect(typeof updateSyncConfig).toBe('function');
      expect(typeof getSyncStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createApiClient('')).rejects.toThrow('ApiClientError:');
      await expect(createStorage('')).rejects.toThrow('StorageError:');
      await expect(createCache('')).rejects.toThrow('CacheError:');
      await expect(createSync('')).rejects.toThrow('SyncError:');
    });

    test('structures retour cohérentes avec timestamp', async () => {
      const apiClient = await createApiClient('http://localhost:3000/api');
      const storage = await createStorage('memory');
      const cache = await createCache('lru');
      const sync = await createSync('manual');

      expect(apiClient).toHaveProperty('timestamp');
      expect(storage).toHaveProperty('timestamp');
      expect(cache).toHaveProperty('timestamp');
      expect(sync).toHaveProperty('timestamp');
    });

    test('intégration services entre eux', async () => {
      // Test workflow : API Client → Storage → Cache → Sync
      const apiClient = await createApiClient('http://localhost:3000/api');
      expect(apiClient.status).toBe('created');

      const storage = await createStorage('memory', { namespace: 'api-cache' });
      expect(storage.status).toBe('created');

      const cache = await createCache('lru', { maxSize: 100 });
      expect(cache.status).toBe('created');

      const sync = await createSync('auto', { interval: 30000 });
      expect(sync.status).toBe('created');

      // Tous les services sont créés et compatibles
      expect([apiClient, storage, cache, sync].every(s => s.status === 'created')).toBe(true);
    });
  });
});
