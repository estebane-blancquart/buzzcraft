import Handlebars from "handlebars";
import { readPath } from "./reader.js";
import { extractAllElements } from "./extractor.js";
import { validateProjectSchema } from "./validator.js";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

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
    // FIX PATH : Remonter au niveau buzzcraft/ puis aller vers app-server
    const templatePath = `../app-server/data/inputs/templates/structure/projects/${templateId}.json`;
    console.log(`[COMPILER] Template path: ${templatePath}`);
    
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
      throw new Error(
        `Invalid JSON in template ${templateId}: ${parseError.message}`
      );
    }

    return {
      loaded: true,
      data: {
        templateId,
        templatePath,
        content: templateContent,
      },
      dependencies: [],
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
    // FIX PATH : Remonter au niveau buzzcraft/ puis aller vers app-server
    const templatesBasePath = resolve("../app-server/data/inputs/templates/code");
    console.log(`[COMPILER] Code templates base path: ${templatesBasePath}`);

    const templates = {};
    const dependencies = [];

    async function discoverTemplates(currentPath, relativePath = "") {
      try {
        const items = await readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          const fullPath = join(currentPath, item.name);
          const relativeItemPath = relativePath
            ? join(relativePath, item.name)
            : item.name;

          if (item.isDirectory()) {
            await discoverTemplates(fullPath, relativeItemPath);
          } else if (item.isFile() && item.name.endsWith(".hbs")) {
            const templateFile = await readPath(fullPath);

            if (templateFile.success && templateFile.data.exists) {
              templates[relativeItemPath] = templateFile.data.content;
              dependencies.push(relativeItemPath);
            }
          }
        }
      } catch (error) {
        console.log(`[WARNING] Cannot access directory: ${currentPath}`);
      }
    }

    await discoverTemplates(templatesBasePath);

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
      },
    };
  } catch (error) {
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
    // FIX PATH : Remonter au niveau buzzcraft/ puis aller vers app-server
    const structureBasePath = resolve("../app-server/data/inputs/templates/structure/projects");
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
                description:
                  templateData.project?.description || "No description",
                path: templatePath,
              });
              
              console.log(`[COMPILER] Found template: ${templateId}`);
            }
          } catch (error) {
            console.log(
              `[WARNING] Invalid template ${templateId}: ${error.message}`
            );
          }
        }
      }
    } catch (dirError) {
      console.log(`[WARNING] Cannot read templates directory: ${dirError.message}`);
      console.log(`[WARNING] Using fallback templates`);
      
      // FALLBACK templates si le dossier n'existe pas
      availableTemplates.push(
        {
          id: "basic",
          name: "Basic Project Template",
          description: "Simple landing page with essential components",
          path: "fallback"
        },
        {
          id: "contact",
          name: "Contact Form Project", 
          description: "Test project for form components",
          path: "fallback"
        },
        {
          id: "restaurant", 
          name: "Template Restaurant",
          description: "Site vitrine pour restaurant avec menu et contact",
          path: "fallback"
        }
      );
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
    
    // FALLBACK complet si tout échoue
    return {
      loaded: true,
      data: {
        templates: [
          {
            id: "basic",
            name: "Basic Project Template",
            description: "Simple landing page with essential components",
            path: "fallback"
          }
        ],
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
      templateName: templateData.name || "Unknown Template",
      templateDescription: templateData.description || "No description",
      created: new Date().toISOString(),
      state: "DRAFT",
    };
  } else {
    // FALLBACK : Template basique minimal
    projectData = {
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
 * FAIT QUOI : Génération services (ex-transitions/build/generator.js)
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 */
export async function generateServices(
  projectData,
  templatesData,
  options = {}
) {
  console.log(`[COMPILER] Generating services`);

  if (!projectData || !templatesData) {
    throw new Error("GenerationError: projectData and templatesData required");
  }

  try {
    // Validation schema
    const validation = validateProjectSchema(projectData);
    if (!validation.valid) {
      throw new Error(
        `Schema validation failed: ${validation.errors.join(", ")}`
      );
    }

    const services = {};
    const artifacts = [];
    const generationErrors = [];

    // Variables de base
    const baseVariables = {
      project: {
        id: projectData.id || projectData.project?.id,
        name: projectData.name || projectData.project?.name,
        template: projectData.template || projectData.project?.template,
        version: projectData.version || projectData.project?.version || "1.0.0",
      },
    };

    // Extraction éléments
    const allElements = extractAllElements(projectData);
    const components = allElements.filter((e) => e._category === "component");
    const containers = allElements.filter((e) => e._category === "container");

    const usedElementTypes = [
      ...new Set(allElements.map((e) => e.type?.toLowerCase()).filter(Boolean)),
    ];

    // Compilation templates
    for (const [templatePath, templateContent] of Object.entries(
      templatesData.templates
    )) {
      try {
        const normalizedPath = templatePath.replace(/\\/g, "/");
        let templateVariables = { ...baseVariables };
        let shouldGenerate = true;

        // Logique spécifique par type
        if (normalizedPath.includes("/components/")) {
          const componentType = getElementTypeFromPath(templatePath);

          if (!usedElementTypes.includes(componentType.toLowerCase())) {
            shouldGenerate = false;
          } else {
            const componentData = findElementByType(components, componentType);
            if (componentData) {
              templateVariables = generateTemplateVariables(
                projectData,
                componentData
              );
              templateVariables.allComponents = components.filter(
                (c) => c.type?.toLowerCase() === componentType.toLowerCase()
              );
            }
          }
        } else if (normalizedPath.includes("/containers/")) {
          const containerType = getElementTypeFromPath(templatePath);

          if (!usedElementTypes.includes(containerType.toLowerCase())) {
            shouldGenerate = false;
          } else {
            const containerData = findElementByType(containers, containerType);
            if (containerData) {
              templateVariables = generateTemplateVariables(
                projectData,
                containerData
              );
              templateVariables.allContainers = containers.filter(
                (c) => c.type?.toLowerCase() === containerType.toLowerCase()
              );
            }
          }
        } else {
          // Templates de service
          templateVariables = {
            ...baseVariables,
            metadata: {
              generatedAt: new Date().toISOString(),
              elementsCount: allElements.length,
              componentsCount: components.length,
              containersCount: containers.length,
              usedTypes: usedElementTypes,
              templateEngine: "handlebars",
              buzzcraft: true,
            },
          };
        }

        if (shouldGenerate) {
          const template = Handlebars.compile(templateContent);
          const compiledContent = template(templateVariables);

          const outputPath = templatePath.replace(".hbs", "");
          services[outputPath] = compiledContent;
          artifacts.push(outputPath);
        }
      } catch (templateError) {
        generationErrors.push(`${templatePath}: ${templateError.message}`);
      }
    }

    return {
      generated: true,
      output: {
        projectId: projectData.id || projectData.project?.id,
        services,
      },
      artifacts,
      metadata: {
        generatedAt: new Date().toISOString(),
        templatesCompiled: artifacts.length,
        elementsFound: allElements.length,
        componentsFound: components.length,
        containersFound: containers.length,
        usedElementTypes,
        schemaValid: validation.valid,
        generationErrors,
      },
    };
  } catch (error) {
    throw new Error(`GenerationError: ${error.message}`);
  }
}

// Utilitaires internes
function getElementTypeFromPath(templatePath) {
  try {
    const normalizedPath = templatePath.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop();
    const elementName = filename.replace(".tsx.hbs", "").replace(".hbs", "");
    return elementName.toLowerCase();
  } catch (error) {
    return "unknown";
  }
}

function findElementByType(elements, type) {
  return elements.find(
    (element) => element.type?.toLowerCase() === type.toLowerCase()
  );
}

function generateTemplateVariables(projectData, elementData = {}) {
  const project = projectData.project || projectData;

  return {
    project: {
      id: project.id || "unknown-project",
      name: project.name || "Unknown Project",
      template: project.template || "basic",
      version: project.version || "1.0.0",
    },
    ...elementData,
    content: elementData.content || "Default content",
    classname: elementData.classname || "",
    id: elementData.id || "default-id",
    type: elementData.type || "default",
    metadata: {
      generatedAt: new Date().toISOString(),
      templateEngine: "handlebars",
      buzzcraft: true,
    },
  };
}