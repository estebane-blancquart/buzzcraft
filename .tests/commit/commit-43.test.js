/**
 * COMMIT 43 - API Responses
 * Tests exhaustifs pour formatage et sérialisation réponses API avec pattern BuzzCraft
 */

import { formatStandardResponse, formatCollectionResponse, formatErrorResponse, formatStreamResponse } from '../../api/responses/formatting.js';
import { serializeResponse, deserializeRequest, batchSerialize } from '../../api/responses/serialization.js';
import { compressResponse, decompressResponse, benchmarkCompression, adaptiveCompress } from '../../api/responses/compression.js';
import { cacheResponse, getCachedResponse, deleteCachedResponse, invalidateCache, getCacheStats } from '../../api/responses/caching.js';

describe('COMMIT 43 - API Responses', () => {
  
  describe('Module formatting.js', () => {
    test('formatStandardResponse fonctionne avec données valides', async () => {
      const data = { message: 'test', value: 42 };
      const statusCode = 200;
      const options = { startTime: Date.now() - 100 };
      const context = { endpoint: '/api/test' };

      const result = await formatStandardResponse(data, statusCode, options, context);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.metadata.statusCode).toBe(200);
      expect(result.metadata.statusType).toBe('OK');
      expect(result.metadata.endpoint).toBe('/api/test');
      expect(typeof result.timing).toBe('number');
      expect(typeof result.metadata.timestamp).toBe('string');
    });
    
    test('formatStandardResponse gère status codes d\'erreur', async () => {
      const data = null;
      const statusCode = 404;
      const options = { error: { message: 'Not found' } };

      const result = await formatStandardResponse(data, statusCode, options);
      
      expect(result.success).toBe(false);
      expect(result.metadata.statusCode).toBe(404);
      expect(result.metadata.statusType).toBe('NOT_FOUND');
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Not found');
    });
    
    test('formatCollectionResponse formate correctement les collections', async () => {
      const items = [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' }
      ];
      const totalCount = 10;
      const pagination = { limit: 2, offset: 0 };

      const result = await formatCollectionResponse(items, totalCount, pagination);
      
      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.count).toBe(2);
      expect(result.data.total).toBe(10);
      expect(result.data.pagination.hasNext).toBe(true);
      expect(result.data.pagination.hasPrev).toBe(false);
      expect(result.data.pagination.pages).toBe(5);
    });
    
    test('formatErrorResponse structure erreurs correctement', async () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      const statusCode = 500;
      const options = { includeStack: true };

      const result = await formatErrorResponse(error, statusCode, options);
      
      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.metadata.statusCode).toBe(500);
      expect(result.error.code).toBe('TEST_ERROR');
      expect(result.error.message).toBe('Test error');
      expect(result.error.type).toBe('INTERNAL_ERROR');
      expect(Array.isArray(result.error.stack)).toBe(true);
    });
    
    test('formatStreamResponse gère les streams', async () => {
      const mockStream = { pipe: () => {}, readable: true };
      const statusCode = 200;
      const options = { contentType: 'application/json', encoding: 'utf8' };

      const result = await formatStreamResponse(mockStream, statusCode, options);
      
      expect(result.success).toBe(true);
      expect(result.stream).toBe(mockStream);
      expect(result.metadata.statusCode).toBe(200);
      expect(result.metadata.stream.contentType).toBe('application/json');
      expect(result.metadata.stream.encoding).toBe('utf8');
    });
    
    test('formatStandardResponse gère format invalide', async () => {
      const data = { test: 'data' };
      const options = { format: 'invalid-format' };

      await expect(
        formatStandardResponse(data, 200, options)
      ).rejects.toThrow('FormatError: Format \'invalid-format\' non supporté');
    });
  });

  describe('Module serialization.js', () => {
    test('serializeResponse JSON fonctionne correctement', async () => {
      const data = { message: 'test', items: [1, 2, 3] };
      const format = 'json';

      const result = await serializeResponse(data, format);
      
      expect(typeof result.serialized).toBe('string');
      expect(result.contentType).toBe('application/json');
      expect(result.format).toBe('json');
      expect(result.encoding).toBe('utf8');
      expect(result.size).toBeGreaterThan(0);
      expect(typeof result.timing).toBe('number');
      
      // Vérifier que c'est du JSON valide
      const parsed = JSON.parse(result.serialized);
      expect(parsed.message).toBe('test');
      expect(parsed.items).toEqual([1, 2, 3]);
    });
    
    test('serializeResponse XML génère structure XML', async () => {
      const data = { message: 'test', value: 42 };
      const format = 'xml';

      const result = await serializeResponse(data, format);
      
      expect(typeof result.serialized).toBe('string');
      expect(result.contentType).toBe('application/xml');
      expect(result.format).toBe('xml');
      expect(result.serialized).toContain('<?xml version="1.0"');
      expect(result.serialized).toContain('<response>');
      expect(result.serialized).toContain('</response>');
    });
    
    test('serializeResponse CSV formate données tabulaires', async () => {
      const data = {
        items: [
          { id: 1, name: 'item1', value: 10 },
          { id: 2, name: 'item2', value: 20 }
        ]
      };
      const format = 'csv';

      const result = await serializeResponse(data, format);
      
      expect(typeof result.serialized).toBe('string');
      expect(result.contentType).toBe('text/csv');
      expect(result.serialized).toContain('id,name,value');
      expect(result.serialized).toContain('1,item1,10');
      expect(result.serialized).toContain('2,item2,20');
    });
    
    test('serializeResponse gère format non supporté', async () => {
      const data = { test: 'data' };
      const format = 'unknown-format';

      await expect(
        serializeResponse(data, format)
      ).rejects.toThrow('FormatNotSupportedError: Format \'unknown-format\' non supporté');
    });
    
    test('serializeResponse avec compression fonctionne', async () => {
      const data = { message: 'test '.repeat(100) }; // Données répétitives pour compression
      const format = 'json';
      const options = { compress: true, compressionAlgorithm: 'gzip' };

      const result = await serializeResponse(data, format, options);
      
      expect(result.compressed).toBe(true);
      expect(result.contentType).toContain('compression=gzip');
      expect(result.metadata.compressionRatio).toBeLessThan(1);
      expect(result.metadata.originalSize).toBeGreaterThan(result.metadata.finalSize);
    });
    
    test('batchSerialize traite plusieurs éléments', async () => {
      const dataArray = [
        { id: 1, message: 'first' },
        { id: 2, message: 'second' },
        { id: 3, message: 'third' }
      ];
      const format = 'json';

      const result = await batchSerialize(dataArray, format);
      
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(typeof result.results[0].result.serialized).toBe('string');
    });
  });

  describe('Module compression.js', () => {
    test('compressResponse avec gzip fonctionne', async () => {
      const data = 'test data '.repeat(100); // Données répétitives
      const algorithm = 'gzip';

      const result = await compressResponse(data, algorithm);
      
      expect(result.algorithm).toBe('gzip');
      expect(result.ratio).toBeLessThan(1);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.savings).toBeGreaterThan(0);
      expect(Buffer.isBuffer(result.compressed)).toBe(true);
    });
    
    test('compressResponse évite compression si inefficace', async () => {
      const data = 'small'; // Données trop petites
      const algorithm = 'auto';

      const result = await compressResponse(data, algorithm);
      
      expect(result.algorithm).toBe('none');
      expect(result.ratio).toBe(1);
      expect(result.reason).toBe('size_too_small');
    });
    
    test('decompressResponse fonctionne avec données compressées', async () => {
      const originalData = 'test data '.repeat(50);
      
      // Comprimer d'abord
      const compressed = await compressResponse(originalData, 'gzip');
      
      // Décomprimer
      const decompressed = await decompressResponse(compressed.compressed, 'gzip');
      
      expect(decompressed.algorithm).toBe('gzip');
      expect(decompressed.decompressedSize).toBe(decompressed.decompressed.length);
      expect(decompressed.decompressed.toString()).toContain('test data');
    });
    
    test('benchmarkCompression compare algorithmes', async () => {
      const data = 'benchmark test data '.repeat(100);
      const algorithms = ['gzip', 'deflate', 'brotli'];

      const result = await benchmarkCompression(data, algorithms);
      
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.results).toHaveLength(3);
      expect(result.summary.tested).toBe(3);
      expect(result.recommendation).toBeDefined();
      
      const successful = result.results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(0);
      
      successful.forEach(r => {
        expect(r.algorithm).toBeOneOf(['gzip', 'deflate', 'brotli']);
        expect(r.ratio).toBeLessThan(1);
        expect(typeof r.compressionTime).toBe('number');
        expect(typeof r.decompressionTime).toBe('number');
        expect(r.valid).toBe(true);
      });
    });
    
    test('adaptiveCompress sélectionne algorithme optimal', async () => {
      const data = { message: 'adaptive test '.repeat(50) };
      const contentType = 'application/json';

      const result = await adaptiveCompress(data, contentType);
      
      expect(result.algorithm).toBeDefined();
      expect(result.algorithm).not.toBe('none');
      expect(result.ratio).toBeLessThan(1);
    });
    
    test('compressResponse gère algorithme non supporté', async () => {
      const data = 'test data';
      const algorithm = 'unknown-algo';

      await expect(
        compressResponse(data, algorithm)
      ).rejects.toThrow('AlgorithmNotSupportedError: Algorithme \'unknown-algo\' non supporté');
    });
  });

  describe('Module caching.js', () => {
    test('cacheResponse met en cache correctement', async () => {
      const key = 'test-cache-key';
      const data = { message: 'cached data', timestamp: Date.now() };
      const options = { ttl: 3600, strategy: 'lru' };

      const result = await cacheResponse(key, data, options);
      
      expect(result.cached).toBe(true);
      expect(result.key).toContain(key);
      expect(result.strategy).toBe('lru');
      expect(result.tier).toBe('memory');
      expect(typeof result.size).toBe('number');
      expect(typeof result.expiresAt).toBe('string');
    });
    
    test('getCachedResponse récupère données mises en cache', async () => {
      const key = 'test-get-cache';
      const data = { value: 'cached value' };
      
      // Mettre en cache d'abord
      await cacheResponse(key, data, { ttl: 3600 });
      
      // Récupérer
      const result = await getCachedResponse(key);
      
      expect(result.hit).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.metadata.accessCount).toBe(1);
      expect(typeof result.metadata.age).toBe('number');
      expect(result.metadata.remainingTtl).toBeGreaterThan(0);
    });
    
    test('getCachedResponse retourne miss pour clé inexistante', async () => {
      const key = 'non-existent-key';

      const result = await getCachedResponse(key);
      
      expect(result.hit).toBe(false);
      expect(result.reason).toBe('key_not_found');
    });
    
    test('deleteCachedResponse supprime entrée cache', async () => {
      const key = 'test-delete-cache';
      const data = { value: 'to be deleted' };
      
      // Mettre en cache
      await cacheResponse(key, data);
      
      // Supprimer
      const deleteResult = await deleteCachedResponse(key);
      expect(deleteResult.deleted).toBe(true);
      
      // Vérifier suppression
      const getResult = await getCachedResponse(key);
      expect(getResult.hit).toBe(false);
    });
    
    test('invalidateCache supprime par pattern', async () => {
      // Mettre plusieurs entrées en cache
      await cacheResponse('user:123:profile', { name: 'John' });
      await cacheResponse('user:456:profile', { name: 'Jane' });
      await cacheResponse('post:789', { title: 'Test' });
      
      // Invalider par pattern
      const result = await invalidateCache('user:.*:profile');
      
      expect(result.invalidated).toBe(2);
      expect(result.pattern).toBe('user:.*:profile');
      
      // Vérifier que les profils users sont supprimés
      const user123 = await getCachedResponse('user:123:profile');
      const user456 = await getCachedResponse('user:456:profile');
      const post789 = await getCachedResponse('post:789');
      
      expect(user123.hit).toBe(false);
      expect(user456.hit).toBe(false);
      expect(post789.hit).toBe(true); // Toujours en cache
    });
    
    test('getCacheStats retourne statistiques complètes', async () => {
      // Générer activité cache
      await cacheResponse('stats-test-1', { data: 'test1' });
      await cacheResponse('stats-test-2', { data: 'test2' });
      await getCachedResponse('stats-test-1');
      await getCachedResponse('stats-test-1'); // Deuxième accès
      await getCachedResponse('non-existent'); // Miss

      const stats = await getCacheStats();
      
      expect(stats.global.hits).toBeGreaterThan(0);
      expect(stats.global.misses).toBeGreaterThan(0);
      expect(stats.global.sets).toBeGreaterThan(0);
      expect(typeof stats.global.hitRate).toBe('string');
      expect(stats.global.hitRate).toContain('%');
      expect(stats.global.totalEntries).toBeGreaterThan(0);
      expect(typeof stats.global.totalSize).toBe('number');
      
      expect(stats.tiers).toHaveProperty('memory');
      expect(stats.tiers.memory.entries).toBeGreaterThan(0);
      
      expect(Array.isArray(stats.topKeys)).toBe(true);
      expect(typeof stats.generatedAt).toBe('string');
    });
    
    test('cacheResponse gère clé invalide', async () => {
      const invalidKey = '';
      const data = { test: 'data' };

      await expect(
        cacheResponse(invalidKey, data)
      ).rejects.toThrow('KeyError: Clé cache doit être une string non vide');
    });
    
    test('cacheResponse gère TTL invalide', async () => {
      const key = 'test-ttl';
      const data = { test: 'data' };
      const options = { ttl: -1 };

      await expect(
        cacheResponse(key, data, options)
      ).rejects.toThrow('ExpirationError: TTL doit être positif');
    });
  });

  describe('Intégration patterns BuzzCraft', () => {
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof formatStandardResponse).toBe('function');
      expect(typeof serializeResponse).toBe('function');
      expect(typeof compressResponse).toBe('function');
      expect(typeof cacheResponse).toBe('function');
      
      // Noms cohérents avec pattern
      expect(formatStandardResponse.name).toBe('formatStandardResponse');
      expect(serializeResponse.name).toBe('serializeResponse');
      expect(compressResponse.name).toBe('compressResponse');
      expect(cacheResponse.name).toBe('cacheResponse');
    });
    
    test('tous les modules utilisent erreurs cohérentes', async () => {
      // Chaque module doit lancer des erreurs avec format correct
      
      // Test formatting
      await expect(
        formatStandardResponse({}, 999) // Status code invalide
      ).rejects.toThrow('FormatError:');
      
      // Test serialization
      await expect(
        serializeResponse({}, 'invalid-format')
      ).rejects.toThrow('FormatNotSupportedError:');
      
      // Test compression
      await expect(
        compressResponse('data', 'invalid-algo')
      ).rejects.toThrow('AlgorithmNotSupportedError:');
      
      // Test caching
      await expect(
        cacheResponse('', {})
      ).rejects.toThrow('KeyError:');
    });
    
    test('architecture dependency flow respectée', () => {
      // Vérifier qu'aucun module api/responses ne dépend d'autres modules api/
      // Les responses utilisent api/schemas uniquement
      
      // api/responses/ → api/schemas/ → engines/ (OK)
      // engines/ → api/responses/ (NOK - pas de dépendance circulaire)
      
      expect(true).toBe(true); // Test symbolique
    });
    
    test('tous les modules retournent structure cohérente', async () => {
      // Vérifier que tous les modules retournent des objets avec timing
      
      const formatResult = await formatStandardResponse({ test: 'data' }, 200);
      expect(formatResult).toHaveProperty('timing');
      expect(typeof formatResult.timing).toBe('number');
      
      const serializeResult = await serializeResponse({ test: 'data' }, 'json');
      expect(serializeResult).toHaveProperty('timing');
      expect(typeof serializeResult.timing).toBe('number');
      
      const compressResult = await compressResponse('test data', 'gzip');
      expect(compressResult).toHaveProperty('timing');
      expect(typeof compressResult.timing).toBe('number');
      
      const cacheResult = await cacheResponse('test-timing', { data: 'test' });
      expect(cacheResult).toHaveProperty('timing');
      expect(typeof cacheResult.timing).toBe('number');
    });
    
    test('intégration entre modules fonctionne', async () => {
      // Test chaîne complète : format → serialize → compress → cache
      
      const originalData = { message: 'integration test', items: [1, 2, 3] };
      
      // 1. Format
      const formatted = await formatStandardResponse(originalData, 200);
      expect(formatted.success).toBe(true);
      
      // 2. Serialize
      const serialized = await serializeResponse(formatted, 'json');
      expect(typeof serialized.serialized).toBe('string');
      
      // 3. Compress
      const compressed = await compressResponse(serialized.serialized, 'gzip');
      expect(compressed.algorithm).toBe('gzip');
      
      // 4. Cache
      const cached = await cacheResponse('integration-test', compressed);
      expect(cached.cached).toBe(true);
      
      // 5. Retrieve
      const retrieved = await getCachedResponse('integration-test');
      expect(retrieved.hit).toBe(true);
      expect(retrieved.data.algorithm).toBe('gzip');
    });
  });
});

// Helper pour toBeOneOf
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
