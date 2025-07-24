/**
 * COMMIT 70 - Panel Help
 * 
 * FAIT QUOI : Support technique avec tickets, diagnostics et assistance en temps réel
 * REÇOIT : supportType: string, userContext: object, priority: string
 * RETOURNE : { support: object, diagnostics: object[], assistance: object, ticket: object }
 * ERREURS : SupportError si type invalide, DiagnosticError si analyse échoue, TicketError si création impossible
 */

export async function createSupportSession(supportType, userContext = {}, priority = 'normal') {
  if (!supportType || typeof supportType !== 'string') {
    throw new Error('SupportError: SupportType requis string');
  }

  const validTypes = ['technical', 'documentation', 'account', 'billing', 'feature-request', 'bug-report'];
  if (!validTypes.includes(supportType)) {
    throw new Error(`SupportError: Type "${supportType}" non supporté`);
  }

  const validPriorities = ['low', 'normal', 'high', 'critical'];
  if (!validPriorities.includes(priority)) {
    throw new Error(`SupportError: Priorité "${priority}" invalide`);
  }

  const sessionId = generateSessionId();
  const diagnostics = await runDiagnostics(userContext);
  const assistance = initializeAssistance(supportType);
  const ticket = createTicket(sessionId, supportType, priority, userContext);

  const support = {
    sessionId,
    type: supportType,
    priority,
    status: 'active',
    startTime: new Date().toISOString(),
    estimatedResponseTime: getResponseTime(priority)
  };

  return {
    support,
    diagnostics,
    assistance,
    ticket,
    metadata: {
      sessionId,
      supportType,
      priority,
      timestamp: new Date().toISOString()
    }
  };
}

export async function validateSupportRequest(supportConfig, requestData, validation = {}) {
  if (!supportConfig || typeof supportConfig !== 'object') {
    throw new Error('SupportError: Configuration support requise');
  }

  if (!requestData || typeof requestData !== 'object') {
    throw new Error('SupportError: RequestData requis object');
  }

  const validationResult = {
    valid: true,
    errors: [],
    warnings: [],
    completeness: 0
  };

  // Validation champs obligatoires
  const requiredFields = getRequiredFields(supportConfig.support.type);
  const missingFields = requiredFields.filter(field => !requestData[field]);
  
  if (missingFields.length > 0) {
    validationResult.errors.push(`missing_required_fields: ${missingFields.join(', ')}`);
    validationResult.valid = false;
  }

  // Validation contenu
  if (requestData.description && requestData.description.length < 20) {
    validationResult.warnings.push('description_too_short');
  }

  // Calcul complétude
  const totalFields = requiredFields.length + getOptionalFields().length;
  const providedFields = Object.keys(requestData).filter(key => requestData[key]).length;
  validationResult.completeness = Math.round((providedFields / totalFields) * 100);

  return {
    ...validationResult,
    supportType: supportConfig.support.type,
    timestamp: new Date().toISOString()
  };
}

export async function updateSupportSession(supportConfig, updates, action = 'update') {
  if (!supportConfig || typeof supportConfig !== 'object') {
    throw new Error('SupportError: Configuration support requise');
  }

  const validActions = ['update', 'escalate', 'resolve', 'close'];
  if (!validActions.includes(action)) {
    throw new Error(`SupportError: Action "${action}" non supportée`);
  }

  const support = supportConfig.support;
  const ticket = supportConfig.ticket;
  let result = { updated: false };

  switch (action) {
    case 'escalate':
      if (support.priority !== 'critical') {
        support.priority = escalatePriority(support.priority);
        support.estimatedResponseTime = getResponseTime(support.priority);
        ticket.escalated = true;
        result = { updated: true, action: 'escalated', newPriority: support.priority };
      }
      break;

    case 'resolve':
      support.status = 'resolved';
      support.resolvedTime = new Date().toISOString();
      ticket.status = 'resolved';
      result = { updated: true, action: 'resolved' };
      break;

    case 'close':
      support.status = 'closed';
      support.closedTime = new Date().toISOString();
      ticket.status = 'closed';
      result = { updated: true, action: 'closed' };
      break;

    default:
      Object.assign(support, updates);
      result = { updated: true, action: 'updated' };
  }

  support.lastUpdate = new Date().toISOString();

  return {
    ...result,
    sessionId: support.sessionId,
    timestamp: new Date().toISOString()
  };
}

export async function getSupportStatus(supportConfig) {
  if (!supportConfig) {
    return {
      status: 'missing',
      configured: false,
      timestamp: new Date().toISOString()
    };
  }

  const support = supportConfig.support;
  const sessionDuration = support.startTime ? 
    Date.now() - new Date(support.startTime).getTime() : 0;

  return {
    status: support?.status || 'unknown',
    configured: !!support,
    session: {
      id: support?.sessionId || 'unknown',
      type: support?.type || 'unknown',
      priority: support?.priority || 'normal',
      duration: Math.round(sessionDuration / 1000 / 60) // minutes
    },
    ticket: {
      id: supportConfig.ticket?.id || 'unknown',
      status: supportConfig.ticket?.status || 'unknown'
    },
    diagnostics: {
      count: supportConfig.diagnostics?.length || 0,
      issues: supportConfig.diagnostics?.filter(d => d.status === 'error').length || 0
    },
    lastCheck: new Date().toISOString()
  };
}

// Fonctions utilitaires
function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `support_${timestamp}_${random}`;
}

async function runDiagnostics(userContext) {
  const diagnostics = [];

  // Diagnostic système
  diagnostics.push({
    id: 'system_info',
    name: 'Informations système',
    status: 'success',
    details: {
      os: userContext.os || 'unknown',
      browser: userContext.browser || 'unknown'
    }
  });

  // Diagnostic connectivité
  diagnostics.push({
    id: 'connectivity',
    name: 'Test connectivité',
    status: navigator.onLine ? 'success' : 'error',
    details: { online: navigator.onLine }
  });

  return diagnostics;
}

function initializeAssistance(supportType) {
  const assistanceTypes = {
    'technical': { type: 'guided', features: ['step-by-step', 'diagnostics'] },
    'documentation': { type: 'search', features: ['smart-search', 'examples'] },
    'bug-report': { type: 'guided', features: ['bug-reproduction', 'log-collection'] }
  };

  return assistanceTypes[supportType] || assistanceTypes['technical'];
}

function createTicket(sessionId, supportType, priority, userContext) {
  const ticketId = `BUZZ-${Date.now().toString(36).toUpperCase()}`;
  
  return {
    id: ticketId,
    sessionId,
    type: supportType,
    priority,
    status: 'open',
    title: `${supportType} - ${ticketId}`,
    createdTime: new Date().toISOString(),
    userInfo: {
      id: userContext.userId || 'anonymous',
      email: userContext.email || null
    }
  };
}

function getResponseTime(priority) {
  const times = {
    'critical': '< 2 heures',
    'high': '< 4 heures',
    'normal': '< 24 heures',
    'low': '< 72 heures'
  };
  return times[priority] || times['normal'];
}

function getRequiredFields(supportType) {
  const fields = {
    'technical': ['description', 'stepsToReproduce'],
    'bug-report': ['description', 'stepsToReproduce', 'expectedBehavior'],
    'feature-request': ['description', 'useCase']
  };
  return fields[supportType] || ['description'];
}

function getOptionalFields() {
  return ['attachments', 'environment', 'priority', 'category'];
}

function escalatePriority(currentPriority) {
  const priorities = ['low', 'normal', 'high', 'critical'];
  const currentIndex = priorities.indexOf(currentPriority);
  return currentIndex < priorities.length - 1 ? 
    priorities[currentIndex + 1] : currentPriority;
}

// panels/help/support : Panel Help (commit 70)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/