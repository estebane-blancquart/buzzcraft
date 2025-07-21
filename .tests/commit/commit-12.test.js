/**
 * Test COMMIT 12 - System Backup
 */

import { checkSnapshotStatus } from '../../app-server/systems/backup/snapshots.js';
import { checkRecoveryFeasibility } from '../../app-server/systems/backup/recovery.js';
import { checkCompressionSupport } from '../../app-server/systems/backup/compression.js';

describe('COMMIT 12 - System Backup', () => {
  
  // === TESTS SNAPSHOTS ===
  test('checkSnapshotStatus - structure retour correcte', async () => {
    // Test avec un fichier qui n'existe probablement pas
    const result = await checkSnapshotStatus('/tmp/non-existent-snapshot.backup');
    
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('metadata');
    expect(result.path).toBe('/tmp/non-existent-snapshot.backup');
    expect(typeof result.exists).toBe('boolean');
    expect(typeof result.size).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
    expect(typeof result.valid).toBe('boolean');
  });

  test('checkSnapshotStatus - accepte options personnalisées', async () => {
    const result = await checkSnapshotStatus('/tmp/test-snapshot.bak', {
      validate: true,
      metadata: false
    });
    
    expect(result.path).toBe('/tmp/test-snapshot.bak');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('valid');
  });

  test('checkSnapshotStatus - validation entrées invalides', async () => {
    await expect(checkSnapshotStatus('/valid/path', 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS RECOVERY ===
  test('checkRecoveryFeasibility - structure retour correcte', async () => {
    const config = {
      source: '/backup/snapshot-2024.tar.gz',
      target: '/restore/location',
      strategy: 'full'
    };
    const result = await checkRecoveryFeasibility(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('feasible');
    expect(result).toHaveProperty('estimatedTime');
    expect(result).toHaveProperty('requirements');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.feasible).toBe('boolean');
    expect(typeof result.estimatedTime).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.requirements).toHaveProperty('sourceAvailable');
    expect(result.requirements).toHaveProperty('targetWritable');
    expect(result.requirements).toHaveProperty('spaceAvailable');
  });

  test('checkRecoveryFeasibility - accepte options personnalisées', async () => {
    const config = {
      source: '/backup/incremental.tar',
      target: '/restore/data',
      strategy: 'incremental'
    };
    const result = await checkRecoveryFeasibility(config, {
      dryRun: true,
      checkIntegrity: false
    });
    
    expect(result.config).toEqual(config);
    expect(result).toHaveProperty('feasible');
    expect(result.estimatedTime).toBe(300); // incremental = 5min
  });

  test('checkRecoveryFeasibility - validation entrées invalides', async () => {
    await expect(checkRecoveryFeasibility(null)).rejects.toThrow('ValidationError');
    await expect(checkRecoveryFeasibility('')).rejects.toThrow('ValidationError');
    await expect(checkRecoveryFeasibility({})).rejects.toThrow('ValidationError');
    await expect(checkRecoveryFeasibility({ source: '' })).rejects.toThrow('ValidationError');
    await expect(checkRecoveryFeasibility({ source: 'valid' })).rejects.toThrow('ValidationError');
    await expect(checkRecoveryFeasibility({ source: 'valid', target: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS COMPRESSION ===
  test('checkCompressionSupport - structure retour correcte', () => {
    const result = checkCompressionSupport('gzip');
    
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('supported');
    expect(result).toHaveProperty('ratio');
    expect(result).toHaveProperty('performance');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.type).toBe('gzip');
    expect(typeof result.supported).toBe('boolean');
    expect(typeof result.ratio).toBe('number');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.performance).toHaveProperty('speed');
    expect(result.performance).toHaveProperty('cpuUsage');
    expect(result.performance).toHaveProperty('level');
  });

  test('checkCompressionSupport - accepte options personnalisées', () => {
    const result = checkCompressionSupport('zstd', {
      level: 9,
      estimate: true
    });
    
    expect(result.type).toBe('zstd');
    expect(result.performance.level).toBe(9);
    expect(result).toHaveProperty('supported');
    expect(result.supported).toBe(true);
  });

  test('checkCompressionSupport - validation entrées invalides', () => {
    expect(() => checkCompressionSupport('')).toThrow('ValidationError');
    expect(() => checkCompressionSupport(null)).toThrow('ValidationError');
    expect(() => checkCompressionSupport('invalid-type')).toThrow('ValidationError');
    expect(() => checkCompressionSupport('gzip', 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test snapshot avec chemin problématique
    const snapshotResult = await checkSnapshotStatus('/non/existent/path/snapshot.bak');
    expect(snapshotResult.exists).toBe(false);
    expect(snapshotResult.accessible).toBe(false);

    // Test recovery avec source invalide
    const recoveryResult = await checkRecoveryFeasibility({
      source: '/invalid/source',
      target: '/readonly/target'
    });
    expect(recoveryResult.feasible).toBe(false);
    expect(recoveryResult.requirements.sourceAvailable).toBe(false);

    // Test compression type non supporté avec try/catch
    try {
      checkCompressionSupport('unsupported-format');
    } catch (error) {
      expect(error.message).toContain('ValidationError');
    }

    // Test compression type 'none'
    const noneResult = checkCompressionSupport('none');
    expect(noneResult.supported).toBe(true);
    expect(noneResult.ratio).toBe(1.0);
    expect(noneResult.performance.speed).toBe('instant');
  });

});
