/**
 * Test COMMIT 6 - System Filesystem
 */

import { checkProjectExists } from '../../app-server/systems/filesystem/project.js';
import { validateWatchPath } from '../../app-server/systems/filesystem/watchers.js';
import { checkTemplateExists } from '../../app-server/systems/filesystem/templates.js';
import { checkOutputPath } from '../../app-server/systems/filesystem/generator.js';
import fs from 'fs/promises';
import path from 'path';

describe('COMMIT 6 - System Filesystem', () => {
  
  const testDir = path.join(process.cwd(), '.tests', 'temp');
  const existingProject = path.join(testDir, 'projects', 'existing-project');
  const existingTemplate = path.join(testDir, 'templates', 'test-template.json');
  const existingOutput = path.join(testDir, 'output');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(existingProject, { recursive: true });
    await fs.mkdir(path.join(testDir, 'templates'), { recursive: true });
    await fs.writeFile(existingTemplate, '{}');
    await fs.mkdir(existingOutput, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('checkProjectExists - exists true pour projet existant', async () => {
    // Changer le cwd temporairement pour que ./projects fonctionne
    const originalCwd = process.cwd();
    process.chdir(testDir);
    
    try {
      const result = await checkProjectExists('existing-project');
      expect(result.projectId).toBe('existing-project');
      expect(result.exists).toBe(true);
      expect(result.path).toContain('existing-project');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('checkProjectExists - exists false pour projet inexistant', async () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);
    
    try {
      const result = await checkProjectExists('non-existing-project');
      expect(result.projectId).toBe('non-existing-project');
      expect(result.exists).toBe(false);
      expect(result.path).toContain('non-existing-project');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('validateWatchPath - watchable true pour chemin existant', async () => {
    const result = await validateWatchPath(existingProject);
    expect(result.path).toBe(existingProject);
    expect(result.exists).toBe(true);
    expect(result.watchable).toBe(true);
  });

  test('validateWatchPath - watchable false pour chemin inexistant', async () => {
    const nonExistingPath = path.join(testDir, 'non-existing');
    const result = await validateWatchPath(nonExistingPath);
    expect(result.path).toBe(nonExistingPath);
    expect(result.exists).toBe(false);
    expect(result.watchable).toBe(false);
  });

  test('checkTemplateExists - exists true pour template existant', async () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);
    
    try {
      const result = await checkTemplateExists('test-template');
      expect(result.templateId).toBe('test-template');
      expect(result.exists).toBe(true);
      expect(result.path).toContain('test-template.json');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('checkTemplateExists - exists false pour template inexistant', async () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);
    
    try {
      const result = await checkTemplateExists('non-existing');
      expect(result.templateId).toBe('non-existing');
      expect(result.exists).toBe(false);
      expect(result.path).toContain('non-existing.json');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('checkOutputPath - writable true pour chemin existant', async () => {
    const result = await checkOutputPath(existingOutput);
    expect(result.path).toBe(existingOutput);
    expect(result.exists).toBe(true);
    expect(result.writable).toBe(true);
  });

  test('checkOutputPath - writable false pour chemin inexistant', async () => {
    const nonExistingPath = path.join(testDir, 'non-existing-output');
    const result = await checkOutputPath(nonExistingPath);
    expect(result.path).toBe(nonExistingPath);
    expect(result.exists).toBe(false);
    expect(result.writable).toBe(false);
  });

  test('Validation entrées invalides', async () => {
    await expect(checkProjectExists('')).rejects.toThrow('ValidationError');
    await expect(validateWatchPath('')).rejects.toThrow('ValidationError');
    await expect(checkTemplateExists('')).rejects.toThrow('ValidationError');
    await expect(checkOutputPath('')).rejects.toThrow('ValidationError');
  });

});