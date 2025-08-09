/*
 * [MOCK] FAIT QUOI : Parse toutes les requêtes HTTP (CREATE, BUILD, DEPLOY, etc.)
 * REÇOIT : req: Request (Express)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function request(req) {
  console.log(`[MOCK] request parser called for ${req.method} ${req.path}`);
  
  try {
    // Extract route info
    const method = req.method;
    const path = req.path;
    const params = req.params || {};
    const body = req.body || {};
    
    // Determine action type
    let action = 'UNKNOWN';
    let projectId = null;
    
    if (method === 'POST' && path === '/projects') {
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
    
    // Validate projectId
    if (!projectId || typeof projectId !== 'string') {
      return {
        success: false,
        error: 'projectId must be non-empty string'
      };
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