/**
 * COMMIT 63 - Panel Editor
 * 
 * FAIT QUOI : Collaboration temps réel avec curseurs multiples et synchronisation
 * REÇOIT : collabConfig: object, sessionId: string, user: object, permissions?: object
 * RETOURNE : { session: object, users: array, sync: object, permissions: object }
 * ERREURS : CollabError si collaboration impossible, SessionError si session invalide, SyncError si synchronisation échoue, PermissionError si accès refusé
 */

export async function initializeCollaboration(collabConfig, sessionId, user) {
  if (!collabConfig || typeof collabConfig !== 'object') {
    throw new Error('CollabError: Configuration collaboration requise');
  }

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('SessionError: ID session requis');
  }

  if (!user || !user.id) {
    throw new Error('CollabError: Utilisateur avec ID requis');
  }

  const session = {
    id: sessionId,
    projectId: collabConfig.projectId,
    created: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active',
    settings: {
      maxUsers: collabConfig.maxUsers || 10,
      autoSave: collabConfig.autoSave !== false,
      saveInterval: collabConfig.saveInterval || 30000,
      conflictResolution: collabConfig.conflictResolution || 'merge'
    }
  };

  const currentUser = {
    id: user.id,
    name: user.name || 'Utilisateur',
    avatar: user.avatar || null,
    role: user.role || 'editor',
    color: user.color || generateUserColor(user.id),
    cursor: { x: 0, y: 0, visible: false },
    selection: null,
    lastActivity: new Date().toISOString(),
    connected: true
  };

  const sync = {
    enabled: true,
    operations: [],
    conflicts: [],
    lastSync: new Date().toISOString(),
    pendingChanges: [],
    version: 1,
    algorithm: 'operational-transformation'
  };

  const permissions = {
    [user.id]: {
      read: true,
      write: user.role !== 'viewer',
      admin: user.role === 'admin',
      share: user.role === 'admin' || user.role === 'owner'
    }
  };

  return {
    session: session,
    users: [currentUser],
    sync: sync,
    permissions: permissions,
    timestamp: new Date().toISOString()
  };
}

export async function validateCollabPermissions(collabData, userId, action) {
  if (!collabData?.permissions || !userId) {
    throw new Error('PermissionError: Données permissions manquantes');
  }

  const userPermissions = collabData.permissions[userId];
  if (!userPermissions) {
    throw new Error('PermissionError: Utilisateur non autorisé');
  }

  const actionPermissions = {
    'read': 'read',
    'edit': 'write', 
    'save': 'write',
    'delete': 'admin',
    'share': 'share',
    'invite': 'admin',
    'kick': 'admin'
  };

  const requiredPermission = actionPermissions[action];
  if (!requiredPermission) {
    throw new Error('PermissionError: Action non reconnue');
  }

  const hasPermission = userPermissions[requiredPermission];

  return {
    allowed: hasPermission,
    userId: userId,
    action: action,
    requiredPermission: requiredPermission,
    userPermissions: userPermissions,
    timestamp: new Date().toISOString()
  };
}

export async function synchronizeCollabChanges(collabData, operation) {
  if (!collabData?.sync) {
    throw new Error('SyncError: Configuration synchronisation manquante');
  }

  if (!operation || !operation.type) {
    throw new Error('SyncError: Opération invalide');
  }

  const supportedOperations = ['insert', 'delete', 'replace', 'move', 'style'];
  if (!supportedOperations.includes(operation.type)) {
    throw new Error('SyncError: Type opération non supporté');
  }

  // Génération ID opération
  const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const transformedOperation = {
    id: operationId,
    type: operation.type,
    data: operation.data,
    userId: operation.userId,
    timestamp: new Date().toISOString(),
    version: collabData.sync.version + 1,
    applied: false
  };

  // Détection conflits
  const conflicts = detectConflicts(transformedOperation, collabData.sync.operations);
  
  if (conflicts.length > 0) {
    collabData.sync.conflicts.push(...conflicts);
    
    // Résolution automatique si configurée
    if (collabData.session?.settings?.conflictResolution === 'merge') {
      transformedOperation.data = mergeConflicts(transformedOperation.data, conflicts);
    }
  }

  // Ajout à la liste des opérations
  collabData.sync.operations.push(transformedOperation);
  collabData.sync.version = transformedOperation.version;
  collabData.sync.lastSync = new Date().toISOString();

  return {
    synchronized: true,
    operationId: operationId,
    version: transformedOperation.version,
    conflicts: conflicts.length,
    conflictResolution: conflicts.length > 0 ? collabData.session?.settings?.conflictResolution : null,
    timestamp: new Date().toISOString()
  };
}

export async function getCollaborationStatus(collabData) {
  if (!collabData) {
    return {
      status: 'disconnected',
      users: 0,
      timestamp: new Date().toISOString()
    };
  }

  const activeUsers = collabData.users?.filter(user => user.connected) || [];
  const recentActivity = collabData.session?.lastActivity ? 
    Date.now() - new Date(collabData.session.lastActivity).getTime() < 300000 : false; // 5 min

  const analysis = {
    connected: !!collabData.session?.id,
    users: {
      total: collabData.users?.length || 0,
      active: activeUsers.length,
      roles: activeUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {})
    },
    sync: {
      version: collabData.sync?.version || 0,
      operations: collabData.sync?.operations?.length || 0,
      conflicts: collabData.sync?.conflicts?.length || 0,
      lastSync: collabData.sync?.lastSync
    },
    session: {
      id: collabData.session?.id,
      projectId: collabData.session?.projectId,
      recentActivity: recentActivity,
      autoSave: collabData.session?.settings?.autoSave
    }
  };

  const statusLevel = 
    !analysis.connected ? 'disconnected' :
    analysis.sync.conflicts > 5 ? 'conflicts' :
    analysis.users.active === 0 ? 'idle' :
    analysis.users.active === 1 ? 'solo' : 'collaborative';

  return {
    status: statusLevel,
    analysis: analysis,
    health: analysis.sync.conflicts > 10 ? 'warning' : 'healthy',
    timestamp: new Date().toISOString()
  };
}

// Fonctions utilitaires
function generateUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function detectConflicts(operation, existingOperations) {
  const conflicts = [];
  const recentOps = existingOperations.filter(op => 
    Date.now() - new Date(op.timestamp).getTime() < 5000 // 5 secondes
  );

  for (const existingOp of recentOps) {
    if (existingOp.userId !== operation.userId && 
        existingOp.type === operation.type &&
        JSON.stringify(existingOp.data.target) === JSON.stringify(operation.data.target)) {
      conflicts.push({
        id: `conflict-${Date.now()}`,
        operation1: existingOp.id,
        operation2: operation.id,
        type: 'concurrent_edit',
        severity: 'medium'
      });
    }
  }

  return conflicts;
}

function mergeConflicts(operationData, conflicts) {
  // Stratégie de merge simple - priorité au timestamp plus récent
  return {
    ...operationData,
    merged: true,
    conflictCount: conflicts.length
  };
}

// panels/editor/collaboration : Panel Editor (commit 63)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
