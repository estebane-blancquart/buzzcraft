/*
 * FAIT QUOI : Validation variables Handlebars avant compilation
 * REÇOIT : templateContent: string, variables: object
 * RETOURNE : { valid: boolean, missingVars: string[], errors: string[] }
 * ERREURS : Aucune (validation défensive)
 */

export function validateTemplateVariables(templateContent, variables) {
  console.log(`[TEMPLATE_VALIDATOR] Validating template variables`);
  
  const errors = [];
  const missingVars = [];
  
  if (!templateContent || typeof templateContent !== 'string') {
    errors.push('Template content must be a non-empty string');
    return { valid: false, missingVars, errors };
  }
  
  if (!variables || typeof variables !== 'object') {
    errors.push('Variables must be an object');
    return { valid: false, missingVars, errors };
  }
  
  // Regex pour trouver toutes les variables {{variable}}
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const foundVariables = new Set();
  let match;
  
  while ((match = variablePattern.exec(templateContent)) !== null) {
    const varName = match[1].trim();
    foundVariables.add(varName);
  }
  
  console.log(`[TEMPLATE_VALIDATOR] Found ${foundVariables.size} unique variables in template`);
  
  // Vérifier que chaque variable a une valeur
  for (const varName of foundVariables) {
    const value = getNestedValue(variables, varName);
    
    if (value === undefined || value === null) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    errors.push(`Missing template variables: ${missingVars.join(', ')}`);
  }
  
  const isValid = errors.length === 0;
  
  console.log(`[TEMPLATE_VALIDATOR] Validation ${isValid ? 'passed' : 'failed'}: ${missingVars.length} missing variables`);
  
  return {
    valid: isValid,
    missingVars,
    errors,
    totalVariables: foundVariables.size
  };
}

/*
 * FAIT QUOI : Récupère valeur nested dans objet (ex: project.name)
 * REÇOIT : obj: object, path: string
 * RETOURNE : any (valeur trouvée ou undefined)
 * ERREURS : Aucune (retourne undefined si chemin invalide)
 */

function getNestedValue(obj, path) {
  // Support des chemins comme "project.name" ou "styleOptions.bg"
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

/*
 * FAIT QUOI : Génère variables par défaut pour templates
 * REÇOIT : projectData: object, componentData: object
 * RETOURNE : object (variables complètes pour Handlebars)
 * ERREURS : Aucune (génération défensive)
 */

export function generateDefaultVariables(projectData, componentData = {}) {
  console.log(`[TEMPLATE_VALIDATOR] Generating default variables`);
  
  const project = projectData.project || projectData;
  
  return {
    // Variables projet de base
    project: {
      id: project.id || 'unknown-project',
      name: project.name || 'Unknown Project',
      template: project.template || 'basic',
      version: project.version || '1.0.0'
    },
    
    // Variables component si disponibles
    ...componentData,
    
    // Variables par défaut pour éviter "undefined"
    content: componentData.content || 'Default content',
    classname: componentData.classname || '',
    id: componentData.id || 'default-id',
    type: componentData.type || 'default',
    
    // Style options calculées
    styleOptions: {
      bg: componentData.bg || 'white',
      color: componentData.color || 'black',
      size: componentData.size || 'md',
      spacing: componentData.spacing || 'normal'
    },
    
    // Metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      templateEngine: 'handlebars',
      buzzcraft: true
    }
  };
}