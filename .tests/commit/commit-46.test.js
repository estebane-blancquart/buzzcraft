/**
 * Test COMMIT 46 - API Authentication
 */

import { 
  generateToken, 
  validateToken, 
  refreshToken, 
  revokeToken,
  introspectToken 
} from '../../api/authentication/tokens.js';

import { 
  createSession, 
  validateSession, 
  attachWebSocketConnection, 
  detachWebSocketConnection,
  terminateSession,
  getUserSessions,
  getSessionStats 
} from '../../api/authentication/sessions.js';

import { 
  checkPermission, 
  checkApiEndpointPermission, 
  getUserPermissions,
  getUserRoles,
  hasRole,
  hasMinimumRole,
  checkResourceOwnership,
  getPermissionSummary 
} from '../../api/authentication/permissions.js';

import { 
  generateAuthUrl, 
  handleCallback, 
  refreshOAuthToken,
  revokeOAuthToken,
  validateOAuthToken,
  getSupportedProviders 
} from '../../api/authentication/oauth.js';

describe('COMMIT 46 - API Authentication', () => {

  describe('Module tokens.js', () => {
    test('generateToken crée token JWT valide', async () => {
      const tokenData = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['editor']
      };
      
      const result = await generateToken(tokenData, 'access');
      
      expect(result.generated).toBe(true);
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3); // Format JWT
      expect(result.type).toBe('access');
      expect(typeof result.expiresIn).toBe('number');
      expect(result.claims).toMatchObject(tokenData);
      expect(result.timestamp).toBeDefined();
    });
    
    test('validateToken valide token correctement', async () => {
      // Générer token d'abord
      const tokenData = { userId: 'user123', email: 'test@example.com' };
      const generated = await generateToken(tokenData, 'access');
      
      const result = await validateToken(generated.token, 'access');
      
      expect(result.valid).toBe(true);
      expect(result.claims.userId).toBe('user123');
      expect(result.type).toBe('access');
      expect(typeof result.expiresIn).toBe('number');
      expect(result.tokenId).toBeDefined();
    });
    
    test('refreshToken génère nouveaux tokens', async () => {
      const tokenData = { userId: 'user123', email: 'test@example.com' };
      const refreshTokenResult = await generateToken(tokenData, 'refresh');
      
      const result = await refreshToken(refreshTokenResult.token);
      
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(typeof result.expiresIn).toBe('number');
      expect(typeof result.rotated).toBe('boolean');
      expect(result.timestamp).toBeDefined();
    });
    
    test('revokeToken révoque token correctement', async () => {
      const tokenData = { userId: 'user123' };
      const generated = await generateToken(tokenData, 'access');
      
      const result = await revokeToken(generated.token, 'manual');
      
      expect(result.revoked).toBe(true);
      expect(result.reason).toBe('manual');
      expect(result.timestamp).toBeDefined();
      expect(result.token).toContain('...');
    });
    
    test('introspectToken retourne métadonnées token', async () => {
      const tokenData = { userId: 'user123', email: 'test@example.com' };
      const generated = await generateToken(tokenData, 'access');
      
      const result = await introspectToken(generated.token);
      
      expect(result.active).toBe(true);
      expect(result.sub).toBeDefined();
      expect(result.aud).toBeDefined();
      expect(result.exp).toBeDefined();
      expect(result.jti).toBeDefined();
    });
    
    test('validateToken rejette tokens invalides', async () => {
      const result = await validateToken('invalid.token.format', 'access');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.type).toBe('access');
    });
  });

  describe('Module sessions.js', () => {
    test('createSession crée session utilisateur', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['editor']
      };
      const connectionInfo = {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      };
      
      const result = await createSession(userData, connectionInfo);
      
      expect(result.created).toBe(true);
      expect(typeof result.sessionId).toBe('string');
      expect(result.sessionId.startsWith('sess_')).toBe(true);
      expect(typeof result.expiresIn).toBe('number');
      expect(result.active).toBe(true);
      expect(result.connections).toBe(0);
    });
    
    test('validateSession valide session active', async () => {
      const userData = { userId: 'user123', email: 'test@example.com' };
      const created = await createSession(userData);
      
      const result = await validateSession(created.sessionId);
      
      expect(result.valid).toBe(true);
      expect(result.sessionId).toBe(created.sessionId);
      expect(result.userId).toBe('user123');
      expect(result.active).toBe(true);
      expect(result.connections).toBe(0);
    });
    
    test('attachWebSocketConnection attache connexion à session', async () => {
      const userData = { userId: 'user123', email: 'test@example.com' };
      const session = await createSession(userData);
      
      const result = await attachWebSocketConnection(
        session.sessionId, 
        'conn123', 
        { ip: '192.168.1.100', userAgent: 'Mozilla/5.0' }
      );
      
      expect(result.attached).toBe(true);
      expect(result.connectionId).toBe('conn123');
      expect(result.sessionId).toBe(session.sessionId);
      expect(result.totalConnections).toBe(1);
    });
    
    test('detachWebSocketConnection détache connexion', async () => {
      const userData = { userId: 'user123' };
      const session = await createSession(userData);
      await attachWebSocketConnection(session.sessionId, 'conn123');
      
      const result = await detachWebSocketConnection('conn123', 'normal');
      
      expect(result.detached).toBe(true);
      expect(result.connectionId).toBe('conn123');
      expect(result.reason).toBe('normal');
      expect(result.remainingConnections).toBe(0);
    });
    
    test('terminateSession ferme session et connexions', async () => {
      const userData = { userId: 'user123' };
      const session = await createSession(userData);
      await attachWebSocketConnection(session.sessionId, 'conn123');
      
      const result = await terminateSession(session.sessionId, 'manual');
      
      expect(result.terminated).toBe(true);
      expect(result.sessionId).toBe(session.sessionId);
      expect(result.reason).toBe('manual');
      expect(Array.isArray(result.closedConnections)).toBe(true);
      expect(typeof result.duration).toBe('number');
    });
    
    test('getUserSessions retourne sessions utilisateur', async () => {
      const userData = { userId: 'user123' };
      await createSession(userData);
      await createSession(userData);
      
      const result = await getUserSessions('user123');
      
      expect(result.userId).toBe('user123');
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(result.sessions.length).toBeGreaterThan(0);
      expect(typeof result.total).toBe('number');
      expect(typeof result.active).toBe('number');
    });
    
    test('getSessionStats retourne statistiques globales', async () => {
      const result = await getSessionStats();
      
      expect(typeof result.total).toBe('number');
      expect(typeof result.active).toBe('number');
      expect(typeof result.expired).toBe('number');
      expect(typeof result.connections).toBe('number');
      expect(typeof result.users).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Module permissions.js', () => {
    test('checkPermission autorise action valide', async () => {
      const user = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['editor']
      };
      
      const result = await checkPermission(user, 'projects', 'create');
      
      expect(result.authorized).toBe(true);
      expect(result.resource).toBe('projects');
      expect(result.action).toBe('create');
      expect(Array.isArray(result.permissions)).toBe(true);
      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.reason).toBe('permission_granted');
    });
    
    test('checkPermission refuse action non autorisée', async () => {
      const user = {
        userId: 'user123',
        roles: ['viewer']
      };
      
      const result = await checkPermission(user, 'projects', 'delete');
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('insufficient_permissions');
      expect(Array.isArray(result.required)).toBe(true);
    });
    
    test('checkApiEndpointPermission vérifie endpoint API', async () => {
      const user = {
        userId: 'user123',
        roles: ['editor']
      };
      
      const result = await checkApiEndpointPermission(user, 'POST', '/api/projects');
      
      expect(result.authorized).toBe(true);
      expect(result.resource).toBe('projects');
      expect(result.action).toBe('create');
    });
    
    test('getUserPermissions retourne permissions utilisateur', async () => {
      const user = {
        userId: 'user123',
        roles: ['editor']
      };
      
      const result = await getUserPermissions(user);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('projects:create');
      expect(result).toContain('projects:edit');
    });
    
    test('getUserRoles retourne rôles avec héritage', async () => {
      const user = {
        userId: 'user123',
        roles: ['editor']
      };
      
      const result = await getUserRoles(user, true);
      
      expect(Array.isArray(result.direct)).toBe(true);
      expect(Array.isArray(result.inherited)).toBe(true);
      expect(Array.isArray(result.all)).toBe(true);
      expect(result.direct).toContain('editor');
      expect(result.inherited).toContain('viewer');
      expect(typeof result.levels).toBe('object');
      expect(typeof result.highest).toBe('number');
    });
    
    test('hasRole vérifie présence rôle', async () => {
      const user = { userId: 'user123', roles: ['editor'] };
      
      const hasEditor = await hasRole(user, 'editor');
      const hasViewer = await hasRole(user, 'viewer', true); // avec héritage
      const hasAdmin = await hasRole(user, 'admin');
      
      expect(hasEditor).toBe(true);
      expect(hasViewer).toBe(true); // hérité
      expect(hasAdmin).toBe(false);
    });
    
    test('hasMinimumRole vérifie niveau minimum', async () => {
      const user = { userId: 'user123', roles: ['editor'] };
      
      const hasViewerLevel = await hasMinimumRole(user, 'viewer');
      const hasEditorLevel = await hasMinimumRole(user, 'editor');
      const hasAdminLevel = await hasMinimumRole(user, 'admin');
      
      expect(hasViewerLevel).toBe(true);
      expect(hasEditorLevel).toBe(true);
      expect(hasAdminLevel).toBe(false);
    });
    
    test('checkResourceOwnership vérifie propriété', async () => {
      const user = { userId: 'user123' };
      const context = { projectOwnerId: 'user123' };
      
      const result = await checkResourceOwnership(user, 'projects', 'project456', context);
      
      expect(result.isOwner).toBe(true);
      expect(result.reason).toBe('direct_ownership');
      expect(result.resourceType).toBe('projects');
      expect(result.resourceId).toBe('project456');
    });
    
    test('getPermissionSummary retourne résumé complet', async () => {
      const user = {
        userId: 'user123',
        email: 'test@example.com',
        roles: ['editor']
      };
      
      const result = await getPermissionSummary(user);
      
      expect(result.userId).toBe('user123');
      expect(result.email).toBe('test@example.com');
      expect(typeof result.permissions).toBe('number');
      expect(Array.isArray(result.permissionsList)).toBe(true);
      expect(Array.isArray(result.roles)).toBe(true);
      expect(typeof result.capabilities).toBe('object');
      expect(typeof result.capabilities.canCreateProjects).toBe('boolean');
      expect(typeof result.capabilities.isAdmin).toBe('boolean');
    });
  });

  describe('Module oauth.js', () => {
    test('generateAuthUrl génère URL autorisation', async () => {
      const result = await generateAuthUrl('google');
      
      expect(typeof result.authUrl).toBe('string');
      expect(result.authUrl).toContain('accounts.google.com');
      expect(result.authUrl).toContain('client_id=');
      expect(result.authUrl).toContain('state=');
      expect(typeof result.state).toBe('string');
      expect(result.provider).toBe('Google');
      expect(typeof result.expiresIn).toBe('number');
    });
    
    test('handleCallback traite callback OAuth', async () => {
      // Générer auth URL d'abord pour obtenir state valide
      const authUrl = await generateAuthUrl('google');
      
      const result = await handleCallback('google', 'auth_code_123', authUrl.state);
      
      expect(result.success).toBe(true);
      expect(typeof result.tokens).toBe('object');
      expect(result.tokens.access_token).toBeDefined();
      expect(typeof result.userInfo).toBe('object');
      expect(result.userInfo.email).toBeDefined();
      expect(typeof result.localUser).toBe('object');
      expect(result.localUser.userId).toBeDefined();
      expect(result.provider).toBe('Google');
    });
    
    test('refreshOAuthToken rafraîchit token', async () => {
      const result = await refreshOAuthToken('google', 'refresh_token_123');
      
      expect(typeof result.access_token).toBe('string');
      expect(result.token_type).toBe('Bearer');
      expect(typeof result.expires_in).toBe('number');
      expect(result.refreshed).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
    
    test('revokeOAuthToken révoque token', async () => {
      const result = await revokeOAuthToken('google', 'access_token_123');
      
      expect(result.revoked).toBe(true);
      expect(result.token).toContain('...');
      expect(result.provider).toBe('Google');
      expect(result.timestamp).toBeDefined();
    });
    
    test('validateOAuthToken valide token', async () => {
      const result = await validateOAuthToken('google', 'valid_access_token');
      
      expect(result.valid).toBe(true);
      expect(typeof result.userInfo).toBe('object');
      expect(result.provider).toBe('Google');
      expect(Array.isArray(result.scopes)).toBe(true);
    });
    
    test('getSupportedProviders retourne providers', () => {
      const result = getSupportedProviders();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const google = result.find(p => p.id === 'google');
      expect(google).toBeDefined();
      expect(google.name).toBe('Google');
      expect(Array.isArray(google.scopes)).toBe(true);
      expect(typeof google.available).toBe('boolean');
    });
    
    test('generateAuthUrl rejette provider non supporté', async () => {
      await expect(generateAuthUrl('unknown-provider'))
        .rejects.toThrow('ProviderError');
    });
    
    test('handleCallback rejette state invalide', async () => {
      await expect(handleCallback('google', 'code123', 'invalid_state'))
        .rejects.toThrow('OAuthError');
    });
  });

  describe('Tests validation paramètres', () => {
    test('tokens - validation paramètres requis', async () => {
      await expect(generateToken(null)).rejects.toThrow('TokenError');
      await expect(generateToken({})).rejects.toThrow('TokenError');
      await expect(validateToken('')).rejects.toThrow('TokenError');
      await expect(refreshToken('')).rejects.toThrow('ExpirationError');
    });
    
    test('sessions - validation paramètres requis', async () => {
      await expect(createSession(null)).rejects.toThrow('SessionError');
      await expect(createSession({})).rejects.toThrow('SessionError');
      await expect(validateSession('')).rejects.toThrow('SessionError');
      await expect(attachWebSocketConnection('', 'conn')).rejects.toThrow('ConnectionError');
    });
    
    test('permissions - validation paramètres requis', async () => {
      await expect(checkPermission(null, 'resource', 'action')).rejects.toThrow('PermissionError');
      await expect(checkPermission({ userId: 'test' }, '', 'action')).rejects.toThrow('ResourceError');
      await expect(checkPermission({ userId: 'test' }, 'resource', '')).rejects.toThrow('PermissionError');
    });
    
    test('oauth - validation paramètres requis', async () => {
      await expect(generateAuthUrl('')).rejects.toThrow('OAuthError');
      await expect(generateAuthUrl('unknown')).rejects.toThrow('ProviderError');
      await expect(handleCallback('', 'code', 'state')).rejects.toThrow('ProviderError');
    });
  });

  describe('Tests intégration workflow complet', () => {
    test('workflow authentification complète', async () => {
      // 1. Générer URL OAuth
      const authUrl = await generateAuthUrl('google');
      expect(authUrl.authUrl).toBeDefined();
      
      // 2. Simuler callback OAuth
      const callback = await handleCallback('google', 'auth_code', authUrl.state);
      expect(callback.success).toBe(true);
      
      // 3. Créer session pour utilisateur
      const session = await createSession(callback.localUser);
      expect(session.created).toBe(true);
      
      // 4. Vérifier permissions
      const permission = await checkPermission(callback.localUser, 'projects', 'read');
      expect(permission.authorized).toBe(true);
      
      // 5. Attacher WebSocket
      const websocket = await attachWebSocketConnection(session.sessionId, 'ws123');
      expect(websocket.attached).toBe(true);
      
      // 6. Générer token API
      const token = await generateToken(callback.localUser, 'access');
      expect(token.generated).toBe(true);
      
      // 7. Valider token
      const validation = await validateToken(token.token, 'access');
      expect(validation.valid).toBe(true);
      
      // 8. Terminer session
      const termination = await terminateSession(session.sessionId);
      expect(termination.terminated).toBe(true);
    });
  });

});
