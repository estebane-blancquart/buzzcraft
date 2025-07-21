/**
 * Test COMMIT 7 - System Docker
 */

import { checkContainerExists } from '../../app-server/systems/docker/containers.js';
import { checkNetworkExists } from '../../app-server/systems/docker/networks.js';
import { checkVolumeExists } from '../../app-server/systems/docker/volumes.js';
import { checkImageExists } from '../../app-server/systems/docker/images.js';
import { checkDatabaseConnection } from '../../app-server/systems/docker/database.js';

describe('COMMIT 7 - System Docker', () => {
  
  test('checkContainerExists - structure retour correcte', async () => {
    // Test sans Docker réel - on teste juste que ça ne crash pas
    const result = await checkContainerExists('test-container');
    
    expect(result).toHaveProperty('containerId');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('running');
    expect(result.containerId).toBe('test-container');
    expect(typeof result.exists).toBe('boolean');
    expect(typeof result.running).toBe('boolean');
  });

  test('checkNetworkExists - structure retour correcte', async () => {
    const result = await checkNetworkExists('test-network');
    
    expect(result).toHaveProperty('networkId');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('driver');
    expect(result.networkId).toBe('test-network');
    expect(typeof result.exists).toBe('boolean');
  });

  test('checkVolumeExists - structure retour correcte', async () => {
    const result = await checkVolumeExists('test-volume');
    
    expect(result).toHaveProperty('volumeId');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('driver');
    expect(result.volumeId).toBe('test-volume');
    expect(typeof result.exists).toBe('boolean');
  });

  test('checkImageExists - structure retour correcte', async () => {
    const result = await checkImageExists('test-image');
    
    expect(result).toHaveProperty('imageId');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('size');
    expect(result.imageId).toBe('test-image');
    expect(typeof result.exists).toBe('boolean');
    expect(typeof result.size).toBe('number');
  });

  test('checkDatabaseConnection - structure retour correcte', async () => {
    const result = await checkDatabaseConnection('db-container');
    
    expect(result).toHaveProperty('containerId');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('running');
    expect(result).toHaveProperty('accessible');
    expect(result.containerId).toBe('db-container');
    expect(typeof result.exists).toBe('boolean');
    expect(typeof result.running).toBe('boolean');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('Validation entrées invalides', async () => {
    await expect(checkContainerExists('')).rejects.toThrow('ValidationError');
    await expect(checkNetworkExists('')).rejects.toThrow('ValidationError');
    await expect(checkVolumeExists('')).rejects.toThrow('ValidationError');  
    await expect(checkImageExists('')).rejects.toThrow('ValidationError');
    await expect(checkDatabaseConnection('')).rejects.toThrow('ValidationError');
  });

});