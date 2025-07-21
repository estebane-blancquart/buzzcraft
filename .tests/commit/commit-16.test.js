/**
 * Test COMMIT 16 - System CI/CD
 */

import { checkPipelineConfiguration } from '../../app-server/systems/ci-cd/pipelines.js';
import { checkAutomationSystem } from '../../app-server/systems/ci-cd/automation.js';
import { checkTestingConfiguration } from '../../app-server/systems/ci-cd/testing.js';

describe('COMMIT 16 - System CI/CD', () => {
  
  // === TESTS PIPELINES ===
  test('checkPipelineConfiguration - structure retour correcte', () => {
    const config = {
      name: 'main-pipeline',
      stages: ['build', 'test', 'deploy'],
      provider: 'github-actions',
      triggers: {
        push: true,
        pullRequest: true
      }
    };
    const result = checkPipelineConfiguration(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('stages');
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('triggers');
    expect(result).toHaveProperty('environments');
    expect(result).toHaveProperty('execution');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.valid).toBe('boolean');
    expect(typeof result.name).toBe('string');
    expect(Array.isArray(result.stages)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.provider).toHaveProperty('name');
    expect(result.provider).toHaveProperty('supported');
  });

  test('checkPipelineConfiguration - accepte options personnalisées', () => {
    const config = {
      name: 'deploy-pipeline',
      stages: [
        { name: 'lint', timeout: 300 },
        { name: 'security', parallel: true }
      ],
      provider: 'jenkins',
      environments: ['dev', 'prod'],
      parallel: true,
      timeout: 7200
    };
    const result = checkPipelineConfiguration(config, {
      validateStages: true,
      checkTriggers: false
    });
    
    expect(result.config).toEqual(config);
    expect(result.provider.name).toBe('jenkins');
    expect(result.provider.supported).toBe(true);
    expect(result.execution.parallel).toBe(true);
    expect(result.execution.timeout).toBe(7200);
  });

  test('checkPipelineConfiguration - validation entrées invalides', () => {
    expect(() => checkPipelineConfiguration(null)).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration('')).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration({})).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration({ name: '' })).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration({ name: 'valid' })).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration({ name: 'valid', stages: 'invalid' })).toThrow('ValidationError');
    expect(() => checkPipelineConfiguration({ name: 'valid', stages: [] }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS AUTOMATION ===
  test('checkAutomationSystem - structure retour correcte', async () => {
    const config = {
      type: 'continuous-integration',
      workflows: ['build', 'test', 'package'],
      integrations: {
        scm: 'github',
        registry: 'docker-hub'
      }
    };
    const result = await checkAutomationSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('workflows');
    expect(result).toHaveProperty('integrations');
    expect(result).toHaveProperty('capabilities');
    expect(result).toHaveProperty('deployment');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.workflows)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.type).toHaveProperty('name');
    expect(result.type).toHaveProperty('supported');
  });

  test('checkAutomationSystem - accepte options personnalisées', async () => {
    const config = {
      type: 'gitops',
      workflows: [
        { name: 'deploy', steps: ['validate', 'apply'] }
      ],
      secrets: true,
      parallel: true,
      deploymentStrategies: ['blue-green', 'canary']
    };
    const result = await checkAutomationSystem(config, {
      validateWorkflows: true,
      checkIntegrations: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.type.name).toBe('gitops');
    expect(result.type.supported).toBe(true);
    expect(result.capabilities.secretManagement).toBe(true);
    expect(result.deployment.strategies).toContain('blue-green');
  });

  test('checkAutomationSystem - validation entrées invalides', async () => {
    await expect(checkAutomationSystem(null)).rejects.toThrow('ValidationError');
    await expect(checkAutomationSystem('')).rejects.toThrow('ValidationError');
    await expect(checkAutomationSystem({})).rejects.toThrow('ValidationError');
    await expect(checkAutomationSystem({ type: '' })).rejects.toThrow('ValidationError');
    await expect(checkAutomationSystem({ type: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS TESTING ===
  test('checkTestingConfiguration - structure retour correcte', () => {
    const config = {
      framework: 'jest',
      suites: ['unit', 'integration'],
      coverage: {
        statements: 85,
        branches: 80
      }
    };
    const result = checkTestingConfiguration(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('configured');
    expect(result).toHaveProperty('framework');
    expect(result).toHaveProperty('suites');
    expect(result).toHaveProperty('coverage');
    expect(result).toHaveProperty('environments');
    expect(result).toHaveProperty('reporting');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.configured).toBe('boolean');
    expect(Array.isArray(result.suites)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.framework).toHaveProperty('name');
    expect(result.framework).toHaveProperty('supported');
  });

  test('checkTestingConfiguration - accepte options personnalisées', () => {
    const config = {
      framework: 'cypress',
      suites: [
        { type: 'e2e', browser: 'chrome' },
        { type: 'performance', threshold: '2s' }
      ],
      coverage: {
        enabled: true,
        formats: ['lcov', 'html']
      },
      browsers: ['chrome', 'firefox', 'safari']
    };
    const result = checkTestingConfiguration(config, {
      validateSuites: true,
      checkCoverage: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.framework.name).toBe('cypress');
    expect(result.framework.supported).toBe(true);
    expect(result.coverage.enabled).toBe(true);
    expect(result.environments.browsers).toContain('chrome');
  });

  test('checkTestingConfiguration - validation entrées invalides', () => {
    expect(() => checkTestingConfiguration(null)).toThrow('ValidationError');
    expect(() => checkTestingConfiguration('')).toThrow('ValidationError');
    expect(() => checkTestingConfiguration({})).toThrow('ValidationError');
    expect(() => checkTestingConfiguration({ framework: '' })).toThrow('ValidationError');
    expect(() => checkTestingConfiguration({ framework: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test pipeline avec provider non supporté
    const pipelineResult = checkPipelineConfiguration({
      name: 'test-pipeline',
      stages: ['build'],
      provider: 'unsupported-provider'
    });
    expect(pipelineResult.provider.supported).toBe(false);
    expect(pipelineResult.valid).toBe(false);

    // Test automation avec type non supporté
    const automationResult = await checkAutomationSystem({
      type: 'unknown-type',
      workflows: []
    });
    expect(automationResult.type.supported).toBe(false);
    expect(automationResult.operational).toBe(false);

    // Test testing avec framework non supporté
    const testingResult = checkTestingConfiguration({
      framework: 'unknown-framework',
      suites: []
    });
    expect(testingResult.framework.supported).toBe(false);
    expect(testingResult.configured).toBe(false);

    // Test pipeline sans stages
    const emptyPipelineResult = checkPipelineConfiguration({
      name: 'empty-pipeline',
      stages: []
    });
    expect(emptyPipelineResult.valid).toBe(false);
  });

});
