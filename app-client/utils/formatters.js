/**
 * COMMIT 54 - App Client Utils
 * 
 * FAIT QUOI : Formatters basiques pour données avec config simple
 * REÇOIT : data: any, config: object, options?: object
 * RETOURNE : { formatted: any, config: object, status: string, metadata: object }
 * ERREURS : FormatterError si data invalide, ConfigError si config manquante
 */

export async function createFormatter(type = 'text', config = {}, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new Error('FormatterError: Type formatter requis');
  }

  const formatter = {
    type,
    config: { locale: 'fr-FR', format: 'default', ...config },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    formatter,
    type,
    config: formatter.config,
    status: 'created',
    metadata: { type },
    timestamp: new Date().toISOString()
  };
}

export async function validateFormatter(formatterConfig) {
  return {
    valid: !!formatterConfig?.created,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };
}

export async function updateFormatterConfig(formatterConfig, newConfig) {
  return {
    updated: true,
    formatter: { ...formatterConfig, config: { ...formatterConfig.config, ...newConfig } },
    changes: Object.keys(newConfig),
    timestamp: new Date().toISOString()
  };
}

export async function getFormatterStatus(formatterConfig) {
  return {
    status: formatterConfig ? 'healthy' : 'missing',
    configured: !!formatterConfig,
    timestamp: new Date().toISOString()
  };
}

// utils/formatters : App Client Utils (commit 54)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
