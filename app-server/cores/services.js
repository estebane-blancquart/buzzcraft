import { extractAllElements } from "./extractor.js";
import { compileTemplate } from "./handlebars.js";

/*
 * FAIT QUOI : Construction pure de services à partir de projets (outil core)
 * REÇOIT : projectData, templates, variables
 * RETOURNE : Services compilés ou null
 * ERREURS : null si données invalides, pas de throw
 */

/*
 * FAIT QUOI : Construit des services à partir d'un projet et de templates
 * REÇOIT : projectData: object, rawTemplates: object (templates NON compilés), baseVariables: object
 * RETOURNE : object|null (services par chemin ou null si échec)
 * ERREURS : null si données invalides
 * 
 * 🔧 FIX MAJEUR: Compile chaque template avec les variables spécifiques de l'élément
 */
export async function buildServices(projectData, rawTemplates, baseVariables) {
  console.log(`[SERVICE-BUILDER] Building services`);

  if (!projectData || typeof projectData !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid project data`);
    return null;
  }

  if (!rawTemplates || typeof rawTemplates !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid raw templates`);
    return null;
  }

  if (!baseVariables || typeof baseVariables !== 'object') {
    console.log(`[SERVICE-BUILDER] Invalid base variables`);
    return null;
  }

  try {
    // Extraction des éléments du projet
    const elements = await extractProjectElements(projectData);
    console.log(`[SERVICE-BUILDER] Extracted ${elements.allElements.length} elements`);

    // Construction des services
    const services = {};
    let builtCount = 0;

    for (const [templatePath, rawTemplateContent] of Object.entries(rawTemplates)) {
      const normalizedPath = templatePath.replace(/\\/g, "/");
      
      console.log(`[SERVICE-BUILDER] Template: ${normalizedPath} -> Generate: ${shouldGenerateService(normalizedPath, elements).generate} (${shouldGenerateService(normalizedPath, elements).reason})`);
      
      const shouldGenerate = shouldGenerateService(normalizedPath, elements);
      
      if (shouldGenerate.generate) {
        // 🔧 FIX: Préparer les variables spécifiques pour ce template ET cet élément
        const templateVariables = prepareTemplateVariables(
          baseVariables, 
          normalizedPath, 
          elements, 
          projectData
        );

        // 🔧 FIX: Compiler le template RAW avec les variables spécifiques
        const compilationResult = await compileTemplate(rawTemplateContent, templateVariables);

        if (compilationResult.success) {
          // 🔧 FIX CRITIQUE: Supprimer le préfixe "code/" du chemin de sortie
          const outputPath = templatePath.replace(/\.hbs$/, '').replace(/^code\//, '');
          services[outputPath] = compilationResult.data;
          builtCount++;
          
          console.log(`[SERVICE-BUILDER] Service built: ${outputPath} (${compilationResult.data.length} chars)`);
        } else {
          console.log(`[SERVICE-BUILDER] Template compilation failed for ${templatePath}: ${compilationResult.error}`);
        }
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
 * 
 * 🔧 FIX CRITIQUE: Fonction maintenant ASYNC + correction interface extractAllElements
 */
async function extractProjectElements(projectData) {
  try {
    console.log(`[SERVICE-BUILDER] Starting element extraction`);
    
    // 🔧 FIX: extractAllElements est ASYNC et retourne {success, data: {elements}}
    const extractionResult = await extractAllElements(projectData);
    
    // Vérifier le succès de l'extraction
    if (!extractionResult.success) {
      console.log(`[SERVICE-BUILDER] Extraction failed: ${extractionResult.error || 'Unknown error'}`);
      return {
        allElements: [],
        components: [],
        containers: [],
        usedTypes: []
      };
    }
    
    if (!extractionResult.data) {
      console.log(`[SERVICE-BUILDER] Extraction returned no data`);
      return {
        allElements: [],
        components: [],
        containers: [],
        usedTypes: []
      };
    }
    
    // 🔧 FIX: Récupérer le tableau d'éléments depuis la structure
    const allElements = extractionResult.data.elements;
    
    if (!Array.isArray(allElements)) {
      console.log(`[SERVICE-BUILDER] Elements is not an array:`, typeof allElements);
      return {
        allElements: [],
        components: [],
        containers: [],
        usedTypes: []
      };
    }
    
    // Maintenant on peut filtrer correctement
    const components = allElements.filter((e) => e._category === "component");
    const containers = allElements.filter((e) => e._category === "container");
    const usedTypes = [...new Set(allElements.map((e) => e.type?.toLowerCase()).filter(Boolean))];

    console.log(`[SERVICE-BUILDER] Successfully extracted ${allElements.length} elements (${components.length} components, ${containers.length} containers)`);
    console.log(`[SERVICE-BUILDER] Used types: ${usedTypes.join(', ')}`);

    return {
      allElements,
      components,
      containers,
      usedTypes
    };

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Element extraction failed: ${error.message}`);
    console.log(`[SERVICE-BUILDER] Stack trace:`, error.stack);
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
      reason: isUsed ? `${elementType} is used` : `${elementType} not used` 
    };

  } catch (error) {
    console.log(`[SERVICE-BUILDER] Service generation decision failed: ${error.message}`);
    return { generate: false, reason: 'decision error' };
  }
}

/*
 * FAIT QUOI : Prépare les variables pour un template spécifique
 * REÇOIT : baseVariables, templatePath, elements, projectData
 * RETOURNE : object (variables enrichies)
 * ERREURS : Retourne baseVariables si enrichissement échoue
 */
function prepareTemplateVariables(baseVariables, templatePath, elements, projectData) {
  try {
    const enrichedVariables = { ...baseVariables };

    // Enrichissement spécifique aux templates de composants/containers
    if (templatePath.includes('/components/') || templatePath.includes('/containers/')) {
      const elementType = extractElementTypeFromPath(templatePath);
      const element = findElementByType(elements.allElements, elementType);
      
      if (element) {
        // 🔧 FIX MAJEUR: Injecter les propriétés de l'élément DIRECTEMENT dans les variables
        // Cela permet à Handlebars d'accéder à {{content}}, {{classname}}, {{id}}, etc.
        Object.assign(enrichedVariables, {
          // Propriétés communes à tous les éléments
          id: element.id,
          content: element.content,
          classname: element.classname,
          // Propriétés spécifiques selon le type
          ...(element.tag && { tag: element.tag }),           // Pour heading
          ...(element.href && { href: element.href }),        // Pour button/link  
          ...(element.target && { target: element.target }),  // Pour link
          ...(element.src && { src: element.src }),           // Pour image
          ...(element.alt && { alt: element.alt }),           // Pour image
          // Ajouter l'élément complet pour les cas complexes
          element: element,
          elementType: elementType
        });
        
        console.log(`[SERVICE-BUILDER] Variables enriched for ${elementType}:`, {
          id: element.id,
          content: element.content,
          classname: element.classname
        });
      }
    }

    // Variables globales
    if (elements.allElements.length > 0) {
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
    // 🔧 FIX: D'abord enlever .hbs, puis .tsx, puis lowercase
    const elementName = filename.replace(".hbs", "").replace(".tsx", "");
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

console.log(`[SERVICE-BUILDER] Service builder loaded successfully - PIXEL PERFECT VERSION`);