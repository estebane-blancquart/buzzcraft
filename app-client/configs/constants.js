// 📋 CONSTANTES CLIENT BUZZCRAFT

// Actions projets disponibles
export const PROJECT_ACTIONS = {
  CREATE: 'CREATE',
  BUILD: 'BUILD',
  DEPLOY: 'DEPLOY', 
  START: 'START',
  STOP: 'STOP',
  REVERT: 'REVERT',
  DELETE: 'DELETE',
  EDIT: 'EDIT'
};

// Types de messages console
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
};

// États projets possibles
export const PROJECT_STATES = {
  VOID: 'VOID',
  DRAFT: 'DRAFT',
  BUILT: 'BUILT', 
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  
  // États transitoires
  BUILDING: '[BUILDING]',
  DEPLOYING: '[DEPLOYING]', 
  STARTING: '[STARTING]',
  REVERTING: '[REVERTING]'
};

// Devices pour l'éditeur
export const DEVICES = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop'
};

// Templates disponibles
export const TEMPLATES = {
  EMPTY: 'empty',
  BASIC: 'basic',
  CONTACT: 'contact',
  PORTFOLIO: 'portfolio'
};

// Configuration timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000,
  WORKFLOW: 30000,
  POLLING: 2000
};

console.log('[CONSTANTS] Client constants loaded');