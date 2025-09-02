/**
 * Request Parser - Parse et valide les requêtes HTTP
 * @description Pattern 13 CALLS - CALL 1 - Parse les requêtes entrantes
 */

/**
 * Parse une requête HTTP entrante et extrait les données structurées
 * @param {express.Request} req - Requête Express
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function request(req) {
  console.log(`[REQUEST-PARSER] CALL 1: Parsing ${req.method} ${req.path}...`);

  try {
    // Extraction des données de base
    const requestData = {
      method: req.method,
      path: req.path,
      params: req.params || {},
      query: req.query || {},
      body: req.body || {},
      headers: req.headers || {},
      ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
    };

    // Détermination de l'action et extraction des paramètres
    const actionResult = determineActionAndParams(req, requestData);
    
    if (!actionResult.success) {
      console.log(`[REQUEST-PARSER] Action determination failed: ${actionResult.error}`);
      return {
        success: false,
        error: actionResult.error,
      };
    }

    const { action, projectId, config } = actionResult;

    // Construction de l'objet de données final
    const parsedData = {
      action,
      projectId,
      config,
      metadata: {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        userAgent: req.headers["user-agent"] || "Unknown",
        contentType: req.headers["content-type"] || "application/json",
        parsedBy: "request-parser",
      },
      rawRequest: {
        headers: req.headers,
        query: req.query,
        ip: requestData.ip,
      },
    };

    console.log(`[REQUEST-PARSER] Successfully parsed ${action} request for project: ${projectId || 'new'}`);
    
    return {
      success: true,
      data: parsedData,
    };

  } catch (error) {
    console.log(`[REQUEST-PARSER] Parse error: ${error.message}`);
    return {
      success: false,
      error: `Request parsing failed: ${error.message}`,
    };
  }
}

/**
 * Détermine l'action et extrait les paramètres selon la route
 * @param {express.Request} req - Requête Express
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
      method: "POST",
      action: "CREATE",
      extractParams: (req, match) => ({
        projectId: req.body?.projectId,
        config: {
          name: req.body?.config?.name,
          template: req.body?.config?.template,
          description: req.body?.config?.description || "",
        },
      }),
    },

    // Actions sur projet existant
    {
      pattern: /^\/projects\/([^\/]+)\/build\/?$/,
      method: "POST",
      action: "BUILD",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },

    {
      pattern: /^\/projects\/([^\/]+)\/deploy\/?$/,
      method: "POST",
      action: "DEPLOY",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },

    {
      pattern: /^\/projects\/([^\/]+)\/start\/?$/,
      method: "POST",
      action: "START",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },

    {
      pattern: /^\/projects\/([^\/]+)\/stop\/?$/,
      method: "POST",
      action: "STOP",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },

    // Suppression
    {
      pattern: /^\/projects\/([^\/]+)\/?$/,
      method: "DELETE",
      action: "DELETE",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: {},
      }),
    },

    // REVERT - POST version
    {
      pattern: /^\/projects\/([^\/]+)\/revert\/?$/,
      method: "POST",
      action: "REVERT",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },

    // REVERT - PUT version
    {
      pattern: /^\/projects\/([^\/]+)\/revert\/?$/,
      method: "PUT",
      action: "REVERT",
      extractParams: (req, match) => ({
        projectId: match[1],
        config: req.body || {},
      }),
    },
  ];

  // Recherche du pattern correspondant
  for (const routePattern of ROUTE_PATTERNS) {
    if (routePattern.method === method) {
      const match = routePattern.pattern.exec(path);
      if (match) {
        try {
          const extracted = routePattern.extractParams(req, match);

          // Validation du projectId pour toutes les actions
          const projectIdValidation = validateProjectId(
            extracted.projectId,
            routePattern.action
          );
          if (!projectIdValidation.valid) {
            return {
              success: false,
              error: projectIdValidation.error,
            };
          }

          return {
            success: true,
            action: routePattern.action,
            projectId: extracted.projectId,
            config: extracted.config,
          };
        } catch (error) {
          return {
            success: false,
            error: `Parameter extraction failed: ${error.message}`,
          };
        }
      }
    }
  }

  // Aucun pattern correspondant trouvé
  return {
    success: false,
    error: `Unsupported route: ${method} ${path}`,
  };
}

/**
 * Valide le projectId selon des règles strictes
 * @param {string} projectId - ID à valider
 * @param {string} action - Action concernée
 * @returns {{valid: boolean, error?: string}}
 */
function validateProjectId(projectId, action) {
  // Pour CREATE, le projectId peut être undefined (généré plus tard)
  if (action === "CREATE") {
    return { valid: true };
  }

  // Pour toutes les autres actions, projectId obligatoire
  if (!projectId || typeof projectId !== "string") {
    return {
      valid: false,
      error: `Project ID is required for ${action} action`,
    };
  }

  // Validation du format
  if (projectId.length < 3 || projectId.length > 50) {
    return {
      valid: false,
      error: "Project ID must be between 3 and 50 characters",
    };
  }

  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return {
      valid: false,
      error: "Project ID must contain only lowercase letters, numbers, and hyphens",
    };
  }

  return { valid: true };
}

console.log(`[REQUEST-PARSER] Request parser module loaded`);
