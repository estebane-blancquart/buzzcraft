/**
 * Validation des templates Handlebars et variables - VERSION PIXEL PARFAIT
 * @module template-validator
 */

// Cache pour les regex compilées (performance)
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;
const HELPER_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+/g;

/**
 * Valide les variables Handlebars avant compilation
 * @param {string} templateContent - Contenu du template à valider
 * @param {object} variables - Variables disponibles pour le template
 * @param {object} [options={}] - Options de validation
 * @param {string[]} [options.requiredVars=[]] - Variables obligatoires
 * @param {boolean} [options.allowPartials=false] - Autoriser les partials manquants
 * @returns {{success: boolean, data: {valid: boolean, missingVars: string[], errors: string[]}}} Résultat validation
 * 
 * @example
 * const result = await validateTemplateVariables(template, { project: {...} });
 * if (result.success && result.data.valid) {
 *   console.log('Template variables are valid');
 * }
 */
export async function validateTemplateVariables(templateContent, variables, options = {}) {
  console.log(`[TEMPLATE-VALIDATOR] Validating template variables`);

  try {
    validateTemplateInput(templateContent, variables, options);

    const errors = [];
    const missingVars = [];
    const requiredVars = options.requiredVars || [];

    // Extraction des variables du template
    const templateVars = extractTemplateVariables(templateContent);
    console.log(`[TEMPLATE-VALIDATOR] Found ${templateVars.size} unique variables in template`);

    // Validation existence variables
    for (const varName of templateVars) {
      const value = getNestedValue(variables, varName);
      
      if (value === undefined || value === null) {
        missingVars.push(varName);
      }
    }

    // Validation variables obligatoires
    for (const requiredVar of requiredVars) {
      if (!templateVars.has(requiredVar)) {
        errors.push(`Required variable '${requiredVar}' not used in template`);
      }
    }

    // Validation syntaxe Handlebars
    const syntaxErrors = validateHandlebarsSyntax(templateContent, options);
    errors.push(...syntaxErrors);

    if (missingVars.length > 0) {
      errors.push(`Missing template variables: ${missingVars.join(', ')}`);
    }

    const isValid = errors.length === 0;

    console.log(`[TEMPLATE-VALIDATOR] Validation ${isValid ? 'passed' : 'failed'}: ${missingVars.length} missing variables`);

    return {
      success: true,
      data: {
        valid: isValid,
        missingVars,
        errors,
        stats: {
          totalVariables: templateVars.size,
          missingCount: missingVars.length,
          validatedAt: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    console.log(`[TEMPLATE-VALIDATOR] Validation failed: ${error.message}`);
    return {
      success: false,
      error: `Template validation failed: ${error.message}`
    };
  }
}

/**
 * Valide la syntaxe Handlebars d'un template
 * @param {string} templateContent - Contenu template à valider
 * @param {object} [options={}] - Options de validation
 * @returns {{success: boolean, data: {valid: boolean, errors: string[]}}} Résultat validation syntaxe
 */
export async function validateHandlebarsSyntax(templateContent, options = {}) {
  console.log(`[TEMPLATE-VALIDATOR] Validating Handlebars syntax`);

  try {
    if (!templateContent || typeof templateContent !== 'string') {
      throw new Error('ValidationError: templateContent must be a non-empty string');
    }

    const errors = validateHandlebarsSyntax(templateContent, options);
    const isValid = errors.length === 0;

    console.log(`[TEMPLATE-VALIDATOR] Syntax validation ${isValid ? 'passed' : 'failed'}`);

    return {
      success: true,
      data: {
        valid: isValid,
        errors
      }
    };

  } catch (error) {
    console.log(`[TEMPLATE-VALIDATOR] Syntax validation failed: ${error.message}`);
    return {
      success: false,
      error: `Syntax validation failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres d'entrée
 * @private
 */
function validateTemplateInput(templateContent, variables, options) {
  if (!templateContent || typeof templateContent !== 'string') {
    throw new Error('ValidationError: templateContent must be a non-empty string');
  }

  if (!variables || typeof variables !== 'object') {
    throw new Error('ValidationError: variables must be an object');
  }

  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  if (options.requiredVars && !Array.isArray(options.requiredVars)) {
    throw new Error('ValidationError: options.requiredVars must be an array');
  }
}

/**
 * Extrait toutes les variables utilisées dans un template
 * @private
 * @param {string} templateContent - Contenu du template
 * @returns {Set<string>} Set des variables trouvées
 */
function extractTemplateVariables(templateContent) {
  const foundVariables = new Set();
  let match;

  // Reset regex (important pour la réutilisation)
  VARIABLE_PATTERN.lastIndex = 0;

  while ((match = VARIABLE_PATTERN.exec(templateContent)) !== null) {
    const varName = cleanVariableName(match[1]);
    if (varName) {
      foundVariables.add(varName);
    }
  }

  return foundVariables;
}

/**
 * Nettoie et normalise un nom de variable
 * @private
 * @param {string} rawVarName - Nom brut de variable (avec helpers, etc.)
 * @returns {string} Nom de variable nettoyé
 */
function cleanVariableName(rawVarName) {
  const cleaned = rawVarName.trim();
  
  // Ignore les helpers (if, each, unless, etc.)
  const helpers = ['if', 'unless', 'each', 'with', 'eq', 'ne', 'gt', 'lt', 'and', 'or'];
  const firstWord = cleaned.split(' ')[0];
  
  if (helpers.includes(firstWord)) {
    return null; // C'est un helper, pas une variable
  }
  
  // Extraire le nom de variable principal (avant les espaces)
  return firstWord;
}

/**
 * Valide la syntaxe Handlebars (fonction interne)
 * @private
 * @param {string} templateContent - Contenu à valider
 * @param {object} options - Options de validation
 * @returns {string[]} Liste des erreurs trouvées
 */
function validateHandlebarsSyntax(templateContent, options) {
  const errors = [];

  // Validation des accolades équilibrées
  const openBraces = (templateContent.match(/\{\{/g) || []).length;
  const closeBraces = (templateContent.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Validation des helpers inconnus (si pas allowPartials)
  if (!options.allowPartials) {
    const unknownHelpers = findUnknownHelpers(templateContent);
    if (unknownHelpers.length > 0) {
      errors.push(`Unknown helpers found: ${unknownHelpers.join(', ')}`);
    }
  }

  // Validation des blocs non fermés
  const unclosedBlocks = findUnclosedBlocks(templateContent);
  if (unclosedBlocks.length > 0) {
    errors.push(`Unclosed blocks: ${unclosedBlocks.join(', ')}`);
  }

  return errors;
}

/**
 * Trouve les helpers inconnus dans un template
 * @private
 * @param {string} templateContent - Contenu du template
 * @returns {string[]} Liste des helpers inconnus
 */
function findUnknownHelpers(templateContent) {
  const usedHelpers = new Set();
  let match;

  // Reset regex
  HELPER_PATTERN.lastIndex = 0;

  while ((match = HELPER_PATTERN.exec(templateContent)) !== null) {
    usedHelpers.add(match[1]);
  }

  // Helpers connus (basiques + BuzzCraft)
  const knownHelpers = ['if', 'unless', 'each', 'with', 'eq', 'ne', 'gt', 'lt', 'and', 'or', 'lookup'];
  
  const unknownHelpers = [];
  for (const helper of usedHelpers) {
    if (!knownHelpers.includes(helper)) {
      unknownHelpers.push(helper);
    }
  }

  return unknownHelpers;
}

/**
 * Trouve les blocs Handlebars non fermés
 * @private
 * @param {string} templateContent - Contenu du template
 * @returns {string[]} Liste des blocs non fermés
 */
function findUnclosedBlocks(templateContent) {
  const blockPattern = /\{\{#(\w+)[^}]*\}\}/g;
  const closePattern = /\{\{\/(\w+)\}\}/g;
  
  const openBlocks = [];
  const closeBlocks = [];
  
  let match;
  
  // Trouver tous les blocs ouverts
  blockPattern.lastIndex = 0;
  while ((match = blockPattern.exec(templateContent)) !== null) {
    openBlocks.push(match[1]);
  }
  
  // Trouver tous les blocs fermés
  closePattern.lastIndex = 0;
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
      closeBlocks.splice(closeIndex, 1); // Retirer le match
    }
  }
  
  return unclosed;
}

/**
 * Récupère une valeur nested dans un objet (ex: "project.name")
 * @private
 * @param {object} obj - Objet source
 * @param {string} path - Chemin vers la valeur
 * @returns {any} Valeur trouvée ou undefined
 */
function getNestedValue(obj, path) {
  if (!path || typeof path !== 'string') {
    return undefined;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

console.log(`[TEMPLATE-VALIDATOR] Template validator loaded successfully - PIXEL PERFECT VERSION`);