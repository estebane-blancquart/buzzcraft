/**
 * Extraction récursive d'éléments projet avec protection cycles - VERSION PIXEL PARFAIT
 * @module extractor
 * @description Extraction sécurisée et optimisée des éléments DOM d'un projet BuzzCraft
 */

// Types d'éléments reconnus
const COMPONENT_TYPES = ['heading', 'paragraph', 'button', 'image', 'video', 'link', 'h', 'p', 'a'];
const CONTAINER_TYPES = ['div', 'list', 'form', 'section'];
const ALL_ELEMENT_TYPES = [...COMPONENT_TYPES, ...CONTAINER_TYPES];

/**
 * Extrait tous les éléments d'un projet avec options avancées
 * @param {object} projectData - Données du projet à analyser
 * @param {object} [options={}] - Options d'extraction
 * @param {string[]|string} [options.types='all'] - Types à extraire ('all', 'components', 'containers', ou array spécifique)
 * @param {number} [options.maxDepth=15] - Profondeur maximum de récursion
 * @param {boolean} [options.detectCycles=true] - Activer la détection de cycles
 * @param {boolean} [options.includeMetadata=true] - Inclure métadonnées (_path, _category)
 * @param {boolean} [options.includeStats=true] - Inclure statistiques d'extraction
 * @returns {{success: boolean, data: {elements: object[], stats?: object}}} Résultat avec éléments extraits
 * 
 * @example
 * // Extraire tous les éléments
 * const result = await extractAllElements(projectData);
 * console.log(`Found ${result.data.elements.length} elements`);
 * 
 * // Extraire seulement les components
 * const components = await extractAllElements(projectData, { types: 'components' });
 * 
 * // Extraction avec options avancées
 * const custom = await extractAllElements(projectData, {
 *   types: ['button', 'div'],
 *   maxDepth: 5,
 *   detectCycles: false
 * });
 */
export async function extractAllElements(projectData, options = {}) {
  console.log(`[EXTRACTOR] Starting element extraction`);
  
  try {
    // Validation et préparation
    validateExtractionInput(projectData, options);
    const config = prepareExtractionConfig(options);
    
    const project = projectData.project || projectData;
    
    if (!project || typeof project !== 'object') {
      console.log(`[EXTRACTOR] No project data found`);
      return {
        success: true,
        data: {
          elements: [],
          stats: config.includeStats ? generateEmptyStats() : undefined
        }
      };
    }

    // Extraction avec protection cycles
    const extractionContext = {
      visited: new Set(),
      elements: [],
      config,
      currentDepth: 0,
      cyclesDetected: 0,
      maxDepthReached: false
    };
    
    // Démarrer l'extraction récursive
    await extractFromNode(project, 'project', extractionContext);
    
    // Filtrage final selon les types demandés
    const filteredElements = filterElementsByTypes(extractionContext.elements, config.types);
    
    // Génération des statistiques
    const stats = config.includeStats ? generateExtractionStats(filteredElements, extractionContext) : undefined;
    
    console.log(`[EXTRACTOR] Extraction complete: ${filteredElements.length} elements found`);
    
    return {
      success: true,
      data: {
        elements: filteredElements,
        stats
      }
    };
    
  } catch (error) {
    console.log(`[EXTRACTOR] Extraction failed: ${error.message}`);
    return {
      success: false,
      error: `Element extraction failed: ${error.message}`
    };
  }
}

/**
 * Extrait seulement les components (éléments atomiques)
 * @param {object} projectData - Données du projet
 * @param {object} [options={}] - Options d'extraction
 * @returns {{success: boolean, data: {elements: object[], stats?: object}}} Components extraits
 * 
 * @example
 * const result = await extractComponents(projectData);
 * const buttons = result.data.elements.filter(el => el.type === 'button');
 */
export async function extractComponents(projectData, options = {}) {
  console.log(`[EXTRACTOR] Extracting components only`);
  
  const componentOptions = {
    ...options,
    types: 'components'
  };
  
  return await extractAllElements(projectData, componentOptions);
}

/**
 * Extrait seulement les containers (éléments conteneurs)
 * @param {object} projectData - Données du projet  
 * @param {object} [options={}] - Options d'extraction
 * @returns {{success: boolean, data: {elements: object[], stats?: object}}} Containers extraits
 * 
 * @example
 * const result = await extractContainers(projectData);
 * const forms = result.data.elements.filter(el => el.type === 'form');
 */
export async function extractContainers(projectData, options = {}) {
  console.log(`[EXTRACTOR] Extracting containers only`);
  
  const containerOptions = {
    ...options,
    types: 'containers'
  };
  
  return await extractAllElements(projectData, containerOptions);
}

/**
 * Trouve un élément par son ID dans un projet
 * @param {object} projectData - Données du projet
 * @param {string} elementId - ID de l'élément à trouver
 * @param {object} [options={}] - Options de recherche
 * @returns {{success: boolean, data: {element: object|null, path?: string}}} Élément trouvé
 * 
 * @example
 * const result = await findElementById(projectData, 'main-title');
 * if (result.success && result.data.element) {
 *   console.log(`Found: ${result.data.element.type} at ${result.data.path}`);
 * }
 */
export async function findElementById(projectData, elementId, options = {}) {
  console.log(`[EXTRACTOR] Searching for element: ${elementId}`);
  
  try {
    validateElementId(elementId);
    
    const extractResult = await extractAllElements(projectData, {
      ...options,
      includeMetadata: true,
      includeStats: false
    });
    
    if (!extractResult.success) {
      return extractResult;
    }
    
    const foundElement = extractResult.data.elements.find(el => el.id === elementId);
    
    if (foundElement) {
      console.log(`[EXTRACTOR] Element found: ${elementId} (${foundElement.type})`);
      return {
        success: true,
        data: {
          element: foundElement,
          path: foundElement._path
        }
      };
    } else {
      console.log(`[EXTRACTOR] Element not found: ${elementId}`);
      return {
        success: true,
        data: {
          element: null
        }
      };
    }
    
  } catch (error) {
    console.log(`[EXTRACTOR] Element search failed: ${error.message}`);
    return {
      success: false,
      error: `Element search failed: ${error.message}`
    };
  }
}

// === FONCTIONS INTERNES ===

/**
 * Valide les paramètres d'extraction
 * @private
 */
function validateExtractionInput(projectData, options) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('ValidationError: projectData must be an object');
  }
  
  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
  
  if (options.maxDepth && (typeof options.maxDepth !== 'number' || options.maxDepth < 1)) {
    throw new Error('ValidationError: options.maxDepth must be a positive number');
  }
  
  if (options.types && typeof options.types !== 'string' && !Array.isArray(options.types)) {
    throw new Error('ValidationError: options.types must be string or array');
  }
}

/**
 * Valide un ID d'élément
 * @private
 */
function validateElementId(elementId) {
  if (!elementId || typeof elementId !== 'string') {
    throw new Error('ValidationError: elementId must be non-empty string');
  }
  
  if (elementId.trim().length === 0) {
    throw new Error('ValidationError: elementId cannot be empty or whitespace only');
  }
}

/**
 * Prépare la configuration d'extraction avec valeurs par défaut
 * @private
 */
function prepareExtractionConfig(options) {
  return {
    types: options.types || 'all',
    maxDepth: options.maxDepth || 15,
    detectCycles: options.detectCycles !== false,
    includeMetadata: options.includeMetadata !== false,
    includeStats: options.includeStats !== false
  };
}

/**
 * Extraction récursive sécurisée d'un nœud
 * @private
 */
async function extractFromNode(node, path, context) {
  // Protection profondeur
  if (context.currentDepth >= context.config.maxDepth) {
    context.maxDepthReached = true;
    console.log(`[EXTRACTOR] Max depth reached at: ${path}`);
    return;
  }
  
  // Protection cycles
  if (context.config.detectCycles) {
    const nodeKey = generateNodeKey(node);
    if (context.visited.has(nodeKey)) {
      context.cyclesDetected++;
      console.log(`[EXTRACTOR] Cycle detected at: ${path}`);
      return;
    }
    context.visited.add(nodeKey);
  }
  
  if (!node || typeof node !== 'object') return;
  
  // Si le node est un élément (a un type et un id)
  if (isValidElement(node)) {
    const category = determineElementCategory(node.type);
    const element = {
      ...node,
      ...(context.config.includeMetadata && {
        _path: path,
        _category: category,
        _extractedAt: new Date().toISOString()
      })
    };
    
    context.elements.push(element);
    console.log(`[EXTRACTOR] Found ${category}: ${node.type} (${node.id}) at ${path}`);
  }
  
  // Continuer l'extraction récursive
  context.currentDepth++;
  
  try {
    await extractFromNodeChildren(node, path, context);
  } finally {
    context.currentDepth--;
    
    // Nettoyer le cycle detector pour ce niveau
    if (context.config.detectCycles) {
      const nodeKey = generateNodeKey(node);
      context.visited.delete(nodeKey);
    }
  }
}

/**
 * Extrait les enfants d'un nœud
 * @private
 */
async function extractFromNodeChildren(node, path, context) {
  // Traiter toutes les propriétés du node
  for (const [key, value] of Object.entries(node)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (Array.isArray(value)) {
      // Traiter chaque élément du tableau
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        await extractFromNode(item, `${currentPath}[${i}]`, context);
      }
    } else if (value && typeof value === 'object') {
      // Traiter l'objet récursivement
      await extractFromNode(value, currentPath, context);
    }
  }
}

/**
 * Vérifie si un node est un élément valide
 * @private
 */
function isValidElement(node) {
  return node && 
         typeof node === 'object' && 
         typeof node.type === 'string' && 
         typeof node.id === 'string' &&
         node.type.trim().length > 0 &&
         node.id.trim().length > 0;
}

/**
 * Détermine la catégorie d'un élément
 * @private
 */
function determineElementCategory(type) {
  if (!type || typeof type !== 'string') return 'unknown';
  
  const normalizedType = type.toLowerCase();
  
  if (CONTAINER_TYPES.includes(normalizedType)) {
    return 'container';
  } else if (COMPONENT_TYPES.includes(normalizedType)) {
    return 'component';
  } else {
    return 'unknown';
  }
}

/**
 * Génère une clé unique pour la détection de cycles
 * @private
 */
function generateNodeKey(node) {
  if (!node || typeof node !== 'object') {
    return String(node);
  }
  
  // Utiliser l'ID si disponible, sinon une empreinte basée sur les propriétés
  if (node.id) {
    return `id:${node.id}`;
  }
  
  if (node.type) {
    return `type:${node.type}`;
  }
  
  // Fallback: empreinte basée sur les clés de l'objet
  const keys = Object.keys(node).sort().slice(0, 5); // Limiter pour performance
  return `keys:${keys.join(',')}`;
}

/**
 * Filtre les éléments selon les types demandés
 * @private
 */
function filterElementsByTypes(elements, typesOption) {
  if (typesOption === 'all') {
    return elements;
  }
  
  if (typesOption === 'components') {
    return elements.filter(el => el._category === 'component');
  }
  
  if (typesOption === 'containers') {
    return elements.filter(el => el._category === 'container');
  }
  
  if (Array.isArray(typesOption)) {
    return elements.filter(el => typesOption.includes(el.type));
  }
  
  return elements;
}

/**
 * Génère les statistiques d'extraction
 * @private
 */
function generateExtractionStats(elements, context) {
  const componentElements = elements.filter(el => el._category === 'component');
  const containerElements = elements.filter(el => el._category === 'container');
  const unknownElements = elements.filter(el => el._category === 'unknown');
  
  // Comptage par type
  const typeDistribution = {};
  elements.forEach(el => {
    typeDistribution[el.type] = (typeDistribution[el.type] || 0) + 1;
  });
  
  return {
    totalElements: elements.length,
    componentCount: componentElements.length,
    containerCount: containerElements.length,
    unknownCount: unknownElements.length,
    typeDistribution,
    extractionMetadata: {
      maxDepthReached: context.maxDepthReached,
      cyclesDetected: context.cyclesDetected,
      extractedAt: new Date().toISOString(),
      maxDepthConfigured: context.config.maxDepth
    }
  };
}

/**
 * Génère des statistiques vides
 * @private
 */
function generateEmptyStats() {
  return {
    totalElements: 0,
    componentCount: 0,
    containerCount: 0,
    unknownCount: 0,
    typeDistribution: {},
    extractionMetadata: {
      maxDepthReached: false,
      cyclesDetected: 0,
      extractedAt: new Date().toISOString(),
      maxDepthConfigured: 0
    }
  };
}

console.log(`[EXTRACTOR] Element extractor loaded successfully - PIXEL PERFECT VERSION`);