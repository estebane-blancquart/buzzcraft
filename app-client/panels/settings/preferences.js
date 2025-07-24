/**
 * COMMIT 67 - Panel Settings
 * 
 * FAIT QUOI : Préférences utilisateur avec personnalisation interface et sauvegarde automatique
 * REÇOIT : userId: string, preferences?: object, autoSave?: boolean
 * RETOURNE : { preferences: object, categories: object[], validation: object, autoSave: object }
 * ERREURS : PreferenceError si préférence invalide, ValidationError si contrainte violée, SaveError si sauvegarde échoue
 */

export async function createUserPreferences(userId, preferences = {}, autoSave = true) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('PreferenceError: UserId requis string');
  }

  if (typeof preferences !== 'object') {
    throw new Error('PreferenceError: Preferences doit être object');
  }

  if (typeof autoSave !== 'boolean') {
    throw new Error('PreferenceError: AutoSave doit être boolean');
  }

  try {
    const defaultPreferences = getDefaultPreferences();
    const mergedPreferences = {
      ...defaultPreferences,
      ...preferences,
      userId,
      lastModified: new Date().toISOString()
    };

    const categories = getPreferenceCategories();
    const validation = await validatePreferences(mergedPreferences);
    const autoSaveConfig = autoSave ? await setupAutoSave(userId) : null;

    return {
      preferences: mergedPreferences,
      categories,
      validation,
      autoSave: autoSaveConfig,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`PreferenceError: Création préférences échouée: ${error.message}`);
  }
}

export async function validatePreferenceChanges(preferences, changes, constraints = {}) {
  if (!preferences || typeof preferences !== 'object') {
    throw new Error('PreferenceError: Preferences requis object');
  }

  if (!changes || typeof changes !== 'object') {
    throw new Error('PreferenceError: Changes requis object');
  }

  if (typeof constraints !== 'object') {
    throw new Error('PreferenceError: Constraints doit être object');
  }

  try {
    const issues = [];
    const warnings = [];

    // Validation chaque changement
    for (const [key, value] of Object.entries(changes)) {
      const constraint = constraints[key] || getDefaultConstraint(key);
      
      // Validation type
      if (constraint.type && typeof value !== constraint.type) {
        issues.push(`invalid_type_${key}: expected ${constraint.type}, got ${typeof value}`);
        continue;
      }

      // Validation valeurs autorisées
      if (constraint.allowedValues && !constraint.allowedValues.includes(value)) {
        issues.push(`invalid_value_${key}: ${value} not in allowed values`);
        continue;
      }

      // Validation range numérique
      if (constraint.range && typeof value === 'number') {
        const { min, max } = constraint.range;
        if (value < min || value > max) {
          issues.push(`out_of_range_${key}: ${value} not in range [${min}, ${max}]`);
          continue;
        }
      }

      // Warnings pour changements impactants
      if (isImpactfulChange(key, preferences[key], value)) {
        warnings.push(`impactful_change_${key}: may require restart or affect performance`);
      }
    }

    return {
      valid: issues.length === 0,
      changes: Object.keys(changes).length,
      validChanges: Object.keys(changes).length - issues.length,
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ValidationError: Validation changements échouée: ${error.message}`);
  }
}

export async function updateUserPreferences(userId, updates, options = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('PreferenceError: UserId requis string');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('PreferenceError: Updates requis object');
  }

  const validateUpdates = options.validateUpdates !== false;
  const backup = options.backup !== false;
  const notify = options.notify !== false;

  try {
    const currentPreferences = await loadUserPreferences(userId);
    
    // Validation avant application
    if (validateUpdates) {
      const validation = await validatePreferenceChanges(currentPreferences, updates);
      if (!validation.valid) {
        throw new Error(`ValidationError: Updates invalides: ${validation.issues.join(', ')}`);
      }
    }

    // Application des updates
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      lastModified: new Date().toISOString()
    };

    return {
      updated: true,
      preferences: updatedPreferences,
      appliedUpdates: Object.keys(updates),
      backup: backup ? currentPreferences : null,
      notified: notify,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`PreferenceError: Mise à jour préférences échouée: ${error.message}`);
  }
}

export async function getPreferencesStatus(userId, options = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('PreferenceError: UserId requis string');
  }

  try {
    const preferences = await loadUserPreferences(userId);
    const hasPreferences = preferences && Object.keys(preferences).length > 0;
    
    const categories = getPreferenceCategories();
    const completeness = calculatePreferenceCompleteness(preferences, categories);
    
    const autoSaveEnabled = preferences.autoSave?.enabled || false;
    const lastModified = preferences.lastModified || null;

    const status = hasPreferences ? 
      (completeness.percentage > 80 ? 'complete' : 'partial') : 
      'empty';

    return {
      status,
      configured: hasPreferences,
      userId: preferences.userId || userId,
      completeness: completeness.percentage,
      categories: categories.length,
      autoSaveEnabled,
      lastModified,
      preferencesCount: Object.keys(preferences).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      configured: false,
      issues: [`status_check_failed: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
function getDefaultPreferences() {
  return {
    theme: 'light',
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    autoSave: { enabled: true, interval: 30 },
    notifications: {
      email: true,
      browser: true,
      desktop: false,
      mobile: true
    },
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true
    }
  };
}

function getPreferenceCategories() {
  return [
    {
      id: 'appearance',
      name: 'Apparence',
      preferences: ['theme', 'language']
    },
    {
      id: 'regional',
      name: 'Régional',
      preferences: ['timezone', 'dateFormat', 'timeFormat']
    },
    {
      id: 'editor',
      name: 'Éditeur',
      preferences: ['editor']
    },
    {
      id: 'notifications',
      name: 'Notifications',
      preferences: ['notifications']
    }
  ];
}

async function validatePreferences(preferences) {
  const issues = [];
  
  if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
    issues.push('invalid_theme');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    timestamp: new Date().toISOString()
  };
}

async function setupAutoSave(userId) {
  return {
    enabled: true,
    userId,
    interval: 30000,
    lastSave: new Date().toISOString()
  };
}

function getDefaultConstraint(key) {
  const constraints = {
    theme: { type: 'string', allowedValues: ['light', 'dark', 'auto'] },
    language: { type: 'string', allowedValues: ['fr', 'en', 'es'] },
    fontSize: { type: 'number', range: { min: 10, max: 24 } }
  };
  
  return constraints[key] || { type: 'string' };
}

function isImpactfulChange(key, oldValue, newValue) {
  const impactfulKeys = ['theme', 'language', 'fontSize'];
  return impactfulKeys.includes(key) && oldValue !== newValue;
}

async function loadUserPreferences(userId) {
  return {
    userId,
    theme: 'light',
    language: 'fr',
    lastModified: new Date().toISOString()
  };
}

function calculatePreferenceCompleteness(preferences, categories) {
  const totalPrefs = categories.reduce((sum, cat) => sum + cat.preferences.length, 0);
  const configuredPrefs = Object.keys(preferences).length;
  
  return {
    percentage: Math.round((configuredPrefs / totalPrefs) * 100),
    configured: configuredPrefs,
    total: totalPrefs
  };
}

// panels/settings/preferences : Panel Settings (commit 67)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
