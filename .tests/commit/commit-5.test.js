/**
 * Test COMMIT 5 - State Online
 */

import { detectOnlineState } from '../../app-server/states/online/detector.js';
import { validateOnlineState } from '../../app-server/states/online/validator.js';
import { validateOnlineOperation } from '../../app-server/states/online/rules.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 5 - State Online', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const projectWithRunning = path.join(testDir, 'with-running');
  const projectWithoutRunning = path.join(testDir, 'without-running');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(projectWithRunning, { recursive: true });
    await fs.mkdir(path.join(projectWithRunning, 'docker'), { recursive: true });
    await fs.writeFile(path.join(projectWithRunning, 'docker/.running'), '');
    await fs.mkdir(projectWithoutRunning, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('detectOnlineState - ONLINE pour projet avec docker/.running', async () => {
    const result = await detectOnlineState(projectWithRunning);
    expect(result.state).toBe('ONLINE');
    expect(result.confidence).toBe(100);
  });

  test('detectOnlineState - CONTINUE pour projet sans docker/.running', async () => {
    const result = await detectOnlineState(projectWithoutRunning);
    expect(result.state).toBe('CONTINUE');
    expect(result.confidence).toBe(0);
  });

  test('validateOnlineState - valid pour projet avec docker/.running', async () => {
    const result = await validateOnlineState(projectWithRunning);
    expect(result.valid).toBe(true);
    expect(result.confidence).toBe(100);
  });

  test('validateOnlineState - invalid pour projet sans docker/.running', async () => {
    const result = await validateOnlineState(projectWithoutRunning);
    expect(result.valid).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('validateOnlineOperation - stop autorisé', () => {
    const result = validateOnlineOperation('ONLINE', 'stop');
    expect(result.allowed).toBe(true);
  });

  test('validateOnlineOperation - invalid refusé', () => {
    const result = validateOnlineOperation('ONLINE', 'invalid');
    expect(result.allowed).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(detectOnlineState('')).rejects.toThrow('ValidationError');
    await expect(validateOnlineState('')).rejects.toThrow('ValidationError');
    expect(() => validateOnlineOperation('', 'stop')).toThrow('StateError');
  });

});