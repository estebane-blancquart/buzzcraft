/**
 * Test COMMIT 2 - State Draft
 */

import { detectDraftState } from '../../app-server/states/draft/detector.js';
import { validateDraftState } from '../../app-server/states/draft/validator.js';
import { validateDraftOperation } from '../../app-server/states/draft/rules.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 2 - State Draft', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const projectWithJson = path.join(testDir, 'with-json');
  const projectWithoutJson = path.join(testDir, 'without-json');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(projectWithJson, { recursive: true });
    await fs.writeFile(path.join(projectWithJson, 'project.json'), '{}');
    await fs.mkdir(projectWithoutJson, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('detectDraftState - DRAFT pour projet avec project.json', async () => {
    const result = await detectDraftState(projectWithJson);
    expect(result.state).toBe('DRAFT');
    expect(result.confidence).toBe(100);
  });

  test('detectDraftState - CONTINUE pour projet sans project.json', async () => {
    const result = await detectDraftState(projectWithoutJson);
    expect(result.state).toBe('CONTINUE');
    expect(result.confidence).toBe(0);
  });

  test('validateDraftState - valid pour projet avec project.json', async () => {
    const result = await validateDraftState(projectWithJson);
    expect(result.valid).toBe(true);
    expect(result.confidence).toBe(100);
  });

  test('validateDraftState - invalid pour projet sans project.json', async () => {
    const result = await validateDraftState(projectWithoutJson);
    expect(result.valid).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('validateDraftOperation - save autorisé', () => {
    const result = validateDraftOperation('DRAFT', 'save');
    expect(result.allowed).toBe(true);
  });

  test('validateDraftOperation - invalid refusé', () => {
    const result = validateDraftOperation('DRAFT', 'invalid');
    expect(result.allowed).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(detectDraftState('')).rejects.toThrow('ValidationError');
    await expect(validateDraftState('')).rejects.toThrow('ValidationError');
    expect(() => validateDraftOperation('', 'save')).toThrow('StateError');
  });

});