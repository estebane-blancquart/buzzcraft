import { extractAllElements } from "./extractor.js";

/*
 * FAIT QUOI : Construction pure de services à partir de projets (outil core)
 * REÇOIT : projectData, templates, variables
 * RETOURNE : Services compilés ou null
 * ERREURS : null si données invalides, pas de throw
 */

/*
 * FAIT QUOI : Construit des services à partir d'un projet et de templates
 * REÇOIT : projectData: object, compiledTemplates: object, baseVariables: object
 * RETOURNE : object|null (services par chemin ou null si échec)
 * ERREURS : null si données invalides
 */
export function buildServices(projectData, compiledTemplates, baseVariables) {
  console.log(`[SERVICE-BUILDER] Building services`);

  if (!projectData || typeof projectData !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid project data`);
    return null;
  }

  if (!compiledTemplates || typeof compiledTemplates !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid compiled templates`);
    return null;
  }

  if (!baseVariables || typeof baseVariables !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid base variables`);
    return null;
  }

  try {
    // Extraction des éléments du projet
    const elements = extractProjectElements(projectData);
    console.log(`[SERVICE-BUILDER] Extracted ${elements.allElements.length} elements`);

    // Construction des services
    const services = {};
    let builtCount = 0;

    for (const [templatePath, templateContent] of Object.entries(compiledTemplates)) {
      const normalizedPath = templatePath.replace(/\\/g, "/");
      
      // Vérifier si ce template doit être généré
      const shouldGenerate = shouldGenerateService(normalizedPath, elements);
      
      if (shouldGenerate.generate) {
        // Préparer les variables pour ce template
        const templateVariables = prepareTemplateVariables(
          baseVariables, 
          normalizedPath, 
          elements, 
          projectData
        );

        // Le template content est déjà compilé par handlebars-engine
        const outputPath = templatePath.replace(/\.hbs$/, '');
        services[outputPath] = templateContent;
        builtCount++;
        
        console.log(`[SERVICE-BUILDER] Service built: ${outputPath}`);
      } else {
        console.log(`[SERVICE-BUILDER] Service skipped: ${normalizedPath} - ${shouldGenerate.reason}`);
      }
    }

    if (builtCount === 0) {
      console.log(`[SERVICE-BUILDER] No services built`);
      return null;
    }

    console.log(`[SERVICE-BUILDER] Built ${builtCount} services successfully`);
    return services;

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Error building services: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Extraction des éléments du projet avec métadonnées
 * REÇOIT : projectData: object
 * RETOURNE : object (éléments organisés par catégorie)
 * ERREURS : Retourne structure vide si extraction échoue
 */
function extractProjectElements(projectData) {
  try {
    const allElements = extractAllElements(projectData);
    const components = allElements.filter((e) => e._category === "component");
    const containers = allElements.filter((e) => e._category === "container");
    const usedTypes = [...new Set(allElements.map((e) => e.type?.toLowerCase()).filter(Boolean))];

    return {
      allElements,
      components,
      containers,
      usedTypes
    };

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Element extraction failed: ${error.message}`);
    return {
      allElements: [],
      components: [],
      containers: [],
      usedTypes: []
    };
  }
}

/*
 * FAIT QUOI : Détermine si un service doit être généré
 * REÇOIT : templatePath: string, elements: object
 * RETOURNE : object (décision et raison)
 * ERREURS : Retourne false par défaut si erreur
 */
function shouldGenerateService(templatePath, elements) {
  try {
    // Templates de service (toujours générer)
    if (!templatePath.includes('/components/') && !templatePath.includes('/containers/')) {
      return { generate: true, reason: 'service template' };
    }

    // Templates de composants/containers (générer seulement si utilisés)
    const elementType = extractElementTypeFromPath(templatePath);
    const isUsed = elements.usedTypes.includes(elementType.toLowerCase());
    
    return { 
      generate: isUsed, 
      reason: isUsed ? 'element type used' : `element type '${elementType}' not used`
    };

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Generation decision failed for ${templatePath}: ${error.message}`);
    return { generate: false, reason: 'decision_error' };
  }
}

/*
 * FAIT QUOI : Prépare les variables spécifiques à un template
 * REÇOIT : baseVariables: object, templatePath: string, elements: object, projectData: object
 * RETOURNE : object (variables enrichies pour ce template)
 * ERREURS : Retourne baseVariables si enrichissement échoue
 */
function prepareTemplateVariables(baseVariables, templatePath, elements, projectData) {
  try {
    let enrichedVariables = { ...baseVariables };

    if (templatePath.includes("/components/")) {
      const componentType = extractElementTypeFromPath(templatePath);
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
      const containerType = extractElementTypeFromPath(templatePath);
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
      // Templates de service - ajouter métadonnées globales
      enrichedVariables.metadata = {
        ...enrichedVariables.metadata,
        elementsCount: elements.allElements.length,
        componentsCount: elements.components.length,
        containersCount: elements.containers.length,
        usedTypes: elements.usedTypes,
      };
    }

    return enrichedVariables;

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Variables preparation failed for ${templatePath}: ${error.message}`);
    return baseVariables;
  }
}

/*
 * FAIT QUOI : Extrait le type d'élément depuis le chemin du template
 * REÇOIT : templatePath: string
 * RETOURNE : string (type d'élément)
 * ERREURS : "unknown" si extraction échoue
 */
function extractElementTypeFromPath(templatePath) {
  try {
    const normalizedPath = templatePath.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop();
    const elementName = filename.replace(".tsx.hbs", "").replace(".hbs", "");
    return elementName.toLowerCase();
  } catch (error) {
    console.log(`[SERVICE-BUILDER] Type extraction failed for path: ${templatePath}`);
    return "unknown";
  }
}

/*
 * FAIT QUOI : Trouve un élément par son type dans une liste
 * REÇOIT : elements: array, type: string
 * RETOURNE : object|undefined (premier élément trouvé)
 * ERREURS : undefined si aucun élément trouvé
 */
function findElementByType(elements, type) {
  try {
    return elements.find(
      (element) => element.type?.toLowerCase() === type.toLowerCase()
    );
  } catch (error) {
    console.log(`[SERVICE-BUILDER] Element search failed for type: ${type}`);
    return undefined;
  }
}

/*
 * FAIT QUOI : Valide que les services construits sont cohérents
 * REÇOIT : services: object
 * RETOURNE : boolean (true si services valides)
 * ERREURS : false si validation échoue
 */
export function validateServices(services) {
  console.log(`[SERVICE-BUILDER] Validating services`);

  if (!services || typeof services !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid services object`);
    return false;
  }

  const serviceCount = Object.keys(services).length;
  if (serviceCount === 0) {
    console.log(`[SERVICE-BUILDER] No services to validate`);
    return false;
  }

  let validCount = 0;

  for (const [servicePath, serviceContent] of Object.entries(services)) {
    if (typeof serviceContent === 'string' && serviceContent.trim().length > 0) {
      validCount++;
    } else {
      console.log(`[SERVICE-BUILDER] Invalid service content: ${servicePath}`);
    }
  }

  const isValid = validCount === serviceCount;
  console.log(`[SERVICE-BUILDER] Validation complete: ${validCount}/${serviceCount} valid services`);
  
  return isValid;
}

/*
 * FAIT QUOI : Calcule des statistiques sur les services construits
 * REÇOIT : services: object
 * RETOURNE : object (statistiques des services)
 * ERREURS : Retourne stats vides si calcul échoue
 */
export function calculateServiceStats(services) {
  console.log(`[SERVICE-BUILDER] Calculating service statistics`);

  try {
    if (!services || typeof services !== 'object') {
      return { total: 0, error: 'invalid_input' };
    }

    const stats = {
      total: Object.keys(services).length,
      byType: {
        components: 0,
        containers: 0,
        services: 0,
        other: 0
      },
      totalSize: 0,
      averageSize: 0
    };

    for (const [servicePath, serviceContent] of Object.entries(services)) {
      // Calcul de la taille
      const size = typeof serviceContent === 'string' ? serviceContent.length : 0;
      stats.totalSize += size;

      // Catégorisation par type
      if (servicePath.includes('/components/')) {
        stats.byType.components++;
      } else if (servicePath.includes('/containers/')) {
        stats.byType.containers++;
      } else if (servicePath.includes('/server/') || servicePath.includes('/api/')) {
        stats.byType.services++;
      } else {
        stats.byType.other++;
      }
    }

    // Calcul de la taille moyenne
    stats.averageSize = stats.total > 0 ? Math.round(stats.totalSize / stats.total) : 0;

    console.log(`[SERVICE-BUILDER] Statistics calculated: ${stats.total} services, ${stats.totalSize} total chars`);
    return stats;

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Statistics calculation failed: ${error.message}`);
    return {
      total: 0,
      error: 'calculation_failed',
      message: error.message
    };
  }
}

/*
 * FAIT QUOI : Filtre les services selon des critères
 * REÇOIT : services: object, filters: object
 * RETOURNE : object (services filtrés)
 * ERREURS : Retourne services originaux si filtrage échoue
 */
export function filterServices(services, filters = {}) {
  console.log(`[SERVICE-BUILDER] Filtering services`);

  try {
    if (!services || typeof services !== 'object') {
      return {};
    }

    if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
      return services;
    }

    const filtered = {};

    for (const [servicePath, serviceContent] of Object.entries(services)) {
      let include = true;

      // Filtrage par extension
      if (filters.extensions && Array.isArray(filters.extensions)) {
        const hasValidExtension = filters.extensions.some(ext => 
          servicePath.toLowerCase().endsWith(ext.toLowerCase())
        );
        if (!hasValidExtension) include = false;
      }

      // Filtrage par type de service
      if (filters.type && typeof filters.type === 'string') {
        switch (filters.type) {
          case 'components':
            if (!servicePath.includes('/components/')) include = false;
            break;
          case 'containers':
            if (!servicePath.includes('/containers/')) include = false;
            break;
          case 'services':
            if (servicePath.includes('/components/') || servicePath.includes('/containers/')) include = false;
            break;
        }
      }

      // Filtrage par taille minimum
      if (filters.minSize && typeof filters.minSize === 'number') {
        if (serviceContent.length < filters.minSize) include = false;
      }

      if (include) {
        filtered[servicePath] = serviceContent;
      }
    }

    console.log(`[SERVICE-BUILDER] Filtered ${Object.keys(filtered).length}/${Object.keys(services).length} services`);
    return filtered;

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Filtering failed: ${error.message}`);
    return services;
  }
}

console.log(`[SERVICE-BUILDER] Builder loaded successfully`);