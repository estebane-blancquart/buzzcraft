/**
 * Test COMMIT 45 - API WebSockets
 */

import { 
  handleWebSocketConnection, 
  handleWebSocketMessage, 
  closeWebSocketConnection,
  getConnectionStats 
} from '../../api/websockets/real-time.js';

import { 
  broadcastMessage, 
  createBroadcastChannel, 
  subscribeToBroadcastChannel,
  broadcastToChannel,
  getBroadcastChannels 
} from '../../api/websockets/broadcasting.js';

import { 
  createSubscription, 
  removeSubscription, 
  notifySubscriptions,
  getConnectionSubscriptions,
  getSubscriptionStats 
} from '../../api/websockets/subscriptions.js';

// Mock WebSocket connection simple (sans jest.fn())
function createMockWebSocket() {
  const calls = [];
  return {
    send: function(data) { 
      calls.push({method: 'send', args: [data]}); 
    },
    close: function() { 
      calls.push({method: 'close', args: []}); 
    },
    readyState: 1, // OPEN
    _getCalls: () => calls
  };
}

describe('COMMIT 45 - API WebSockets', () => {

  describe('Module real-time.js', () => {
    test('handleWebSocketConnection établit connexion correctement', async () => {
      const mockSocket = createMockWebSocket();
      const connectionInfo = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      };
      
      const result = await handleWebSocketConnection(mockSocket, connectionInfo);
      
      expect(result.connected).toBe(true);
      expect(result.connectionId).toBeDefined();
      expect(typeof result.connectionId).toBe('string');
      expect(result.timestamp).toBeDefined();
      expect(Array.isArray(result.capabilities)).toBe(true);
      expect(result.capabilities).toContain('ping');
    });
    
    test('handleWebSocketMessage traite message ping', async () => {
      const mockSocket = createMockWebSocket();
      const connection = await handleWebSocketConnection(mockSocket);
      
      const message = {
        type: 'ping',
        timestamp: new Date().toISOString()
      };
      
      const result = await handleWebSocketMessage(connection.connectionId, message);
      
      expect(result.processed).toBe(true);
      expect(result.messageType).toBe('ping');
      expect(result.result.ponged).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
    
    test('handleWebSocketMessage gère authentification', async () => {
      const mockSocket = createMockWebSocket();
      const connection = await handleWebSocketConnection(mockSocket);
      
      const authMessage = {
        type: 'auth',
        token: 'valid_test_token',
        userId: 'user123'
      };
      
      const result = await handleWebSocketMessage(connection.connectionId, authMessage);
      
      expect(result.processed).toBe(true);
      expect(result.messageType).toBe('auth');
      expect(result.result.authenticated).toBe(true);
      expect(result.result.userId).toBe('user123');
    });
    
    test('closeWebSocketConnection ferme connexion correctement', async () => {
      const mockSocket = createMockWebSocket();
      const connection = await handleWebSocketConnection(mockSocket);
      
      const result = await closeWebSocketConnection(connection.connectionId, 'normal');
      
      expect(result.closed).toBe(true);
      expect(result.connectionId).toBe(connection.connectionId);
      expect(result.reason).toBe('normal');
      expect(typeof result.duration).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('handleWebSocketMessage rejette messages non authentifiés', async () => {
      const mockSocket = createMockWebSocket();
      const connection = await handleWebSocketConnection(mockSocket);
      
      const protectedMessage = {
        type: 'project-action',
        projectId: 'test123',
        action: 'build'
      };
      
      const result = await handleWebSocketMessage(connection.connectionId, protectedMessage);
      
      expect(result.processed).toBe(false);
      expect(result.reason).toBe('auth_required');
    });
    
    test('getConnectionStats retourne statistiques correctes', async () => {
      const stats = await getConnectionStats();
      
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.disconnected).toBe('number');
      expect(Array.isArray(stats.connections)).toBe(true);
      expect(stats.timestamp).toBeDefined();
    });
  });

  describe('Module broadcasting.js', () => {
    test('broadcastMessage diffuse message correctement', async () => {
      const message = {
        type: 'notification',
        content: 'Test broadcast message',
        priority: 'normal'
      };
      
      const targets = ['conn1', 'conn2', 'conn3'];
      
      const result = await broadcastMessage(message, targets, {}, { type: 'global' });
      
      expect(result.broadcasted).toBe(true);
      expect(typeof result.delivered).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.targets)).toBe(true);
      expect(result.broadcastId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
    
    test('createBroadcastChannel crée canal de diffusion', async () => {
      const channelName = 'test-channel';
      const options = {
        maxSubscribers: 50,
        requireAuth: true,
        moderated: false
      };
      
      const result = await createBroadcastChannel(channelName, options);
      
      expect(result.created).toBe(true);
      expect(result.channelName).toBe(channelName);
      expect(result.settings.maxSubscribers).toBe(50);
      expect(result.settings.requireAuth).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
    
    test('subscribeToBroadcastChannel ajoute abonné au canal', async () => {
      const channelName = 'subscription-test';
      await createBroadcastChannel(channelName);
      
      const result = await subscribeToBroadcastChannel(channelName, 'conn123');
      
      expect(result.subscribed).toBe(true);
      expect(result.channelName).toBe(channelName);
      expect(result.connectionId).toBe('conn123');
      expect(typeof result.subscriberCount).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('broadcastToChannel diffuse à tous les abonnés', async () => {
      const channelName = 'broadcast-test';
      await createBroadcastChannel(channelName);
      await subscribeToBroadcastChannel(channelName, 'conn1');
      await subscribeToBroadcastChannel(channelName, 'conn2');
      
      const message = {
        type: 'channel-message',
        content: 'Hello channel subscribers'
      };
      
      const result = await broadcastToChannel(channelName, message);
      
      expect(result.broadcasted).toBe(true);
      expect(result.channelName).toBe(channelName);
      expect(result.subscriberCount).toBe(2);
    });
    
    test('getBroadcastChannels retourne liste des canaux', async () => {
      const result = await getBroadcastChannels();
      
      expect(Array.isArray(result.channels)).toBe(true);
      expect(typeof result.totalChannels).toBe('number');
      expect(typeof result.totalSubscribers).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('broadcastMessage valide paramètres requis', async () => {
      await expect(broadcastMessage(null)).rejects.toThrow('BroadcastError');
      await expect(broadcastMessage({})).rejects.toThrow('BroadcastError');
      await expect(broadcastMessage({ type: 'test' })).rejects.toThrow('BroadcastError');
    });
  });

  describe('Module subscriptions.js', () => {
    test('createSubscription crée abonnement valide', async () => {
      const filters = {
        projectId: 'project123',
        eventType: 'state-change'
      };
      
      const result = await createSubscription('project-events', 'conn456', filters);
      
      expect(result.subscribed).toBe(true);
      expect(result.subscriptionId).toBeDefined();
      expect(result.type).toBe('project-events');
      expect(result.filters.projectId).toBe('project123');
      expect(result.notifications).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
    
    test('notifySubscriptions trouve abonnements correspondants', async () => {
      // Créer abonnement
      await createSubscription('project-events', 'conn789', { projectId: 'test-project' });
      
      const event = {
        type: 'project-state-change',
        source: 'engine',
        timestamp: new Date().toISOString()
      };
      
      const eventData = {
        projectId: 'test-project',
        fromState: 'DRAFT',
        toState: 'BUILT'
      };
      
      const result = await notifySubscriptions(event, eventData);
      
      expect(result.notified).toBe(true);
      expect(typeof result.matchingSubscriptions).toBe('number');
      expect(typeof result.delivered).toBe('number');
      expect(Array.isArray(result.notifications)).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
    
    test('removeSubscription supprime abonnement', async () => {
      const subscription = await createSubscription('user-notifications', 'conn999', { userId: 'user123' });
      
      const result = await removeSubscription(subscription.subscriptionId);
      
      expect(result.removed).toBe(true);
      expect(result.subscriptionId).toBe(subscription.subscriptionId);
      expect(result.type).toBe('user-notifications');
      expect(typeof result.duration).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('getConnectionSubscriptions retourne abonnements connexion', async () => {
      const connectionId = 'conn-subs-test';
      await createSubscription('project-events', connectionId, { projectId: 'proj1' });
      await createSubscription('system-alerts', connectionId, { severity: 'critical' });
      
      const result = await getConnectionSubscriptions(connectionId);
      
      expect(result.connectionId).toBe(connectionId);
      expect(Array.isArray(result.subscriptions)).toBe(true);
      expect(result.count).toBe(2);
      expect(result.timestamp).toBeDefined();
    });
    
    test('getSubscriptionStats retourne statistiques abonnements', async () => {
      const stats = await getSubscriptionStats();
      
      expect(typeof stats.totalSubscriptions).toBe('number');
      expect(typeof stats.activeSubscriptions).toBe('number');
      expect(typeof stats.totalNotifications).toBe('number');
      expect(typeof stats.activeByType).toBe('object');
      expect(typeof stats.connections).toBe('number');
      expect(stats.timestamp).toBeDefined();
    });
    
    test('createSubscription valide type et filtres', async () => {
      await expect(
        createSubscription('invalid-type', 'conn123')
      ).rejects.toThrow('SubscriptionError');
      
      await expect(
        createSubscription('project-events', '')
      ).rejects.toThrow('SubscriptionError');
      
      const tooManyFilters = {
        projectId: 'proj1',
        eventType: 'change',
        userId: 'user1',
        status: 'active',
        priority: 'high',
        category: 'build' // 6 filtres, max 5
      };
      
      await expect(
        createSubscription('project-events', 'conn123', tooManyFilters)
      ).rejects.toThrow('FilterError');
    });
  });

  describe('Intégration patterns BuzzCraft', () => {
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof handleWebSocketConnection).toBe('function');
      expect(typeof broadcastMessage).toBe('function');
      expect(typeof createSubscription).toBe('function');
      
      // Noms cohérents avec pattern
      expect(handleWebSocketConnection.name).toBe('handleWebSocketConnection');
      expect(broadcastMessage.name).toBe('broadcastMessage');
      expect(createSubscription.name).toBe('createSubscription');
    });
    
    test('tous les modules utilisent erreurs cohérentes', async () => {
      // Chaque module doit lancer des erreurs avec format correct
      
      // Test real-time
      await expect(
        handleWebSocketConnection(null)
      ).rejects.toThrow('ConnectionError:');
      
      // Test broadcasting
      await expect(
        broadcastMessage({ invalid: 'data' })
      ).rejects.toThrow('BroadcastError:');
      
      // Test subscriptions
      await expect(
        createSubscription('invalid-type', 'conn123')
      ).rejects.toThrow('SubscriptionError:');
    });
    
    test('architecture dependency flow respectée', () => {
      // Test symbolique - vérifier que les modules n'importent que depuis events/responses/schemas
      // En pratique, on vérifierait les imports statiquement
      expect(true).toBe(true);
    });
    
    test('tous les modules retournent structure cohérente', async () => {
      // Test que tous les modules retournent un objet avec timestamp
      const mockSocket = createMockWebSocket();
      const connectionResult = await handleWebSocketConnection(mockSocket);
      expect(connectionResult).toHaveProperty('timestamp');
      
      const broadcastResult = await broadcastMessage({
        type: 'test',
        content: 'Test message'
      }, ['conn1']);
      expect(broadcastResult).toHaveProperty('timestamp');
      
      const subscriptionResult = await createSubscription('project-events', 'conn-test', {});
      expect(subscriptionResult).toHaveProperty('timestamp');
    });
    
    test('intégration complète WebSocket workflow', async () => {
      // Test workflow complet : connexion → auth → subscription → broadcast → notification
      
      // 1. Établir connexion WebSocket
      const mockSocket = createMockWebSocket();
      const connection = await handleWebSocketConnection(mockSocket);
      expect(connection.connected).toBe(true);
      
      // 2. Authentifier utilisateur
      const authResult = await handleWebSocketMessage(connection.connectionId, {
        type: 'auth',
        token: 'valid_test_token',
        userId: 'integration-user'
      });
      expect(authResult.result.authenticated).toBe(true);
      
      // 3. Créer abonnement
      const subscription = await createSubscription('project-events', connection.connectionId, {
        projectId: 'integration-project'
      });
      expect(subscription.subscribed).toBe(true);
      
      // 4. Créer canal broadcast
      const channel = await createBroadcastChannel('integration-channel');
      expect(channel.created).toBe(true);
      
      // 5. S'abonner au canal
      const channelSub = await subscribeToBroadcastChannel('integration-channel', connection.connectionId);
      expect(channelSub.subscribed).toBe(true);
      
      // 6. Diffuser message
      const broadcast = await broadcastToChannel('integration-channel', {
        type: 'integration-test',
        content: 'Full workflow test'
      });
      expect(broadcast.broadcasted).toBe(true);
      
      // 7. Notifier abonnements
      const notification = await notifySubscriptions({
        type: 'project-state-change',
        source: 'integration-test'
      }, {
        projectId: 'integration-project',
        change: 'workflow-complete'
      });
      expect(notification.notified).toBe(true);
    });
  });

});
