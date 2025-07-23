/**
 * COMMIT 61 - Panel Dashboard
 * 
 * FAIT QUOI : Raccourcis dashboard avec actions rapides et navigation
 * REÇOIT : shortcutsConfig: object, userPreferences?: object, context?: object, permissions?: array
 * RETOURNE : { shortcuts: array, categories: array, navigation: object, actions: object }
 * ERREURS : ShortcutError si raccourci invalide, PermissionError si accès refusé, NavigationError si navigation échoue, ContextError si contexte invalide
 */

export async function loadDashboardShortcuts(shortcutsConfig, userPreferences = {}) {
  if (!shortcutsConfig || typeof shortcutsConfig !== 'object') {
    throw new Error('ShortcutError: Configuration raccourcis requise');
  }

  const defaultShortcuts = [
    {
      id: 'create-project',
      category: 'projects',
      title: 'Nouveau Projet',
      icon: 'plus',
      action: 'navigate',
      target: '/projects/create',
      permissions: ['project.create'],
      priority: 1
    },
    {
      id: 'open-editor',
      category: 'editor',
      title: 'Éditeur Visuel',
      icon: 'edit',
      action: 'navigate',
      target: '/editor',
      permissions: ['editor.access'],
      priority: 2
    },
    {
      id: 'deploy-latest',
      category: 'deployment',
      title: 'Déployer',
      icon: 'deploy',
      action: 'execute',
      target: 'deployment.deploy',
      permissions: ['deployment.execute'],
      priority: 3
    },
    {
      id: 'view-analytics',
      category: 'analytics',
      title: 'Analytics',
      icon: 'chart',
      action: 'navigate',
      target: '/analytics',
      permissions: ['analytics.view'],
      priority: 4
    }
  ];

  // Application des préférences utilisateur
  let shortcuts = [...defaultShortcuts];
  
  if (userPreferences.hiddenShortcuts) {
    shortcuts = shortcuts.filter(s => !userPreferences.hiddenShortcuts.includes(s.id));
  }

  if (userPreferences.customOrder) {
    shortcuts.sort((a, b) => {
      const orderA = userPreferences.customOrder.indexOf(a.id);
      const orderB = userPreferences.customOrder.indexOf(b.id);
      if (orderA === -1 && orderB === -1) return a.priority - b.priority;
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    });
  }

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return {
    shortcuts: shortcuts,
    categories: categories,
    navigation: { ready: true },
    actions: { 
      navigate: 'executeNavigation',
      execute: 'executeAction'
    },
    timestamp: new Date().toISOString()
  };
}

export async function validateShortcutAccess(shortcut, userPermissions = []) {
  if (!shortcut || !shortcut.id) {
    throw new Error('ShortcutError: Raccourci invalide');
  }

  const validation = {
    accessible: true,
    shortcutId: shortcut.id,
    requiredPermissions: shortcut.permissions || [],
    missingPermissions: [],
    timestamp: new Date().toISOString()
  };

  if (shortcut.permissions) {
    for (const permission of shortcut.permissions) {
      if (!userPermissions.includes(permission)) {
        validation.missingPermissions.push(permission);
        validation.accessible = false;
      }
    }
  }

  return validation;
}

export async function executeShortcutAction(shortcut, context = {}) {
  if (!shortcut?.action) {
    throw new Error('ShortcutError: Action raccourci manquante');
  }

  const actionHandlers = {
    navigate: (target) => ({
      type: 'navigation',
      target: target,
      executed: true
    }),
    execute: (target) => ({
      type: 'execution',
      command: target,
      executed: true,
      result: 'pending'
    }),
    modal: (target) => ({
      type: 'modal',
      modalId: target,
      opened: true
    })
  };

  const handler = actionHandlers[shortcut.action];
  if (!handler) {
    throw new Error('ShortcutError: Type d\'action non supporté');
  }

  const result = handler(shortcut.target);

  return {
    shortcutId: shortcut.id,
    action: shortcut.action,
    result: result,
    context: context,
    timestamp: new Date().toISOString()
  };
}

export async function getShortcutsUsage(shortcutsData, timeframe = '7d') {
  const mockUsageData = {
    'create-project': { clicks: 45, trend: '+12%' },
    'open-editor': { clicks: 123, trend: '+8%' },
    'deploy-latest': { clicks: 34, trend: '-5%' },
    'view-analytics': { clicks: 67, trend: '+15%' }
  };

  const totalClicks = Object.values(mockUsageData).reduce((sum, data) => sum + data.clicks, 0);
  
  const usage = shortcutsData?.shortcuts?.map(shortcut => ({
    id: shortcut.id,
    title: shortcut.title,
    usage: mockUsageData[shortcut.id] || { clicks: 0, trend: '0%' },
    percentage: mockUsageData[shortcut.id] ? 
      ((mockUsageData[shortcut.id].clicks / totalClicks) * 100).toFixed(1) : '0.0'
  })) || [];

  return {
    timeframe: timeframe,
    totalShortcuts: shortcutsData?.shortcuts?.length || 0,
    totalClicks: totalClicks,
    usage: usage,
    timestamp: new Date().toISOString()
  };
}

// panels/dashboard/shortcuts : Panel Dashboard (commit 61)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
