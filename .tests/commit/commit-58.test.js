/**
 * TESTS COMMIT 58 - App Client Navigation
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Router
import {
  createRouter, navigateToRoute, resolveRoute, getRouterStatus
} from '../../app-client/navigation/router.js';

// Guards
import {
  createNavigationGuard, executeGuard, checkRouteAccess, getGuardStatus
} from '../../app-client/navigation/guards.js';

// Breadcrumbs
import {
  generateBreadcrumbs, formatBreadcrumb, updateBreadcrumbConfig, getBreadcrumbStatus
} from '../../app-client/navigation/breadcrumbs.js';

// History
import {
  createNavigationHistory, pushHistoryEntry, navigateHistory, getHistoryStatus
} from '../../app-client/navigation/history.js';

describe('COMMIT 58 - App Client Navigation', () => {

  describe('Router', () => {
    test('createRouter crée router avec routes par défaut', async () => {
      const result = await createRouter();
      expect(result.routes.length).toBeGreaterThan(0);
      expect(result.router.routes).toBeDefined();
    });

    test('navigateToRoute navigue vers route existante', async () => {
      const router = await createRouter();
      const result = await navigateToRoute(router.router, 'dashboard');
      expect(result.navigated).toBe(true);
      expect(result.route.name).toBe('dashboard');
    });

    test('resolveRoute résout path vers route', async () => {
      const router = await createRouter();
      const result = await resolveRoute(router.router, '/projects');
      expect(result.resolved).toBe(true);
    });

    test('rejette navigation vers route inexistante', async () => {
      const router = await createRouter();
      await expect(navigateToRoute(router.router, 'inexistante')).rejects.toThrow('RouteError');
    });
  });

  describe('Guards', () => {
    test('createNavigationGuard crée guard', async () => {
      const guardFn = () => ({ allowed: true });
      const result = await createNavigationGuard('test', guardFn);
      expect(result.created).toBe(true);
      expect(result.name).toBe('test');
    });

    test('executeGuard exécute guard auth', async () => {
      const guard = { name: 'auth', handler: null };
      const route = { name: 'dashboard' };
      const context = { user: { id: 1 }, token: 'abc' };
      
      const result = await executeGuard(guard, route, context);
      expect(result.executed).toBe(true);
      expect(result.allowed).toBe(true);
    });

    test('checkRouteAccess vérifie accès route', async () => {
      const route = { name: 'dashboard' };
      const guards = [{ name: 'auth' }];
      const context = { user: { id: 1 }, token: 'abc' };
      
      const result = await checkRouteAccess(route, guards, context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Breadcrumbs', () => {
    test('generateBreadcrumbs génère breadcrumbs pour route', async () => {
      const route = { name: 'projects', path: '/projects' };
      const result = await generateBreadcrumbs(route);
      expect(result.breadcrumbs.length).toBeGreaterThan(0);
      expect(result.route).toBe('projects');
    });

    test('formatBreadcrumb formate breadcrumb', async () => {
      const breadcrumb = { name: 'Accueil', path: '/', icon: 'home' };
      const result = await formatBreadcrumb(breadcrumb);
      expect(result.formatted).toBe('Accueil');
    });

    test('updateBreadcrumbConfig met à jour config', async () => {
      const config = { separator: '/' };
      const updates = { separator: '>' };
      const result = await updateBreadcrumbConfig(config, updates);
      expect(result.updated).toBe(true);
      expect(result.config.separator).toBe('>');
    });
  });

  describe('History', () => {
    test('createNavigationHistory crée historique', async () => {
      const result = await createNavigationHistory();
      expect(result.canGoBack).toBe(false);
      expect(result.canGoForward).toBe(false);
    });

    test('pushHistoryEntry ajoute entrée', async () => {
      const history = await createNavigationHistory();
      const entry = { route: 'dashboard', path: '/' };
      const result = await pushHistoryEntry(history.history, entry);
      expect(result.pushed).toBe(true);
      expect(result.stackSize).toBe(1);
    });

    test('navigateHistory navigue dans historique', async () => {
      const history = await createNavigationHistory();
      await pushHistoryEntry(history.history, { route: 'dashboard' });
      await pushHistoryEntry(history.history, { route: 'projects' });
      
      const result = await navigateHistory(history.history, 'back');
      expect(result.navigated).toBe(true);
      expect(result.direction).toBe('back');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Router
      expect(typeof createRouter).toBe('function');
      expect(typeof navigateToRoute).toBe('function');
      expect(typeof resolveRoute).toBe('function');
      expect(typeof getRouterStatus).toBe('function');

      // Guards
      expect(typeof createNavigationGuard).toBe('function');
      expect(typeof executeGuard).toBe('function');
      expect(typeof checkRouteAccess).toBe('function');
      expect(typeof getGuardStatus).toBe('function');

      // Breadcrumbs
      expect(typeof generateBreadcrumbs).toBe('function');
      expect(typeof formatBreadcrumb).toBe('function');
      expect(typeof updateBreadcrumbConfig).toBe('function');
      expect(typeof getBreadcrumbStatus).toBe('function');

      // History
      expect(typeof createNavigationHistory).toBe('function');
      expect(typeof pushHistoryEntry).toBe('function');
      expect(typeof navigateHistory).toBe('function');
      expect(typeof getHistoryStatus).toBe('function');
    });

    test('erreurs typées cohérentes', async () => {
      await expect(createRouter('invalid')).rejects.toThrow('RouterError');
      await expect(createNavigationGuard('')).rejects.toThrow('GuardError');
      await expect(generateBreadcrumbs(null)).rejects.toThrow('BreadcrumbError');
      await expect(createNavigationHistory(-1)).rejects.toThrow('HistoryError');
    });

    test('structure retour avec timestamp', async () => {
      const routerResult = await createRouter();
      expect(routerResult.timestamp).toBeDefined();

      const historyResult = await createNavigationHistory();
      expect(historyResult.timestamp).toBeDefined();
    });
  });

});
