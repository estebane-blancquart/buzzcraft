import Handlebars from 'handlebars';

// Cache pour les templates pre-compilés
const templateCache = new Map();

// === HELPERS BUZZCRAFT ===

/**
 * Helper conditionnel avec opérateurs
 */
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=':
      return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case '&&':
      return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case '||':
      return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

/**
 * Helper égalité simple
 */
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

/**
 * Helper inégalité
 */
Handlebars.registerHelper('ne', function (a, b) {
  return a !== b;
});

/**
 * Helper supérieur à
 */
Handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});

/**
 * Helper inférieur à
 */
Handlebars.registerHelper('lt', function (a, b) {
  return a < b;
});

/**
 * Helper ET logique
 */
Handlebars.registerHelper('and', function (a, b) {
  return a && b;
});

/**
 * Helper OU logique
 */
Handlebars.registerHelper('or', function (a, b) {
  return a || b;
});

// === FONCTIONS PRINCIPALES ===

/**
 * Compile un template Handlebars avec des variables
 * @param {string} templateContent - Contenu du template à compiler
 * @param {object} variables - Variables pour la compilation
 * @param {object} [options={}] - Options de compilation
 * @param {number} [options.timeout=10000] - Timeout en ms
 * @param {boolean} [options.strict=false] - Mode strict (erreur sur variables manquantes)
 * @returns {{success: boolean, data?: string, error?: string}} Template compilé ou erreur
 * 
 * @example
 * const result = await compileTemplate('Hello {{name}}!', { name: 'World' });
 * if (result.success) {
 *   console.log(result.data); // "Hello World!"
 * }
 */
export async function compileTemplate(templateContent, variables = {}, options = {}) {
  console.log(`[HANDLEBARS] Compiling template`);

  try {
    if (!templateContent || typeof templateContent !== 'string') {
      return { success: false, error: 'ValidationError: templateContent must be non-empty string' };
    }

    if (!variables || typeof variables !== 'object') {
      return { success: false, error: 'ValidationError: variables must be an object' };
    }

    const config = {
      timeout: options.timeout || 10000,
      strict: options.strict || false,
      validateSyntax: options.validateSyntax !== false
    };

    // Validation syntaxe Handlebars
    if (config.validateSyntax) {
      const syntaxValidation = validateHandlebarsSyntax(templateContent);
      if (!syntaxValidation.valid) {
        return { success: false, error: `Syntax validation failed: ${syntaxValidation.errors.join(', ')}` };
      }
    }

    // Compilation avec timeout
    const compiledOutput = await Promise.race([
      new Promise(resolve => {
        try {
          const template = Handlebars.compile(templateContent, { strict: config.strict });
          const result = template(variables);
          resolve({ success: true, data: result });
        } catch (error) {
          resolve({ success: false, error: `Template compilation failed: ${error.message}` });
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Template compilation timeout')), config.timeout)
      )
    ]);

    console.log(`[HANDLEBARS] Template compiled successfully`);
    return compiledOutput;

  } catch (error) {
    console.log(`[HANDLEBARS] Compilation failed: ${error.message}`);
    return { success: false, error: `Template compilation failed: ${error.message}` };
  }
}

/**
 * Compile plusieurs templates en batch - ALIAS pour compatibilité build-coordinator
 * @param {object} templates - Templates à compiler { path: content }
 * @param {object} variables - Variables communes
 * @param {object} [options={}] - Options de compilation
 * @returns {{success: boolean, data?: object, errors?: string[]}} Templates compilés
 */
export async function compileTemplates(templates, variables = {}, options = {}) {
  return await batchCompileTemplates(templates, variables, options);
}

/**
 * Compile un batch de templates en parallèle
 * @param {object} templates - Templates à compiler { path: content }
 * @param {object} variables - Variables communes
 * @param {object} [options={}] - Options de compilation
 * @param {number} [options.batchSize=5] - Nombre de templates en parallèle
 * @param {boolean} [options.continueOnError=true] - Continuer si erreur
 * @returns {{success: boolean, data?: object, errors?: string[]}} Templates compilés
 * 
 * @example
 * const templates = { 'index.hbs': 'Hello {{name}}!', 'about.hbs': 'About {{title}}' };
 * const result = await batchCompileTemplates(templates, { name: 'World', title: 'Us' });
 */
export async function batchCompileTemplates(templates, variables = {}, options = {}) {
  console.log(`[HANDLEBARS] Batch compiling templates`);

  try {
    if (!templates || typeof templates !== 'object') {
      return { success: false, error: 'ValidationError: templates must be an object' };
    }

    if (!variables || typeof variables !== 'object') {
      return { success: false, error: 'ValidationError: variables must be an object' };
    }

    const config = {
      batchSize: options.batchSize || 5,
      continueOnError: options.continueOnError !== false,
      timeout: options.timeout || 10000
    };

    const templateEntries = Object.entries(templates);
    const compiled = {};
    const errors = [];

    // Traitement par batch
    for (let i = 0; i < templateEntries.length; i += config.batchSize) {
      const batch = templateEntries.slice(i, i + config.batchSize);
      
      const batchPromises = batch.map(async ([templatePath, templateContent]) => {
        try {
          const compileOptions = {
            timeout: config.timeout,
            cacheKey: options.cache ? `batch-${templatePath}` : undefined
          };

          const result = await compileTemplate(templateContent, variables, compileOptions);
          
          if (result.success) {
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

      await Promise.all(batchPromises);
      
      if (!config.continueOnError && errors.length > 0) {
        break;
      }
    }

    const successCount = Object.keys(compiled).length;
    const hasErrors = errors.length > 0;
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
 */
export async function executeTemplate(compiledTemplate, variables = {}, options = {}) {
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
    const result = await Promise.race([
      new Promise(resolve => {
        try {
          const output = compiledTemplate(variables);
          resolve({ success: true, data: output });
        } catch (error) {
          resolve({ success: false, error: `Template execution failed: ${error.message}` });
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Template execution timeout')), config.timeout)
      )
    ]);

    console.log(`[HANDLEBARS] Template executed successfully`);
    return result;

  } catch (error) {
    console.log(`[HANDLEBARS] Template execution failed: ${error.message}`);
    return { success: false, error: `Template execution failed: ${error.message}` };
  }
}

// === FONCTIONS UTILITAIRES ===

/**
 * Valide la syntaxe Handlebars d'un template
 * @private
 */
function validateHandlebarsSyntax(templateContent) {
  const errors = [];

  try {
    // Test de compilation basique
    Handlebars.compile(templateContent);
  } catch (error) {
    errors.push(`Compilation error: ${error.message}`);
  }

  // Vérifier les blocs non fermés
  const unclosedBlocks = findUnclosedBlocks(templateContent);
  if (unclosedBlocks.length > 0) {
    errors.push(`Unclosed blocks: ${unclosedBlocks.join(', ')}`);
  }

  // Vérifier les helpers inconnus (optionnel)
  const unknownHelpers = findUnknownHelpers(templateContent);
  if (unknownHelpers.length > 0) {
    // Warning plutôt qu'erreur pour les helpers inconnus
    console.log(`[HANDLEBARS] Unknown helpers detected: ${unknownHelpers.join(', ')}`);
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