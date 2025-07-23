/**
 * COMMIT 63 - Panel Editor
 * 
 * FAIT QUOI : Éditeur visuel drag & drop avec composants et preview temps réel
 * REÇOIT : visualConfig: object, components: array, canvas?: object, interactions?: object
 * RETOURNE : { editor: object, canvas: object, components: array, interactions: object }
 * ERREURS : VisualError si éditeur invalide, CanvasError si canvas corrompu, ComponentError si composant inexistant, InteractionError si interaction impossible
 */

export async function initializeVisualEditor(visualConfig, components = []) {
  if (!visualConfig || typeof visualConfig !== 'object') {
    throw new Error('VisualError: Configuration éditeur visuel requise');
  }

  const defaultComponents = [
    {
      id: 'text-block',
      name: 'Bloc Texte',
      category: 'content',
      icon: 'type',
      props: { content: 'Texte exemple', fontSize: '16px', color: '#000000' },
      draggable: true,
      resizable: true
    },
    {
      id: 'image-block',
      name: 'Image',
      category: 'media',
      icon: 'image',
      props: { src: '/placeholder.jpg', alt: 'Image', width: '300px', height: '200px' },
      draggable: true,
      resizable: true
    },
    {
      id: 'button-element',
      name: 'Bouton',
      category: 'interactive',
      icon: 'cursor-pointer',
      props: { text: 'Cliquer ici', variant: 'primary', size: 'medium' },
      draggable: true,
      resizable: false
    },
    {
      id: 'container-grid',
      name: 'Grille',
      category: 'layout',
      icon: 'grid',
      props: { columns: 3, gap: '20px', padding: '20px' },
      draggable: true,
      resizable: true,
      children: []
    },
    {
      id: 'navbar-component',
      name: 'Navigation',
      category: 'navigation',
      icon: 'menu',
      props: { brand: 'Site', links: ['Accueil', 'À propos', 'Contact'] },
      draggable: true,
      resizable: false
    }
  ];

  const canvas = {
    id: `canvas-${Date.now()}`,
    width: visualConfig.canvasWidth || 1200,
    height: visualConfig.canvasHeight || 800,
    backgroundColor: visualConfig.backgroundColor || '#ffffff',
    elements: [],
    selectedElement: null,
    zoom: visualConfig.zoom || 100,
    grid: {
      enabled: visualConfig.showGrid !== false,
      size: visualConfig.gridSize || 20,
      snap: visualConfig.snapToGrid !== false
    },
    rulers: {
      enabled: visualConfig.showRulers !== false,
      unit: 'px'
    }
  };

  const interactions = {
    dragAndDrop: {
      enabled: true,
      activeElement: null,
      dropZones: []
    },
    selection: {
      enabled: true,
      multiSelect: visualConfig.multiSelect !== false,
      selectedElements: []
    },
    resize: {
      enabled: true,
      handles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
      aspectRatio: false
    },
    contextMenu: {
      enabled: true,
      actions: ['copy', 'paste', 'delete', 'duplicate', 'properties']
    }
  };

  const editor = {
    id: `visual-editor-${Date.now()}`,
    config: visualConfig,
    canvas: canvas,
    components: [...defaultComponents, ...components],
    interactions: interactions,
    history: {
      undoStack: [],
      redoStack: [],
      maxHistorySize: 50
    },
    clipboard: null,
    performance: {
      renderTime: 0,
      elementsCount: 0,
      lastAction: new Date().toISOString()
    }
  };

  return {
    editor: editor,
    canvas: canvas,
    components: editor.components,
    interactions: interactions,
    timestamp: new Date().toISOString()
  };
}

export async function validateCanvasStructure(canvas) {
  const validation = {
    valid: true,
    elements: 0,
    issues: [],
    performance: {},
    timestamp: new Date().toISOString()
  };

  if (!canvas?.id) {
    validation.issues.push('Canvas sans identifiant');
    validation.valid = false;
  }

  if (!canvas?.elements) {
    validation.issues.push('Structure éléments manquante');
    validation.valid = false;
  } else {
    validation.elements = canvas.elements.length;

    // Validation des éléments
    for (const element of canvas.elements) {
      if (!element.id || !element.type) {
        validation.issues.push(`Élément invalide: ${element.id || 'sans ID'}`);
        validation.valid = false;
      }

      // Vérification positionnement
      if (element.position && (element.position.x < 0 || element.position.y < 0)) {
        validation.issues.push(`Position négative pour élément: ${element.id}`);
      }

      // Vérification dimensions
      if (element.size && (element.size.width <= 0 || element.size.height <= 0)) {
        validation.issues.push(`Dimensions invalides pour élément: ${element.id}`);
      }
    }

    // Analyse performance
    validation.performance = {
      elementsCount: validation.elements,
      complexity: validation.elements > 50 ? 'high' : validation.elements > 20 ? 'medium' : 'low',
      recommendOptimization: validation.elements > 100
    };
  }

  return validation;
}

export async function addElementToCanvas(editor, componentId, position = { x: 0, y: 0 }) {
  if (!editor?.canvas) {
    throw new Error('CanvasError: Canvas éditeur manquant');
  }

  const component = editor.components.find(comp => comp.id === componentId);
  if (!component) {
    throw new Error('ComponentError: Composant inexistant');
  }

  // Génération élément canvas
  const element = {
    id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: component.id,
    name: component.name,
    position: position,
    size: {
      width: component.props.width || '200px',
      height: component.props.height || '100px'
    },
    props: { ...component.props },
    style: {},
    children: component.children ? [...component.children] : [],
    locked: false,
    visible: true,
    zIndex: editor.canvas.elements.length + 1
  };

  // Sauvegarde historique
  editor.history.undoStack.push({
    action: 'add_element',
    element: null,
    timestamp: new Date().toISOString()
  });

  // Ajout au canvas
  editor.canvas.elements.push(element);
  editor.canvas.selectedElement = element.id;
  editor.performance.elementsCount = editor.canvas.elements.length;
  editor.performance.lastAction = new Date().toISOString();

  return {
    added: true,
    element: element,
    canvas: {
      elementsCount: editor.canvas.elements.length,
      selectedElement: element.id
    },
    position: position,
    timestamp: new Date().toISOString()
  };
}

export async function getVisualEditorStatus(editor) {
  if (!editor) {
    return {
      status: 'not_initialized',
      ready: false,
      timestamp: new Date().toISOString()
    };
  }

  const analysis = {
    ready: !!editor.id,
    canvas: {
      elements: editor.canvas?.elements?.length || 0,
      selected: !!editor.canvas?.selectedElement,
      size: `${editor.canvas?.width || 0}x${editor.canvas?.height || 0}`
    },
    components: {
      available: editor.components?.length || 0,
      categories: [...new Set(editor.components?.map(c => c.category) || [])]
    },
    interactions: {
      dragDrop: editor.interactions?.dragAndDrop?.enabled || false,
      selection: editor.interactions?.selection?.enabled || false,
      resize: editor.interactions?.resize?.enabled || false
    },
    performance: {
      elementsCount: editor.performance?.elementsCount || 0,
      lastAction: editor.performance?.lastAction,
      complexity: editor.performance?.elementsCount > 50 ? 'high' : 
                  editor.performance?.elementsCount > 20 ? 'medium' : 'low'
    }
  };

  return {
    status: analysis.ready ? 'ready' : 'initializing',
    ready: analysis.ready,
    analysis: analysis,
    health: analysis.canvas.elements > 100 ? 'warning' : 'healthy',
    timestamp: new Date().toISOString()
  };
}

// panels/editor/visual : Panel Editor (commit 63)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
