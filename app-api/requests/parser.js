/*
 * FAIT QUOI : Parse toutes les requêtes HTTP (CREATE, BUILD, DEPLOY, etc.) - VERSION SIMPLE
 * REÇOIT : req: Request (Express)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function request(req) {
  console.log(`[DEBUG] request parser called for ${req.method} ${req.path}`);
  
  try {
    // Extract route info
    const method = req.method;
    const path = req.path;
    const params = req.params || {};
    const body = req.body || {};
    
    // Determine action type
    let action = 'UNKNOWN';
    let projectId = null;
    
    if (method === 'POST' && path === '/') {
      action = 'CREATE';
      projectId = body.projectId;
    } else if (method === 'POST' && path.includes('/build')) {
      action = 'BUILD';
      projectId = params.id;
    } else if (method === 'POST' && path.includes('/deploy')) {
      action = 'DEPLOY';
      projectId = params.id;
    } else if (method === 'POST' && path.includes('/start')) {
      action = 'START';
      projectId = params.id;
    } else if (method === 'POST' && path.includes('/stop')) {
      action = 'STOP';
      projectId = params.id;
    } else if (method === 'DELETE') {
      action = 'DELETE';
      projectId = params.id;
    } else if (method === 'PUT') {
      action = 'UPDATE';
      projectId = params.id;
    }
    
    // Validate projectId (simple et direct)
    if (!projectId || typeof projectId !== 'string') {
      return {
        success: false,
        error: 'Project ID is required'
      };
    }
    
    if (!/^[a-z0-9-]+$/.test(projectId)) {
      return {
        success: false,
        error: 'Project ID must contain only lowercase letters, numbers and hyphens'
      };
    }
    
    if (projectId.length < 3) {
      return {
        success: false,
        error: 'Project ID must be at least 3 characters'
      };
    }
    
    // Validation spécifique CREATE
    if (action === 'CREATE') {
      if (!body.config || typeof body.config !== 'object') {
        return {
          success: false,
          error: 'Config object is required'
        };
      }
      
      if (!body.config.name || typeof body.config.name !== 'string') {
        return {
          success: false,
          error: 'Project name is required in config'
        };
      }
      
      if (body.config.name.length < 2) {
        return {
          success: false,
          error: 'Project name must be at least 2 characters'
        };
      }
      
      // Template validation : laisse loader.js se débrouiller
      // Si template invalide, loadTemplate() échouera naturellement
    }
    
    return {
      success: true,
      data: {
        action,
        projectId,
        config: body.config || body,
        method,
        path
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}