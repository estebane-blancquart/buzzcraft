import Handlebars from "handlebars";

/*
 * FAIT QUOI : Moteur de compilation Handlebars pur (outil core)
 * REÇOIT : Templates et variables
 * RETOURNE : Contenu compilé ou null
 * ERREURS : null si échec, pas de throw
 */

// Enregistrement des helpers au chargement du module
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("ne", function (a, b) {
  return a !== b;
});

console.log(`[HANDLEBARS] Helpers registered successfully`);

/*
 * FAIT QUOI : Compile un template Handlebars individuel
 * REÇOIT : templateContent: string, variables: object
 * RETOURNE : string|null (contenu compilé ou null si échec)
 * ERREURS : null si compilation échoue
 */
export function compileTemplate(templateContent, variables) {
  console.log(`[HANDLEBARS] Compiling template`);

  if (!templateContent || typeof templateContent !== 'string') {
    console.log(`[HANDLEBARS] Invalid template content`);
    return null;
  }

  if (!variables || typeof variables !== 'object') {
    console.log(`[HANDLEBARS] Invalid variables`);
    return null;
  }

  try {
    // Validation syntaxe basique
    if (!isValidHandlebarsSyntax(templateContent)) {
      console.log(`[HANDLEBARS] Invalid Handlebars syntax`);
      return null;
    }

    const template = Handlebars.compile(templateContent);
    const compiledContent = template(variables);

    console.log(`[HANDLEBARS] Template compiled successfully`);
    return compiledContent;

  } catch (error) {
    console.log(`[HANDLEBARS] Compilation failed: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Compile plusieurs templates en batch
 * REÇOIT : templates: object, variables: object
 * RETOURNE : object|null (templates compilés par clé)
 * ERREURS : null si échec global
 */
export function compileTemplates(templates, variables) {
  console.log(`[HANDLEBARS] Batch compiling ${Object.keys(templates).length} templates`);

  if (!templates || typeof templates !== 'object') {
    console.log(`[HANDLEBARS] Invalid templates object`);
    return null;
  }

  if (!variables || typeof variables !== 'object') {
    console.log(`[HANDLEBARS] Invalid variables object`);
    return null;
  }

  const compiled = {};
  let successCount = 0;

  for (const [templatePath, templateContent] of Object.entries(templates)) {
    const result = compileTemplate(templateContent, variables);
    
    if (result !== null) {
      // Nettoyer l'extension .hbs pour le nom de fichier final
      const outputPath = templatePath.replace(/\.hbs$/, '');
      compiled[outputPath] = result;
      successCount++;
    } else {
      console.log(`[HANDLEBARS] Failed to compile: ${templatePath}`);
    }
  }

  if (successCount === 0) {
    console.log(`[HANDLEBARS] No templates compiled successfully`);
    return null;
  }

  console.log(`[HANDLEBARS] Batch compilation complete: ${successCount}/${Object.keys(templates).length} successful`);
  return compiled;
}

/*
 * FAIT QUOI : Pre-compile un template pour réutilisation
 * REÇOIT : templateContent: string
 * RETOURNE : function|null (template compilé réutilisable)
 * ERREURS : null si échec de compilation
 */
export function precompileTemplate(templateContent) {
  console.log(`[HANDLEBARS] Pre-compiling template`);

  if (!templateContent || typeof templateContent !== 'string') {
    return null;
  }

  try {
    if (!isValidHandlebarsSyntax(templateContent)) {
      return null;
    }

    const template = Handlebars.compile(templateContent);
    console.log(`[HANDLEBARS] Template pre-compiled successfully`);
    
    return template;

  } catch (error) {
    console.log(`[HANDLEBARS] Pre-compilation failed: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Exécute un template pre-compilé avec des variables
 * REÇOIT : compiledTemplate: function, variables: object
 * RETOURNE : string|null (résultat de l'exécution)
 * ERREURS : null si échec d'exécution
 */
export function executeTemplate(compiledTemplate, variables) {
  console.log(`[HANDLEBARS] Executing pre-compiled template`);

  if (typeof compiledTemplate !== 'function') {
    console.log(`[HANDLEBARS] Invalid compiled template`);
    return null;
  }

  if (!variables || typeof variables !== 'object') {
    console.log(`[HANDLEBARS] Invalid variables`);
    return null;
  }

  try {
    const result = compiledTemplate(variables);
    console.log(`[HANDLEBARS] Template executed successfully`);
    return result;

  } catch (error) {
    console.log(`[HANDLEBARS] Template execution failed: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Génère des variables de base pour templates
 * REÇOIT : projectData: object
 * RETOURNE : object (variables standardisées)
 * ERREURS : Toujours retourne un objet (défensif)
 */
export function generateBaseVariables(projectData) {
  const project = projectData?.project || projectData || {};

  return {
    project: {
      id: project.id || "unknown-project",
      name: project.name || "Unknown Project",
      template: project.template || "basic",
      version: project.version || "1.0.0",
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      templateEngine: "handlebars",
      buzzcraft: true,
    }
  };
}

/*
 * FAIT QUOI : Valide la syntaxe Handlebars basique
 * REÇOIT : templateContent: string
 * RETOURNE : boolean
 * ERREURS : false si syntaxe invalide
 */
export function isValidHandlebarsSyntax(templateContent) {
  if (!templateContent || typeof templateContent !== 'string') {
    return false;
  }

  // Validation basique des accolades
  const openBraces = (templateContent.match(/\{\{/g) || []).length;
  const closeBraces = (templateContent.match(/\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.log(`[HANDLEBARS] Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    return false;
  }

  // Validation des helpers inconnus
  const helperPattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+/g;
  const usedHelpers = new Set();
  let match;

  while ((match = helperPattern.exec(templateContent)) !== null) {
    usedHelpers.add(match[1]);
  }

  const registeredHelpers = Object.keys(Handlebars.helpers);
  for (const helper of usedHelpers) {
    if (!registeredHelpers.includes(helper)) {
      console.log(`[HANDLEBARS] Warning: Unknown helper '${helper}'`);
      // Warning mais pas d'échec - peut être valide
    }
  }

  return true;
}

console.log(`[HANDLEBARS] Handlebars core loaded successfully`);