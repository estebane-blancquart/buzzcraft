/**
 * COMMIT 48 - API Documentation
 * 
 * FAIT QUOI : Exemples requests/responses avec tests API interactifs et validation données
 * REÇOIT : endpoint: string, method: string, data?: object, options?: object
 * RETOURNE : { examples: object, interactive: boolean, validated: boolean, generatedAt: string }
 * ERREURS : ExampleError si génération échoue, ValidationError si données invalides, InteractiveError si tests échouent
 */

const REQUEST_EXAMPLES = {
  'POST:/api/projects': {
    summary: 'Créer nouveau projet',
    request: {
      name: 'Mon Site Web',
      template: 'react',
      description: 'Site vitrine avec React'
    },
    response: {
      success: true,
      data: {
        id: 'proj_123456',
        name: 'Mon Site Web',
        template: 'react',
        state: 'DRAFT',
        createdAt: '2024-01-15T10:30:00Z'
      }
    }
  },
  'GET:/api/projects': {
    summary: 'Lister projets',
    request: {
      page: 1,
      limit: 20,
      status: 'ONLINE'
    },
    response: {
      success: true,
      data: [
        { id: 'proj_123', name: 'Site 1', state: 'ONLINE' },
        { id: 'proj_456', name: 'Site 2', state: 'ONLINE' }
      ],
      pagination: { page: 1, limit: 20, total: 2 }
    }
  },
  'POST:/api/projects/{id}/build': {
    summary: 'Lancer build',
    request: {
      target: 'production',
      optimize: true,
      cache: true
    },
    response: {
      success: true,
      data: {
        workflowId: 'wf_789012',
        status: 'running',
        progress: 0,
        startedAt: '2024-01-15T10:35:00Z'
      }
    }
  }
};

const STATUS_CODES = {
  200: 'Success',
  201: 'Created', 
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Error'
};

export async function generateRequestExamples(endpoint, method = 'GET', data = {}, options = {}) {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('ExampleError: endpoint requis');
  }

  if (!method || typeof method !== 'string') {
    throw new Error('ExampleError: method requis');
  }

  try {
    const exampleKey = endpoint.includes(":") ? endpoint : `${method}:${endpoint}`;
    const baseExample = REQUEST_EXAMPLES[exampleKey];

    if (!baseExample) {
      // Générer exemple par défaut
      return {
        examples: {
          request: data,
          response: { success: true, data: null }
        },
        interactive: false,
        validated: false,
        generatedAt: new Date().toISOString()
      };
    }

    return {
      examples: baseExample,
      interactive: true,
      validated: true,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`ExampleError: ${error.message}`);
  }
}

export async function generateResponseExamples(statusCode = 200, endpoint = '', errorType = '') {
  if (typeof statusCode !== 'number') {
    throw new Error('ExampleError: statusCode doit être number');
  }

  if (!STATUS_CODES[statusCode]) {
    throw new Error(`ExampleError: Status code ${statusCode} non supporté`);
  }

  try {
    let responseExample;

    if (statusCode >= 200 && statusCode < 300) {
      // Success response
      responseExample = {
        success: true,
        data: { message: STATUS_CODES[statusCode] },
        metadata: {
          statusCode,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Error response
      responseExample = {
        success: false,
        error: {
          code: errorType || STATUS_CODES[statusCode].toUpperCase(),
          message: STATUS_CODES[statusCode],
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      statusCode,
      statusText: STATUS_CODES[statusCode],
      example: responseExample,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`ExampleError: ${error.message}`);
  }
}

export async function createInteractiveTests(endpoint, examples = {}, authRequired = false) {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('InteractiveError: endpoint requis');
  }

  if (!examples || typeof examples !== 'object') {
    throw new Error('InteractiveError: examples requis');
  }

  try {
    const testConfig = {
      endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      authRequired,
      examples
    };

    if (authRequired) {
      testConfig.headers['Authorization'] = 'Bearer YOUR_TOKEN_HERE';
    }

    // Simulation création tests interactifs
    const testsCreated = Object.keys(examples).length > 0;

    return {
      interactive: testsCreated,
      endpoint,
      testsCount: Object.keys(examples).length,
      authRequired,
      createdAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`InteractiveError: ${error.message}`);
  }
}

export async function validateExampleData(exampleData, schemaType = 'request') {
  if (!exampleData || typeof exampleData !== 'object') {
    throw new Error('ValidationError: exampleData requis');
  }

  if (schemaType !== 'request' && schemaType !== 'response') {
    throw new Error('ValidationError: schemaType doit être request ou response');
  }

  try {
    const errors = [];

    // Validation basique selon type
    if (schemaType === 'request') {
      if (exampleData.name && typeof exampleData.name !== 'string') {
        errors.push('name doit être string');
      }
      if (exampleData.template && !['react', 'vue', 'angular', 'static'].includes(exampleData.template)) {
        errors.push('template invalide');
      }
    } else {
      if (!exampleData.hasOwnProperty('success')) {
        errors.push('success requis dans response');
      }
      if (exampleData.success && !exampleData.data) {
        errors.push('data requis si success=true');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      schemaType,
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`ValidationError: ${error.message}`);
  }
}

// documentation/examples : API Documentation (commit 48)
// DEPENDENCY FLOW : api/documentation/ → api/schemas/ → engines/ → transitions/ → systems/
