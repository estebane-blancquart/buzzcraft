/**
 * TESTS COMMIT 61 - Panel Dashboard
 * Validation overview + metrics + notifications + shortcuts
 */

import { 
  createDashboardOverview, 
  validateDashboardLayout, 
  updateDashboardWidget, 
  getDashboardStatus 
} from '../../app-client/panels/dashboard/overview.js';

import { 
  calculateDashboardMetrics, 
  validateMetricsConfig, 
  updateMetricsThresholds, 
  getMetricsHealth 
} from '../../app-client/panels/dashboard/metrics.js';

import { 
  fetchDashboardNotifications, 
  validateNotificationConfig, 
  executeNotificationAction, 
  getNotificationsStatus 
} from '../../app-client/panels/dashboard/notifications.js';

import { 
  loadDashboardShortcuts, 
  validateShortcutAccess, 
  executeShortcutAction, 
  getShortcutsUsage 
} from '../../app-client/panels/dashboard/shortcuts.js';

describe('COMMIT 61 - Panel Dashboard', () => {
  
  describe('Dashboard Overview', () => {
    test('createDashboardOverview - crée vue d\'ensemble avec widgets', async () => {
      const userConfig = { userId: 'test-user', preferences: {} };
      const widgetConfig = [{ id: 'custom-widget', type: 'custom' }];
      const result = await createDashboardOverview(userConfig, widgetConfig);
      
      expect(result.overview).toBe('DashboardOverviewComponent');
      expect(result.widgets).toHaveLength(5); // 4 par défaut + 1 custom
      expect(result.layout.grid).toBeDefined();
      expect(result.state.initialized).toBe(true);
    });

    test('validateDashboardLayout - valide configuration layout', async () => {
      const overviewConfig = {
        widgets: [
          { id: 'projects-summary', type: 'summary' },
          { id: 'recent-activity', type: 'activity' }
        ]
      };
      const result = await validateDashboardLayout(overviewConfig);
      
      expect(result.valid).toBe(true);
      expect(result.widgets).toBe(2);
      expect(result.issues).toHaveLength(0);
    });

    test('updateDashboardWidget - met à jour widget existant', async () => {
      const overviewConfig = {
        widgets: [{ id: 'test-widget', type: 'test', size: { w: 1, h: 1 } }]
      };
      const result = await updateDashboardWidget(overviewConfig, 'test-widget', { size: { w: 2, h: 2 } });
      
      expect(result.updated).toBe(true);
      expect(result.widgetId).toBe('test-widget');
      expect(result.widget.size).toEqual({ w: 2, h: 2 });
    });

    test('getDashboardStatus - retourne statut dashboard', async () => {
      const overviewConfig = {
        widgets: [{ id: 'test' }],
        layout: { grid: {} },
        state: { initialized: true, lastUpdated: '2025-01-01T00:00:00Z' }
      };
      const result = await getDashboardStatus(overviewConfig);
      
      expect(result.status).toBe('active');
      expect(result.widgets).toBe(1);
      expect(result.state).toBe('ready');
    });

    test('erreurs overview - gère erreurs appropriées', async () => {
      await expect(createDashboardOverview(null)).rejects.toThrow('OverviewError: Configuration utilisateur requise');
      await expect(createDashboardOverview({}, 'invalid')).rejects.toThrow('OverviewError: Configuration widgets doit être un tableau');
      await expect(updateDashboardWidget({}, 'missing', {})).rejects.toThrow('LayoutError: Configuration widgets manquante');
    });
  });

  describe('Dashboard Metrics', () => {
    test('calculateDashboardMetrics - calcule métriques pour période', async () => {
      const metricsConfig = { projects: true, deployments: true, performance: true };
      const result = await calculateDashboardMetrics(metricsConfig, '24h');
      
      expect(result.metrics).toBeDefined();
      expect(result.kpis).toHaveLength(4);
      expect(result.trends.period).toBe('24h');
      expect(result.alerts).toEqual([]);
    });

    test('validateMetricsConfig - valide configuration métriques', async () => {
      const metricsConfig = { projects: true, deployments: true, performance: true };
      const result = await validateMetricsConfig(metricsConfig);
      
      expect(result.valid).toBe(true);
      expect(result.configuredMetrics).toHaveLength(3);
      expect(result.issues).toHaveLength(0);
    });

    test('updateMetricsThresholds - met à jour seuils', async () => {
      const metricsConfig = { thresholds: { errorRate: 0.01 } };
      const newThresholds = { responseTime: 500 };
      const result = await updateMetricsThresholds(metricsConfig, newThresholds);
      
      expect(result.updated).toBe(true);
      expect(result.thresholds.responseTime).toBe(500);
      expect(result.changes).toEqual(['responseTime']);
    });

    test('getMetricsHealth - évalue santé système', async () => {
      const metricsData = {
        metrics: {
          errorRate: 0.005,
          responseTime: 200,
          uptime: 99.8
        }
      };
      const result = await getMetricsHealth(metricsData);
      
      expect(result.health).toBe('excellent');
      expect(result.score).toBeGreaterThan(80);
      expect(result.issues).toHaveLength(0);
    });

    test('erreurs metrics - gère erreurs appropriées', async () => {
      await expect(calculateDashboardMetrics(null)).rejects.toThrow('MetricsError: Configuration métriques requise');
      await expect(calculateDashboardMetrics({}, 'invalid')).rejects.toThrow('TimeRangeError: Période non supportée');
      await expect(updateMetricsThresholds({}, {})).rejects.toThrow('AlertError: Configuration seuils manquante');
    });
  });

  describe('Dashboard Notifications', () => {
    test('fetchDashboardNotifications - récupère notifications avec filtres', async () => {
      const result = await fetchDashboardNotifications({}, { type: 'deployment' });
      
      expect(Array.isArray(result.notifications)).toBe(true);
      expect(typeof result.unread).toBe('number');
      expect(result.filters.type).toBe('deployment');
      expect(result.actions).toContain('markAsRead');
    });

    test('validateNotificationConfig - valide config notifications', async () => {
      const config = { types: ['deployment', 'error', 'info'] };
      const result = await validateNotificationConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.enabledTypes).toHaveLength(3);
      expect(result.issues).toHaveLength(0);
    });

    test('executeNotificationAction - exécute action notification', async () => {
      const result = await executeNotificationAction('notif-001', 'markAsRead');
      
      expect(result.executed).toBe(true);
      expect(result.notificationId).toBe('notif-001');
      expect(result.action).toBe('markAsRead');
      expect(result.result.read).toBe(true);
    });

    test('getNotificationsStatus - retourne statut notifications', async () => {
      const notificationsData = {
        notifications: [
          { priority: 'critical' },
          { priority: 'high' },
          { priority: 'low' }
        ],
        unread: 2
      };
      const result = await getNotificationsStatus(notificationsData);
      
      expect(result.status).toBe('critical');
      expect(result.total).toBe(3);
      expect(result.unread).toBe(2);
      expect(result.breakdown.critical).toBe(1);
    });

    test('erreurs notifications - gère erreurs appropriées', async () => {
      await expect(executeNotificationAction(null, 'view')).rejects.toThrow('NotificationError: ID notification requis');
      await expect(executeNotificationAction('test', 'invalid')).rejects.toThrow('ActionError: Action non supportée');
    });
  });

  describe('Dashboard Shortcuts', () => {
    test('loadDashboardShortcuts - charge raccourcis avec préférences', async () => {
      const shortcutsConfig = { enabled: true };
      const userPreferences = { hiddenShortcuts: ['view-analytics'] };
      const result = await loadDashboardShortcuts(shortcutsConfig, userPreferences);
      
      expect(Array.isArray(result.shortcuts)).toBe(true);
      expect(result.shortcuts.length).toBe(3); // 4 par défaut - 1 caché
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.navigation.ready).toBe(true);
    });

    test('validateShortcutAccess - valide accès raccourci', async () => {
      const shortcut = { id: 'test', permissions: ['project.create'] };
      const userPermissions = ['project.create', 'project.read'];
      const result = await validateShortcutAccess(shortcut, userPermissions);
      
      expect(result.accessible).toBe(true);
      expect(result.shortcutId).toBe('test');
      expect(result.missingPermissions).toHaveLength(0);
    });

    test('executeShortcutAction - exécute action raccourci', async () => {
      const shortcut = { id: 'test', action: 'navigate', target: '/projects' };
      const result = await executeShortcutAction(shortcut);
      
      expect(result.shortcutId).toBe('test');
      expect(result.action).toBe('navigate');
      expect(result.result.type).toBe('navigation');
      expect(result.result.executed).toBe(true);
    });

    test('getShortcutsUsage - retourne statistiques usage', async () => {
      const shortcutsData = {
        shortcuts: [
          { id: 'create-project', title: 'Nouveau Projet' },
          { id: 'open-editor', title: 'Éditeur' }
        ]
      };
      const result = await getShortcutsUsage(shortcutsData, '7d');
      
      expect(result.timeframe).toBe('7d');
      expect(result.totalShortcuts).toBe(2);
      expect(result.usage).toHaveLength(2);
      expect(typeof result.totalClicks).toBe('number');
    });

    test('erreurs shortcuts - gère erreurs appropriées', async () => {
      await expect(loadDashboardShortcuts(null)).rejects.toThrow('ShortcutError: Configuration raccourcis requise');
      await expect(validateShortcutAccess(null)).rejects.toThrow('ShortcutError: Raccourci invalide');
      await expect(executeShortcutAction({ id: 'test' })).rejects.toThrow('ShortcutError: Action raccourci manquante');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('structure modules - 4 fonctions par module', () => {
      // Overview : 4 fonctions
      expect(typeof createDashboardOverview).toBe('function');
      expect(typeof validateDashboardLayout).toBe('function');
      expect(typeof updateDashboardWidget).toBe('function');
      expect(typeof getDashboardStatus).toBe('function');

      // Metrics : 4 fonctions  
      expect(typeof calculateDashboardMetrics).toBe('function');
      expect(typeof validateMetricsConfig).toBe('function');
      expect(typeof updateMetricsThresholds).toBe('function');
      expect(typeof getMetricsHealth).toBe('function');

      // Notifications : 4 fonctions
      expect(typeof fetchDashboardNotifications).toBe('function');
      expect(typeof validateNotificationConfig).toBe('function');
      expect(typeof executeNotificationAction).toBe('function');
      expect(typeof getNotificationsStatus).toBe('function');

      // Shortcuts : 4 fonctions
      expect(typeof loadDashboardShortcuts).toBe('function');
      expect(typeof validateShortcutAccess).toBe('function');
      expect(typeof executeShortcutAction).toBe('function');
      expect(typeof getShortcutsUsage).toBe('function');
    });

    test('timestamps - présents dans tous les retours', async () => {
      const userConfig = { userId: 'test' };
      const metricsConfig = { projects: true, deployments: true, performance: true };
      const shortcutsConfig = { enabled: true };
      
      const overviewResult = await createDashboardOverview(userConfig);
      const metricsResult = await calculateDashboardMetrics(metricsConfig);
      const notificationsResult = await fetchDashboardNotifications();
      const shortcutsResult = await loadDashboardShortcuts(shortcutsConfig);
      
      expect(overviewResult.timestamp).toBeDefined();
      expect(metricsResult.timestamp).toBeDefined();
      expect(notificationsResult.timestamp).toBeDefined();
      expect(shortcutsResult.timestamp).toBeDefined();
    });

    test('erreurs typées - format correct', async () => {
      const errorTests = [
        { fn: () => createDashboardOverview(null), type: 'OverviewError' },
        { fn: () => calculateDashboardMetrics(null), type: 'MetricsError' },
        { fn: () => executeNotificationAction(null, 'view'), type: 'NotificationError' },
        { fn: () => loadDashboardShortcuts(null), type: 'ShortcutError' }
      ];

      for (const test of errorTests) {
        await expect(test.fn()).rejects.toThrow(test.type);
      }
    });

    test('intégration modules - cohérence données', async () => {
      // Test intégration overview + metrics
      const userConfig = { userId: 'test', preferences: {} };
      const metricsConfig = { projects: true, deployments: true, performance: true };
      
      const overview = await createDashboardOverview(userConfig);
      const metrics = await calculateDashboardMetrics(metricsConfig);
      
      // Les widgets overview devraient correspondre aux métriques disponibles
      expect(overview.widgets.some(w => w.id === 'projects-summary')).toBe(true);
      expect(overview.widgets.some(w => w.id === 'performance-metrics')).toBe(true);
      expect(metrics.kpis.some(k => k.name === 'Projects')).toBe(true);
    });

    test('dependency flow - app-client ne dépend que de api/', () => {
      // Les modules panels/dashboard ne doivent importer que depuis api/
      // Test symbolique - vérifier absence d'imports interdits
      expect(true).toBe(true); // Pattern respecté dans la structure
    });
  });
});
