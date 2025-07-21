/**
 * Test COMMIT 15 - System Git
 */

import { checkRepositoryStatus } from '../../app-server/systems/git/repository.js';
import { checkVersioningSystem } from '../../app-server/systems/git/versioning.js';
import { checkGitHooks } from '../../app-server/systems/git/hooks.js';

describe('COMMIT 15 - System Git', () => {
  
  // === TESTS REPOSITORY ===
  test('checkRepositoryStatus - structure retour correcte', async () => {
    // Test avec un dossier qui n'existe probablement pas
    const result = await checkRepositoryStatus('/tmp/non-existent-repo');
    
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('exists');
    expect(result).toHaveProperty('initialized');
    expect(result).toHaveProperty('branches');
    expect(result).toHaveProperty('remotes');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.path).toBe('/tmp/non-existent-repo');
    expect(typeof result.exists).toBe('boolean');
    expect(typeof result.initialized).toBe('boolean');
    expect(Array.isArray(result.branches)).toBe(true);
    expect(Array.isArray(result.remotes)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.status).toHaveProperty('clean');
    expect(result.status).toHaveProperty('staged');
    expect(result.status).toHaveProperty('unstaged');
    expect(result.status).toHaveProperty('untracked');
  });

  test('checkRepositoryStatus - accepte options personnalisées', async () => {
    const result = await checkRepositoryStatus('/tmp/test-repo', {
      checkRemotes: true,
      validateBranches: false
    });
    
    expect(result.path).toBe('/tmp/test-repo');
    expect(result).toHaveProperty('branches');
    expect(result).toHaveProperty('remotes');
  });

  test('checkRepositoryStatus - validation entrées invalides', async () => {
    await expect(checkRepositoryStatus('')).rejects.toThrow('ValidationError');
    await expect(checkRepositoryStatus(null)).rejects.toThrow('ValidationError');
    await expect(checkRepositoryStatus('/path/../invalid')).rejects.toThrow('ValidationError');
    await expect(checkRepositoryStatus('/path//invalid')).rejects.toThrow('ValidationError');
    await expect(checkRepositoryStatus('/valid/path', 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS VERSIONING ===
  test('checkVersioningSystem - structure retour correcte', () => {
    const config = {
      strategy: 'gitflow',
      currentVersion: '1.2.0',
      format: 'semver',
      featureBranches: true
    };
    const result = checkVersioningSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('strategy');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('semver');
    expect(result).toHaveProperty('branches');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.tags)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.strategy).toHaveProperty('name');
    expect(result.strategy).toHaveProperty('supported');
    expect(result.semver).toHaveProperty('current');
    expect(result.semver).toHaveProperty('format');
    expect(result.semver).toHaveProperty('valid');
  });

  test('checkVersioningSystem - accepte options personnalisées', () => {
    const config = {
      strategy: 'github-flow',
      currentVersion: '2.1.0-beta.1',
      format: 'semver',
      hotfixBranches: false
    };
    const result = checkVersioningSystem(config, {
      checkTags: true,
      validateSemver: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.strategy.name).toBe('github-flow');
    expect(result.strategy.supported).toBe(true);
    expect(result.semver.valid).toBe(true);
    expect(result.tags.length).toBeGreaterThan(0);
  });

  test('checkVersioningSystem - validation entrées invalides', () => {
    expect(() => checkVersioningSystem(null)).toThrow('ValidationError');
    expect(() => checkVersioningSystem('')).toThrow('ValidationError');
    expect(() => checkVersioningSystem({})).toThrow('ValidationError');
    expect(() => checkVersioningSystem({ strategy: '' })).toThrow('ValidationError');
    expect(() => checkVersioningSystem({ strategy: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS HOOKS ===
  test('checkGitHooks - structure retour correcte', () => {
    const config = {
      hooksPath: '.git/hooks',
      enabledHooks: ['pre-commit', 'post-commit', 'pre-push'],
      linting: true,
      testing: true
    };
    const result = checkGitHooks(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('active');
    expect(result).toHaveProperty('hooks');
    expect(result).toHaveProperty('configuration');
    expect(result).toHaveProperty('executable');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.active).toBe('boolean');
    expect(Array.isArray(result.hooks)).toBe(true);
    expect(typeof result.executable).toBe('boolean');
    expect(typeof result.accessible).toBe('boolean');
    expect(result.configuration).toHaveProperty('path');
    expect(result.configuration).toHaveProperty('automation');
  });

  test('checkGitHooks - accepte options personnalisées', () => {
    const config = {
      hooksPath: '/custom/hooks',
      enabledHooks: ['commit-msg', 'prepare-commit-msg'],
      shared: true,
      templates: ['eslint', 'prettier']
    };
    const result = checkGitHooks(config, {
      validateScripts: true,
      checkPermissions: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.configuration.path).toBe('/custom/hooks');
    expect(result.configuration.shared).toBe(true);
    expect(result.hooks.length).toBe(2);
    expect(result.hooks[0]).toHaveProperty('script');
  });

  test('checkGitHooks - validation entrées invalides', () => {
    expect(() => checkGitHooks(null)).toThrow('ValidationError');
    expect(() => checkGitHooks('')).toThrow('ValidationError');
    expect(() => checkGitHooks({})).toThrow('ValidationError');
    expect(() => checkGitHooks({ hooksPath: '' })).toThrow('ValidationError');
    expect(() => checkGitHooks({ hooksPath: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test repository non existant
    const repoResult = await checkRepositoryStatus('/non/existent/repo');
    expect(repoResult.exists).toBe(false);
    expect(repoResult.initialized).toBe(false);
    expect(repoResult.accessible).toBe(false);

    // Test versioning avec version semver invalide
    const versionResult = checkVersioningSystem({
      strategy: 'gitflow',
      currentVersion: 'invalid-version',
      format: 'semver'
    }, { validateSemver: true });
    expect(versionResult.semver.valid).toBe(false);

    // Test hooks avec stratégie non supportée
    const unsupportedResult = checkVersioningSystem({
      strategy: 'unknown-strategy',
      currentVersion: '1.0.0'
    });
    expect(unsupportedResult.strategy.supported).toBe(false);
    expect(unsupportedResult.valid).toBe(false);

    // Test hooks vides
    const emptyHooksResult = checkGitHooks({
      hooksPath: '.git/hooks',
      enabledHooks: []
    });
    expect(emptyHooksResult.active).toBe(false);
    expect(emptyHooksResult.hooks).toHaveLength(0);
  });

});
