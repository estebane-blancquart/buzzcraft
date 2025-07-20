/**
 * Test COMMIT 1 - State Void
 */

import { detectVoidState } from '../../app-server/states/void/detector.js';
import { validateVoidState } from '../../app-server/states/void/validator.js';
import { validateVoidTransition } from '../../app-server/states/void/rules.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 1 - State Void', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const existingPath = path.join(testDir, 'existing');
  const nonExistingPath = path.join(testDir, 'non-existing');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(existingPath, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('detectVoidState - VOID pour inexistant', async () => {
    const result = await detectVoidState(nonExistingPath);
    expect(result.state).toBe('VOID');
    expect(result.confidence).toBe(100);
  });

  test('detectVoidState - CONTINUE pour existant', async () => {
    const result = await detectVoidState(existingPath);
    expect(result.state).toBe('CONTINUE');
    expect(result.confidence).toBe(0);
  });

  test('validateVoidState - valid pour inexistant', async () => {
    const result = await validateVoidState(nonExistingPath);
    expect(result.valid).toBe(true);
    expect(result.confidence).toBe(100);
  });

  test('validateVoidState - invalid pour existant', async () => {
    const result = await validateVoidState(existingPath);
    expect(result.valid).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('validateVoidTransition - VOID → DRAFT autorisé', () => {
    const result = validateVoidTransition('VOID', 'DRAFT');
    expect(result.allowed).toBe(true);
  });

  test('validateVoidTransition - VOID → BUILT refusé', () => {
    const result = validateVoidTransition('VOID', 'BUILT');
    expect(result.allowed).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(detectVoidState('')).rejects.toThrow('ValidationError');
    await expect(validateVoidState('')).rejects.toThrow('ValidationError');
    expect(() => validateVoidTransition('', 'DRAFT')).toThrow('StateError');
  });

});