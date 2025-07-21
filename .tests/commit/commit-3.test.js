/**
 * Test COMMIT 3 - State Built
 */

import { detectBuiltState } from '../../app-server/states/built/detector.js';
import { validateBuiltState } from '../../app-server/states/built/validator.js';
import { validateBuiltOperation } from '../../app-server/states/built/rules.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 3 - State Built', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const projectWithOutput = path.join(testDir, 'with-output');
  const projectWithoutOutput = path.join(testDir, 'without-output');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(projectWithOutput, { recursive: true });
    await fs.mkdir(path.join(projectWithOutput, '.outputs/active'), { recursive: true });
    await fs.mkdir(projectWithoutOutput, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('detectBuiltState - BUILT pour projet avec .outputs/active', async () => {
    const result = await detectBuiltState(projectWithOutput);
    expect(result.state).toBe('BUILT');
    expect(result.confidence).toBe(100);
  });

  test('detectBuiltState - CONTINUE pour projet sans .outputs/active', async () => {
    const result = await detectBuiltState(projectWithoutOutput);
    expect(result.state).toBe('CONTINUE');
    expect(result.confidence).toBe(0);
  });

  test('validateBuiltState - valid pour projet avec .outputs/active', async () => {
    const result = await validateBuiltState(projectWithOutput);
    expect(result.valid).toBe(true);
    expect(result.confidence).toBe(100);
  });

  test('validateBuiltState - invalid pour projet sans .outputs/active', async () => {
    const result = await validateBuiltState(projectWithoutOutput);
    expect(result.valid).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('validateBuiltOperation - deploy autorisé', () => {
    const result = validateBuiltOperation('BUILT', 'deploy');
    expect(result.allowed).toBe(true);
  });

  test('validateBuiltOperation - invalid refusé', () => {
    const result = validateBuiltOperation('BUILT', 'invalid');
    expect(result.allowed).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(detectBuiltState('')).rejects.toThrow('ValidationError');
    await expect(validateBuiltState('')).rejects.toThrow('ValidationError');
    expect(() => validateBuiltOperation('', 'deploy')).toThrow('StateError');
  });

});