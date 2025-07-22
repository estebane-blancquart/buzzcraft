/**
 * COMMIT 46 - API Authentication
 * 
 * FAIT QUOI : Gestion sessions utilisateur avec persistence WebSocket et cleanup automatique
 * REÇOIT : sessionData: object, operation: string, options?: object, context?: object
 * RETOURNE : { sessionId: string, active: boolean, connections: array, lastActivity: string }
 * ERREURS : SessionError si session invalide, ConnectionError si connexion échouée, ExpirationError si session expirée
 */

const SESSION_CONFIG = {
  maxDuration: 8 * 60 * 60 * 1000, // 8 heures
  idleTimeout: 30 * 60 * 1000, // 30 minutes d'inactivité
  maxConnections: 5, // Maximum 5 connexions WebSocket par session
  cleanupInterval: 5 * 60 * 1000, // Nettoyage toutes les 5 minutes
  persistSession: true
};

// Stockage sessions en mémoire (en production: Redis/DB)
const ACTIVE_SESSIONS = new Map();
const USER_SESSIONS = new Map(); // userId -> Set de sessionIds
const WEBSOCKET_CONNECTIONS = new Map(); // connectionId -> sessionInfo

export async function createSession(userData, connectionInfo = {}, options = {}, context = {}) {
  if (!userData || !userData.userId) {
    throw new Error('SessionError: userData avec userId requis');
  }

  try {
    const sessionId = generateSessionId();
    const now = new Date();
    const maxDuration = options.maxDuration || SESSION_CONFIG.maxDuration;
    
    const sessionData = {
      sessionId,
      userId: userData.userId,
      email: userData.email,
      roles: userData.roles || [],
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: new Date(now.getTime() + maxDuration).toISOString(),
      connections: [],
      metadata: {
        userAgent: connectionInfo.userAgent,
        ip: connectionInfo.ip,
        device: detectDevice(connectionInfo.userAgent),
        location: connectionInfo.location
      },
      active: true
    };

    // Sauvegarder session
    ACTIVE_SESSIONS.set(sessionId, sessionData);

    // Indexer par utilisateur
    if (!USER_SESSIONS.has(userData.userId)) {
      USER_SESSIONS.set(userData.userId, new Set());
    }
    USER_SESSIONS.get(userData.userId).add(sessionId);

    // Limiter nombre de sessions par utilisateur
    const userSessions = USER_SESSIONS.get(userData.userId);
    if (userSessions.size > (options.maxUserSessions || 10)) {
      await cleanupOldestUserSession(userData.userId);
    }

    return {
      sessionId,
      created: true,
      expiresIn: maxDuration,
      expiresAt: sessionData.expiresAt,
      connections: 0,
      active: true,
      timestamp: now.toISOString()
    };

  } catch (sessionError) {
    throw new Error(`SessionError: Échec création session: ${sessionError.message}`);
  }
}

export async function validateSession(sessionId, options = {}, context = {}) {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new Error('SessionError: sessionId requis et non vide');
  }

  const session = ACTIVE_SESSIONS.get(sessionId);
  
  if (!session) {
    return {
      valid: false,
      reason: 'session_not_found',
      active: false
    };
  }

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const lastActivity = new Date(session.lastActivity);
  const idleTime = now.getTime() - lastActivity.getTime();

  // Vérifier expiration
  if (now > expiresAt) {
    await terminateSession(sessionId, 'expired');
    return {
      valid: false,
      reason: 'session_expired',
      active: false,
      expiredAt: session.expiresAt
    };
  }

  // Vérifier inactivité
  const idleTimeout = options.idleTimeout || SESSION_CONFIG.idleTimeout;
  if (idleTime > idleTimeout) {
    await terminateSession(sessionId, 'idle_timeout');
    return {
      valid: false,
      reason: 'idle_timeout',
      active: false,
      idleTime: Math.floor(idleTime / 1000)
    };
  }

  // Mettre à jour activité
  if (options.updateActivity !== false) {
    session.lastActivity = now.toISOString();
    ACTIVE_SESSIONS.set(sessionId, session);
  }

  return {
    valid: true,
    sessionId,
    userId: session.userId,
    email: session.email,
    roles: session.roles,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    connections: session.connections.length,
    active: session.active,
    metadata: session.metadata
  };
}

export async function attachWebSocketConnection(sessionId, connectionId, connectionInfo = {}, options = {}) {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new Error('ConnectionError: sessionId requis pour attachement WebSocket');
  }

  if (!connectionId || typeof connectionId !== 'string' || connectionId.trim() === '') {
    throw new Error('ConnectionError: connectionId requis pour attachement WebSocket');
  }

  const validation = await validateSession(sessionId, options);
  
  if (!validation.valid) {
    throw new Error('ConnectionError: Session invalide pour connexion WebSocket');
  }

  try {
    const session = ACTIVE_SESSIONS.get(sessionId);
    
    // Vérifier limite connexions
    if (session.connections.length >= (options.maxConnections || SESSION_CONFIG.maxConnections)) {
      throw new Error('ConnectionError: Limite de connexions WebSocket atteinte');
    }

    const connectionData = {
      connectionId,
      connectedAt: new Date().toISOString(),
      userAgent: connectionInfo.userAgent,
      ip: connectionInfo.ip,
      active: true
    };

    // Ajouter connexion à la session
    session.connections.push(connectionData);
    session.lastActivity = new Date().toISOString();
    ACTIVE_SESSIONS.set(sessionId, session);

    // Indexer connexion
    WEBSOCKET_CONNECTIONS.set(connectionId, {
      sessionId,
      userId: session.userId,
      connectedAt: connectionData.connectedAt
    });

    return {
      attached: true,
      connectionId,
      sessionId,
      totalConnections: session.connections.length,
      timestamp: connectionData.connectedAt
    };

  } catch (connectionError) {
    throw new Error(`ConnectionError: Échec attachement WebSocket: ${connectionError.message}`);
  }
}

export async function detachWebSocketConnection(connectionId, reason = 'normal', options = {}) {
  const connectionInfo = WEBSOCKET_CONNECTIONS.get(connectionId);
  
  if (!connectionInfo) {
    return {
      detached: false,
      reason: 'connection_not_found'
    };
  }

  try {
    const { sessionId, userId } = connectionInfo;
    const session = ACTIVE_SESSIONS.get(sessionId);

    if (session) {
      // Retirer connexion de la session
      session.connections = session.connections.filter(conn => conn.connectionId !== connectionId);
      session.lastActivity = new Date().toISOString();
      ACTIVE_SESSIONS.set(sessionId, session);

      // Si plus de connexions et option auto-terminate
      if (session.connections.length === 0 && options.terminateSession) {
        await terminateSession(sessionId, 'no_connections');
      }
    }

    // Nettoyer index connexion
    WEBSOCKET_CONNECTIONS.delete(connectionId);

    return {
      detached: true,
      connectionId,
      sessionId,
      reason,
      remainingConnections: session?.connections.length || 0,
      timestamp: new Date().toISOString()
    };

  } catch (detachError) {
    throw new Error(`ConnectionError: Échec détachement WebSocket: ${detachError.message}`);
  }
}

export async function terminateSession(sessionId, reason = 'manual', options = {}) {
  const session = ACTIVE_SESSIONS.get(sessionId);
  
  if (!session) {
    return {
      terminated: false,
      reason: 'session_not_found'
    };
  }

  try {
    // Fermer toutes les connexions WebSocket
    const closedConnections = [];
    for (const connection of session.connections) {
      await detachWebSocketConnection(connection.connectionId, reason);
      closedConnections.push(connection.connectionId);
    }

    // Nettoyer session
    ACTIVE_SESSIONS.delete(sessionId);

    // Nettoyer index utilisateur
    const userSessions = USER_SESSIONS.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        USER_SESSIONS.delete(session.userId);
      }
    }

    return {
      terminated: true,
      sessionId,
      reason,
      closedConnections,
      duration: new Date().getTime() - new Date(session.createdAt).getTime(),
      timestamp: new Date().toISOString()
    };

  } catch (terminateError) {
    throw new Error(`SessionError: Échec termination session: ${terminateError.message}`);
  }
}

export async function getUserSessions(userId, options = {}) {
  const userSessionIds = USER_SESSIONS.get(userId);
  
  if (!userSessionIds || userSessionIds.size === 0) {
    return {
      userId,
      sessions: [],
      total: 0,
      active: 0
    };
  }

  const sessions = [];
  let activeCount = 0;

  for (const sessionId of userSessionIds) {
    const session = ACTIVE_SESSIONS.get(sessionId);
    if (session) {
      const validation = await validateSession(sessionId, { updateActivity: false });
      
      if (validation.valid) {
        sessions.push({
          sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          connections: session.connections.length,
          metadata: session.metadata,
          active: true
        });
        activeCount++;
      }
    }
  }

  return {
    userId,
    sessions: options.includeInactive ? sessions : sessions.filter(s => s.active),
    total: sessions.length,
    active: activeCount,
    timestamp: new Date().toISOString()
  };
}

export async function getSessionStats() {
  const now = new Date();
  let totalSessions = 0;
  let activeSessions = 0;
  let totalConnections = 0;
  let expiredSessions = 0;

  for (const [sessionId, session] of ACTIVE_SESSIONS) {
    totalSessions++;
    
    const validation = await validateSession(sessionId, { updateActivity: false });
    if (validation.valid) {
      activeSessions++;
      totalConnections += session.connections.length;
    } else {
      expiredSessions++;
    }
  }

  return {
    total: totalSessions,
    active: activeSessions,
    expired: expiredSessions,
    connections: totalConnections,
    websocketConnections: WEBSOCKET_CONNECTIONS.size,
    users: USER_SESSIONS.size,
    timestamp: now.toISOString()
  };
}

// Cleanup automatique des sessions expirées
export function startSessionCleanup() {
  return setInterval(async () => {
    const expiredSessions = [];
    
    for (const [sessionId, session] of ACTIVE_SESSIONS) {
      const validation = await validateSession(sessionId, { updateActivity: false });
      if (!validation.valid) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await terminateSession(sessionId, 'cleanup');
    }

    if (expiredSessions.length > 0) {
      console.log(`Session cleanup: ${expiredSessions.length} sessions expirées supprimées`);
    }
  }, SESSION_CONFIG.cleanupInterval);
}

// Fonctions utilitaires
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function detectDevice(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

async function cleanupOldestUserSession(userId) {
  const userSessionIds = USER_SESSIONS.get(userId);
  if (!userSessionIds || userSessionIds.size === 0) return;

  let oldestSessionId = null;
  let oldestTime = Date.now();

  for (const sessionId of userSessionIds) {
    const session = ACTIVE_SESSIONS.get(sessionId);
    if (session) {
      const createdTime = new Date(session.createdAt).getTime();
      if (createdTime < oldestTime) {
        oldestTime = createdTime;
        oldestSessionId = sessionId;
      }
    }
  }

  if (oldestSessionId) {
    await terminateSession(oldestSessionId, 'session_limit');
  }
}

// authentication/sessions : API Authentication (commit 46)
// DEPENDENCY FLOW : api/authentication/ → api/schemas/ → engines/ → transitions/ → systems/
