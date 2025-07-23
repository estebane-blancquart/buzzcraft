/**
 * COMMIT 51 - App Client Structure
 * 
 * FAIT QUOI : Configuration routing client avec routes définitions et navigation guards
 * REÇOIT : routes: array, config?: object, guards?: array, options?: object
 * RETOURNE : { router: object, routes: array, navigation: object, guards: array }
 * ERREURS : RouteError si routes invalides, NavigationError si navigation échoue, GuardError si guard bloque
 */

const DEFAULT_ROUTES = [
  { path: '/', name: 'home', component: 'Home', public: true },
  { path: '/dashboard', name: 'dashboard', component: 'Dashboard', auth: true },
  { path: '/projects', name: 'projects', component: 'Projects', auth: true },
  { path: '/projects/:id', name: 'project-detail', component: 'ProjectDetail', auth: true },
  { path: '/settings', name: 'settings', component: 'Settings', auth: true },
  { path: '/login', name: 'login', component: 'Login', public: true },
  { path: '*', name: 'not-found', component: 'NotFound', public: true }
];

// Mock sessionStorage pour environnement Node.js
const mockStorage = {
  getItem: (key) => {
    if (key === 'auth_token') return 'mock-token';
    if (key === 'user_permissions') return '["read", "write"]';
    return null;
  },
  setItem: () => {},
  removeItem: () => {}
};

const getStorage = () => {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : mockStorage;
  } catch {
    return mockStorage;
  }
};

const ROUTE_GUARDS = {
  auth: (to, from, next) => {
    const storage = getStorage();
    const isAuthenticated = storage.getItem('auth_token');
    if (!isAuthenticated && to.auth) {
      return next('/login');
    }
    next();
  },
  permissions: (to, from, next) => {
    if (to.permissions && !checkPermissions(to.permissions)) {
      return next('/unauthorized');
    }
    next();
  }
};

function checkPermissions(requiredPermissions) {
  const storage = getStorage();
  const userPermissions = JSON.parse(storage.getItem('user_permissions') || '[]');
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

export async function setupClientRouting(routes = DEFAULT_ROUTES, config = {}, guards = [], options = {}) {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error('RouteError: Routes doivent être un array non vide');
  }

  for (const route of routes) {
    if (!route.path || !route.name || !route.component) {
      throw new Error('RouteError: Chaque route doit avoir path, name et component');
    }
  }

  try {
    const mergedGuards = { ...ROUTE_GUARDS, ...guards };
    
    const router = {
      routes,
      config: {
        mode: config.mode || 'history',
        base: config.base || '/',
        scrollBehavior: config.scrollBehavior || 'top'
      },
      guards: mergedGuards,
      initialized: true
    };

    const navigation = {
      currentRoute: routes.find(r => r.path === '/') || routes[0],
      history: [],
      canGoBack: false,
      canGoForward: false
    };

    return {
      router,
      routes,
      navigation,
      guards: Object.keys(mergedGuards),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`RouteError: Setup routing échoué: ${error.message}`);
  }
}

export async function validateRoutes(routes, options = {}) {
  if (!Array.isArray(routes)) {
    throw new Error('RouteError: Routes doivent être array');
  }

  const strict = options.strict !== false;
  const checkDuplicates = options.checkDuplicates !== false;

  try {
    const issues = [];
    const paths = new Set();
    const names = new Set();

    for (const route of routes) {
      // Validation structure
      if (!route.path || !route.name || !route.component) {
        issues.push(`route_incomplete: ${route.name || 'unknown'}`);
      }

      // Check duplicates
      if (checkDuplicates) {
        if (paths.has(route.path)) {
          issues.push(`duplicate_path: ${route.path}`);
        }
        if (names.has(route.name)) {
          issues.push(`duplicate_name: ${route.name}`);
        }
        paths.add(route.path);
        names.add(route.name);
      }
    }

    const valid = issues.length === 0;

    return {
      valid,
      routesCount: routes.length,
      publicRoutes: routes.filter(r => r.public).length,
      authRoutes: routes.filter(r => r.auth).length,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`RouteError: Validation routes échouée: ${error.message}`);
  }
}

export async function navigateToRoute(routeName, params = {}, options = {}) {
  if (!routeName || typeof routeName !== 'string') {
    throw new Error('NavigationError: RouteName requis string');
  }

  const replace = options.replace === true;
  const query = options.query || {};

  try {
    // Simulation navigation
    const targetRoute = DEFAULT_ROUTES.find(r => r.name === routeName);
    
    if (!targetRoute) {
      throw new Error(`NavigationError: Route ${routeName} non trouvée`);
    }

    // Check auth avec mock storage
    const storage = getStorage();
    if (targetRoute.auth && !storage.getItem('auth_token')) {
      throw new Error(`NavigationError: Route ${routeName} nécessite authentification`);
    }

    const navigation = {
      from: '/',
      to: targetRoute.path,
      params,
      query,
      replace,
      success: true
    };

    return {
      navigated: true,
      route: targetRoute,
      navigation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`NavigationError: Navigation échouée: ${error.message}`);
  }
}

export async function getRoutingStatus(routingSetup, options = {}) {
  if (!routingSetup || typeof routingSetup !== 'object') {
    throw new Error('RouteError: RoutingSetup requis object');
  }

  try {
    const routes = routingSetup.routes || [];
    const validation = await validateRoutes(routes, options);
    
    const status = validation.valid ? 'healthy' : 'degraded';
    const configured = routingSetup.router && routes.length > 0;

    return {
      status,
      configured: !!configured,
      routesCount: routes.length,
      publicRoutes: validation.publicRoutes,
      authRoutes: validation.authRoutes,
      guardsActive: routingSetup.guards?.length || 0,
      issues: validation.issues,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      configured: false,
      routesCount: 0,
      issues: [`status_check_failed: ${error.message}`],
      lastCheck: new Date().toISOString()
    };
  }
}

// structure/routing : App Client Structure (commit 51)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
