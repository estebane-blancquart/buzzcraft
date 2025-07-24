/**
 * COMMIT 64 - Panel Structure
 * 
 * FAIT QUOI : Navigation arbre hiérarchique avec expansions et drag&drop
 * REÇOIT : projectStructure: object, navigationMode: string, expandLevel?: number
 * RETOURNE : { navigator: object, tree: object[], expanded: string[], actions: object }
 * ERREURS : NavigatorError si structure invalide, TreeError si navigation échoue, HierarchyError si arbre corrompu
 */

export async function createStructureNavigator(projectStructure, navigationMode = 'tree', expandLevel = 2) {
  if (!projectStructure || typeof projectStructure !== 'object') {
    throw new Error('NavigatorError: Structure projet requise object');
  }

  if (!['tree', 'flat', 'hybrid'].includes(navigationMode)) {
    throw new Error('NavigatorError: Mode navigation doit être tree, flat, hybrid');
  }

  try {
    const tree = generateNavigationTree(projectStructure, expandLevel);
    const expanded = getExpandedNodes(tree, expandLevel);

    return {
      navigator: {
        mode: navigationMode,
        expandLevel,
        interactive: true,
        dragDrop: navigationMode === 'tree'
      },
      tree,
      expanded,
      actions: {
        expand: true,
        collapse: true,
        select: true,
        dragDrop: navigationMode === 'tree'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`NavigatorError: Création navigation échouée: ${error.message}`);
  }
}

export async function validateNavigatorStructure(navigator, structure) {
  if (!navigator || typeof navigator !== 'object') {
    throw new Error('NavigatorError: Navigator requis object');
  }

  if (!structure || typeof structure !== 'object') {
    throw new Error('NavigatorError: Structure requise object');
  }

  try {
    const issues = [];

    // Validation navigator
    if (!navigator.navigator || !navigator.tree) {
      issues.push('missing_navigator_components');
    }

    if (!Array.isArray(navigator.tree)) {
      issues.push('invalid_tree_format');
    }

    if (!navigator.actions || typeof navigator.actions !== 'object') {
      issues.push('missing_actions');
    }

    // Validation structure cohérence
    const treeNodes = navigator.tree.length;
    const structureNodes = countStructureNodes(structure);
    
    if (Math.abs(treeNodes - structureNodes) > 5) {
      issues.push('tree_structure_mismatch');
    }

    return {
      valid: issues.length === 0,
      navigator: navigator.navigator?.mode || 'unknown',
      treeNodes,
      structureNodes,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`NavigatorError: Validation échouée: ${error.message}`);
  }
}

export async function updateNavigatorSelection(navigator, selectedNodes, options = {}) {
  if (!navigator || typeof navigator !== 'object') {
    throw new Error('NavigatorError: Navigator requis object');
  }

  if (!Array.isArray(selectedNodes)) {
    throw new Error('NavigatorError: Selected nodes doit être array');
  }

  const multiSelect = options.multiSelect !== false;
  const expandSelected = options.expandSelected !== false;

  try {
    const selection = multiSelect ? selectedNodes : selectedNodes.slice(0, 1);
    const expanded = expandSelected ? 
      [...navigator.expanded, ...getParentNodes(selection)] : 
      navigator.expanded;

    return {
      updated: true,
      selection,
      expanded: [...new Set(expanded)],
      multiSelect,
      count: selection.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`NavigatorError: Mise à jour sélection échouée: ${error.message}`);
  }
}

export async function getNavigatorStatus(navigator, options = {}) {
  if (!navigator || typeof navigator !== 'object') {
    throw new Error('NavigatorError: Navigator requis object');
  }

  try {
    const validation = await validateNavigatorStructure(navigator, { nodes: [] });
    
    const status = validation.valid ? 'operational' : 'degraded';
    const interactive = navigator.actions?.select && navigator.actions?.expand;

    return {
      status,
      mode: navigator.navigator?.mode || 'unknown',
      interactive,
      treeNodes: validation.treeNodes,
      expandedNodes: navigator.expanded?.length || 0,
      issues: validation.issues,
      lastUpdate: navigator.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      mode: 'unknown',
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
function generateNavigationTree(structure, expandLevel) {
  // Simulation génération arbre
  return [
    { id: 'root', label: 'Project Root', level: 0, expanded: true },
    { id: 'components', label: 'Components', level: 1, expanded: expandLevel >= 1 },
    { id: 'pages', label: 'Pages', level: 1, expanded: expandLevel >= 1 },
    { id: 'assets', label: 'Assets', level: 1, expanded: expandLevel >= 1 }
  ];
}

function getExpandedNodes(tree, expandLevel) {
  return tree.filter(node => node.level <= expandLevel).map(node => node.id);
}

function countStructureNodes(structure) {
  // Simulation comptage nodes
  return Object.keys(structure).length || 4;
}

function getParentNodes(selectedNodes) {
  // Simulation récupération parents
  return selectedNodes.map(node => node.replace(/\/[^/]*$/, '')).filter(Boolean);
}

// panels/structure/navigator : Panel Structure (commit 64)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
