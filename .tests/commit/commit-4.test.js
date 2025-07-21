/**
 * Test COMMIT 4 - State Offline
 */

import { detectOfflineState } from '../../app-server/states/offline/detector.js';
import { validateOfflineState } from '../../app-server/states/offline/validator.js';
import { validateOfflineOperation } from '../../app-server/states/offline/rules.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 4 - State Offline', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const projectWithDocker = path.join(testDir, 'with-docker');
  const projectWithoutDocker = path.join(testDir, 'without-docker');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(projectWithDocker, { recursive: true });
    await fs.mkdir(path.join(projectWithDocker, 'docker'), { recursive: true });
    await fs.mkdir(projectWithoutDocker, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('detectOfflineState - OFFLINE pour projet avec docker/', async () => {
    const result = await detectOfflineState(projectWithDocker);
    expect(result.state).toBe('OFFLINE');
    expect(result.confidence).toBe(100);
  });

  test('detectOfflineState - CONTINUE pour projet sans docker/', async () => {
    const result = await detectOfflineState(projectWithoutDocker);
    expect(result.state).toBe('CONTINUE');
    expect(result.confidence).toBe(0);
  });

  test('validateOfflineState - valid pour projet avec docker/', async () => {
    const result = await validateOfflineState(projectWithDocker);
    expect(result.valid).toBe(true);
    expect(result.confidence).toBe(100);
  });

  test('validateOfflineState - invalid pour projet sans docker/', async () => {
    const result = await validateOfflineState(projectWithoutDocker);
    expect(result.valid).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('validateOfflineOperation - start autorisé', () => {
    const result = validateOfflineOperation('OFFLINE', 'start');
    expect(result.allowed).toBe(true);
  });

  test('validateOfflineOperation - invalid refusé', () => {
    const result = validateOfflineOperation('OFFLINE', 'invalid');
    expect(result.allowed).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(detectOfflineState('')).rejects.toThrow('ValidationError');
    await expect(validateOfflineState('')).rejects.toThrow('ValidationError');
    expect(() => validateOfflineOperation('', 'start')).toThrow('StateError');
  });

});