import { TEMPLATES, PROJECT_ID_PATTERN, VALIDATION_LIMITS, ERROR_MESSAGES } from '../config/constants.js';

console.log('[DEBUG] Constants loaded:');
console.log('- TEMPLATES:', TEMPLATES);
console.log('- PROJECT_ID_PATTERN:', PROJECT_ID_PATTERN);
console.log('- ERROR_MESSAGES:', ERROR_MESSAGES?.PROJECT_ID_REQUIRED);

/*
 * [MOCK] FAIT QUOI : Parse toutes les requêtes HTTP (CREATE, BUILD, DEPLOY, etc.)
 * REÇOIT : req: Request (Express)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function request(req) {
  console.log(`[DEBUG] request parser called for ${req.method} ${req.path}`);
  console.log('[DEBUG] req.body:', JSON.stringify(req.body, null, 2));
  
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
    
    console.log('[DEBUG] Extracted projectId:', projectId, typeof projectId);
    
    // Validate projectId avec constantes
    if (!projectId || typeof projectId !== 'string') {
      console.log('[DEBUG] FAIL: projectId empty or not string');
      return {
        success: false,
        error: ERROR_MESSAGES.PROJECT_ID_REQUIRED
      };
    }
    
    console.log('[DEBUG] projectId is valid string, checking pattern...');
    
    if (!PROJECT_ID_PATTERN.test(projectId)) {
      console.log('[DEBUG] FAIL: projectId pattern invalid');
      return {
        success: false,
        error: ERROR_MESSAGES.PROJECT_ID_INVALID
      };
    }
    
    console.log('[DEBUG] Pattern OK, checking length...');
    
    if (projectId.length < VALIDATION_LIMITS.PROJECT_ID_MIN_LENGTH) {
      console.log('[DEBUG] FAIL: projectId too short');
      return {
        success: false,
        error: ERROR_MESSAGES.PROJECT_ID_TOO_SHORT
      };
    }
    
    console.log('[DEBUG] ProjectId validation passed!');
    
    // Validation spécifique CREATE
    if (action === 'CREATE') {
      console.log('[DEBUG] Validating CREATE action...');
      
      if (!body.config || typeof body.config !== 'object') {
        console.log('[DEBUG] FAIL: config missing or not object');
        console.log('[DEBUG] FAIL: config missing or not object');
        return {
          success: false,
          error: ERROR_MESSAGES.CONFIG_REQUIRED
        };
      }
      
      console.log('[DEBUG] Config OK, checking name...');
      
      if (!body.config.name || typeof body.config.name !== 'string') {
        console.log('[DEBUG] FAIL: config.name missing or not string');
        return {
          success: false,
          error: ERROR_MESSAGES.CONFIG_NAME_REQUIRED
        };
      }
      
      if (body.config.name.length < VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH) {
        console.log('[DEBUG] FAIL: config.name too short');
        return {
          success: false,
          error: ERROR_MESSAGES.CONFIG_NAME_TOO_SHORT
        };
      }
      
      console.log('[DEBUG] Name OK, checking template...');
      
      if (body.config.template && !TEMPLATES.includes(body.config.template)) {
        console.log('[DEBUG] FAIL: invalid template');
        return {
          success: false,
          error: ERROR_MESSAGES.TEMPLATE_INVALID
        };
      }
      
      console.log('[DEBUG] CREATE validation passed!');
    }
    
    console.log('[DEBUG] All validation passed, returning success');
    
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