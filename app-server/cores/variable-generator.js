/**
 * Génération de variables par défaut pour templates - VERSION PIXEL PARFAIT
 * @module variable-generator
 */

/**
 * Génère des variables complètes pour templates Handlebars
 * @param {object} projectData - Données du projet source
 * @param {object} [componentData={}] - Données spécifiques au component
 * @param {object} [options={}] - Options de génération
 * @param {boolean} [options.includeMetadata=true] - Inclure les métadonnées
 * @param {boolean} [options.includeDefaults=true] - Inclure les valeurs par défaut
 * @param {object} [options.customDefaults={}] - Valeurs par défaut personnalisées
 * @returns {{success: boolean, data: object}} Variables générées prêtes pour templates
 * 
 * @example
 * const result = await generateTemplateVariables(projectData, componentData);
 * if (result.success) {
 *   const compiled = handlebars.compile(template)(result.data);
 * }
 */
export async function generateTemplateVariables(projectData, componentData = {}, options = {}) {
  console.log(`[VARIABLE-GENERATOR] Generating template variables`);

  try {
    validateGeneratorInput(projectData, componentData, options);

    const project = projectData.project || projectData;
    const includeMetadata = options.includeMetadata !== false;
    const includeDefaults = options.includeDefaults !== false;

    // Variables projet de base
    const baseVariables = generateProjectVariables(project, options);
    
    // Variables component si fournies
    const componentVariables = generateComponentVariables(componentData, options);
    
    // Variables par défaut pour éviter undefined
    const defaultVariables = includeDefaults ? generateDefaultVariables(options) : {};
    
    // Variables de style calculées
    const styleVariables = generateStyleVariables(componentData, options);
    
    // Métadonnées de génération
    const metadataVariables = includeMetadata ? generateMetadataVariables(options) : {};

    // Merge intelligent des variables (ordre important)
    const allVariables = {
      ...defaultVariables,      // Defaults en premier (fallback)
      ...baseVariables,         // Variables projet (priorité)
      ...componentVariables,    // Variables component (spécifique)
      ...styleVariables,        // Variables style (calculées)
      ...metadataVariables      // Métadonnées en dernier
    };

    console.log(`[VARIABLE-GENERATOR] Generated ${Object.keys(allVariables).length} variable groups`);

    return {
      success: true,
      data: allVariables
    };

  } catch (error) {
    console.log(`[VARIABLE-GENERATOR] Generation failed: ${error.message}`);
    return {
      success: false,
      error: `Variable generation failed: ${error.message}`
    };
  }
}

/**
 * Génère variables de base pour un component spécifique
 * @param {object} componentData - Données du component
 * @param {object} [options={}] - Options de génération
 * @returns {{success: boolean, data: object}} Variables component
 */
export async function generateComponentVariables(componentData, options = {}) {
  console.log(`[VARIABLE-GENERATOR] Generating component variables`);

  try {
    if (!componentData || typeof componentData !== 'object') {
      return { success: true, data: {} };
    }

    const componentVars = {
      // Propriétés directes du component
      ...componentData,
      
      // Propriétés normalisées
      id: componentData.id || generateId(),
      type: componentData.type || 'unknown',
      classname: componentData.classname || '',
      
      // Propriétés spécifiques par type
      ...generateTypeSpecificVariables(componentData),
      
      // Arrays pour helpers Handlebars
      hasContent: !!(componentData.content || componentData.text),
      hasClasses: !!(componentData.classname && componentData.classname.trim()),
      hasAttributes: hasValidAttributes(componentData)
    };

    return {
      success: true,
      data: componentVars
    };

  } catch (error) {
    console.log(`[VARIABLE-GENERATOR] Component variables generation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Valide les paramètres d'entrée
 * @private
 */
function validateGeneratorInput(projectData, componentData, options) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('ValidationError: projectData must be an object');
  }

  if (componentData && typeof componentData !== 'object') {
    throw new Error('ValidationError: componentData must be an object');
  }

  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
}

/**
 * Génère les variables projet de base
 * @private
 */
function generateProjectVariables(project, options) {
  const customDefaults = options.customDefaults || {};
  
  return {
    project: {
      id: project.id || customDefaults.projectId || 'unknown-project',
      name: project.name || customDefaults.projectName || 'Unknown Project',
      template: project.template || customDefaults.template || 'basic',
      version: project.version || customDefaults.version || '1.0.0',
      description: project.description || customDefaults.description || '',
      
      // États et métadonnées
      state: project.state || 'DRAFT',
      created: project.created || new Date().toISOString(),
      lastModified: project.lastModified || new Date().toISOString(),
      
      // Statistiques si disponibles
      pagesCount: project.pages ? project.pages.length : 0,
      hasPages: !!(project.pages && project.pages.length > 0)
    }
  };
}

/**
 * Génère les variables par défaut universelles
 * @private
 */
function generateDefaultVariables(options) {
  const customDefaults = options.customDefaults || {};
  
  return {
    // Variables par défaut pour éviter "undefined" dans templates
    content: customDefaults.content || 'Default content',
    text: customDefaults.text || 'Default text',
    classname: customDefaults.classname || '',
    id: customDefaults.id || 'default-id',
    type: customDefaults.type || 'default',
    
    // Attributs HTML courants
    href: customDefaults.href || '#',
    src: customDefaults.src || '',
    alt: customDefaults.alt || 'Image description',
    target: customDefaults.target || '_self',
    
    // Booléens pour conditions Handlebars
    enabled: true,
    visible: true,
    required: false,
    disabled: false,
    
    // Valeurs numériques par défaut
    width: customDefaults.width || 400,
    height: customDefaults.height || 300,
    maxLength: customDefaults.maxLength || 100,
    tabIndex: 0
  };
}

/**
 * Génère les variables de style calculées
 * @private
 */
function generateStyleVariables(componentData, options) {
  const customDefaults = options.customDefaults || {};
  
  return {
    styleOptions: {
      // Couleurs
      bg: componentData.bg || customDefaults.bg || 'white',
      color: componentData.color || customDefaults.color || 'black',
      borderColor: componentData.borderColor || customDefaults.borderColor || 'gray',
      
      // Tailles
      size: componentData.size || customDefaults.size || 'md',
      fontSize: componentData.fontSize || customDefaults.fontSize || '1rem',
      padding: componentData.padding || customDefaults.padding || 'normal',
      margin: componentData.margin || customDefaults.margin || 'normal',
      
      // Layout
      display: componentData.display || customDefaults.display || 'block',
      position: componentData.position || customDefaults.position || 'static',
      flexDirection: componentData.flexDirection || customDefaults.flexDirection || 'row',
      
      // États visuels
      hover: componentData.hover || customDefaults.hover || false,
      focus: componentData.focus || customDefaults.focus || false,
      active: componentData.active || customDefaults.active || false,
      
      // Responsive
      responsive: {
        desktop: componentData.desktop || true,
        tablet: componentData.tablet || true,
        mobile: componentData.mobile || true
      }
    }
  };
}

/**
 * Génère les métadonnées de génération
 * @private
 */
function generateMetadataVariables(options) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      templateEngine: 'handlebars',
      buzzcraft: true,
      version: '1.0.0',
      generator: 'variable-generator-core',
      
      // Informations de contexte
      environment: process.env.NODE_ENV || 'development',
      buildMode: options.buildMode || 'development',
      
      // Timestamps utiles
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleDateString('fr-FR'),
      timeFormatted: new Date().toLocaleTimeString('fr-FR')
    }
  };
}

/**
 * Génère variables spécifiques selon le type de component
 * @private
 */
function generateTypeSpecificVariables(componentData) {
  const type = componentData.type;
  
  switch (type) {
    case 'heading':
    case 'h':
      return {
        tag: componentData.tag || 'h2',
        level: extractHeadingLevel(componentData.tag),
        isMainTitle: componentData.tag === 'h1'
      };
      
    case 'button':
      return {
        buttonType: componentData.buttonType || 'button',
        isSubmit: componentData.buttonType === 'submit',
        isLink: !!(componentData.href && componentData.href !== '#')
      };
      
    case 'image':
      return {
        hasCaption: !!(componentData.caption || componentData.alt),
        isLazy: componentData.lazy !== false,
        aspectRatio: calculateAspectRatio(componentData.width, componentData.height)
      };
      
    case 'video':
      return {
        hasControls: componentData.controls !== false,
        autoplay: componentData.autoplay === true,
        loop: componentData.loop === true,
        muted: componentData.muted === true
      };
      
    case 'link':
    case 'a':
      return {
        isExternal: isExternalLink(componentData.href),
        opensNewTab: componentData.target === '_blank',
        hasTitle: !!(componentData.title)
      };
      
    case 'form':
      return {
        method: componentData.method || 'POST',
        hasInputs: !!(componentData.inputs && componentData.inputs.length > 0),
        hasButtons: !!(componentData.buttons && componentData.buttons.length > 0),
        isMultipart: componentData.enctype === 'multipart/form-data'
      };
      
    case 'list':
      return {
        tag: componentData.tag || 'ul',
        isOrdered: componentData.tag === 'ol',
        hasItems: !!(componentData.items && componentData.items.length > 0),
        itemsCount: componentData.items ? componentData.items.length : 0
      };
      
    default:
      return {};
  }
}

/**
 * Vérifie si un component a des attributs valides
 * @private
 */
function hasValidAttributes(componentData) {
  const attributeKeys = ['id', 'classname', 'style', 'title', 'data-*'];
  return attributeKeys.some(key => {
    if (key.endsWith('*')) {
      // Vérifier les attributs data-*
      return Object.keys(componentData).some(k => k.startsWith('data-'));
    }
    return componentData[key] && String(componentData[key]).trim().length > 0;
  });
}

/**
 * Extrait le niveau d'un heading (h1 → 1, h2 → 2, etc.)
 * @private
 */
function extractHeadingLevel(tag) {
  if (!tag || typeof tag !== 'string') return 2;
  const match = tag.match(/h([1-6])/);
  return match ? parseInt(match[1], 10) : 2;
}

/**
 * Calcule le ratio d'aspect d'une image
 * @private
 */
function calculateAspectRatio(width, height) {
  if (!width || !height || width <= 0 || height <= 0) {
    return '16/9'; // Ratio par défaut
  }
  
  const ratio = width / height;
  
  // Ratios standards
  if (Math.abs(ratio - 16/9) < 0.1) return '16/9';
  if (Math.abs(ratio - 4/3) < 0.1) return '4/3';
  if (Math.abs(ratio - 3/2) < 0.1) return '3/2';
  if (Math.abs(ratio - 1) < 0.1) return '1/1';
  
  // Ratio personnalisé arrondi
  return `${Math.round(ratio * 100) / 100}/1`;
}

/**
 * Détermine si un lien est externe
 * @private
 */
function isExternalLink(href) {
  if (!href || typeof href !== 'string') return false;
  return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
}

/**
 * Génère un ID unique si manquant
 * @private
 */
function generateId() {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utilitaire pour merger des variables de façon intelligente
 * @param {object} base - Variables de base
 * @param {object} override - Variables à merger
 * @param {object} [options={}] - Options de merge
 * @returns {{success: boolean, data: object}} Variables mergées
 */
export async function mergeTemplateVariables(base, override, options = {}) {
  console.log(`[VARIABLE-GENERATOR] Merging template variables`);

  try {
    if (!base || typeof base !== 'object') {
      throw new Error('ValidationError: base variables must be an object');
    }

    if (!override || typeof override !== 'object') {
      return { success: true, data: { ...base } };
    }

    // Merge profond intelligent
    const merged = deepMergeVariables(base, override, options);

    console.log(`[VARIABLE-GENERATOR] Variables merged successfully`);

    return {
      success: true,
      data: merged
    };

  } catch (error) {
    console.log(`[VARIABLE-GENERATOR] Merge failed: ${error.message}`);
    return {
      success: false,
      error: `Variable merge failed: ${error.message}`
    };
  }
}

/**
 * Merge profond de variables avec règles intelligentes
 * @private
 */
function deepMergeVariables(base, override, options) {
  const merged = { ...base };
  
  for (const key in override) {
    if (!override.hasOwnProperty(key)) continue;
    
    const baseValue = merged[key];
    const overrideValue = override[key];
    
    if (baseValue && typeof baseValue === 'object' && 
        overrideValue && typeof overrideValue === 'object' &&
        !Array.isArray(baseValue) && !Array.isArray(overrideValue)) {
      // Merge récursif pour les objets
      merged[key] = deepMergeVariables(baseValue, overrideValue, options);
    } else {
      // Remplacement direct pour primitives et arrays
      merged[key] = overrideValue;
    }
  }
  
  return merged;
}

console.log(`[VARIABLE-GENERATOR] Variable generator loaded successfully - PIXEL PERFECT VERSION`);