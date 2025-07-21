/**
 * Test COMMIT 10 - System Ports
 */

import { checkPortHealth } from '../../app-server/systems/ports/healthcheck.js';
import { checkPortAvailable } from '../../app-server/systems/ports/allocator.js';
import { checkPortRegistry } from '../../app-server/systems/ports/registry.js';

describe('COMMIT 10 - System Ports', () => {
  
  test('checkPortHealth - structure retour correcte', async () => {
    // Test sans netstat réel - on teste juste que ça ne crash pas
    const result = await checkPortHealth(3000);
    
    expect(result).toHaveProperty('port');
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('listening');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.port).toBe(3000);
    expect(typeof result.healthy).toBe('boolean');
    expect(typeof result.listening).toBe('boolean');
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkPortHealth - validation range ports', async () => {
    const result = await checkPortHealth(8080);
    
    expect(result.port).toBe(8080);
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('timestamp');
  });

  test('checkPortAvailable - structure retour correcte', async () => {
    const result = await checkPortAvailable(3001);
    
    expect(result).toHaveProperty('port');
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('occupied');
    expect(result).toHaveProperty('allocatable');
    expect(result).toHaveProperty('range');
    expect(result.port).toBe(3001);
    expect(typeof result.available).toBe('boolean');
    expect(typeof result.occupied).toBe('boolean');
    expect(typeof result.allocatable).toBe('boolean');
  });

  test('checkPortAvailable - accepte options range', async () => {
    const result = await checkPortAvailable(4000, { range: 'development' });
    
    expect(result.range).toBe('development');
    expect(result.port).toBe(4000);
  });

  test('checkPortRegistry - structure retour correcte', async () => {
    const result = await checkPortRegistry(3002);
    
    expect(result).toHaveProperty('port');
    expect(result).toHaveProperty('registered');
    expect(result).toHaveProperty('conflicts');
    expect(result).toHaveProperty('available');
    expect(result.port).toBe(3002);
    expect(typeof result.registered).toBe('boolean');
    expect(Array.isArray(result.conflicts)).toBe(true);
    expect(Array.isArray(result.available)).toBe(true);
  });

  test('checkPortRegistry - gère les conflits', async () => {
    const result = await checkPortRegistry(8000);
    
    expect(result.port).toBe(8000);
    expect(result).toHaveProperty('conflicts');
    expect(result).toHaveProperty('available');
  });

  test('Validation entrées invalides', async () => {
    // Ports invalides pour healthcheck
    await expect(checkPortHealth('')).rejects.toThrow('ValidationError');
    await expect(checkPortHealth(0)).rejects.toThrow('ValidationError');
    await expect(checkPortHealth(70000)).rejects.toThrow('ValidationError');
    
    // Ports invalides pour allocator
    await expect(checkPortAvailable('')).rejects.toThrow('ValidationError');
    await expect(checkPortAvailable(-1)).rejects.toThrow('ValidationError');
    await expect(checkPortAvailable(99999)).rejects.toThrow('ValidationError');
    
    // Ports invalides pour registry
    await expect(checkPortRegistry('')).rejects.toThrow('ValidationError');
    await expect(checkPortRegistry(null)).rejects.toThrow('ValidationError');
  });

});