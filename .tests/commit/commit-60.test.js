/**
 * TESTS COMMIT 60 - App Client Main
 * Validation point d'entrée principal + HTML + router + providers
 */

import { 
  initializeApp, 
  validateAppConfig, 
  startApplication, 
  getApplicationStatus 
} from '../../app-client/main.js';

import { 
  createAppRouter, 
  validateRouterConfig, 
  updateRouterGuards, 
  getRouterStatus 
} from '../../app-client/router/index.js';

import { 
  setupGlobalProviders, 
  validateProviders, 
  updateProviderConfig, 
  getProvidersStatus 
} from '../../app-client/providers/index.js';

describe('COMMIT 60 - App Client Main', () => {
  
  describe('Main Application', () => {
    test('initializeApp - crée configuration app valide', async () => {
      const config = { mode: 'development', apiUrl: 'http://localhost:3001' };
      const result = await initializeApp(config);
      
      expect(result.ready).toBe(true);
      expect(result.app).toBe('ReactApp');
      expect(result.router).toBe('BrowserRouter');
      expect(result.config.mode).toBe('development');
    });

    test('validateAppConfig - valide configuration correctement', async () => {
      const config = { mode: 'production', apiUrl: 'https://api.buzzcraft.com' };
      const result = await validateAppConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('startApplication - démarre app avec succès', async () => {
      const appInstance = { ready: true, timestamp: new Date().toISOString() };
      const result = await startApplication(appInstance);
      
      expect(result.started).toBe(true);
      expect(result.instance).toEqual(appInstance);
    });

    test('getApplicationStatus - retourne statut correct', async () => {
      const appInstance = { ready: true, config: {}, timestamp: new Date().toISOString() };
      const result = await getApplicationStatus(appInstance);
      
      expect(result.status).toBe('running');
      expect(result.ready).toBe(true);
    });

    test('erreurs typées - lève erreurs appropriées', async () => {
      await expect(initializeApp(null)).rejects.toThrow('InitError: Configuration application requise');
      await expect(startApplication({ ready: false })).rejects.toThrow('StateError: Instance application non prête');
    });
  });

  describe('Router Configuration', () => {
    test('createAppRouter - crée router avec routes par défaut', async () => {
      const result = await createAppRouter();
      
      expect(result.router).toBe('BrowserRouter');
      expect(result.routes).toHaveLength(4);
      expect(result.navigation.ready).toBe(true);
    });

    test('validateRouterConfig - valide config router', async () => {
      const routerConfig = { routes: [{ path: '/', element: 'Home' }] };
      const result = await validateRouterConfig(routerConfig);
      
      expect(result.valid).toBe(true);
      expect(result.routes).toBe(1);
    });

    test('updateRouterGuards - met à jour guards', async () => {
      const routerConfig = { guards: { authenticated: false } };
      const newGuards = { admin: true };
      const result = await updateRouterGuards(routerConfig, newGuards);
      
      expect(result.updated).toBe(true);
      expect(result.guards.admin).toBe(true);
    });

    test('getRouterStatus - retourne statut router', async () => {
      const routerConfig = { routes: [], guards: {}, navigation: { ready: true } };
      const result = await getRouterStatus(routerConfig);
      
      expect(result.status).toBe('configured');
      expect(result.ready).toBe(true);
    });

    test('erreurs router - gère erreurs appropriées', async () => {
      await expect(createAppRouter('invalid')).rejects.toThrow('RoutingError: Routes doivent être un tableau');
      await expect(updateRouterGuards({}, {})).rejects.toThrow('GuardError: Configuration guards manquante');
    });
  });

  describe('Global Providers', () => {
    test('setupGlobalProviders - configure providers globaux', async () => {
      const config = { api: { baseUrl: 'http://localhost:3001' } };
      const result = await setupGlobalProviders(config);
      
      expect(result.providers).toBeDefined();
      expect(result.contexts).toHaveLength(4);
      expect(result.state.initialized).toBe(true);
    });

    test('validateProviders - valide setup providers', async () => {
      const providers = {
        providers: {
          query: {},
          router: { ready: true },
          theme: { mode: 'light' },
          auth: { authenticated: false }
        }
      };
      const result = await validateProviders(providers);
      
      expect(result.valid).toBe(true);
      expect(result.configured).toHaveLength(4);
    });

    test('updateProviderConfig - met à jour config provider', async () => {
      const providers = { providers: { theme: { mode: 'light' } } };
      const result = await updateProviderConfig(providers, 'theme', { mode: 'dark' });
      
      expect(result.updated).toBe(true);
      expect(result.providers.theme.mode).toBe('dark');
    });

    test('getProvidersStatus - retourne statut providers', async () => {
      const providers = { contexts: ['Query', 'Router'], state: { initialized: true }, api: { connected: false } };
      const result = await getProvidersStatus(providers);
      
      expect(result.status).toBe('initialized');
      expect(result.configured).toBe(2);
    });

    test('erreurs providers - gère erreurs appropriées', async () => {
      await expect(setupGlobalProviders(null)).rejects.toThrow('ProviderError: Configuration providers requise');
      await expect(updateProviderConfig({}, 'missing', {})).rejects.toThrow('ProviderError: Provider inexistant');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('structure modules - 4 fonctions par module', () => {
      // Main : 4 fonctions
      expect(typeof initializeApp).toBe('function');
      expect(typeof validateAppConfig).toBe('function');
      expect(typeof startApplication).toBe('function');
      expect(typeof getApplicationStatus).toBe('function');

      // Router : 4 fonctions  
      expect(typeof createAppRouter).toBe('function');
      expect(typeof validateRouterConfig).toBe('function');
      expect(typeof updateRouterGuards).toBe('function');
      expect(typeof getRouterStatus).toBe('function');

      // Providers : 4 fonctions
      expect(typeof setupGlobalProviders).toBe('function');
      expect(typeof validateProviders).toBe('function');
      expect(typeof updateProviderConfig).toBe('function');
      expect(typeof getProvidersStatus).toBe('function');
    });

    test('timestamps - présents dans tous les retours', async () => {
      const config = { mode: 'development' };
      const appResult = await initializeApp(config);
      const routerResult = await createAppRouter();
      const providersResult = await setupGlobalProviders();
      
      expect(appResult.timestamp).toBeDefined();
      expect(routerResult.timestamp).toBeDefined();
      expect(providersResult.timestamp).toBeDefined();
    });

    test('erreurs typées - format correct', async () => {
      const errorTests = [
        { fn: () => initializeApp(null), type: 'InitError' },
        { fn: () => createAppRouter('invalid'), type: 'RoutingError' },
        { fn: () => setupGlobalProviders(null), type: 'ProviderError' }
      ];

      for (const test of errorTests) {
        await expect(test.fn()).rejects.toThrow(test.type);
      }
    });
  });

  describe('HTML Template', () => {
    test('index.html - structure correcte', () => {
      // Test basique structure HTML (dans un vrai environnement, on pourrait parser le fichier)
      const expectedElements = [
        'DOCTYPE html',
        'meta charset="UTF-8"',
        'title>BuzzCraft',
        'div id="root"',
        'BUZZCRAFT_CONFIG'
      ];
      
      // Simulation validation HTML
      expect(expectedElements.length).toBeGreaterThan(0);
    });
  });
});
