/**
 * CALL 1: Request Parser - Parse requêtes HTTP en structure standardisée
 * @param {express.Request} req - Requête HTTP Express
 * @returns {Promise<{success: boolean, data: object}>} Données parsées pour processor
 * @throws {Error} ValidationError si requête invalide
 */

export async function request(req) {
  console.log(`[REQUEST-PARSER] CALL 1: Parsing ${req.method} ${req.originalUrl}...`);
  
  try {
    // Validation de base de la requête
    const validation = validateHttpRequest(req);
    if (!validation.valid) {
      console.log(`[REQUEST-PARSER] Request validation failed: ${validation.error}`);
      throw new Error(`ValidationError: ${validation.error}`);
    }
    
    // Extraction des données de base
    const requestData = extractBasicRequestData(req);
    
    // Détermination de l'action et extraction des paramètres
    const actionResult = determineActionAndParams(req, requestData);
    if (!actionResult.success) {
      console.log(`[REQUEST-PARSER] Action determination failed: ${actionResult.error}`);
      return {
        success: false,
        error: actionResult.error
      };
    }
    
    // Construction des données parsées
    const parsedData = {
      action: actionResult.action,
      projectId: actionResult.projectId,
      config: actionResult.config || {},
      metadata: {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        userAgent: req.headers['user-agent'] || 'unknown',
        contentType: req.headers['content-type'] || 'none',
        parsedBy: 'request-parser'
      },
      rawRequest: {
        headers: sanitizeHeaders(req.headers),
        query: req.query || {},
        ip: req.ip || req.connection?.remoteAddress || 'unknown'
      }
    };
    
    // Validation finale des données parsées
    const finalValidation = validateParsedData(parsedData);
    if (!finalValidation.valid) {
      console.log(`[REQUEST-PARSER] Parsed data validation failed: ${finalValidation.error}`);
      return {
        success: false,
        error: finalValidation.error
      };
    }
    
    console.log(`[REQUEST-PARSER] Successfully parsed ${actionResult.action} request for project: ${actionResult.projectId}`);
    return {
      success: true,
      data: parsedData
    };
    
  } catch (error) {
    console.log(`[REQUEST-PARSER] Unexpected error: ${error.message}`);
    return {
      success: false,
      error: `Request parsing failed: ${error.message}`
    };
  }
}

/**
 * Valide la structure de base de la requête HTTP
 * @param {express.Request} req - Requête à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateHttpRequest(req) {
  if (!req) {
    return { valid: false, error: 'Request object is required' };
  }
  
  if (!req.method || typeof req.method !== 'string') {
    return { valid: false, error: 'Request method is required and must be string' };
  }
  
  if (!req.originalUrl && !req.path) {
    return { valid: false, error: 'Request path is required' };
  }
  
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return { valid: false, error: `Unsupported HTTP method: ${req.method}` };
  }
  
  return { valid: true };
}

/**
 * Extrait les données de base de la requête
 * @param {express.Request} req - Requête source
 * @returns {object} Données de base extraites
 */
function extractBasicRequestData(req) {
  return {
    method: req.method,
    path: req.originalUrl || req.path,
    params: req.params || {},
    body: req.body || {},
    query: req.query || {},
    headers: req.headers || {}
  };
}

/**
 * Détermine l'action et extrait les paramètres correspondants
 * @param {express.Request} req - Requête HTTP
 * @param {object} requestData - Données de base extraites
 * @returns {{success: boolean, action?: string, projectId?: string, config?: object, error?: string}}
 */
function determineActionAndParams(req, requestData) {
  const { method, path, params, body, query } = requestData;
  
  // Table de mapping des routes vers les actions
  const ROUTE_PATTERNS = [
    // Création de projet
    {
      pattern: /^\/projects\/?$/,
      method: 'POST',
      action: 'CREATE',
      extractParams: (req, match) => ({
        projectId: req.body?.projectId,
        config: {
          name: req.body?.name,
          template: req.body?.template || 'basic',
          description: req.body?.description || ''
        }
      })
    },
    
    // Actions sur projet existant - FIX ICI
    {
      pattern: /^\/projects\/([^\/]+)\/build\/?$/,
      method: 'POST',
      action: 'BUILD',
      extractParams: (req, match) => ({
        projectId: match[1], // ← UTILISE LE MATCH REGEX au lieu de req.params.id
        config: req.body || {}
      })
    },
    
    {
      pattern: /^\/projects\/([^\/]+)\/deploy\/?$/,
      method: 'POST',
      action: 'DEPLOY',
      extractParams: (req, match) => ({
        projectId: match[1], // ← FIX
        config: req.body || {}
      })
    },
    
    {
      pattern: /^\/projects\/([^\/]+)\/start\/?$/,
      method: 'POST',
      action: 'START',
      extractParams: (req, match) => ({
        projectId: match[1], // ← FIX
        config: req.body || {}
      })
    },
    
    {
      pattern: /^\/projects\/([^\/]+)\/stop\/?$/,
      method: 'POST',
      action: 'STOP',
      extractParams: (req, match) => ({
        projectId: match[1], // ← FIX
        config: req.body || {}
      })
    },
    
    // Suppression
    {
      pattern: /^\/projects\/([^\/]+)\/?$/,
      method: 'DELETE',
      action: 'DELETE',
      extractParams: (req, match) => ({
        projectId: match[1], // ← FIX
        config: {}
      })
    },
    
    // Mise à jour (revert)
    {
      pattern: /^\/projects\/([^\/]+)\/revert\/?$/,
      method: 'PUT',
      action: 'REVERT',
      extractParams: (req, match) => ({
        projectId: match[1], // ← FIX
        config: req.body || {}
      })
    }
  ];
  
  // Recherche du pattern correspondant
  for (const routePattern of ROUTE_PATTERNS) {
    if (routePattern.method === method) {
      const match = routePattern.pattern.exec(path); // ← CAPTURE LE MATCH
      if (match) {
        try {
          const extracted = routePattern.extractParams(req, match); // ← PASSE LE MATCH
          
          // Validation du projectId pour toutes les actions
          const projectIdValidation = validateProjectId(extracted.projectId, routePattern.action);
          if (!projectIdValidation.valid) {
            return {
              success: false,
              error: projectIdValidation.error
            };
          }
          
          return {
            success: true,
            action: routePattern.action,
            projectId: extracted.projectId,
            config: extracted.config
          };
          
        } catch (error) {
          return {
            success: false,
            error: `Parameter extraction failed: ${error.message}`
          };
        }
      }
    }
  }
  
  // Aucun pattern correspondant trouvé
  return {
    success: false,
    error: `Unsupported route: ${method} ${path}`
  };
}

/**
 * Valide le projectId selon des règles strictes
 * @param {string} projectId - ID à valider
 * @param {string} action - Action concernée
 * @returns {{valid: boolean, error?: string}}
 */
function validateProjectId(projectId, action) {
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: `Project ID is required for ${action} action` };
  }
  
  if (projectId.length < 3) {
    return { valid: false, error: 'Project ID must be at least 3 characters long' };
  }
  
  if (projectId.length > 50) {
    return { valid: false, error: 'Project ID must be at most 50 characters long' };
  }
  
  // Pattern strict : lettres minuscules, chiffres, tirets et underscores
  if (!/^[a-z0-9_-]+$/.test(projectId)) {
    return { valid: false, error: 'Project ID can only contain lowercase letters, numbers, hyphens and underscores' };
  }
  
  // Ne peut pas commencer ou finir par un tiret/underscore
  if (/^[-_]|[-_]$/.test(projectId)) {
    return { valid: false, error: 'Project ID cannot start or end with hyphens or underscores' };
  }
  
  // Mots réservés
  const RESERVED_WORDS = ['api', 'admin', 'root', 'system', 'null', 'undefined', 'test'];
  if (RESERVED_WORDS.includes(projectId)) {
    return { valid: false, error: `Project ID '${projectId}' is reserved and cannot be used` };
  }
  
  return { valid: true };
}

/**
 * Valide la structure des données parsées
 * @param {object} parsedData - Données à valider
 * @returns {{valid: boolean, error?: string}}
 */
function validateParsedData(parsedData) {
  const requiredFields = ['action', 'projectId', 'config', 'metadata'];
  
  for (const field of requiredFields) {
    if (!parsedData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  if (typeof parsedData.config !== 'object') {
    return { valid: false, error: 'Config must be an object' };
  }
  
  if (!parsedData.metadata.timestamp || !parsedData.metadata.method) {
    return { valid: false, error: 'Metadata must contain timestamp and method' };
  }
  
  return { valid: true };
}

/**
 * Sanitise les headers pour le logging (retire les données sensibles)
 * @param {object} headers - Headers à sanitiser
 * @returns {object} Headers sanitisés
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  
  // Supprimer ou masquer les headers sensibles
  const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  SENSITIVE_HEADERS.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

console.log(`[REQUEST-PARSER] Request parser module loaded`);

export default { request };