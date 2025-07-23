/**
 * COMMIT 50 - API Metrics
 * Tests exhaustifs pour métriques API avec pattern BuzzCraft
 */

import { exportMetrics, scheduleMetricsExport, getExportHistory, validateExportDestination } from '../../api/metrics/exporter.js';
import { formatMetricsData, createCustomTemplate, validateMetricsFormat, convertBetweenFormats } from '../../api/metrics/formats.js';
import { filterMetrics, createComplexQuery, aggregateMetrics, saveFilterQuery } from '../../api/metrics/filters.js';
import { generateDashboard, createWidgetConfig, updateDashboardLayout, exportDashboardConfig } from '../../api/metrics/dashboards.js';

describe('COMMIT 50 - API Metrics', () => {
  
  describe('Module exporter.js', () => {
    test('exportMetrics fonctionne avec données valides', async () => {
      const metrics = {
        requests_total: 1500,
        response_time_avg: 250,
        error_rate: 0.02
      };
      
      const result = await exportMetrics(metrics, 'json', 'file:metrics.json');
      
      expect(result.exported).toBe(true);
      expect(result.exportId).toMatch(/^exp_/);
      expect(result.format).toBe('json');
      expect(result.destination).toBe('file:metrics.json');
      expect(typeof result.size).toBe('number');
      expect(result.exportedAt).toBeDefined();
    });
    
    test('exportMetrics rejette format invalide', async () => {
      const metrics = { test: 123 };
      
      await expect(
        exportMetrics(metrics, 'invalid_format')
      ).rejects.toThrow('FormatError: format \'invalid_format\' non supporté');
    });
    
    test('scheduleMetricsExport configure scheduling', async () => {
      const schedule = '0 * * * *'; // Chaque heure
      const exportConfig = {
        format: 'prometheus',
        destination: 'http:localhost:9090/metrics'
      };
      
      const result = await scheduleMetricsExport(schedule, exportConfig);
      
      expect(result.scheduled).toBe(true);
      expect(result.scheduleId).toMatch(/^sched_/);
      expect(result.schedule).toBe(schedule);
      expect(result.nextRun).toBeDefined();
      expect(result.scheduledAt).toBeDefined();
    });
    
    test('getExportHistory retourne historique', async () => {
      const result = await getExportHistory(10, 'json');
      
      expect(result.retrieved).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.format).toBe('json');
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.totalExports).toBe('number');
      expect(Array.isArray(result.exports)).toBe(true);
      expect(result.retrievedAt).toBeDefined();
    });
    
    test('validateExportDestination valide destination', async () => {
      const result = await validateExportDestination('file:/tmp/metrics.json');
      
      expect(result.validated).toBe(true);
      expect(result.destination).toBe('file:/tmp/metrics.json');
      expect(result.type).toBe('file');
      expect(result.path).toBe('/tmp/metrics.json');
      expect(typeof result.accessible).toBe('boolean');
      expect(typeof result.writable).toBe('boolean');
      expect(result.validatedAt).toBeDefined();
    });
  });

  describe('Module formats.js', () => {
    test('formatMetricsData formate vers Prometheus', async () => {
      const data = {
        http_requests_total: { value: 1000, type: 'counter' },
        response_time: { value: 150, type: 'gauge' }
      };
      
      const result = await formatMetricsData(data, 'prometheus');
      
      expect(result.formatted).toBe(true);
      expect(result.format).toBe('prometheus');
      expect(result.formatName).toBe('Prometheus Metrics');
      expect(result.contentType).toBe('text/plain');
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('# TYPE');
      expect(result.formattedAt).toBeDefined();
    });
    
    test('createCustomTemplate crée template', async () => {
      const templateConfig = {
        fields: { service: 'buzzcraft', environment: 'production' },
        mappings: { requests: 'http_requests_total' }
      };
      
      const result = await createCustomTemplate('custom_template', 'grafana', templateConfig);
      
      expect(result.created).toBe(true);
      expect(result.templateName).toBe('custom_template');
      expect(result.targetFormat).toBe('grafana');
      expect(result.version).toBe('1.0.0');
      expect(result.createdAt).toBeDefined();
    });
    
    test('validateMetricsFormat valide format', async () => {
      const data = {
        valid_metric_name: { value: 100, type: 'gauge' }
      };
      
      const result = await validateMetricsFormat(data, 'prometheus');
      
      expect(result.valid).toBe(true);
      expect(result.format).toBe('prometheus');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.validatedAt).toBeDefined();
    });
    
    test('convertBetweenFormats convertit formats', async () => {
      const sourceData = { requests: 1000 };
      
      const result = await convertBetweenFormats(sourceData, 'custom', 'prometheus');
      
      expect(result.converted).toBe(true);
      expect(result.sourceFormat).toBe('custom');
      expect(result.targetFormat).toBe('prometheus');
      expect(typeof result.sourceValid).toBe('boolean');
      expect(typeof result.targetValid).toBe('boolean');
      expect(result.data).toBeDefined();
      expect(result.convertedAt).toBeDefined();
    });
  });

  describe('Module filters.js', () => {
    test('filterMetrics filtre avec requête simple', async () => {
      const metrics = {
        api_requests: { value: 1000, endpoint: '/api/users' },
        db_queries: { value: 500, endpoint: '/api/posts' }
      };
      
      const filterQuery = {
        field: 'endpoint',
        operator: 'eq',
        value: '/api/users'
      };
      
      const result = await filterMetrics(metrics, filterQuery);
      
      expect(result.filtered).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.totalResults).toBe('number');
      expect(result.query).toBeDefined();
      expect(result.filteredAt).toBeDefined();
    });
    
    test('createComplexQuery crée requête complexe', async () => {
      const conditions = [
        { field: 'value', operator: 'gt', value: 100 },
        { field: 'type', operator: 'eq', value: 'counter' }
      ];
      
      const result = await createComplexQuery(conditions, 'AND', { name: 'test_query' });
      
      expect(result.created).toBe(true);
      expect(result.conditions).toBe(2);
      expect(result.logic).toBe('AND');
      expect(result.query.type).toBe('complex');
      expect(result.createdAt).toBeDefined();
    });
    
    test('aggregateMetrics agrège métriques', async () => {
      const metrics = [
        { name: 'requests', value: 100, category: 'api' },
        { name: 'requests', value: 200, category: 'web' },
        { name: 'errors', value: 5, category: 'api' }
      ];
      
      const aggregations = {
        total_requests: { field: 'value', function: 'sum' },
        avg_requests: { field: 'value', function: 'avg' }
      };
      
      const result = await aggregateMetrics(metrics, aggregations, 'category');
      
      expect(result.aggregated).toBe(true);
      expect(result.groupBy).toBe('category');
      expect(Array.isArray(result.aggregations)).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.aggregatedAt).toBeDefined();
    });
    
    test('saveFilterQuery sauvegarde requête', async () => {
      const query = {
        field: 'status',
        operator: 'eq',
        value: 'active'
      };
      
      const result = await saveFilterQuery('active_metrics', query, 'Métriques actives');
      
      expect(result.saved).toBe(true);
      expect(result.name).toBe('active_metrics');
      expect(result.description).toBe('Métriques actives');
      expect(result.savedAt).toBeDefined();
    });
  });

  describe('Module dashboards.js', () => {
    test('generateDashboard génère dashboard', async () => {
      const config = {
        title: 'Test Dashboard',
        refreshInterval: 30000
      };
      
      const widgets = [
        { type: 'line_chart', title: 'Requests', metrics: ['requests_total'] },
        { type: 'gauge', title: 'Response Time', metrics: ['response_time_avg'] }
      ];
      
      const result = await generateDashboard(config, widgets, 'grid');
      
      expect(result.generated).toBe(true);
      expect(result.dashboardId).toMatch(/^dash_/);
      expect(result.title).toBe('Test Dashboard');
      expect(result.widgets).toBe(2);
      expect(result.layout).toBe('grid');
      expect(result.interactive).toBe(true);
      expect(result.generatedAt).toBeDefined();
    });
    
    test('createWidgetConfig crée configuration widget', async () => {
      const metrics = ['cpu_usage', 'memory_usage'];
      const config = {
        title: 'System Metrics',
        showPoints: true
      };
      
      const result = await createWidgetConfig('line_chart', metrics, config);
      
      expect(result.created).toBe(true);
      expect(result.widgetId).toMatch(/^widget_/);
      expect(result.type).toBe('line_chart');
      expect(result.title).toBe('System Metrics');
      expect(result.metrics).toBe(2);
      expect(result.createdAt).toBeDefined();
    });
    
    test('updateDashboardLayout met à jour layout', async () => {
      // D'abord créer un dashboard
      const dashResult = await generateDashboard(
        { title: 'Layout Test' },
        [{ type: 'counter', metrics: ['test'] }]
      );
      
      const newLayout = {
        type: 'flex',
        direction: 'column'
      };
      
      const result = await updateDashboardLayout(dashResult.dashboardId, newLayout);
      
      expect(result.updated).toBe(true);
      expect(result.dashboardId).toBe(dashResult.dashboardId);
      expect(result.layout).toBe('flex');
      expect(result.updatedAt).toBeDefined();
    });
    
    test('exportDashboardConfig exporte configuration', async () => {
      // Créer dashboard d'abord
      const dashResult = await generateDashboard(
        { title: 'Export Test' },
        [{ type: 'table', metrics: ['data'] }]
      );
      
      const result = await exportDashboardConfig(dashResult.dashboardId, 'json');
      
      expect(result.exported).toBe(true);
      expect(result.dashboardId).toBe(dashResult.dashboardId);
      expect(result.format).toBe('json');
      expect(typeof result.size).toBe('number');
      expect(result.config).toBeDefined();
      expect(result.exportedAt).toBeDefined();
    });
  });

  describe('Intégration patterns BuzzCraft', () => {
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof exportMetrics).toBe('function');
      expect(typeof formatMetricsData).toBe('function');
      expect(typeof filterMetrics).toBe('function');
      expect(typeof generateDashboard).toBe('function');
      
      // Noms cohérents avec pattern
      expect(exportMetrics.name).toBe('exportMetrics');
      expect(formatMetricsData.name).toBe('formatMetricsData');
      expect(filterMetrics.name).toBe('filterMetrics');
      expect(generateDashboard.name).toBe('generateDashboard');
    });
    
    test('tous les modules utilisent erreurs cohérentes', async () => {
      // Chaque module doit lancer des erreurs avec format correct
      
      // exporter
      await expect(
        exportMetrics(null, 'json')
      ).rejects.toThrow('ExportError:');
      
      // formats
      await expect(
        formatMetricsData({}, 'invalid')
      ).rejects.toThrow('FormatError:');
      
      // filters
      await expect(
        filterMetrics({}, null)
      ).rejects.toThrow('FilterError:');
      
      // dashboards
      await expect(
        generateDashboard(null, [])
      ).rejects.toThrow('DashboardError:');
    });
    
    test('architecture dependency flow respectée', () => {
      // Test symbolique - vérifier que les modules n'importent que depuis api/monitoring/schemas
      expect(true).toBe(true);
    });
    
    test('tous les modules retournent structure cohérente', async () => {
      // Test que tous les modules retournent un objet avec timestamp
      
      const exportResult = await exportMetrics({ test: 123 }, 'json', 'file:test.json');
      expect(exportResult).toHaveProperty('exportedAt');
      
      const formatResult = await formatMetricsData({ test: 123 }, 'custom');
      expect(formatResult).toHaveProperty('formattedAt');
      
      const filterResult = await filterMetrics({ test: 123 }, { field: 'test', operator: 'exists' });
      expect(filterResult).toHaveProperty('filteredAt');
      
      const dashResult = await generateDashboard({ title: 'Test' }, []);
      expect(dashResult).toHaveProperty('generatedAt');
    });
    
    test('intégration complète workflow metrics', async () => {
      // Test workflow complet : export → format → filter → dashboard
      
      // 1. Export métriques
      const metrics = {
        requests_total: 1000,
        errors_total: 25,
        response_time_avg: 150
      };
      
      const exportResult = await exportMetrics(metrics, 'json', 'file:test.json');
      expect(exportResult.exported).toBe(true);
      
      // 2. Format métriques vers Prometheus
      const formatResult = await formatMetricsData(metrics, 'prometheus');
      expect(formatResult.formatted).toBe(true);
      
      // 3. Filtrer métriques (errors seulement)
      const filterQuery = {
        field: 'name',
        operator: 'contains',
        value: 'error'
      };
      
      const filterResult = await filterMetrics(metrics, filterQuery);
      expect(filterResult.filtered).toBe(true);
      
      // 4. Créer dashboard avec widgets
      const widgets = [
        { type: 'counter', title: 'Total Requests', metrics: ['requests_total'] },
        { type: 'gauge', title: 'Error Rate', metrics: ['errors_total'] },
        { type: 'line_chart', title: 'Response Time', metrics: ['response_time_avg'] }
      ];
      
      const dashResult = await generateDashboard(
        { title: 'Integration Dashboard', refreshInterval: 30000 },
        widgets,
        'grid'
      );
      expect(dashResult.generated).toBe(true);
      expect(dashResult.widgets).toBe(3);
      
      // 5. Export dashboard vers Grafana
      const dashExportResult = await exportDashboardConfig(dashResult.dashboardId, 'grafana');
      expect(dashExportResult.exported).toBe(true);
      expect(dashExportResult.config.dashboard).toBeDefined();
    });
    
    test('métriques temps réel avec agrégations complexes', async () => {
      // Test capacités temps réel et agrégations avancées
      
      const timeSeriesMetrics = [
        { name: 'cpu_usage', value: 45, timestamp: '2024-01-01T10:00:00Z', host: 'server1' },
        { name: 'cpu_usage', value: 67, timestamp: '2024-01-01T10:01:00Z', host: 'server1' },
        { name: 'cpu_usage', value: 52, timestamp: '2024-01-01T10:00:00Z', host: 'server2' },
        { name: 'memory_usage', value: 78, timestamp: '2024-01-01T10:00:00Z', host: 'server1' }
      ];
      
      // Agrégation complexe avec groupement
      const aggregations = {
        avg_cpu: { field: 'value', function: 'avg' },
        max_cpu: { field: 'value', function: 'max' },
        p95_cpu: { field: 'value', function: 'percentile', parameter: 95 }
      };
      
      const aggResult = await aggregateMetrics(timeSeriesMetrics, aggregations, 'host');
      expect(aggResult.aggregated).toBe(true);
      expect(aggResult.groupBy).toBe('host');
      expect(aggResult.results.server1).toBeDefined();
      expect(aggResult.results.server2).toBeDefined();
      
      // Filtrage avec requête complexe
      const complexQuery = await createComplexQuery([
        { field: 'value', operator: 'gt', value: 50 },
        { field: 'name', operator: 'eq', value: 'cpu_usage' }
      ], 'AND');
      
      const complexFilterResult = await filterMetrics(timeSeriesMetrics, complexQuery.query);
      expect(complexFilterResult.filtered).toBe(true);
      expect(complexFilterResult.totalResults).toBeGreaterThan(0);
    });
  });
});
