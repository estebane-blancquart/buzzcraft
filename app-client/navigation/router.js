/**
 * COMMIT 58 - App Client Navigation
 * 
 * FAIT QUOI : Système routage avec configuration routes et navigation programmatique
 * REÇOIT : routes: array, config?: object, options?: object, navigation?: object
 * RETOURNE : { router: object, routes: array, current: object, history: array }
 * ERREURS : RouterError si routes invalides, RouteError si route introuvable, NavigationError si navigation échoue
 */

export async function createRouter(routes = [], config = {}) {
  if (!Array.isArray(routes)) {
    throw new Error('RouterError: Routes array requis');
  }

  const defaultRoutes = [
    { path: '/', name: 'dashboard', component: 'Dashboard' },
    { path: '/projects', name: 'projects', component: 'Projects' },
    { path: '/editor/:id', name: 'editor', component: 'Editor' },
    { path: '/settings', name: 'settings', component: 'Settings' }
  ];

  const allRoutes = routes.length > 0 ? routes : defaultRoutes;
  const routerConfig = {
    mode: config.mode || 'hash',
    base: config.base || '/',
    scrollBehavior: config.scrollBehavior || 'top',
    ...config
  };

  return {
    router: {
      routes: allRoutes,
      config: routerConfig,
      currentRoute: null
    },
    routes: allRoutes,
    current: null,
    history: [],
    timestamp: new Date().toISOString()
  };
}

export async function navigateToRoute(router, routeName, params = {}) {
  if (!router || typeof router !== 'object') {
    throw new Error('RouterError: Router requis');
  }

  if (!routeName || typeof routeName !== 'string') {
    throw new Error('NavigationError: Nom de route requis');
  }

  const route = router.routes?.find(r => r.name === routeName);
  if (!route) {
    throw new Error(`RouteError: Route '${routeName}' introuvable`);
  }

  // Build path with params
  let path = route.path;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });

  return {
    navigated: true,
    route: route,
    path: path,
    params: params,
    timestamp: new Date().toISOString()
  };
}

export async function resolveRoute(router, path) {
  if (!router || typeof router !== 'object') {
    throw new Error('RouterError: Router requis');
  }

  if (!path || typeof path !== 'string') {
    throw new Error('RouterError: Path requis');
  }

  const route = router.routes?.find(r => {
    const routePattern = r.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(path);
  });

  return {
    resolved: !!route,
    route: route || null,
    path: path,
    params: route ? {} : null,
    timestamp: new Date().toISOString()
  };
}

export async function getRouterStatus(router) {
  return {
    status: router ? 'healthy' : 'missing',
    configured: !!router,
    routes: router?.routes?.length || 0,
    current: router?.currentRoute?.name || 'none',
    timestamp: new Date().toISOString()
  };
}

// navigation/router : App Client Navigation (commit 58)
// DEPENDENCY FLOW (no circular deps)
