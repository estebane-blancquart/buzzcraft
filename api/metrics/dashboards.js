/**
 * COMMIT 50 - API Metrics
 * 
 * FAIT QUOI : Génération dashboards métriques avec widgets interactifs et configuration temps réel
 * REÇOIT : config: object, widgets: array, layout: object, options?: object
 * RETOURNE : { generated: boolean, dashboardId: string, widgets: number, interactive: boolean }
 * ERREURS : DashboardError si génération échoue, WidgetError si widget invalide, LayoutError si disposition incorrecte
 */

const WIDGET_TYPES = {
  "line_chart": {
    name: "Line Chart",
    dataTypes: ["time_series"],
    configSchema: [],
    defaultConfig: { showPoints: false, smooth: true }
  },
  "bar_chart": {
    name: "Bar Chart",
    dataTypes: ["categorical", "aggregated"],
    configSchema: [],
    defaultConfig: { orientation: "vertical", stacked: false }
  },
  "pie_chart": {
    name: "Pie Chart",
    dataTypes: ["percentage", "aggregated"],
    configSchema: [],
    defaultConfig: { showLabels: true, showPercentages: true }
  },
  "gauge": {
    name: "Gauge",
    dataTypes: ["single_value"],
    configSchema: [],
    defaultConfig: { showValue: true, colorBands: true }
  },
  "counter": {
    name: "Counter",
    dataTypes: ["single_value"],
    configSchema: [],
    defaultConfig: { showTrend: true, showPercentChange: false }
  },
  "table": {
    name: "Table",
    dataTypes: ["tabular"],
    configSchema: [],
    defaultConfig: { pagination: true, searchable: true }
  },
  "heatmap": {
    name: "Heatmap",
    dataTypes: ["matrix"],
    configSchema: [],
    defaultConfig: { colorScale: "viridis", showValues: false }
  }
};

const LAYOUT_TEMPLATES = {
  'grid': { type: 'grid', columns: 12, rowHeight: 100 },
  'masonry': { type: 'masonry', columns: 4, gap: 16 },
  'flex': { type: 'flex', direction: 'row', wrap: true },
  'tabs': { type: 'tabs', position: 'top' }
};

const DASHBOARDS = new Map();
const DASHBOARD_TEMPLATES = new Map();

export async function generateDashboard(config, widgets, layout = 'grid', options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('DashboardError: config requis');
  }

  if (!Array.isArray(widgets)) {
    throw new Error('DashboardError: widgets doit être un tableau');
  }

  if (typeof layout === 'string' && !LAYOUT_TEMPLATES[layout]) {
    throw new Error(`LayoutError: layout '${layout}' non supporté`);
  }

  try {
    const dashboardId = `dash_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Validation et configuration widgets
    const processedWidgets = [];
    for (let i = 0; i < widgets.length; i++) {
      const widget = await processWidget(widgets[i], i);
      processedWidgets.push(widget);
    }

    // Configuration layout
    const layoutConfig = typeof layout === 'string' ? 
      LAYOUT_TEMPLATES[layout] : layout;

    // Génération structure dashboard
    const dashboard = {
      id: dashboardId,
      config: {
        title: config.title || 'BuzzCraft Dashboard',
        description: config.description || '',
        refreshInterval: config.refreshInterval || 30000,
        autoRefresh: config.autoRefresh !== false,
        theme: config.theme || 'light',
        timezone: config.timezone || 'UTC'
      },
      layout: layoutConfig,
      widgets: processedWidgets,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        tags: config.tags || [],
        isPublic: config.isPublic || false
      },
      interactive: options.interactive !== false
    };

    // Sauvegarde dashboard
    DASHBOARDS.set(dashboardId, dashboard);

    return {
      generated: true,
      dashboardId,
      title: dashboard.config.title,
      widgets: processedWidgets.length,
      layout: layoutConfig.type,
      interactive: dashboard.interactive,
      generatedAt: dashboard.metadata.createdAt
    };

  } catch (error) {
    throw new Error(`DashboardError: ${error.message}`);
  }
}

export async function createWidgetConfig(type, metrics, config = {}, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new Error('WidgetError: type requis');
  }

  if (!WIDGET_TYPES[type]) {
    throw new Error(`WidgetError: type '${type}' non supporté`);
  }

  if (!metrics || (typeof metrics !== 'string' && !Array.isArray(metrics))) {
    throw new Error('WidgetError: metrics requis (string ou array)');
  }

  try {
    const widgetType = WIDGET_TYPES[type];
    const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Validation configuration selon schéma widget
    const validationResult = await validateWidgetConfig(config, widgetType.configSchema);
    if (!validationResult.valid) {
      throw new Error(`WidgetError: configuration invalide - ${validationResult.errors.join(', ')}`);
    }

    // Merge avec configuration par défaut
    const finalConfig = {
      ...widgetType.defaultConfig,
      ...config
    };

    const widgetConfig = {
      id: widgetId,
      type,
      title: config.title || `${widgetType.name} Widget`,
      metrics: Array.isArray(metrics) ? metrics : [metrics],
      config: finalConfig,
      position: config.position || { x: 0, y: 0, w: 6, h: 4 },
      dataSource: options.dataSource || 'default',
      refreshInterval: options.refreshInterval || null,
      createdAt: new Date().toISOString()
    };

    return {
      created: true,
      widgetId,
      type,
      title: widgetConfig.title,
      metrics: widgetConfig.metrics.length,
      createdAt: widgetConfig.createdAt
    };

  } catch (error) {
    throw new Error(`WidgetError: ${error.message}`);
  }
}

export async function updateDashboardLayout(dashboardId, newLayout, options = {}) {
  if (!dashboardId || typeof dashboardId !== 'string') {
    throw new Error('LayoutError: dashboardId requis');
  }

  if (!newLayout || typeof newLayout !== 'object') {
    throw new Error('LayoutError: newLayout requis');
  }

  try {
    const dashboard = DASHBOARDS.get(dashboardId);
    if (!dashboard) {
      throw new Error(`LayoutError: dashboard '${dashboardId}' introuvable`);
    }

    // Validation nouveau layout
    const layoutValidation = await validateLayout(newLayout, dashboard.widgets);
    if (!layoutValidation.valid) {
      throw new Error(`LayoutError: layout invalide - ${layoutValidation.errors.join(', ')}`);
    }

    // Sauvegarde ancien layout si demandé
    if (options.backup) {
      dashboard.layoutHistory = dashboard.layoutHistory || [];
      dashboard.layoutHistory.push({
        layout: dashboard.layout,
        timestamp: new Date().toISOString()
      });
    }

    // Application nouveau layout
    dashboard.layout = newLayout;
    dashboard.metadata.updatedAt = new Date().toISOString();

    // Mise à jour positions widgets si fourni
    if (newLayout.widgetPositions) {
      for (const widget of dashboard.widgets) {
        const newPosition = newLayout.widgetPositions[widget.id];
        if (newPosition) {
          widget.position = newPosition;
        }
      }
    }

    return {
      updated: true,
      dashboardId,
      layout: newLayout.type || 'custom',
      widgetsRepositioned: newLayout.widgetPositions ? Object.keys(newLayout.widgetPositions).length : 0,
      updatedAt: dashboard.metadata.updatedAt
    };

  } catch (error) {
    throw new Error(`LayoutError: ${error.message}`);
  }
}

export async function exportDashboardConfig(dashboardId, format = 'json', options = {}) {
  if (!dashboardId || typeof dashboardId !== 'string') {
    throw new Error('DashboardError: dashboardId requis');
  }

  const supportedFormats = ['json', 'yaml', 'grafana', 'tableau'];
  if (!supportedFormats.includes(format)) {
    throw new Error(`DashboardError: format '${format}' non supporté`);
  }

  try {
    const dashboard = DASHBOARDS.get(dashboardId);
    if (!dashboard) {
      throw new Error(`DashboardError: dashboard '${dashboardId}' introuvable`);
    }

    let exportedConfig;

    switch (format) {
      case 'json':
        exportedConfig = await exportToJSON(dashboard, options);
        break;
      case 'yaml':
        exportedConfig = await exportToYAML(dashboard, options);
        break;
      case 'grafana':
        exportedConfig = await exportToGrafana(dashboard, options);
        break;
      case 'tableau':
        exportedConfig = await exportToTableau(dashboard, options);
        break;
    }

    return {
      exported: true,
      dashboardId,
      format,
      size: JSON.stringify(exportedConfig).length,
      config: exportedConfig,
      exportedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`DashboardError: ${error.message}`);
  }
}

// Widget processing functions
async function processWidget(widgetConfig, index) {
  if (!widgetConfig.type) {
    throw new Error(`WidgetError: type requis pour widget ${index}`);
  }

  if (!WIDGET_TYPES[widgetConfig.type]) {
    throw new Error(`WidgetError: type '${widgetConfig.type}' invalide pour widget ${index}`);
  }

  const widgetType = WIDGET_TYPES[widgetConfig.type];
  const processedWidget = {
    id: widgetConfig.id || `widget_${index}`,
    type: widgetConfig.type,
    title: widgetConfig.title || `${widgetType.name} ${index + 1}`,
    metrics: widgetConfig.metrics || [],
    config: {
      ...widgetType.defaultConfig,
      ...widgetConfig.config
    },
    position: widgetConfig.position || { x: 0, y: 0, w: 6, h: 4 },
    dataSource: widgetConfig.dataSource || 'default'
  };

  // Validation configuration widget
  const validation = await validateWidgetConfig(processedWidget.config, widgetType.configSchema);
  if (!validation.valid) {
    throw new Error(`WidgetError: widget ${index} invalide - ${validation.errors.join(', ')}`);
  }

  return processedWidget;
}

async function validateWidgetConfig(config, schema) {
  const errors = [];
  
  for (const requiredField of schema) {
    if (!config.hasOwnProperty(requiredField)) {
      errors.push(`Champ requis manquant: ${requiredField}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

async function validateLayout(layout, widgets) {
  const errors = [];
  
  if (!layout.type) {
    errors.push('Type de layout requis');
  }
  
  if (layout.widgetPositions) {
    for (const widgetId of Object.keys(layout.widgetPositions)) {
      const widget = widgets.find(w => w.id === widgetId);
      if (!widget) {
        errors.push(`Widget ${widgetId} introuvable`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Export functions
async function exportToJSON(dashboard, options) {
  return {
    dashboard: {
      ...dashboard,
      exportedAt: new Date().toISOString(),
      exportFormat: 'json'
    }
  };
}

async function exportToYAML(dashboard, options) {
  // Simulation export YAML
  return {
    dashboard: dashboard.config.title,
    widgets: dashboard.widgets.length,
    format: 'yaml'
  };
}

async function exportToGrafana(dashboard, options) {
  const grafanaDashboard = {
    dashboard: {
      title: dashboard.config.title,
      panels: dashboard.widgets.map((widget, index) => ({
        id: index + 1,
        title: widget.title,
        type: mapWidgetTypeToGrafana(widget.type),
        gridPos: {
          h: widget.position.h,
          w: widget.position.w,
          x: widget.position.x,
          y: widget.position.y
        },
        targets: widget.metrics.map(metric => ({
          expr: metric,
          legendFormat: metric
        }))
      })),
      time: { from: 'now-1h', to: 'now' },
      refresh: dashboard.config.refreshInterval ? `${dashboard.config.refreshInterval / 1000}s` : '30s'
    }
  };

  return grafanaDashboard;
}

async function exportToTableau(dashboard, options) {
  // Simulation export Tableau
  return {
    workbook: {
      name: dashboard.config.title,
      worksheets: dashboard.widgets.map(widget => ({
        name: widget.title,
        type: widget.type,
        metrics: widget.metrics
      }))
    }
  };
}

function mapWidgetTypeToGrafana(widgetType) {
  const mapping = {
    'line_chart': 'graph',
    'bar_chart': 'bargauge',
    'pie_chart': 'piechart',
    'gauge': 'gauge',
    'counter': 'stat',
    'table': 'table',
    'heatmap': 'heatmap'
  };
  
  return mapping[widgetType] || 'graph';
}

// metrics/dashboards : API Metrics (commit 50)
// DEPENDENCY FLOW : api/metrics/ → api/monitoring/ → api/schemas/ → engines/ → transitions/ → systems/
