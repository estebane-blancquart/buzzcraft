/**
 * COMMIT 45 - API WebSockets
 * 
 * FAIT QUOI : Gestion connexions WebSocket temps réel avec authentification et routing
 * REÇOIT : connection: object, message: object, options?: object
 * RETOURNE : { connected: boolean, message: object, routed: boolean, timestamp: string }
 * ERREURS : ConnectionError si connexion échoue, MessageError si message invalide, RoutingError si routing impossible
 */

const activeConnections = new Map();
const messageHandlers = new Map();
const connectionStats = {
  total: 0,
  active: 0,
  disconnected: 0,
  errors: 0
};

// Types de messages supportés
const MESSAGE_TYPES = {
  'ping': { requireAuth: false, handler: handlePing },
  'auth': { requireAuth: false, handler: handleAuth },
  'subscribe': { requireAuth: true, handler: handleSubscribe },
  'unsubscribe': { requireAuth: true, handler: handleUnsubscribe },
  'project-action': { requireAuth: true, handler: handleProjectAction },
  'chat': { requireAuth: true, handler: handleChat },
  'heartbeat': { requireAuth: false, handler: handleHeartbeat }
};

export async function handleWebSocketConnection(connection, connectionInfo = {}) {
  if (!connection || typeof connection !== 'object') {
    throw new Error('ConnectionError: connection WebSocket requis');
  }

  try {
    const timestamp = new Date().toISOString();
    const connectionId = generateConnectionId();

    const wsConnection = {
      id: connectionId,
      socket: connection,
      authenticated: false,
      userId: null,
      subscriptions: new Set(),
      connectedAt: timestamp,
      lastActivity: timestamp,
      ip: connectionInfo.ip || 'unknown',
      userAgent: connectionInfo.userAgent || 'unknown',
      messageCount: 0,
      errorCount: 0
    };

    // Sauvegarder connexion
    activeConnections.set(connectionId, wsConnection);
    connectionStats.total++;
    connectionStats.active++;

    // Configurer handlers événements
    setupConnectionEventHandlers(wsConnection);

    // Envoyer message de bienvenue
    await sendMessage(wsConnection, {
      type: 'welcome',
      connectionId,
      timestamp,
      serverInfo: {
        version: '1.0.0',
        capabilities: ['real-time', 'broadcasting', 'subscriptions']
      }
    });

    return {
      connected: true,
      connectionId,
      timestamp,
      capabilities: Object.keys(MESSAGE_TYPES)
    };

  } catch (connectionError) {
    connectionStats.errors++;
    throw new Error(`ConnectionError: Échec établissement connexion WebSocket: ${connectionError.message}`);
  }
}

export async function handleWebSocketMessage(connectionId, rawMessage) {
  if (!connectionId || !activeConnections.has(connectionId)) {
    throw new Error('ConnectionError: Connexion WebSocket introuvable');
  }

  const connection = activeConnections.get(connectionId);

  try {
    // Parser message
    const message = typeof rawMessage === 'string' 
      ? JSON.parse(rawMessage) 
      : rawMessage;

    if (!message.type || !MESSAGE_TYPES[message.type]) {
      throw new Error(`MessageError: Type de message '${message.type}' non supporté`);
    }

    const messageConfig = MESSAGE_TYPES[message.type];

    // Vérifier authentification si requise
    if (messageConfig.requireAuth && !connection.authenticated) {
      await sendError(connection, 'AUTH_REQUIRED', 'Authentification requise pour ce type de message');
      return {
        processed: false,
        reason: 'auth_required',
        timestamp: new Date().toISOString()
      };
    }

    // Mettre à jour statistiques connexion
    connection.messageCount++;
    connection.lastActivity = new Date().toISOString();

    // Traiter message avec handler approprié
    const result = await messageConfig.handler(connection, message);

    return {
      processed: true,
      messageType: message.type,
      result,
      timestamp: new Date().toISOString()
    };

  } catch (messageError) {
    connection.errorCount++;
    connectionStats.errors++;

    await sendError(connection, 'MESSAGE_ERROR', messageError.message);

    throw new Error(`MessageError: Erreur traitement message: ${messageError.message}`);
  }
}

export async function closeWebSocketConnection(connectionId, reason = 'normal') {
  if (!connectionId || !activeConnections.has(connectionId)) {
    return {
      closed: false,
      reason: 'connection_not_found'
    };
  }

  try {
    const connection = activeConnections.get(connectionId);

    // Nettoyer subscriptions
    connection.subscriptions.clear();

    // Fermer socket si encore ouvert
    if (connection.socket && typeof connection.socket.close === 'function') {
      connection.socket.close();
    }

    // Retirer des connexions actives
    activeConnections.delete(connectionId);
    connectionStats.active--;
    connectionStats.disconnected++;

    return {
      closed: true,
      connectionId,
      reason,
      duration: Date.now() - new Date(connection.connectedAt),
      messageCount: connection.messageCount,
      timestamp: new Date().toISOString()
    };

  } catch (closeError) {
    throw new Error(`ConnectionError: Erreur fermeture connexion: ${closeError.message}`);
  }
}

export async function getConnectionStats() {
  const connections = Array.from(activeConnections.values());
  
  return {
    ...connectionStats,
    connections: connections.map(conn => ({
      id: conn.id,
      authenticated: conn.authenticated,
      userId: conn.userId,
      subscriptions: conn.subscriptions.size,
      messageCount: conn.messageCount,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity
    })),
    timestamp: new Date().toISOString()
  };
}

async function setupConnectionEventHandlers(connection) {
  // Simulation setup handlers - en prod, utiliserait vrais événements WebSocket
  console.log(`��� Handlers configurés pour connexion ${connection.id}`);
}

async function sendMessage(connection, message) {
  try {
    // Simulation envoi - en prod, utiliserait connection.socket.send()
    console.log(`��� Envoi à ${connection.id}:`, message);
    return true;
  } catch (error) {
    console.warn(`Erreur envoi message à ${connection.id}:`, error);
    return false;
  }
}

async function sendError(connection, code, message) {
  await sendMessage(connection, {
    type: 'error',
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  });
}

// Handlers pour différents types de messages
async function handlePing(connection, message) {
  await sendMessage(connection, {
    type: 'pong',
    timestamp: new Date().toISOString()
  });
  return { ponged: true };
}

async function handleAuth(connection, message) {
  if (!message.token) {
    throw new Error('Token d\'authentification requis');
  }

  // Simulation validation token
  const isValid = message.token.startsWith('valid_');
  
  if (isValid) {
    connection.authenticated = true;
    connection.userId = message.userId || 'user_' + Math.random().toString(36).substring(2, 10);
    
    await sendMessage(connection, {
      type: 'auth_success',
      userId: connection.userId,
      timestamp: new Date().toISOString()
    });
    
    return { authenticated: true, userId: connection.userId };
  } else {
    await sendError(connection, 'AUTH_FAILED', 'Token invalide');
    return { authenticated: false };
  }
}

async function handleSubscribe(connection, message) {
  if (!message.channel) {
    throw new Error('Canal de subscription requis');
  }

  connection.subscriptions.add(message.channel);
  
  await sendMessage(connection, {
    type: 'subscribed',
    channel: message.channel,
    timestamp: new Date().toISOString()
  });

  return { subscribed: true, channel: message.channel };
}

async function handleUnsubscribe(connection, message) {
  if (!message.channel) {
    throw new Error('Canal de désinscription requis');
  }

  connection.subscriptions.delete(message.channel);
  
  await sendMessage(connection, {
    type: 'unsubscribed',
    channel: message.channel,
    timestamp: new Date().toISOString()
  });

  return { unsubscribed: true, channel: message.channel };
}

async function handleProjectAction(connection, message) {
  if (!message.projectId || !message.action) {
    throw new Error('projectId et action requis');
  }

  // Simulation traitement action projet
  const result = {
    projectId: message.projectId,
    action: message.action,
    executed: true,
    timestamp: new Date().toISOString()
  };

  await sendMessage(connection, {
    type: 'project_action_result',
    ...result
  });

  return result;
}

async function handleChat(connection, message) {
  if (!message.content) {
    throw new Error('Contenu message requis');
  }

  const chatMessage = {
    messageId: generateMessageId(),
    userId: connection.userId,
    content: message.content,
    channel: message.channel || 'general',
    timestamp: new Date().toISOString()
  };

  // Diffuser à tous les utilisateurs du canal
  await broadcastToChannel(chatMessage.channel, {
    type: 'chat_message',
    ...chatMessage
  });

  return { sent: true, messageId: chatMessage.messageId };
}

async function handleHeartbeat(connection, message) {
  connection.lastActivity = new Date().toISOString();
  
  await sendMessage(connection, {
    type: 'heartbeat_ack',
    timestamp: connection.lastActivity
  });

  return { acknowledged: true };
}

async function broadcastToChannel(channel, message) {
  const subscribers = Array.from(activeConnections.values())
    .filter(conn => conn.subscriptions.has(channel));

  for (const connection of subscribers) {
    await sendMessage(connection, message);
  }

  return subscribers.length;
}

function generateConnectionId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// websockets/real-time : API WebSockets (commit 45)
// DEPENDENCY FLOW : api/websockets/ → api/events/ → api/responses/ → api/schemas/ → engines/
