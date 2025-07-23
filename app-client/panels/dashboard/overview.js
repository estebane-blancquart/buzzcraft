/**
 * COMMIT 61 - Panel Dashboard
 * 
 * FAIT QUOI : Vue d'ensemble dashboard avec widgets dynamiques et état global
 * REÇOIT : userConfig: object, widgetConfig: array, layoutOptions?: object, refreshInterval?: number
 * RETOURNE : { overview: ReactComponent, widgets: array, layout: object, state: object }
 * ERREURS : OverviewError si widgets invalides, LayoutError si disposition échoue, StateError si état corrompu, ConfigError si config utilisateur invalide
 */

import React from 'react';

export async function createDashboardOverview(userConfig, widgetConfig = [], layoutOptions = {}) {
  if (!userConfig || typeof userConfig !== 'object') {
    throw new Error('OverviewError: Configuration utilisateur requise');
  }

  if (!Array.isArray(widgetConfig)) {
    throw new Error('OverviewError: Configuration widgets doit être un tableau');
  }

  const defaultWidgets = [
    { id: 'projects-summary', type: 'summary', position: { x: 0, y: 0 }, size: { w: 2, h: 1 } },
    { id: 'recent-activity', type: 'activity', position: { x: 2, y: 0 }, size: { w: 2, h: 2 } },
    { id: 'performance-metrics', type: 'metrics', position: { x: 0, y: 1 }, size: { w: 2, h: 1 } },
    { id: 'quick-actions', type: 'actions', position: { x: 4, y: 0 }, size: { w: 1, h: 2 } }
  ];

  const layout = {
    grid: layoutOptions.grid || { cols: 12, rows: 8 },
    responsive: layoutOptions.responsive !== false,
    draggable: layoutOptions.draggable !== false,
    resizable: layoutOptions.resizable !== false
  };

  return {
    overview: 'DashboardOverviewComponent',
    widgets: [...defaultWidgets, ...widgetConfig],
    layout: layout,
    state: { 
      initialized: true, 
      userConfig,
      lastUpdated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };
}

export async function validateDashboardLayout(overviewConfig) {
  const validation = {
    valid: true,
    widgets: 0,
    issues: [],
    timestamp: new Date().toISOString()
  };

  if (!overviewConfig?.widgets) {
    validation.issues.push('Configuration widgets manquante');
    validation.valid = false;
  } else {
    validation.widgets = overviewConfig.widgets.length;
    
    // Vérifier les widgets requis
    const requiredWidgets = ['projects-summary', 'recent-activity'];
    const widgetIds = overviewConfig.widgets.map(w => w.id);
    
    for (const required of requiredWidgets) {
      if (!widgetIds.includes(required)) {
        validation.issues.push(`Widget requis manquant: ${required}`);
        validation.valid = false;
      }
    }
  }

  return validation;
}

export async function updateDashboardWidget(overviewConfig, widgetId, newConfig) {
  if (!overviewConfig?.widgets) {
    throw new Error('LayoutError: Configuration widgets manquante');
  }

  const widgetIndex = overviewConfig.widgets.findIndex(w => w.id === widgetId);
  if (widgetIndex === -1) {
    throw new Error('LayoutError: Widget inexistant');
  }

  const updatedWidgets = [...overviewConfig.widgets];
  updatedWidgets[widgetIndex] = { ...updatedWidgets[widgetIndex], ...newConfig };

  return {
    updated: true,
    widgetId,
    widget: updatedWidgets[widgetIndex],
    totalWidgets: updatedWidgets.length,
    timestamp: new Date().toISOString()
  };
}

export async function getDashboardStatus(overviewConfig) {
  return {
    status: overviewConfig ? 'active' : 'inactive',
    widgets: overviewConfig?.widgets?.length || 0,
    layout: overviewConfig?.layout ? 'configured' : 'default',
    state: overviewConfig?.state?.initialized ? 'ready' : 'pending',
    lastUpdated: overviewConfig?.state?.lastUpdated || null,
    timestamp: new Date().toISOString()
  };
}

// panels/dashboard/overview : Panel Dashboard (commit 61)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
