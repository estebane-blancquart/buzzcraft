import Handlebars from "handlebars";
import { readPath } from "./reader.js";
import { extractAllElements } from "./extractor.js";
import { validateProjectSchema } from "./validator.js";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";  // ← AJOUTÉ
import { dirname, join, resolve } from "path";  // ← AJOUTÉ
import {
  PATHS,
  getTemplatePath,
  getCodeTemplatePath,
  resolveFromServer
} from "./path-resolver.js";

// Enregistrer helpers Handlebars
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("ne", function (a, b) {
  return a !== b;
});

/*
 * FAIT QUOI : Chargement template structure JSON
 * REÇOIT : templateId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 * ERREURS : LoadError si template introuvable
 */
export async function loadTemplate(templateId, options = {}) {
  console.log(`[COMPILER] Loading template: ${templateId}`);

  if (!templateId || typeof templateId !== "string") {
    throw new Error("LoadError: templateId must be non-empty string");
  }

  try {
    const templatePath = getTemplatePath('project', templateId);
    console.log(`[COMPILER] Template resolved path: ${templatePath}`);
    
    const templateFile = await readPath(templatePath);

    if (!templateFile.success) {
      console.log(`[COMPILER] Template read failed: ${templateFile.error}`);
      throw new Error(`Failed to read template: ${templateFile.error}`);
    }

    if (!templateFile.data.exists) {
      console.log(`[COMPILER] Template file does not exist: ${templatePath}`);
      throw new Error(`Template ${templateId} does not exist`);
    }

    let templateContent;
    try {
      templateContent = JSON.parse(templateFile.data.content);
      console.log(`[COMPILER] Template parsed successfully`);
    } catch (parseError) {
      console.log(`[COMPILER] Template parse error: ${parseError.message}`);
      throw new Error(`Invalid JSON in template ${templateId}: ${parseError.message}`);
    }

    return {
      loaded: true,
      data: {
        templateId,
        templatePath,
        content: templateContent,
      },
      dependencies: [templatePath],
      metadata: {
        loadedAt: new Date().toISOString(),
        templatePath,
        fileSize: templateFile.data.content.length,
      },
    };
  } catch (error) {
    console.log(`[COMPILER] Template loading failed: ${error.message}`);
    return {
      loaded: false,
      error: error.message,
    };
  }
}

/*
 * FAIT QUOI : Chargement templates Handlebars (auto-découverte)
 * REÇOIT : projectId: string, options: object
 * RETOURNE : { loaded: boolean, data: object, dependencies: string[], metadata: object }
 */
export async function loadCodeTemplates(projectId, options = {}) {
  console.log(`[COMPILER] Loading code templates for: ${projectId}`);

  if (!projectId || typeof projectId !== "string") {
    throw new Error("LoadError: projectId must be non-empty string");
  }

  try {
    const templatesBasePath = PATHS.templatesCode;
    console.log(`[COMPILER] Code templates base path: ${templatesBasePath}`);

    const templates = {};
    const dependencies = [];
    const maxDepth = options.maxDepth || 10; // Protection récursion infinie

    async function discoverTemplates(currentPath, relativePath = "", depth = 0) {
      if (depth >= maxDepth) {
        console.log(`[COMPILER] Maximum recursion depth reached at: ${currentPath}`);
        return;
      }

      try {
        const items = await readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          const fullPath = join(currentPath, item.name);
          const relativeItemPath = relativePath
            ? join(relativePath, item.name)
            : item.name;

          if (item.isDirectory()) {
            await discoverTemplates(fullPath, relativeItemPath, depth + 1);
          } else if (item.isFile() && item.name.endsWith(".hbs")) {
            const templateFile = await readPath(fullPath);

            if (templateFile.success && templateFile.data.exists) {
              templates[relativeItemPath] = templateFile.data.content;
              dependencies.push(relativeItemPath);
              console.log(`[COMPILER] Template discovered: ${relativeItemPath}`);
            } else {
              console.log(`[COMPILER] Failed to read template: ${fullPath} - ${templateFile.error}`);
            }
          }
        }
      } catch (error) {
        console.log(`[COMPILER] Directory access failed: ${currentPath} - ${error.message}`);
      }
    }

    await discoverTemplates(templatesBasePath);

    console.log(`[COMPILER] Discovery complete: ${Object.keys(templates).length} templates found`);

    return {
      loaded: true,
      data: {
        projectId,
        templates,
        templatesBasePath,
      },
      dependencies,
      metadata: {
        loadedAt: new Date().toISOString(),
        templatesCount: Object.keys(templates).length,
        templatesBasePath,
        autoDiscovered: true,
        maxDepthUsed: maxDepth,
      },
    };
  } catch (error) {
    console.log(`[COMPILER] Code templates loading failed: ${error.message}`);
    return {
      loaded: false,
      error: error.message,
    };
  }
}

/*
 * FAIT QUOI : Découverte templates disponibles
 * REÇOIT : options: object
 * RETOURNE : { loaded: boolean, data: object }
 */
export async function discoverAvailableTemplates(options = {}) {
  console.log(`[COMPILER] Discovering available templates`);

  try {
    const structureBasePath = PATHS.templatesProjects;
    console.log(`[COMPILER] Discovery base path: ${structureBasePath}`);
    
    const availableTemplates = [];
    
    try {
      const items = await readdir(structureBasePath, { withFileTypes: true });

      for (const item of items) {
        if (item.isFile() && item.name.endsWith(".json")) {
          const templateId = item.name.replace(".json", "");
          const templatePath = join(structureBasePath, item.name);

          try {
            const templateFile = await readPath(templatePath);
            if (templateFile.success && templateFile.data.exists) {
              const templateData = JSON.parse(templateFile.data.content);

              availableTemplates.push({
                id: templateId,
                name: templateData.project?.name || templateId,
                description: templateData.project?.description || "No description",
                path: templatePath,
              });
              
              console.log(`[COMPILER] Found template: ${templateId}`);
            }
          } catch (parseError) {
            console.log(`[COMPILER] Invalid template ${templateId}: ${parseError.message}`);
          }
        }
      }
    } catch (dirError) {
      console.log(`[COMPILER] Cannot read templates directory: ${dirError.message}`);
      // Ne pas utiliser fallback hardcodé - let caller handle this
      throw new Error(`Templates directory not accessible: ${dirError.message}`);
    }

    if (availableTemplates.length === 0) {
      throw new Error('No valid templates found in templates directory');
    }

    console.log(`[COMPILER] Discovery complete: ${availableTemplates.length} templates found`);

    return {
      loaded: true,
      data: {
        templates: availableTemplates,
        count: availableTemplates.length,
      },
      dependencies: availableTemplates.map((t) => t.path),
      metadata: {
        discoveredAt: new Date().toISOString(),
        basePath: structureBasePath,
      },
    };
  } catch (error) {
    console.log(`[COMPILER] Discovery failed: ${error.message}`);
    
    // Fallback seulement si explicitement demandé
    if (options.useFallback) {
      const fallbackTemplates = [
        {
          id: "basic",
          name: "Basic Project Template",
          description: "Simple landing page with essential components",
          path: "fallback"
        }
      ];
      
      return {
        loaded: true,
        data: {
          templates: fallbackTemplates,
          count: 1,
        },
        dependencies: [],
        metadata: {
          discoveredAt: new Date().toISOString(),
          basePath: "fallback",
          fallback: true
        },
      };
    }
    
    return {
      loaded: false,
      error: error.message,
    };
  }
}

/*
 * FAIT QUOI : Génération projet (ex-transitions/create/generator.js)
 * REÇOIT : projectId: string, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 */
export async function generateProject(projectId, config, options = {}) {
  console.log(`[COMPILER] Generating project: ${projectId}`);

  if (!projectId || !config) {
    throw new Error("GenerationError: projectId and config required");
  }

  const templateData = options.template?.content || {};

  let projectData;
  
  // Si pas de template chargé, utiliser un template de base
  if (templateData.project) {
    projectData = {
      ...templateData.project,
      id: projectId,
      name: config.name || projectId,
      template: config.template || "basic",
      templateName: templateData.project?.name || "Unknown Template",
      templateDescription: templateData.project?.description || "No description",
      created: new Date().toISOString(),
      state: "DRAFT",
    };
    console.log(`[COMPILER] Project generated from template: ${templateData.project?.name}`);
  } else {
    // FALLBACK : Template basique minimal
    projectData = generateFallbackProject(projectId, config);
    console.log(`[COMPILER] Project generated from fallback template`);
  }

  return {
    generated: true,
    output: projectData,
    artifacts: ["project.json"],
    metadata: {
      generatedAt: new Date().toISOString(),
      templateUsed: projectData.template,
      templateLoaded: !!templateData.name,
      hasPages: !!projectData.pages,
      fallbackUsed: !templateData.project
    },
  };
}

/*
 * FAIT QUOI : Génération services - VERSION REFACTORISÉE
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 */
export async function generateServices(projectData, templatesData, options = {}) {
  console.log(`[COMPILER] Starting services generation`);

  if (!projectData || !templatesData) {
    throw new Error("GenerationError: projectData and templatesData required");
  }

  try {
    // ÉTAPE 1: Validation des inputs
    const validation = await validateInputsForGeneration(projectData, templatesData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // ÉTAPE 2: Extraction des éléments projet
    const elements = extractProjectElements(projectData);
    console.log(`[COMPILER] Extracted ${elements.allElements.length} elements`);

    // ÉTAPE 3: Pre-compilation des templates
    const compiledTemplates = await preCompileTemplates(templatesData.templates);
    console.log(`[COMPILER] Pre-compiled ${compiledTemplates.size} templates`);

    // ÉTAPE 4: Génération des services
    const services = await compileServicesWithElements(compiledTemplates, elements, projectData);
    console.log(`[COMPILER] Generated ${Object.keys(services.output).length} services`);

    // ÉTAPE 5: Formatage du résultat final
    const result = formatServicesGenerationResult(services, elements, projectData, validation);

    return result;

  } catch (error) {
    console.log(`[COMPILER] Services generation failed: ${error.message}`);
    throw new Error(`GenerationError: ${error.message}`);
  }
}

/*
 * FAIT QUOI : Validation des inputs avant génération
 * REÇOIT : projectData: object, templatesData: object
 * RETOURNE : { valid: boolean, errors: string[], warnings: string[] }
 */
async function validateInputsForGeneration(projectData, templatesData) {
  console.log(`[COMPILER] Validating inputs for generation`);

  const errors = [];
  const warnings = [];

  // Validation projet
  const projectValidation = validateProjectSchema(projectData);
  if (!projectValidation.valid) {
    errors.push(...projectValidation.errors);
  }
  warnings.push(...projectValidation.warnings);

  // Validation templates data
  if (!templatesData.templates || typeof templatesData.templates !== 'object') {
    errors.push('templatesData.templates must be an object');
  } else if (Object.keys(templatesData.templates).length === 0) {
    warnings.push('No templates provided - generation will be minimal');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/*
 * FAIT QUOI : Extraction éléments du projet avec métadonnées
 * REÇOIT : projectData: object
 * RETOURNE : { allElements: array, components: array, containers: array, usedTypes: array }
 */
function extractProjectElements(projectData) {
  console.log(`[COMPILER] Extracting project elements`);

  const allElements = extractAllElements(projectData);
  const components = allElements.filter((e) => e._category === "component");
  const containers = allElements.filter((e) => e._category === "container");
  const usedTypes = [...new Set(allElements.map((e) => e.type?.toLowerCase()).filter(Boolean))];

  console.log(`[COMPILER] Found ${components.length} components, ${containers.length} containers`);
  console.log(`[COMPILER] Used element types: ${usedTypes.join(', ')}`);

  return {
    allElements,
    components,
    containers,
    usedTypes
  };
}

/*
 * FAIT QUOI : Pre-compilation de tous les templates Handlebars
 * REÇOIT : templates: object
 * RETOURNE : Map<string, HandlebarsTemplate>
 */
async function preCompileTemplates(templates) {
  console.log(`[COMPILER] Pre-compiling ${Object.keys(templates).length} templates`);

  const compiledTemplates = new Map();
  const compilationErrors = [];

  for (const [templatePath, templateContent] of Object.entries(templates)) {
    try {
      // Validation préventive du template
      validateTemplateContent(templateContent, templatePath);

      // Compilation Handlebars
      const compiledTemplate = Handlebars.compile(templateContent);
      compiledTemplates.set(templatePath, {
        template: compiledTemplate,
        originalContent: templateContent
      });

      console.log(`[COMPILER] Template compiled: ${templatePath}`);
    } catch (error) {
      compilationErrors.push(`${templatePath}: ${error.message}`);
      console.log(`[COMPILER] Template compilation failed: ${templatePath} - ${error.message}`);
    }
  }

  if (compilationErrors.length > 0 && compiledTemplates.size === 0) {
    throw new Error(`All templates failed to compile: ${compilationErrors.join('; ')}`);
  }

  if (compilationErrors.length > 0) {
    console.log(`[COMPILER] Warning: ${compilationErrors.length} templates failed to compile`);
  }

  return compiledTemplates;
}

/*
 * FAIT QUOI : Validation d'un template avant compilation
 * REÇOIT : templateContent: string, templatePath: string
 * RETOURNE : void (throw si invalide)
 */
function validateTemplateContent(templateContent, templatePath) {
  if (!templateContent || typeof templateContent !== 'string') {
    throw new Error(`Template content must be non-empty string at ${templatePath}`);
  }

  if (templateContent.trim().length === 0) {
    throw new Error(`Template content is empty at ${templatePath}`);
  }

  // Validation basique syntaxe Handlebars
  const openBraces = (templateContent.match(/\{\{/g) || []).length;
  const closeBraces = (templateContent.match(/\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    throw new Error(`Mismatched Handlebars braces in ${templatePath}: ${openBraces} open, ${closeBraces} close`);
  }
}

/*
 * FAIT QUOI : Génération des services avec éléments extraits
 * REÇOIT : compiledTemplates: Map, elements: object, projectData: object
 * RETOURNE : { output: object, artifacts: array, generationErrors: array }
 */
async function compileServicesWithElements(compiledTemplates, elements, projectData) {
  console.log(`[COMPILER] Compiling services with extracted elements`);

  const services = {};
  const artifacts = [];
  const generationErrors = [];

  // Variables de base pour tous les templates
  const baseVariables = generateBaseTemplateVariables(projectData);

  for (const [templatePath, compiledData] of compiledTemplates) {
    try {
      const normalizedPath = templatePath.replace(/\\/g, "/");
      let templateVariables = { ...baseVariables };
      let shouldGenerate = true;

      // Déterminer si ce template doit être généré
      const generationDecision = shouldGenerateTemplate(normalizedPath, elements);
      shouldGenerate = generationDecision.shouldGenerate;

      if (shouldGenerate) {
        // Enrichir les variables selon le type de template
        templateVariables = enrichTemplateVariables(
          templateVariables, 
          normalizedPath, 
          elements, 
          projectData
        );

        // Compilation finale
        const compiledContent = compiledData.template(templateVariables);
        const outputPath = templatePath.replace(".hbs", "");
        
        services[outputPath] = compiledContent;
        artifacts.push(outputPath);
        
        console.log(`[COMPILER] Service generated: ${outputPath}`);
      } else {
        console.log(`[COMPILER] Template skipped (not needed): ${templatePath} - ${generationDecision.reason}`);
      }

    } catch (templateError) {
      const errorMsg = `${templatePath}: ${templateError.message}`;
      generationErrors.push(errorMsg);
      console.log(`[COMPILER] Template generation error: ${errorMsg}`);
    }
  }

  return {
    output: services,
    artifacts,
    generationErrors
  };
}

/*
 * FAIT QUOI : Détermine si un template doit être généré
 * REÇOIT : templatePath: string, elements: object
 * RETOURNE : { shouldGenerate: boolean, reason: string }
 */
function shouldGenerateTemplate(templatePath, elements) {
  // Templates de service (toujours générer)
  if (!templatePath.includes('/components/') && !templatePath.includes('/containers/')) {
    return { shouldGenerate: true, reason: 'service template' };
  }

  // Templates de composants/containers
  const elementType = getElementTypeFromPath(templatePath);
  const isUsed = elements.usedTypes.includes(elementType.toLowerCase());
  
  return { 
    shouldGenerate: isUsed, 
    reason: isUsed ? 'element type used in project' : `element type '${elementType}' not used`
  };
}

/*
 * FAIT QUOI : Enrichissement des variables selon le type de template
 * REÇOIT : baseVariables: object, templatePath: string, elements: object, projectData: object
 * RETOURNE : object (variables enrichies)
 */
function enrichTemplateVariables(baseVariables, templatePath, elements, projectData) {
  let enrichedVariables = { ...baseVariables };

  if (templatePath.includes("/components/")) {
    const componentType = getElementTypeFromPath(templatePath);
    const componentData = findElementByType(elements.components, componentType);
    
    if (componentData) {
      enrichedVariables = {
        ...enrichedVariables,
        ...componentData,
        allComponents: elements.components.filter(
          (c) => c.type?.toLowerCase() === componentType.toLowerCase()
        )
      };
    }
  } else if (templatePath.includes("/containers/")) {
    const containerType = getElementTypeFromPath(templatePath);
    const containerData = findElementByType(elements.containers, containerType);
    
    if (containerData) {
      enrichedVariables = {
        ...enrichedVariables,
        ...containerData,
        allContainers: elements.containers.filter(
          (c) => c.type?.toLowerCase() === containerType.toLowerCase()
        )
      };
    }
  } else {
    // Templates de service
    enrichedVariables.metadata = {
      ...enrichedVariables.metadata,
      elementsCount: elements.allElements.length,
      componentsCount: elements.components.length,
      containersCount: elements.containers.length,
      usedTypes: elements.usedTypes,
    };
  }

  return enrichedVariables;
}

/*
 * FAIT QUOI : Formatage du résultat final de génération
 * REÇOIT : services: object, elements: object, projectData: object, validation: object
 * RETOURNE : object (résultat final formaté)
 */
function formatServicesGenerationResult(services, elements, projectData, validation) {
  const project = projectData.project || projectData;
  
  return {
    generated: true,
    output: {
      projectId: project.id,
      services: services.output,
    },
    artifacts: services.artifacts,
    metadata: {
      generatedAt: new Date().toISOString(),
      templatesCompiled: services.artifacts.length,
      elementsFound: elements.allElements.length,
      componentsFound: elements.components.length,
      containersFound: elements.containers.length,
      usedElementTypes: elements.usedTypes,
      schemaValid: validation.valid,
      schemaWarnings: validation.warnings,
      generationErrors: services.generationErrors,
      hasGenerationErrors: services.generationErrors.length > 0
    },
  };
}

// === FONCTIONS UTILITAIRES ===

/*
 * FAIT QUOI : Génère un projet fallback minimal
 * REÇOIT : projectId: string, config: object
 * RETOURNE : object (projet minimal)
 */
function generateFallbackProject(projectId, config) {
  return {
    id: projectId,
    name: config.name || projectId,
    template: config.template || "basic",
    created: new Date().toISOString(),
    state: "DRAFT",
    pages: [
      {
        id: "home",
        name: "Home Page",
        layout: {
          sections: [
            {
              id: "hero-section",
              name: "Hero Section",
              divs: [
                {
                  id: "hero-container",
                  name: "Hero Container",
                  classname: "text-center py-16 px-8",
                  components: [
                    {
                      id: "main-title",
                      type: "heading",
                      tag: "h1",
                      content: config.name || projectId,
                      classname: "text-4xl font-bold text-gray-900 mb-4"
                    },
                    {
                      id: "subtitle",
                      type: "paragraph",
                      content: "Welcome to your new project!",
                      classname: "text-xl text-gray-600 mb-8"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  };
}

/*
 * FAIT QUOI : Génère variables de base pour templates
 * REÇOIT : projectData: object
 * RETOURNE : object (variables de base)
 */
function generateBaseTemplateVariables(projectData) {
  const project = projectData.project || projectData;

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
 * FAIT QUOI : Extraction du type d'élément depuis le path du template
 * REÇOIT : templatePath: string
 * RETOURNE : string (type d'élément)
 */
function getElementTypeFromPath(templatePath) {
  try {
    const normalizedPath = templatePath.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop();
    const elementName = filename.replace(".tsx.hbs", "").replace(".hbs", "");
    return elementName.toLowerCase();
  } catch (error) {
    console.log(`[COMPILER] Failed to extract element type from path: ${templatePath}`);
    return "unknown";
  }
}

/*
 * FAIT QUOI : Trouve un élément par son type dans une liste
 * REÇOIT : elements: array, type: string
 * RETOURNE : object|undefined (élément trouvé)
 */
function findElementByType(elements, type) {
  return elements.find(
    (element) => element.type?.toLowerCase() === type.toLowerCase()
  );
}