/**
 * COMMIT 11 - System Network
 * 
 * FAIT QUOI : Vérification du statut et de la santé du proxy (nginx, apache, etc.)
 * REÇOIT : proxyUrl: string, options: { timeout?: number, headers?: object }
 * RETOURNE : { proxyUrl: string, healthy: boolean, status: number, latency: number, accessible: boolean }
 * ERREURS : ValidationError si proxyUrl invalide, NetworkError si connexion impossible
 */

export async function checkProxyStatus(proxyUrl, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!proxyUrl || typeof proxyUrl !== 'string') {
    throw new Error('ValidationError: proxyUrl must be a non-empty string');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation URL format
  try {
    new URL(proxyUrl);
  } catch {
    throw new Error('ValidationError: proxyUrl must be a valid URL');
  }

  // Logique minimale avec try/catch
  try {
    const startTime = Date.now();
    const timeout = options.timeout || 5000;
    const headers = options.headers || {};

    // Test proxy simple (simulation HTTP health check)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(proxyUrl, {
      method: 'HEAD',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    const isHealthy = response.status >= 200 && response.status < 400;
    
    return {
      proxyUrl,
      healthy: isHealthy,
      status: response.status,
      latency,
      accessible: true,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      proxyUrl,
      healthy: false,
      status: 0,
      latency: 0,
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/network/proxy : System Network (commit 11)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
