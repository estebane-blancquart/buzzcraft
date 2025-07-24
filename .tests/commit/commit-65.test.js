/**
 * TESTS COMMIT 65 - Panel Config
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Project
import {
  createProjectConfig, validateProjectSettings, updateProjectConfiguration, getProjectConfigStatus
} from '../../app-client/panels/config/project.js';

// Components
import {
  createComponentsConfig, validateComponentDefinitions, updateComponentsLibrary, getComponentsConfigStatus
} from '../../app-client/panels/config/components.js';

// Deployment
import {
  createDeploymentConfig, validateDeploymentEnvironments, testDeploymentConnections, getDeploymentConfigStatus
} from '../../app-client/panels/config/deployment.js';

// Themes
import {
  createThemesConfig, validateThemeColors, applyThemeConfiguration, getThemesConfigStatus
} from '../../app-client/panels/config/themes.js';

describe('COMMIT 65 - Panel Config', () => {

  describe('Project', () => {
    test('createProjectConfig crée config basique', async () => {
      const projectData = { name: 'Test Project', type: 'website' };
      const result = await createProjectConfig(projectData);
      
      expect(result.config.project.name).toBe('Test Project');
      expect(result.config.project.type).toBe('website');
      expect(Array.isArray(result.templates)).toBe(true);
      expect(typeof result.validation).toBe('object');
      expect(Array.isArray(result.changes)).toBe(true);
    });

    test('validateProjectSettings valide configuration', async () => {
      const config = {
        project: { name: 'Test', id: 'test-123' },
        settings: { autoSave: true, validation: 'strict', backup: true },
        features: { responsive: true, seo: true }
      };
      const settings = { validationMode: 'strict' };
      const result = await validateProjectSettings(config, settings);
      
      expect(result.valid).toBe(true);
      expect(typeof result.featuresEnabled).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    test('rejette données invalides', async () => {
      await expect(createProjectConfig(null)).rejects.toThrow('ProjectError');
      await expect(validateProjectSettings(null, {})).rejects.toThrow('ProjectError');
    });
  });

  describe('Components', () => {
    test('createComponentsConfig crée config basique', async () => {
      const components = [
        { id: 'button', name: 'Button', category: 'forms' }
      ];
      const result = await createComponentsConfig(components, true, false);
      
      expect(Array.isArray(result.components)).toBe(true);
      expect(typeof result.library).toBe('object');
      expect(result.library.editable).toBe(true);
      expect(result.library.previewEnabled).toBe(false);
    });

    test('validateComponentDefinitions valide composants', async () => {
      const components = [
        { id: 'btn1', name: 'Button 1', category: 'forms' },
        { id: 'btn2', name: 'Button 2', category: 'forms' }
      ];
      const result = await validateComponentDefinitions(components);
      
      expect(result.valid).toBe(true);
      expect(result.components).toBe(2);
      expect(result.duplicates).toBe(0);
    });

    test('détecte IDs dupliqués', async () => {
      const components = [
        { id: 'btn', name: 'Button 1' },
        { id: 'btn', name: 'Button 2' }
      ];
      const result = await validateComponentDefinitions(components);
      
      expect(result.valid).toBe(false);
      expect(result.duplicates).toBe(1);
    });
  });

  describe('Deployment', () => {
    test('createDeploymentConfig crée config basique', async () => {
      const deployConfig = { strategy: 'manual', buildCommand: 'npm run build' };
      const result = await createDeploymentConfig(deployConfig);
      
      expect(result.config.strategy).toBe('manual');
      expect(result.config.buildCommand).toBe('npm run build');
      expect(Array.isArray(result.environments)).toBe(true);
      expect(typeof result.status).toBe('object');
    });

    test('validateDeploymentEnvironments valide environnements', async () => {
      const environments = [
        { name: 'dev', type: 'development', url: 'http://localhost' },
        { name: 'prod', type: 'production', url: 'https://example.com', ssl: true }
      ];
      const result = await validateDeploymentEnvironments(environments);
      
      expect(result.valid).toBe(true);
      expect(result.environments).toBe(2);
      expect(result.production).toBe(1);
    });

    test('testDeploymentConnections teste connexions', async () => {
      const environments = [
        { name: 'test', type: 'development', url: 'http://localhost' }
      ];
      const result = await testDeploymentConnections(environments);
      
      expect(result.tested).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.summary).toBe('object');
      expect(typeof result.summary.successRate).toBe('number');
    });
  });

  describe('Themes', () => {
    test('createThemesConfig crée config basique', async () => {
      const themeConfig = { current: 'buzzcraft-light' };
      const result = await createThemesConfig(themeConfig);
      
      expect(Array.isArray(result.themes)).toBe(true);
      expect(typeof result.currentTheme).toBe('object');
      expect(typeof result.colors).toBe('object');
    });

    test('validateThemeColors valide couleurs', async () => {
      const colors = {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b'
      };
      const result = await validateThemeColors(colors);
      
      expect(result.valid).toBe(true);
      expect(result.colors).toBe(4);
      expect(result.requiredColors).toBe(4);
      expect(result.accessibility).toBe(true);
    });

    test('détecte couleurs manquantes', async () => {
      const colors = { primary: '#2563eb' }; // Manque background, text, secondary
      const result = await validateThemeColors(colors);
      
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('rejette couleurs invalides', async () => {
      const colors = { primary: 'invalid-color', background: '#fff', text: '#000', secondary: '#ccc' };
      const result = await validateThemeColors(colors);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('invalid_color_format'))).toBe(true);
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Project
      expect(typeof createProjectConfig).toBe('function');
      expect(typeof validateProjectSettings).toBe('function');
      expect(typeof updateProjectConfiguration).toBe('function');
      expect(typeof getProjectConfigStatus).toBe('function');

      // Components
      expect(typeof createComponentsConfig).toBe('function');
      expect(typeof validateComponentDefinitions).toBe('function');
      expect(typeof updateComponentsLibrary).toBe('function');
      expect(typeof getComponentsConfigStatus).toBe('function');

      // Deployment
      expect(typeof createDeploymentConfig).toBe('function');
      expect(typeof validateDeploymentEnvironments).toBe('function');
      expect(typeof testDeploymentConnections).toBe('function');
      expect(typeof getDeploymentConfigStatus).toBe('function');

      // Themes
      expect(typeof createThemesConfig).toBe('function');
      expect(typeof validateThemeColors).toBe('function');
      expect(typeof applyThemeConfiguration).toBe('function');
      expect(typeof getThemesConfigStatus).toBe('function');
    });

    test('timestamps présents dans tous les retours', async () => {
      const projectData = { name: 'Test' };
      const components = [{ id: 'btn', name: 'Button' }];
      const environments = [{ name: 'test', type: 'development' }];
      const colors = { primary: '#000', secondary: '#ccc', background: '#fff', text: '#333' };

      const project = await createProjectConfig(projectData);
      const componentsConfig = await createComponentsConfig(components);
      const deployment = await createDeploymentConfig();
      const themes = await createThemesConfig();

      expect(project.timestamp).toBeDefined();
      expect(componentsConfig.timestamp).toBeDefined();
      expect(deployment.timestamp).toBeDefined();
      expect(themes.timestamp).toBeDefined();

      // Validation format ISO
      expect(new Date(project.timestamp).toISOString()).toBe(project.timestamp);
      expect(new Date(componentsConfig.timestamp).toISOString()).toBe(componentsConfig.timestamp);
      expect(new Date(deployment.timestamp).toISOString()).toBe(deployment.timestamp);
      expect(new Date(themes.timestamp).toISOString()).toBe(themes.timestamp);
    });

    test('gestion erreurs typées cohérente', async () => {
      // Project
      await expect(createProjectConfig(null)).rejects.toThrow('ProjectError');
      await expect(validateProjectSettings(null, {})).rejects.toThrow('ProjectError');

      // Components
      await expect(createComponentsConfig('invalid')).rejects.toThrow('ComponentError');
      await expect(validateComponentDefinitions('invalid')).rejects.toThrow('ComponentError');

      // Deployment
      await expect(createDeploymentConfig('invalid')).rejects.toThrow('DeployError');
      await expect(validateDeploymentEnvironments('invalid')).rejects.toThrow('DeployError');

      // Themes
      await expect(createThemesConfig('invalid')).rejects.toThrow('ThemeError');
      await expect(validateThemeColors(null)).rejects.toThrow('ColorError');
    });

    test('status functions retournent structure cohérente', async () => {
      const projectData = { name: 'Test', id: 'test' };
      const components = [{ id: 'btn', name: 'Button' }];
      const deployment = {};
      const themes = {};

      const projectConfig = await createProjectConfig(projectData);
      const componentsConfig = await createComponentsConfig(components);
      const deploymentConfig = await createDeploymentConfig(deployment);
      const themesConfig = await createThemesConfig(themes);

      const projectStatus = await getProjectConfigStatus(projectConfig);
      const componentsStatus = await getComponentsConfigStatus(componentsConfig);
      const deploymentStatus = await getDeploymentConfigStatus(deploymentConfig);
      const themesStatus = await getThemesConfigStatus(themesConfig);

      // Tous ont un status
      expect(projectStatus.status).toBeDefined();
      expect(componentsStatus.status).toBeDefined();
      expect(deploymentStatus.status).toBeDefined();
      expect(themesStatus.status).toBeDefined();

      // Tous ont un configured/loaded - FIX: Utiliser les bonnes propriétés
      expect(typeof projectStatus.configured).toBe('boolean');
      expect(typeof componentsStatus.loaded).toBe('boolean');
      expect(typeof deploymentStatus.configured).toBe('boolean');
      expect(typeof themesStatus.configured).toBe('boolean');

      // Tous ont lastUpdate
      expect(projectStatus.lastUpdate).toBeDefined();
      expect(componentsStatus.lastUpdate).toBeDefined();
      expect(deploymentStatus.lastUpdate).toBeDefined();
      expect(themesStatus.lastUpdate).toBeDefined();
    });

    test('validation functions détectent problèmes', async () => {
      // Project: config incomplète - FIX: Structure correcte
      const incompleteConfig = { 
        project: {}, // Manque name et id
        settings: undefined // Pas de settings
      };
      const projectValidation = await validateProjectSettings(incompleteConfig, {});
      expect(projectValidation.valid).toBe(false);
      expect(projectValidation.issues.length).toBeGreaterThan(0);

      // Components: composants sans ID
      const invalidComponents = [{ name: 'Button' }]; // Manque id
      const componentsValidation = await validateComponentDefinitions(invalidComponents);
      expect(componentsValidation.valid).toBe(false);

      // Deployment: environnements invalides
      const invalidEnvs = [{ name: 'test' }]; // Manque type
      const deploymentValidation = await validateDeploymentEnvironments(invalidEnvs);
      expect(deploymentValidation.valid).toBe(false);

      // Themes: couleurs manquantes
      const incompleteColors = { primary: '#000' }; // Manque required colors
      const themesValidation = await validateThemeColors(incompleteColors);
      expect(themesValidation.valid).toBe(false);
    });
  });

});
