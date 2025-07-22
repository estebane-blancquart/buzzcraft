/**
 * COMMIT 46 - API Authentication
 * 
 * FAIT QUOI : Gestion OAuth avec providers multiples et flow authorization code standard
 * REÇOIT : provider: string, operation: string, data: object, options?: object
 * RETOURNE : { authUrl: string, tokens: object, userInfo: object, success: boolean }
 * ERREURS : OAuthError si flow échoue, ProviderError si provider non supporté, TokenError si échange token échoue
 */

const OAUTH_PROVIDERS = {
  'google': {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    clientId: process.env.GOOGLE_CLIENT_ID || 'google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-secret',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  },
  'github': {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scopes: ['user:email'],
    clientId: process.env.GITHUB_CLIENT_ID || 'github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'github-secret',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback'
  },
  'microsoft': {
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    clientId: process.env.MICROSOFT_CLIENT_ID || 'microsoft-client-id',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'microsoft-secret',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback'
  }
};

const OAUTH_STATES = new Map(); // state -> { provider, timestamp, redirectUrl }

export async function generateAuthUrl(provider, options = {}, context = {}) {
  if (!provider || typeof provider !== 'string' || provider.trim() === '') {
    throw new Error('OAuthError: Provider requis et non vide');
  }

  const providerConfig = OAUTH_PROVIDERS[provider.toLowerCase()];
  if (!providerConfig) {
    throw new Error(`ProviderError: Provider '${provider}' non supporté`);
  }

  try {
    const state = generateOAuthState();
    const nonce = generateNonce();
    
    // Stocker state pour validation callback
    OAUTH_STATES.set(state, {
      provider: provider.toLowerCase(),
      timestamp: Date.now(),
      redirectUrl: options.redirectUrl || context.redirectUrl,
      nonce
    });

    // Construire URL d'autorisation
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      response_type: 'code',
      scope: providerConfig.scopes.join(' '),
      state,
      ...(provider === 'google' && { access_type: 'offline', prompt: 'consent' }),
      ...(provider === 'microsoft' && { response_mode: 'query' }),
      ...(nonce && { nonce })
    });

    const authUrl = `${providerConfig.authUrl}?${params.toString()}`;

    return {
      authUrl,
      state,
      provider: providerConfig.name,
      expiresIn: 600, // State expire après 10 minutes
      timestamp: new Date().toISOString()
    };

  } catch (authError) {
    throw new Error(`OAuthError: Échec génération URL auth: ${authError.message}`);
  }
}

export async function handleCallback(provider, code, state, options = {}, context = {}) {
  if (!provider || typeof provider !== 'string' || provider.trim() === '') {
    throw new Error('ProviderError: Provider requis et non vide');
  }

  if (!code || typeof code !== 'string' || code.trim() === '') {
    throw new Error('OAuthError: Code requis et non vide');
  }

  if (!state || typeof state !== 'string' || state.trim() === '') {
    throw new Error('OAuthError: State requis et non vide');
  }

  const providerConfig = OAUTH_PROVIDERS[provider.toLowerCase()];
  if (!providerConfig) {
    throw new Error(`ProviderError: Provider '${provider}' non supporté`);
  }

  // Valider state
  const storedState = OAUTH_STATES.get(state);
  if (!storedState || storedState.provider !== provider.toLowerCase()) {
    throw new Error('OAuthError: State invalide ou expiré');
  }

  // Vérifier expiration state (10 minutes)
  if (Date.now() - storedState.timestamp > 600000) {
    OAUTH_STATES.delete(state);
    throw new Error('OAuthError: State expiré');
  }

  try {
    // Nettoyer state
    OAUTH_STATES.delete(state);

    // Échanger code contre tokens
    const tokens = await exchangeCodeForTokens(providerConfig, code);
    
    // Récupérer informations utilisateur
    const userInfo = await fetchUserInfo(providerConfig, tokens.access_token);

    // Créer/mettre à jour utilisateur local
    const localUser = await createOrUpdateUser(userInfo, provider, tokens);

    return {
      success: true,
      tokens,
      userInfo,
      localUser,
      provider: providerConfig.name,
      redirectUrl: storedState.redirectUrl,
      timestamp: new Date().toISOString()
    };

  } catch (callbackError) {
    throw new Error(`OAuthError: Échec callback: ${callbackError.message}`);
  }
}

export async function refreshOAuthToken(provider, refreshToken, options = {}) {
  const providerConfig = OAUTH_PROVIDERS[provider.toLowerCase()];
  if (!providerConfig) {
    throw new Error(`ProviderError: Provider '${provider}' non supporté`);
  }

  if (!refreshToken) {
    throw new Error('TokenError: Refresh token requis');
  }

  try {
    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret
    };

    // Simulation échange refresh token (en production: fetch réel)
    const response = await mockTokenRequest(providerConfig.tokenUrl, tokenData);
    
    if (!response.access_token) {
      throw new Error('Réponse token invalide');
    }

    return {
      access_token: response.access_token,
      token_type: response.token_type || 'Bearer',
      expires_in: response.expires_in || 3600,
      refresh_token: response.refresh_token || refreshToken,
      scope: response.scope,
      refreshed: true,
      timestamp: new Date().toISOString()
    };

  } catch (refreshError) {
    throw new Error(`TokenError: Échec refresh token: ${refreshError.message}`);
  }
}

export async function revokeOAuthToken(provider, token, tokenType = 'access_token', options = {}) {
  const providerConfig = OAUTH_PROVIDERS[provider.toLowerCase()];
  if (!providerConfig) {
    throw new Error(`ProviderError: Provider '${provider}' non supporté`);
  }

  try {
    // URLs révocation par provider
    const revokeUrls = {
      'google': 'https://oauth2.googleapis.com/revoke',
      'github': 'https://api.github.com/applications/{client_id}/token',
      'microsoft': 'https://login.microsoftonline.com/common/oauth2/v2.0/logout'
    };

    const revokeUrl = revokeUrls[provider.toLowerCase()];
    if (!revokeUrl) {
      return {
        revoked: false,
        reason: 'revocation_not_supported',
        provider
      };
    }

    // Simulation révocation (en production: fetch réel)
    const mockRevocation = await mockRevokeRequest(revokeUrl, token, tokenType);

    return {
      revoked: true,
      token: token.substring(0, 10) + '...', // Masquer token
      tokenType,
      provider: providerConfig.name,
      timestamp: new Date().toISOString()
    };

  } catch (revokeError) {
    throw new Error(`OAuthError: Échec révocation: ${revokeError.message}`);
  }
}

export async function validateOAuthToken(provider, accessToken, options = {}) {
  const providerConfig = OAUTH_PROVIDERS[provider.toLowerCase()];
  if (!providerConfig) {
    throw new Error(`ProviderError: Provider '${provider}' non supporté`);
  }

  try {
    // Valider token en récupérant infos utilisateur
    const userInfo = await fetchUserInfo(providerConfig, accessToken);

    return {
      valid: true,
      userInfo,
      provider: providerConfig.name,
      scopes: options.scopes || providerConfig.scopes,
      timestamp: new Date().toISOString()
    };

  } catch (validationError) {
    return {
      valid: false,
      error: validationError.message,
      provider: providerConfig.name,
      timestamp: new Date().toISOString()
    };
  }
}

export function getSupportedProviders() {
  return Object.keys(OAUTH_PROVIDERS).map(key => {
    const config = OAUTH_PROVIDERS[key];
    return {
      id: key,
      name: config.name,
      scopes: config.scopes,
      available: !!(config.clientId && config.clientSecret),
      redirectUri: config.redirectUri
    };
  });
}

// Fonctions utilitaires
async function exchangeCodeForTokens(providerConfig, code) {
  const tokenData = {
    grant_type: 'authorization_code',
    code,
    client_id: providerConfig.clientId,
    client_secret: providerConfig.clientSecret,
    redirect_uri: providerConfig.redirectUri
  };

  // Simulation échange code (en production: fetch réel vers tokenUrl)
  return mockTokenRequest(providerConfig.tokenUrl, tokenData);
}

async function fetchUserInfo(providerConfig, accessToken) {
  // Simulation récupération user info (en production: fetch réel)
  return mockUserInfoRequest(providerConfig, accessToken);
}

async function createOrUpdateUser(userInfo, provider, tokens) {
  // Simulation création/mise à jour utilisateur
  // En production: vérifier si utilisateur existe par email, créer ou mettre à jour
  
  const localUser = {
    userId: `oauth_${provider}_${userInfo.id}`,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture || userInfo.avatar_url,
    provider,
    providerId: userInfo.id.toString(),
    roles: ['viewer'], // Rôle par défaut pour nouveaux utilisateurs OAuth
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    oauthTokens: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? 
        new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
    }
  };

  return localUser;
}

function generateOAuthState() {
  return `state_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateNonce() {
  return `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Mock functions pour simulation (remplacer par vrais calls en production)
async function mockTokenRequest(tokenUrl, tokenData) {
  // Simulation succès échange token
  return {
    access_token: `mock_access_${Math.random().toString(36)}`,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: `mock_refresh_${Math.random().toString(36)}`,
    scope: 'openid email profile'
  };
}

async function mockUserInfoRequest(providerConfig, accessToken) {
  // Simulation infos utilisateur selon provider
  const mockUsers = {
    'google': {
      id: '123456789',
      email: 'user@gmail.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true
    },
    'github': {
      id: 987654321,
      login: 'testuser',
      email: 'user@github.com',
      name: 'Test User',
      avatar_url: 'https://github.com/avatar.jpg'
    },
    'microsoft': {
      id: 'abc123def456',
      userPrincipalName: 'user@outlook.com',
      displayName: 'Test User',
      mail: 'user@outlook.com'
    }
  };

  // Retourner mock user selon provider
  return mockUsers[providerConfig.name.toLowerCase()] || mockUsers['google'];
}

async function mockRevokeRequest(revokeUrl, token, tokenType) {
  // Simulation révocation réussie
  return { success: true };
}

// authentication/oauth : API Authentication (commit 46)
// DEPENDENCY FLOW : api/authentication/ → api/schemas/ → engines/ → transitions/ → systems/
