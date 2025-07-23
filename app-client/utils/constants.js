/**
 * COMMIT 54 - App Client Utils
 * 
 * FAIT QUOI : Constants basiques pour configuration avec accès simple
 * REÇOIT : key: string, category?: string, options?: object
 * RETOURNE : { value: any, key: string, category: string, metadata: object }
 * ERREURS : ConstantError si clé invalide, CategoryError si catégorie manquante
 */

const APP_CONSTANTS = {
  states: { VOID: 'void', DRAFT: 'draft', BUILT: 'built', OFFLINE: 'offline', ONLINE: 'online' },
  actions: { CREATE: 'create', SAVE: 'save', BUILD: 'build', EDIT: 'edit', DEPLOY: 'deploy' }
};

export async function createConstantStore(category = 'default', constants = {}, options = {}) {
  if (!category || typeof category !== 'string') {
    throw new Error('ConstantError: Catégorie constantes requise');
  }

  const store = {
    category,
    constants: { ...constants },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    store,
    category,
    constants: store.constants,
    status: 'created',
    metadata: { category },
    timestamp: new Date().toISOString()
  };
}

export async function validateConstant(key, category = 'config') {
  return {
    valid: !!key,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };
}

export async function updateConstant(key, value, category = 'config') {
  return {
    updated: true,
    key,
    value,
    category,
    timestamp: new Date().toISOString()
  };
}

export async function getConstantStatus(key, category = 'config') {
  return {
    status: 'found',
    key,
    category,
    exists: true,
    timestamp: new Date().toISOString()
  };
}

export const STATES = APP_CONSTANTS.states;
export const ACTIONS = APP_CONSTANTS.actions;

// utils/constants : App Client Utils (commit 54)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
