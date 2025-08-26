import Handlebars from "handlebars";

/**
 * Moteur de compilation Handlebars pur avec protection et cache - VERSION PIXEL PARFAIT
 * @module handlebars
 * @description Compilation sécurisée et optimisée de templates Handlebars pour BuzzCraft
 */

// Cache des templates compilés (performance)
const templateCache = new Map();

// Timeout par défaut pour compilation (30 secondes)
const DEFAULT_COMPILATION_TIMEOUT = 30000;

// Enregistrement des helpers au chargement du module
registerBuzzCraftHelpers();

/**
 * Compile un template Handlebars individuel avec options avancées
 * @param {string} templateContent - Contenu du template à compiler
 * @param {object} variables - Variables pour la compilation
 * @param {object} [options={}] - Options de compilation
 * @param {number} [options.timeout=30000] - Timeout en millisecondes
 * @param {boolean} [options.cache=false] - Activer le cache du template
 * @param {string} [options.cacheKey] - Clé de cache personnalisée
 * @param {boolean} [options.validateSyntax=true] - Valider la syntaxe avant compilation
 * @returns {{success: boolean, data?: string, error?: string}} Résultat de compilation
 * 
 * @example
 * const result = await compileTemplate('Hello {{name}}!', { name: 'World' });
 * if (result.success) {
 *   console.log(result.data); // "Hello World!"
 * }
 * 
 * // Avec cache pour réutilisation
 * const cached = await compileTemplate(template, vars, { cache: true, cacheKey: 'header' });
 */
export async function compileTemplate(templateContent, variables, options = {}) {
  console.log(`[HANDLEBARS] Compiling template`);

  try {
    // Validation des paramètres
    const validation = validateCompileInput(templateContent, variables, options);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = prepareCompilationConfig(options);

    // Vérification cache
    if (config.cache && config.cacheKey) {
      const cached = templateCache.get(config.cacheKey);
      if (cached) {
        console.log(`[HANDLEBARS] Using cached template: ${config.cacheKey}`);
        try {
          const result = cached(variables);
          return { success: true, data: result };
        } catch (error) {
          console.log(`[HANDLEBARS] Cached template execution failed: ${error.message}`);
          // Continue avec compilation fresh
        }
      }
    }

    // Validation syntaxe si demandée
    if (config.validateSyntax) {
      const syntaxValidation = validateHandlebarsSyntax(templateContent);
      if (!syntaxValidation.valid) {
        return { success: false, error: `Syntax validation failed: ${syntaxValidation.errors.join(', ')}` };
      }
    }

    // Compilation avec timeout protection
    const compiledContent = await compileWithTimeout(templateContent, variables, config);

    // Mise en cache si demandée
    if (config.cache && config.cacheKey && compiledContent.template) {
      templateCache.set(config.cacheKey, compiledContent.template);
      console.log(`[HANDLEBARS] Template cached: ${config.cacheKey}`);
    }

    console.log(`[HANDLEBARS] Template compiled successfully`);
    return { success: true, data: compiledContent.result };

  } catch (error) {
    console.log(`[HANDLEBARS] Compilation failed: ${error.message}`);
    return { success: false, error: `Compilation failed: ${error.message}` };
  }
}

/**
 * Compile plusieurs templates en batch avec optimisations
 * @param {object} templates - Object avec templates par clé
 * @param {object} variables - Variables communes pour tous les templates
 * @param {object} [options={}] - Options de compilation batch
 * @param {number} [options.concurrency=5] - Nombre de compilations parallèles
 * @param {boolean} [options.continueOnError=true] - Continuer même si certains échouent
 * @param {boolean} [options.cache=true] - Activer le cache pour ce batch
 * @returns {{success: boolean, data?: object, errors?: string[]}} Templates compilés par clé
 * 
 * @example
 * const templates = {
 *   header: '<h1>{{title}}</h1>',
 *   footer: '<p>{{year}}</p>'
 * };
 * const result = await compileTemplates(templates, { title: 'Hello', year: 2024 });
 * if (result.success) {
 *   console.log(result.data.header); // "<h1>Hello</h1>"
 * }
 */
export async function compileTemplates(templates, variables, options = {}) {
  console.log(`[HANDLEBARS] Batch compiling ${Object.keys(templates).length} templates`);

  try {
    // Validation des paramètres
    if (!templates || typeof templates !== 'object') {
      return { success: false, error: 'ValidationError: templates must be an object' };
    }

    if (!variables || typeof variables !== 'object') {
      return { success: false, error: 'ValidationError: variables must be an object' };
    }

    const config = {
      concurrency: options.concurrency || 5,
      continueOnError: options.continueOnError !== false,
      cache: options.cache !== false,
      validateSyntax: options.validateSyntax !== false,
      ...options
    };

    const compiled = {};
    const errors = [];
    const templateEntries = Object.entries(templates);

    // Compilation avec concurrence limitée
    for (let i = 0; i < templateEntries.length; i += config.concurrency) {
      const batch = templateEntries.slice(i, i + config.concurrency);
      
      const batchPromises = batch.map(async ([templatePath, templateContent]) => {
        try {
          const compileOptions = {
            ...config,
            cache: config.cache,
            cacheKey: config.cache ? `batch-${templatePath}` : undefined
          };

          const result = await compileTemplate(templateContent, variables, compileOptions);
          
          if (result.success) {
            // Nettoyer l'extension .hbs pour le nom de fichier final
            const outputPath = templatePath.replace(/\.hbs$/, '');
            compiled[outputPath] = result.data;
            return { success: true, path: outputPath };
          } else {
            const error = `${templatePath}: ${result.error}`;
            errors.push(error);
            console.log(`[HANDLEBARS] Failed to compile: ${error}`);
            return { success: false, path: templatePath, error };
          }
          
        } catch (error) {
          const errorMsg = `${templatePath}: ${error.message}`;
          errors.push(errorMsg);
          console.log(`[HANDLEBARS] Batch compilation error: ${errorMsg}`);
          return { success: false, path: templatePath, error: errorMsg };
        }
      });

      // Attendre ce batch
      const batchResults = await Promise.all(batchPromises);
      
      // Si continueOnError est false et qu'il y a des erreurs, arrêter
      if (!config.continueOnError && errors.length > 0) {
        break;
      }
    }

    const successCount = Object.keys(compiled).length;
    const hasErrors = errors.length > 0;

    // Décider du succès global
    const isSuccess = successCount > 0 && (!hasErrors || config.continueOnError);

    if (isSuccess) {
      console.log(`[HANDLEBARS] Batch compilation complete: ${successCount}/${templateEntries.length} successful`);
      return {
        success: true,
        data: compiled,
        ...(hasErrors && { errors })
      };
    } else {
      console.log(`[HANDLEBARS] Batch compilation failed: ${errors.length} errors`);
      return {
        success: false,
        error: `Batch compilation failed: ${errors.length} templates failed`,
        errors
      };
    }

  } catch (error) {
    console.log(`[HANDLEBARS] Batch compilation failed: ${error.message}`);
    return { success: false, error: `Batch compilation failed: ${error.message}` };
  }
}

/**
 * Pre-compile un template pour réutilisation multiple
 * @param {string} templateContent - Contenu du template à pre-compiler
 * @param {object} [options={}] - Options de pre-compilation
 * @param {boolean} [options.cache=true] - Mettre en cache le template pre-compilé
 * @param {string} [options.cacheKey] - Clé de cache personnalisée
 * @returns {{success: boolean, data?: Function, error?: string}} Template pre-compilé réutilisable
 * 
 * @example
 * const result = await precompileTemplate('Hello {{name}}!');
 * if (result.success) {
 *   const output1 = result.data({ name: 'Alice' });
 *   const output2 = result.data({ name: 'Bob' });
 * }
 */
export async function precompileTemplate(templateContent, options = {}) {
  console.log(`[HANDLEBARS] Pre-compiling template`);

  try {
    if (!templateContent || typeof templateContent !== 'string') {
      return { success: false, error: 'ValidationError: templateContent must be non-empty string' };
    }

    const config = {
      cache: options.cache !== false,
      cacheKey: options.cacheKey,
      validateSyntax: options.validateSyntax !== false
    };

    // Vérification cache
    if (config.cache && config.cacheKey) {
      const cached = templateCache.get(config.cacheKey);
      if (cached) {
        console.log(`[HANDLEBARS] Using cached pre-compiled template: ${config.cacheKey}`);
        return { success: true, data: cached };
      }
    }

    // Validation syntaxe
    if (config.validateSyntax) {
      const syntaxValidation = validateHandlebarsSyntax(templateContent);
      if (!syntaxValidation.valid) {
        return { success: false, error: `Syntax validation failed: ${syntaxValidation.errors.join(', ')}` };
      }
    }

    // Pre-compilation
    const template = Handlebars.compile(templateContent);

    // Mise en cache si demandée
    if (config.cache && config.cacheKey) {
      templateCache.set(config.cacheKey, template);
      console.log(`[HANDLEBARS] Pre-compiled template cached: ${config.cacheKey}`);
    }

    console.log(`[HANDLEBARS] Template pre-compiled successfully`);
    return { success: true, data: template };

  } catch (error) {
    console.log(`[HANDLEBARS] Pre-compilation failed: ${error.message}`);
    return { success: false, error: `Pre-compilation failed: ${error.message}` };
  }
}

/**
 * Exécute un template pre-compilé avec des variables
 * @param {Function} compiledTemplate - Template pre-compilé
 * @param {object} variables - Variables pour l'exécution
 * @param {object} [options={}] - Options d'exécution
 * @param {number} [options.timeout=5000] - Timeout pour l'exécution
 * @returns {{success: boolean, data?: string, error?: string}} Résultat de l'exécution
 * 
 * @example
 * const template = await precompileTemplate('Hello {{name}}!');
 * const result = await executeTemplate(template.data, { name: 'World' });
 * console.log(result.data); // "Hello World!"
 */
export async function executeTemplate(compiledTemplate, variables, options = {}) {
  console.log(`[HANDLEBARS] Executing pre-compiled template`);

  try {
    if (typeof compiledTemplate !== 'function') {
      return { success: false, error: 'ValidationError: compiledTemplate must be a function' };
    }

    if (!variables || typeof variables !== 'object') {
      return { success: false, error: 'ValidationError: variables must be an object' };
    }

    const config = {
      timeout: options.timeout || 5000
    };

    // Exécution avec timeout
    const result = await executeWithTimeout(compiledTemplate, variables, config.timeout);

    console.log(`[HANDLEBARS] Template executed successfully`);
    return { success: true, data: result };

  } catch (error) {
    console.log(`[HANDLEBARS] Template execution failed: ${error.message}`);
    return { success: false, error: `Template execution failed: ${error.message}` };
  }
}

/**
 * Valide la syntaxe Handlebars d'un template
 * @param {string} templateContent - Contenu à valider
 * @param {object} [options={}] - Options de validation
 * @param {boolean} [options.checkHelpers=true] - Vérifier les helpers inconnus
 * @returns {{success: boolean, data?: {valid: boolean, errors: string[]}, error?: string}} Résultat validation
 * 
 * @example
 * const result = await validateSyntax('{{#if condition}}Valid{{/if}}');
 * if (result.success && result.data.valid) {
 *   console.log('Template syntax is valid');
 * }
 */
export async function validateSyntax(templateContent, options = {}) {
  console.log(`[HANDLEBARS] Validating template syntax`);

  try {
    if (!templateContent || typeof templateContent !== 'string') {
      return { success: false, error: 'ValidationError: templateContent must be non-empty string' };
    }

    const validation = validateHandlebarsSyntax(templateContent, options);

    console.log(`[HANDLEBARS] Syntax validation ${validation.valid ? 'passed' : 'failed'}`);

    return {
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors
      }
    };

  } catch (error) {
    console.log(`[HANDLEBARS] Syntax validation failed: ${error.message}`);
    return { success: false, error: `Syntax validation failed: ${error.message}` };
  }
}

/**
 * Nettoie le cache des templates
 * @param {string|string[]} [keys] - Clés spécifiques à nettoyer, ou undefined pour tout nettoyer
 * @returns {{success: boolean, data: {cleared: number}}} Nombre d'entrées nettoyées
 * 
 * @example
 * // Nettoyer tout le cache
 * const result = await clearCache();
 * console.log(`${result.data.cleared} templates cleared`);
 * 
 * // Nettoyer des clés spécifiques
 * await clearCache(['header', 'footer']);
 */
export async function clearCache(keys) {
  console.log(`[HANDLEBARS] Clearing template cache`);

  try {
    let cleared = 0;

    if (!keys) {
      // Nettoyer tout le cache
      cleared = templateCache.size;
      templateCache.clear();
    } else {
      // Nettoyer des clés spécifiques
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => {
        if (templateCache.delete(key)) {
          cleared++;
        }
      });
    }

    console.log(`[HANDLEBARS] Cache cleared: ${cleared} templates`);

    return {
      success: true,
      data: { cleared }
    };

  } catch (error) {
    console.log(`[HANDLEBARS] Cache clear failed: ${error.message}`);
    return { success: false, error: `Cache clear failed: ${error.message}` };
  }
}

// === FONCTIONS INTERNES ===

/**
 * Enregistre les helpers Handlebars personnalisés pour BuzzCraft
 * @private
 */
function registerBuzzCraftHelpers() {
  // Helpers de comparaison
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  Handlebars.registerHelper("ne", function (a, b) {
    return a !== b;
  });

  Handlebars.registerHelper("gt", function (a, b) {
    return a > b;
  });

  Handlebars.registerHelper("lt", function (a, b) {
    return a < b;
  });

  // Helpers logiques
  Handlebars.registerHelper("and", function (a, b) {
    return a && b;
  });

  Handlebars.registerHelper("or", function (a, b) {
    return a || b;
  });

  // Helper conditionnel avancé
  Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
    switch (operator) {
      case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      default: return options.inverse(this);
    }
  });

  console.log(`[HANDLEBARS] BuzzCraft helpers registered successfully`);
}

/**
 * Valide les paramètres de compilation
 * @private
 */
function validateCompileInput(templateContent, variables, options) {
  if (!templateContent || typeof templateContent !== 'string') {
    return { valid: false, error: 'ValidationError: templateContent must be non-empty string' };
  }

  if (!variables || typeof variables !== 'object') {
    return { valid: false, error: 'ValidationError: variables must be an object' };
  }

  if (options && typeof options !== 'object') {
    return { valid: false, error: 'ValidationError: options must be an object' };
  }

  if (options.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
    return { valid: false, error: 'ValidationError: options.timeout must be positive number' };
  }

  return { valid: true };
}

/**
 * Prépare la configuration de compilation
 * @private
 */
function prepareCompilationConfig(options) {
  return {
    timeout: options.timeout || DEFAULT_COMPILATION_TIMEOUT,
    cache: options.cache === true,
    cacheKey: options.cacheKey,
    validateSyntax: options.validateSyntax !== false
  };
}

/**
 * Compile avec protection timeout
 * @private
 */
async function compileWithTimeout(templateContent, variables, config) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Compilation timeout exceeded (${config.timeout}ms)`));
    }, config.timeout);

    try {
      const template = Handlebars.compile(templateContent);
      const result = template(variables);
      
      clearTimeout(timeoutId);
      resolve({ template, result });
      
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Exécute template avec protection timeout
 * @private
 */
async function executeWithTimeout(compiledTemplate, variables, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Template execution timeout exceeded (${timeout}ms)`));
    }, timeout);

    try {
      const result = compiledTemplate(variables);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Validation syntaxe Handlebars interne
 * @private
 */
function validateHandlebarsSyntax(templateContent, options = {}) {
  const errors = [];
  const checkHelpers = options.checkHelpers !== false;

  if (!templateContent || typeof templateContent !== 'string') {
    errors.push('Template content must be a non-empty string');
    return { valid: false, errors };
  }

  // Validation des accolades équilibrées
  const openBraces = (templateContent.match(/\{\{/g) || []).length;
  const closeBraces = (templateContent.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Validation des blocs non fermés
  const unclosedBlocks = findUnclosedBlocks(templateContent);
  if (unclosedBlocks.length > 0) {
    errors.push(`Unclosed blocks: ${unclosedBlocks.join(', ')}`);
  }

  // Validation helpers si demandée
  if (checkHelpers) {
    const unknownHelpers = findUnknownHelpers(templateContent);
    if (unknownHelpers.length > 0) {
      errors.push(`Unknown helpers: ${unknownHelpers.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Trouve les blocs Handlebars non fermés
 * @private
 */
function findUnclosedBlocks(templateContent) {
  const blockPattern = /\{\{#(\w+)[^}]*\}\}/g;
  const closePattern = /\{\{\/(\w+)\}\}/g;
  
  const openBlocks = [];
  const closeBlocks = [];
  
  let match;
  
  // Trouver tous les blocs ouverts
  while ((match = blockPattern.exec(templateContent)) !== null) {
    openBlocks.push(match[1]);
  }
  
  // Reset regex
  closePattern.lastIndex = 0;
  
  // Trouver tous les blocs fermés
  while ((match = closePattern.exec(templateContent)) !== null) {
    closeBlocks.push(match[1]);
  }
  
  // Trouver les blocs non fermés
  const unclosed = [];
  for (const openBlock of openBlocks) {
    const closeIndex = closeBlocks.indexOf(openBlock);
    if (closeIndex === -1) {
      unclosed.push(openBlock);
    } else {
      closeBlocks.splice(closeIndex, 1);
    }
  }
  
  return unclosed;
}

/**
 * Trouve les helpers inconnus
 * @private
 */
function findUnknownHelpers(templateContent) {
  const helperPattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+/g;
  const usedHelpers = new Set();
  let match;

  while ((match = helperPattern.exec(templateContent)) !== null) {
    usedHelpers.add(match[1]);
  }

  // Helpers connus (Handlebars built-in + BuzzCraft custom)
  const knownHelpers = [
    'if', 'unless', 'each', 'with', 'lookup', 'log',
    'eq', 'ne', 'gt', 'lt', 'and', 'or', 'ifCond'
  ];
  
  const unknownHelpers = [];
  for (const helper of usedHelpers) {
    if (!knownHelpers.includes(helper)) {
      unknownHelpers.push(helper);
    }
  }

  return unknownHelpers;
}

console.log(`[HANDLEBARS] Handlebars engine loaded successfully - PIXEL PERFECT VERSION`);