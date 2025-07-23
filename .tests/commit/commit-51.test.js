/**
 * Tests COMMIT 51 - App Client Structure
 * Test des 4 modules : foundations, routing, providers, layouts
 */

import { describe, test, expect } from '@jest/globals';

// Import modules
import {
  initializeEnvironment,
  validateFoundations,
  configureClientFeatures,
  getFoundationStatus
} from '../../app-client/structure/foundations.js';

import {
  setupClientRouting,
  validateRoutes,
  navigateToRoute,
  getRoutingStatus
} from '../../app-client/structure/routing.js';

import {
  setupProviders,
  validateProviders,
  updateProviderState,
  getProvidersStatus
} from '../../app-client/structure/providers.js';

import {
  setupLayout,
  validateLayout,
  updateLayoutZone,
  getLayoutStatus
} from '../../app-client/structure/layouts.js';

describe('COMMIT 51 - App Client Structure', () => {

  describe('Foundations Module', () => {
    test('initializeEnvironment avec environment development', async () => {
      const result = await initializeEnvironment('development', {
        apiUrl: 'http://localhost:3001'
      });

      expect(result.initialized).toBe(true);
      expect(result.environment).toBe('development');
      expect(result.config.debug).toBe(true);
      expect(result.features.debugging).toBe(true);
      expect(result.features.router).toBe(true);
    });

    test('initializeEnvironment rejette environment invalide', async () => {
      await expect(
        initializeEnvironment('invalid-env')
      ).rejects.toThrow('EnvironmentError: Environment doit être development, staging, production');
    });

    test('validateFoundations valide foundations complètes', async () => {
      const foundations = {
        initialized: true,
        environment: 'development',
        config: { apiUrl: 'http://localhost:3001', wsUrl: 'ws://localhost:3001' },
        features: { router: true, stateManagement: true }
      };

      const result = await validateFoundations(foundations);

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('development');
      expect(result.issues).toEqual([]);
    });

    test('configureClientFeatures configure features correctement', async () => {
      const features = { router: true, analytics: false };
      const result = await configureClientFeatures(features);

      expect(result.configured).toBe(true);
      expect(result.features.router).toBe(true);
      expect(result.active).toContain('router');
      expect(result.count).toBeGreaterThan(0);
    });

    test('getFoundationStatus retourne status santé', async () => {
      const foundations = {
        initialized: true,
        environment: 'production',
        config: { apiUrl: 'https://api.buzzcraft.com' },
        features: { router: true }
      };

      const result = await getFoundationStatus(foundations);

      expect(result.status).toBe('healthy');
      expect(result.healthy).toBe(true);
      expect(result.environment).toBe('production');
    });
  });

  describe('Routing Module', () => {
    test('setupClientRouting configure routes par défaut', async () => {
      const result = await setupClientRouting();

      expect(result.router.initialized).toBe(true);
      expect(result.routes.length).toBeGreaterThan(0);
      expect(result.navigation.currentRoute).toBeDefined();
      expect(result.guards).toContain('auth');
    });

    test('validateRoutes valide routes correctement', async () => {
      const routes = [
        { path: '/', name: 'home', component: 'Home' },
        { path: '/about', name: 'about', component: 'About' }
      ];

      const result = await validateRoutes(routes);

      expect(result.valid).toBe(true);
      expect(result.routesCount).toBe(2);
      expect(result.issues).toEqual([]);
    });

    test('navigateToRoute navigue vers route valide', async () => {
      const result = await navigateToRoute('dashboard');

      expect(result.navigated).toBe(true);
      expect(result.route.name).toBe('dashboard');
      expect(result.navigation.success).toBe(true);
    });

    test('getRoutingStatus retourne status routing', async () => {
      const routingSetup = {
        router: { initialized: true },
        routes: [{ path: '/', name: 'home', component: 'Home' }],
        guards: ['auth']
      };

      const result = await getRoutingStatus(routingSetup);

      expect(result.status).toBe('healthy');
      expect(result.configured).toBe(true);
      expect(result.routesCount).toBe(1);
    });
  });

  describe('Providers Module', () => {
    test('setupProviders configure providers par défaut', async () => {
      const result = await setupProviders();

      expect(result.configured).toBe(true);
      expect(result.providers.length).toBeGreaterThan(0);
      expect(result.state.auth).toBeDefined();
      expect(result.state._metadata.initialized).toBe(true);
    });

    test('validateProviders valide providers correctement', async () => {
      const providerSetup = {
        providers: [
          { name: 'AuthProvider', required: true },
          { name: 'ThemeProvider', required: true }
        ],
        context: { count: 2 },
        state: { auth: {}, theme: {}, ui: {} }
      };

      const result = await validateProviders(providerSetup);

      expect(result.valid).toBe(true);
      expect(result.providersCount).toBe(2);
      expect(result.issues).toEqual([]);
    });

    test('updateProviderState met à jour state correctement', async () => {
      const result = await updateProviderState('auth.user', { id: 1, name: 'Test' });

      expect(result.updated).toBe(true);
      expect(result.path).toBe('auth.user');
      expect(result.state.success).toBe(true);
    });

    test('getProvidersStatus retourne status providers', async () => {
      // FIX: Setup complet qui passe la validation
      const providerSetup = {
        configured: true,
        providers: [
          { name: 'AuthProvider', required: true },
          { name: 'ThemeProvider', required: true }
        ],
        context: { count: 2 },
        services: { count: 3 },
        state: { 
          auth: { user: null }, 
          theme: { mode: 'light' },
          _metadata: { initialized: true } 
        }
      };

      const result = await getProvidersStatus(providerSetup);

      expect(result.status).toBe('healthy');
      expect(result.configured).toBe(true);
      expect(result.providers).toBe(2);
    });
  });

  describe('Layouts Module', () => {
    test('setupLayout configure layout par défaut', async () => {
      const result = await setupLayout();

      expect(result.layout.initialized).toBe(true);
      expect(result.zones.length).toBeGreaterThan(0);
      expect(result.navigation.enabled).toBe(true);
      expect(result.responsive.enabled).toBe(true);
    });

    test('validateLayout valide layout correctement', async () => {
      const layoutSetup = {
        layout: { name: 'main', type: 'dashboard' },
        zones: [
          { name: 'header', component: 'AppHeader' },
          { name: 'main', component: 'AppMain' }
        ],
        navigation: { enabled: true },
        responsive: { enabled: true }
      };

      const result = await validateLayout(layoutSetup);

      expect(result.valid).toBe(true);
      expect(result.layoutType).toBe('dashboard');
      expect(result.zonesCount).toBe(2);
    });

    test('updateLayoutZone met à jour zone correctement', async () => {
      const config = { width: '300px', collapsible: true };
      const result = await updateLayoutZone('sidebar', config);

      expect(result.updated).toBe(true);
      expect(result.zoneName).toBe('sidebar');
      expect(result.zone.success).toBe(true);
    });

    test('getLayoutStatus retourne status layout', async () => {
      const layoutSetup = {
        layout: { name: 'main' },
        zones: [{ name: 'header' }, { name: 'main' }],
        navigation: { enabled: true },
        responsive: { enabled: true, breakpoints: { sm: '576px' } }
      };

      const result = await getLayoutStatus(layoutSetup);

      expect(result.status).toBe('healthy');
      expect(result.configured).toBe(true);
      expect(result.zones).toBe(2);
    });
  });

  describe('Architecture Cohérence', () => {
    test('tous les modules exportent 4 fonctions', () => {
      // Foundations - 4 fonctions
      expect(typeof initializeEnvironment).toBe('function');
      expect(typeof validateFoundations).toBe('function');
      expect(typeof configureClientFeatures).toBe('function');
      expect(typeof getFoundationStatus).toBe('function');

      // Routing - 4 fonctions
      expect(typeof setupClientRouting).toBe('function');
      expect(typeof validateRoutes).toBe('function');
      expect(typeof navigateToRoute).toBe('function');
      expect(typeof getRoutingStatus).toBe('function');

      // Providers - 4 fonctions
      expect(typeof setupProviders).toBe('function');
      expect(typeof validateProviders).toBe('function');
      expect(typeof updateProviderState).toBe('function');
      expect(typeof getProvidersStatus).toBe('function');

      // Layouts - 4 fonctions
      expect(typeof setupLayout).toBe('function');
      expect(typeof validateLayout).toBe('function');
      expect(typeof updateLayoutZone).toBe('function');
      expect(typeof getLayoutStatus).toBe('function');
    });

    test('tous les modules utilisent erreurs typées cohérentes', async () => {
      // Foundations
      await expect(
        initializeEnvironment('invalid')
      ).rejects.toThrow('EnvironmentError:');

      // Routing
      await expect(
        setupClientRouting([])
      ).rejects.toThrow('RouteError:');

      // Providers
      await expect(
        setupProviders('invalid')
      ).rejects.toThrow('ProviderError:');

      // Layouts
      await expect(
        setupLayout('invalid')
      ).rejects.toThrow('LayoutError:');
    });

    test('modules retournent structures cohérentes', async () => {
      // Foundations
      const foundations = await initializeEnvironment('development');
      expect(foundations).toHaveProperty('initialized');
      expect(foundations).toHaveProperty('environment');
      expect(foundations).toHaveProperty('config');
      expect(foundations).toHaveProperty('features');

      // Routing
      const routing = await setupClientRouting();
      expect(routing).toHaveProperty('router');
      expect(routing).toHaveProperty('routes');
      expect(routing).toHaveProperty('navigation');
      expect(routing).toHaveProperty('guards');

      // Providers
      const providers = await setupProviders();
      expect(providers).toHaveProperty('providers');
      expect(providers).toHaveProperty('context');
      expect(providers).toHaveProperty('state');
      expect(providers).toHaveProperty('configured');

      // Layouts
      const layouts = await setupLayout();
      expect(layouts).toHaveProperty('layout');
      expect(layouts).toHaveProperty('zones');
      expect(layouts).toHaveProperty('navigation');
      expect(layouts).toHaveProperty('responsive');
    });

    test('fonctions status retournent format uniforme', async () => {
      // Test status foundations
      const foundationsStatus = await getFoundationStatus({
        initialized: true,
        environment: 'development',
        config: {},
        features: {}
      });
      expect(foundationsStatus).toHaveProperty('status');
      expect(foundationsStatus).toHaveProperty('healthy');
      expect(foundationsStatus).toHaveProperty('issues');

      // Test status routing
      const routingStatus = await getRoutingStatus({
        routes: [],
        config: {}
      });
      expect(routingStatus).toHaveProperty('status');
      expect(routingStatus).toHaveProperty('configured');
      expect(routingStatus).toHaveProperty('issues');

      // Test status providers
      const providersStatus = await getProvidersStatus({
        configured: true,
        providers: [],
        context: {},
        state: {}
      });
      expect(providersStatus).toHaveProperty('status');
      expect(providersStatus).toHaveProperty('configured');
      expect(providersStatus).toHaveProperty('issues');

      // Test status layouts
      const layoutsStatus = await getLayoutStatus({
        layout: { name: 'test' },
        zones: []
      });
      expect(layoutsStatus).toHaveProperty('status');
      expect(layoutsStatus).toHaveProperty('configured');
      expect(layoutsStatus).toHaveProperty('issues');
    });
  });

});
