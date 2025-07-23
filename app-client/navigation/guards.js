/**
 * COMMIT 58 - App Client Navigation
 * 
 * FAIT QUOI : Guards navigation avec authentification et autorisation routes
 * REÇOIT : route: object, guard: string, context?: object, options?: object
 * RETOURNE : { allowed: boolean, guard: string, redirect?: string, reason?: string }
 * ERREURS : GuardError si guard invalide, AuthError si authentification échoue, PermissionError si autorisation refusée
 */

export async function createNavigationGuard(guardName, guardFunction) {
  if (!guardName || typeof guardName !== 'string') {
    throw new Error('GuardError: Nom de guard requis');
  }

  if (!guardFunction || typeof guardFunction !== 'function') {
    throw new Error('GuardError: Fonction guard requise');
  }

  const guard = {
    name: guardName,
    handler: guardFunction,
    enabled: true
  };

  return {
    created: true,
    guard: guard,
    name: guardName,
    enabled: true,
    timestamp: new Date().toISOString()
  };
}

export async function executeGuard(guard, route, context = {}) {
  if (!guard || typeof guard !== 'object') {
    throw new Error('GuardError: Guard requis');
  }

  if (!route || typeof route !== 'object') {
    throw new Error('GuardError: Route requise');
  }

  // Built-in guards
  const builtInGuards = {
    'auth': (route, context) => {
      const isAuthenticated = !!(context.user && context.token);
      return {
        allowed: isAuthenticated,
        redirect: isAuthenticated ? null : '/login',
        reason: isAuthenticated ? null : 'Authentication required'
      };
    },
    'admin': (route, context) => {
      const isAdmin = context.user?.role === 'admin';
      return {
        allowed: isAdmin,
        redirect: isAdmin ? null : '/unauthorized',
        reason: isAdmin ? null : 'Admin role required'
      };
    }
  };

  const guardHandler = builtInGuards[guard.name] || guard.handler;
  const result = guardHandler(route, context);

  return {
    executed: true,
    guard: guard.name,
    route: route.name,
    allowed: result.allowed,
    redirect: result.redirect || null,
    reason: result.reason || null,
    timestamp: new Date().toISOString()
  };
}

export async function checkRouteAccess(route, guards = [], context = {}) {
  if (!route || typeof route !== 'object') {
    throw new Error('GuardError: Route requise');
  }

  if (!Array.isArray(guards)) {
    throw new Error('GuardError: Guards array requis');
  }

  const results = [];
  let allowed = true;
  let redirect = null;
  let reason = null;

  for (const guard of guards) {
    const result = await executeGuard(guard, route, context);
    results.push(result);
    
    if (!result.allowed) {
      allowed = false;
      redirect = result.redirect;
      reason = result.reason;
      break;
    }
  }

  return {
    allowed: allowed,
    route: route.name,
    guards: results.length,
    redirect: redirect,
    reason: reason,
    timestamp: new Date().toISOString()
  };
}

export async function getGuardStatus(guardConfig) {
  return {
    status: guardConfig ? 'healthy' : 'missing',
    configured: !!guardConfig,
    guards: guardConfig?.guards?.length || 0,
    enabled: guardConfig?.enabled || false,
    timestamp: new Date().toISOString()
  };
}

// navigation/guards : App Client Navigation (commit 58)
// DEPENDENCY FLOW (no circular deps)
