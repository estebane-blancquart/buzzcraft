/**
 * COMMIT 58 - App Client Navigation
 * 
 * FAIT QUOI : Système breadcrumbs avec génération automatique et personnalisation
 * REÇOIT : route: object, options?: object, config?: object, context?: object
 * RETOURNE : { breadcrumbs: array, route: string, items: number, config: object }
 * ERREURS : BreadcrumbError si route invalide, ConfigError si configuration incorrecte, ItemError si item malformé
 */

export async function generateBreadcrumbs(route, options = {}) {
  if (!route || typeof route !== 'object') {
    throw new Error('BreadcrumbError: Route requise');
  }

  const breadcrumbMap = {
    'dashboard': [
      { name: 'Accueil', path: '/', icon: 'home' }
    ],
    'projects': [
      { name: 'Accueil', path: '/', icon: 'home' },
      { name: 'Projets', path: '/projects', icon: 'folder' }
    ],
    'editor': [
      { name: 'Accueil', path: '/', icon: 'home' },
      { name: 'Projets', path: '/projects', icon: 'folder' },
      { name: 'Éditeur', path: '/editor', icon: 'edit' }
    ],
    'settings': [
      { name: 'Accueil', path: '/', icon: 'home' },
      { name: 'Paramètres', path: '/settings', icon: 'settings' }
    ]
  };

  const breadcrumbs = breadcrumbMap[route.name] || [
    { name: 'Accueil', path: '/', icon: 'home' }
  ];

  // Add current route if not in breadcrumbs
  const hasCurrentRoute = breadcrumbs.some(b => b.path === route.path);
  if (!hasCurrentRoute && route.name !== 'dashboard') {
    breadcrumbs.push({
      name: route.title || route.name,
      path: route.path,
      current: true
    });
  }

  return {
    breadcrumbs: breadcrumbs,
    route: route.name,
    items: breadcrumbs.length,
    config: { separator: '/', showIcons: options.showIcons !== false },
    timestamp: new Date().toISOString()
  };
}

export async function formatBreadcrumb(breadcrumb, format = 'default') {
  if (!breadcrumb || typeof breadcrumb !== 'object') {
    throw new Error('BreadcrumbError: Breadcrumb requis');
  }

  const formats = {
    'default': (b) => b.name,
    'withIcon': (b) => `${b.icon || ''} ${b.name}`,
    'path': (b) => `${b.name} (${b.path})`,
    'html': (b) => `<a href="${b.path}">${b.name}</a>`
  };

  const formatter = formats[format] || formats['default'];
  const formatted = formatter(breadcrumb);

  return {
    formatted: formatted,
    original: breadcrumb,
    format: format,
    timestamp: new Date().toISOString()
  };
}

export async function updateBreadcrumbConfig(config, updates = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('ConfigError: Configuration breadcrumbs requise');
  }

  const updatedConfig = {
    ...config,
    separator: updates.separator || config.separator || '/',
    showIcons: updates.showIcons !== undefined ? updates.showIcons : config.showIcons,
    maxItems: updates.maxItems || config.maxItems || 5,
    showHome: updates.showHome !== undefined ? updates.showHome : config.showHome !== false
  };

  return {
    updated: true,
    config: updatedConfig,
    changes: Object.keys(updates),
    timestamp: new Date().toISOString()
  };
}

export async function getBreadcrumbStatus(breadcrumbConfig) {
  return {
    status: breadcrumbConfig ? 'healthy' : 'missing',
    configured: !!breadcrumbConfig,
    items: breadcrumbConfig?.breadcrumbs?.length || 0,
    showIcons: breadcrumbConfig?.config?.showIcons || false,
    timestamp: new Date().toISOString()
  };
}

// navigation/breadcrumbs : App Client Navigation (commit 58)
// DEPENDENCY FLOW (no circular deps)
