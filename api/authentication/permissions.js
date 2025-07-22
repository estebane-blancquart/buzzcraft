/**
 * COMMIT 46 - API Authentication
 * 
 * FAIT QUOI : Vérification permissions utilisateur avec RBAC et autorisation endpoints API
 * REÇOIT : user: object, resource: string, action: string, context?: object
 * RETOURNE : { authorized: boolean, permissions: array, roles: array, reason: string }
 * ERREURS : PermissionError si permissions insuffisantes, RoleError si rôle invalide, ResourceError si ressource inconnue
 */

const ROLE_HIERARCHY = {
  'super_admin': {
    inherits: ['admin', 'editor', 'viewer'],
    permissions: ['*'],
    level: 100
  },
  'admin': {
    inherits: ['editor', 'viewer'],
    permissions: [
      'projects:*',
      'users:*',
      'system:*',
      'deployments:*'
    ],
    level: 80
  },
  'editor': {
    inherits: ['viewer'],
    permissions: [
      'projects:create',
      'projects:edit',
      'projects:delete',
      'projects:build',
      'projects:deploy'
    ],
    level: 60
  },
  'viewer': {
    inherits: [],
    permissions: [
      'projects:read',
      'projects:list',
      'states:read'
    ],
    level: 40
  },
  'guest': {
    inherits: [],
    permissions: [
      'projects:list'
    ],
    level: 20
  }
};

const RESOURCE_PERMISSIONS = {
  'projects': {
    'create': ['projects:create', 'projects:*'],
    'read': ['projects:read', 'projects:*'],
    'update': ['projects:edit', 'projects:*'],
    'delete': ['projects:delete', 'projects:*'],
    'list': ['projects:list', 'projects:read', 'projects:*'],
    'build': ['projects:build', 'projects:*'],
    'deploy': ['projects:deploy', 'projects:*'],
    'start': ['projects:deploy', 'projects:*'],
    'stop': ['projects:deploy', 'projects:*']
  },
  'users': {
    'create': ['users:create', 'users:*'],
    'read': ['users:read', 'users:*'],
    'update': ['users:edit', 'users:*'],
    'delete': ['users:delete', 'users:*'],
    'list': ['users:list', 'users:read', 'users:*']
  },
  'system': {
    'read': ['system:read', 'system:*'],
    'configure': ['system:configure', 'system:*'],
    'restart': ['system:restart', 'system:*'],
    'logs': ['system:logs', 'system:*']
  },
  'deployments': {
    'read': ['deployments:read', 'deployments:*'],
    'create': ['deployments:create', 'deployments:*'],
    'cancel': ['deployments:cancel', 'deployments:*'],
    'rollback': ['deployments:rollback', 'deployments:*']
  }
};

const API_ENDPOINT_PERMISSIONS = {
  'GET /api/projects': 'projects:list',
  'POST /api/projects': 'projects:create',
  'GET /api/projects/:id': 'projects:read',
  'PUT /api/projects/:id': 'projects:update',
  'DELETE /api/projects/:id': 'projects:delete',
  'POST /api/projects/:id/build': 'projects:build',
  'POST /api/projects/:id/deploy': 'projects:deploy',
  'POST /api/projects/:id/start': 'projects:start',
  'POST /api/projects/:id/stop': 'projects:stop',
  'GET /api/users': 'users:list',
  'POST /api/users': 'users:create',
  'GET /api/users/:id': 'users:read',
  'PUT /api/users/:id': 'users:update',
  'DELETE /api/users/:id': 'users:delete',
  'GET /api/system/status': 'system:read',
  'POST /api/system/restart': 'system:restart',
  'GET /api/system/logs': 'system:logs'
};

export async function checkPermission(user, resource, action, context = {}) {
  if (!user || !user.userId) {
    throw new Error('PermissionError: Utilisateur requis pour vérification permissions');
  }

  if (!resource || typeof resource !== 'string') {
    throw new Error('ResourceError: Ressource requise et doit être une chaîne');
  }

  if (!action || typeof action !== 'string') {
    throw new Error('PermissionError: Action requise et doit être une chaîne');
  }

  try {
    const userRoles = user.roles || [];
    const userPermissions = await getUserPermissions(user);

    // Vérifier permission directe
    const requiredPermissions = RESOURCE_PERMISSIONS[resource]?.[action] || [];
    
    if (requiredPermissions.length === 0) {
      throw new Error(`ResourceError: Action '${action}' non définie pour ressource '${resource}'`);
    }

    // Super admin a tous les droits
    if (userRoles.includes('super_admin')) {
      return {
        authorized: true,
        permissions: ['*'],
        roles: userRoles,
        reason: 'super_admin_access',
        resource,
        action,
        timestamp: new Date().toISOString()
      };
    }

    // Vérifier permissions spécifiques
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasPermission) {
      return {
        authorized: false,
        permissions: userPermissions,
        roles: userRoles,
        reason: 'insufficient_permissions',
        required: requiredPermissions,
        resource,
        action,
        timestamp: new Date().toISOString()
      };
    }

    // Vérifications contextuelles
    const contextCheck = await checkContextualPermissions(user, resource, action, context);
    if (!contextCheck.allowed) {
      return {
        authorized: false,
        permissions: userPermissions,
        roles: userRoles,
        reason: contextCheck.reason,
        resource,
        action,
        timestamp: new Date().toISOString()
      };
    }

    return {
      authorized: true,
      permissions: userPermissions,
      roles: userRoles,
      reason: 'permission_granted',
      resource,
      action,
      timestamp: new Date().toISOString()
    };

  } catch (permissionError) {
    throw new Error(`PermissionError: Échec vérification permissions: ${permissionError.message}`);
  }
}

export async function checkApiEndpointPermission(user, method, path, context = {}) {
  const endpoint = `${method.toUpperCase()} ${normalizePath(path)}`;
  const requiredPermission = API_ENDPOINT_PERMISSIONS[endpoint];

  if (!requiredPermission) {
    return {
      authorized: false,
      reason: 'endpoint_not_found',
      endpoint,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const [resource, action] = requiredPermission.split(':');
    return await checkPermission(user, resource, action, {
      ...context,
      endpoint,
      method,
      path
    });

  } catch (endpointError) {
    throw new Error(`PermissionError: Échec vérification endpoint: ${endpointError.message}`);
  }
}

export async function getUserPermissions(user) {
  if (!user || !user.roles) {
    return [];
  }

  const allPermissions = new Set();
  const processedRoles = new Set();

  // Traiter chaque rôle avec héritage
  for (const roleName of user.roles) {
    await addRolePermissions(roleName, allPermissions, processedRoles);
  }

  return Array.from(allPermissions);
}

export async function getUserRoles(user, includeInherited = true) {
  if (!user || !user.roles) {
    return {
      direct: [],
      inherited: [],
      all: [],
      levels: {}
    };
  }

  const directRoles = user.roles;
  const inheritedRoles = new Set();
  const allRoles = new Set(directRoles);
  const levels = {};

  if (includeInherited) {
    for (const roleName of directRoles) {
      const role = ROLE_HIERARCHY[roleName];
      if (role) {
        levels[roleName] = role.level;
        
        // Ajouter rôles hérités récursivement
        for (const inheritedRole of role.inherits) {
          if (!allRoles.has(inheritedRole)) {
            inheritedRoles.add(inheritedRole);
            allRoles.add(inheritedRole);
            
            const inheritedRoleConfig = ROLE_HIERARCHY[inheritedRole];
            if (inheritedRoleConfig) {
              levels[inheritedRole] = inheritedRoleConfig.level;
            }
          }
        }
      }
    }
  }

  return {
    direct: directRoles,
    inherited: Array.from(inheritedRoles),
    all: Array.from(allRoles),
    levels,
    highest: Math.max(...Object.values(levels), 0)
  };
}

export async function hasRole(user, roleName, includeInherited = true) {
  const userRoles = await getUserRoles(user, includeInherited);
  return userRoles.all.includes(roleName);
}

export async function hasMinimumRole(user, minimumRoleName) {
  const userRoles = await getUserRoles(user, true);
  const minimumRole = ROLE_HIERARCHY[minimumRoleName];
  
  if (!minimumRole) {
    throw new Error(`RoleError: Rôle minimum '${minimumRoleName}' introuvable`);
  }

  return userRoles.highest >= minimumRole.level;
}

export async function checkResourceOwnership(user, resourceType, resourceId, context = {}) {
  // Vérifications propriété basiques
  if (resourceType === 'projects') {
    // En production: vérifier en base si user possède le projet
    const projectOwnerId = context.projectOwnerId || context.userId;
    
    if (user.userId === projectOwnerId) {
      return {
        isOwner: true,
        reason: 'direct_ownership',
        resourceType,
        resourceId
      };
    }

    // Vérifier si membre équipe projet
    if (context.teamMembers && context.teamMembers.includes(user.userId)) {
      return {
        isOwner: true,
        reason: 'team_membership',
        resourceType,
        resourceId
      };
    }
  }

  return {
    isOwner: false,
    reason: 'not_owner',
    resourceType,
    resourceId
  };
}

export function getPermissionSummary(user) {
  return getUserPermissions(user).then(permissions => {
    const summary = {
      userId: user.userId,
      email: user.email,
      permissions: permissions.length,
      permissionsList: permissions,
      roles: user.roles || [],
      capabilities: {
        canCreateProjects: permissions.some(p => p === 'projects:create' || p === '*'),
        canManageUsers: permissions.some(p => p === 'users:*' || p === '*'),
        canConfigureSystem: permissions.some(p => p === 'system:*' || p === '*'),
        isAdmin: (user.roles || []).some(r => ['admin', 'super_admin'].includes(r))
      },
      timestamp: new Date().toISOString()
    };

    return summary;
  });
}

// Fonctions utilitaires
async function addRolePermissions(roleName, permissionsSet, processedRoles) {
  if (processedRoles.has(roleName)) {
    return; // Éviter cycles
  }

  processedRoles.add(roleName);
  const role = ROLE_HIERARCHY[roleName];
  
  if (!role) {
    return; // Rôle inconnu
  }

  // Ajouter permissions du rôle
  for (const permission of role.permissions) {
    permissionsSet.add(permission);
  }

  // Traiter rôles hérités récursivement
  for (const inheritedRole of role.inherits) {
    await addRolePermissions(inheritedRole, permissionsSet, processedRoles);
  }
}

async function checkContextualPermissions(user, resource, action, context) {
  // Vérifications contextuelles spécifiques
  
  // Pour les projets, vérifier propriété
  if (resource === 'projects' && ['update', 'delete', 'deploy'].includes(action)) {
    if (context.projectId) {
      const ownership = await checkResourceOwnership(user, 'projects', context.projectId, context);
      
      // Si pas propriétaire, vérifier permissions admin
      if (!ownership.isOwner) {
        const hasAdminRole = await hasMinimumRole(user, 'admin');
        if (!hasAdminRole) {
          return {
            allowed: false,
            reason: 'ownership_required'
          };
        }
      }
    }
  }

  // Vérifications horaires pour actions critiques
  if (['delete', 'restart'].includes(action) && context.enforceBusinessHours) {
    const hour = new Date().getHours();
    if (hour < 8 || hour > 18) {
      const hasOverride = await hasMinimumRole(user, 'admin');
      if (!hasOverride) {
        return {
          allowed: false,
          reason: 'outside_business_hours'
        };
      }
    }
  }

  return { allowed: true };
}

function normalizePath(path) {
  // Normaliser paths avec paramètres pour matching
  return path
    .replace(/\/[0-9a-f-]{8,}/g, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id'); // IDs numériques
}

// authentication/permissions : API Authentication (commit 46)
// DEPENDENCY FLOW : api/authentication/ → api/schemas/ → engines/ → transitions/ → systems/
