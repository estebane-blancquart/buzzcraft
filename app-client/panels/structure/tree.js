/**
 * COMMIT 64 - Panel Structure
 * 
 * FAIT QUOI : Arbre composants avec rendu optimisé et virtualisation
 * REÇOIT : treeData: object, renderOptions?: object, virtualization?: boolean
 * RETOURNE : { tree: object, virtualized: boolean, performance: object, render: object }
 * ERREURS : TreeError si données arbre invalides, RenderError si rendu échoue, VirtualizationError si virtualisation impossible
 */

export async function createStructureTree(treeData, renderOptions = {}, virtualization = true) {
  if (!treeData || typeof treeData !== 'object') {
    throw new Error('TreeError: TreeData requis object');
  }

  if (typeof renderOptions !== 'object') {
    throw new Error('TreeError: RenderOptions doit être object');
  }

  try {
    const tree = {
      data: treeData,
      expanded: renderOptions.expanded || [],
      selected: renderOptions.selected || [],
      dragDrop: renderOptions.dragDrop !== false
    };

    const render = {
      virtualization,
      itemHeight: renderOptions.itemHeight || 32,
      viewportHeight: renderOptions.viewportHeight || 400,
      overscan: renderOptions.overscan || 5
    };

    const performance = await calculateTreePerformance(treeData, render);

    return {
      tree,
      virtualized: virtualization && performance.shouldVirtualize,
      performance,
      render,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`TreeError: Création arbre échouée: ${error.message}`);
  }
}

export async function validateTreeStructure(tree, options = {}) {
  if (!tree || typeof tree !== 'object') {
    throw new Error('TreeError: Tree requis object');
  }

  const strict = options.strict !== false;
  const checkCircular = options.checkCircular !== false;

  try {
    const issues = [];

    // Validation structure
    if (!tree.tree || !tree.tree.data) {
      issues.push('missing_tree_data');
    }

    if (!Array.isArray(tree.tree?.expanded)) {
      issues.push('invalid_expanded_format');
    }

    if (!Array.isArray(tree.tree?.selected)) {
      issues.push('invalid_selected_format');
    }

    // Validation données arbre
    if (tree.tree?.data) {
      const nodeCount = countTreeNodes(tree.tree.data);
      if (nodeCount === 0) {
        issues.push('empty_tree');
      }

      if (checkCircular && hasCircularReferences(tree.tree.data)) {
        issues.push('circular_references');
      }
    }

    // Validation performance
    if (tree.performance && tree.performance.nodeCount > 1000 && !tree.virtualized) {
      issues.push('large_tree_not_virtualized');
    }

    return {
      valid: issues.length === 0,
      nodeCount: tree.performance?.nodeCount || 0,
      virtualized: tree.virtualized || false,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`TreeError: Validation arbre échouée: ${error.message}`);
  }
}

export async function updateTreeNodes(tree, updates, options = {}) {
  if (!tree || typeof tree !== 'object') {
    throw new Error('TreeError: Tree requis object');
  }

  if (!Array.isArray(updates)) {
    throw new Error('TreeError: Updates doit être array');
  }

  const atomic = options.atomic !== false;
  const reindex = options.reindex !== false;

  try {
    const applied = [];
    const failed = [];

    for (const update of updates) {
      try {
        if (!update.type || !update.nodeId) {
          throw new Error('Update invalide: type et nodeId requis');
        }

        // Simulation application update
        applied.push(update);
      } catch (error) {
        failed.push({ update, error: error.message });
        if (atomic) {
          throw new Error(`TreeError: Update atomique échouée: ${error.message}`);
        }
      }
    }

    // Recalcul performance si nécessaire
    const performance = reindex ? 
      await calculateTreePerformance(tree.tree.data, tree.render) : 
      tree.performance;

    return {
      updated: true,
      appliedUpdates: applied,
      failedUpdates: failed,
      performance,
      reindexed: reindex,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`TreeError: Mise à jour nodes échouée: ${error.message}`);
  }
}

export async function getTreeStatus(tree, options = {}) {
  if (!tree || typeof tree !== 'object') {
    throw new Error('TreeError: Tree requis object');
  }

  try {
    const validation = await validateTreeStructure(tree, options);
    
    const status = validation.valid ? 
      (validation.nodeCount > 0 ? 'loaded' : 'empty') : 
      'invalid';

    const interactive = tree.tree?.dragDrop && validation.valid;

    return {
      status,
      interactive,
      nodeCount: validation.nodeCount,
      virtualized: validation.virtualized,
      expanded: tree.tree?.expanded?.length || 0,
      selected: tree.tree?.selected?.length || 0,
      issues: validation.issues,
      lastUpdate: tree.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      interactive: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function calculateTreePerformance(treeData, renderOptions) {
  // Simulation calcul performance
  const nodeCount = countTreeNodes(treeData);
  const itemHeight = renderOptions.itemHeight || 32;
  const viewportHeight = renderOptions.viewportHeight || 400;
  
  const visibleItems = Math.ceil(viewportHeight / itemHeight);
  const shouldVirtualize = nodeCount > visibleItems * 3;

  return {
    nodeCount,
    visibleItems,
    shouldVirtualize,
    estimatedHeight: nodeCount * itemHeight,
    renderTime: Math.round(nodeCount * 0.1), // simulation temps rendu
    memoryUsage: Math.round(nodeCount * 0.5) // simulation mémoire
  };
}

function countTreeNodes(treeData) {
  // Simulation comptage nodes
  if (!treeData || typeof treeData !== 'object') return 0;
  
  let count = 1; // Le node actuel
  
  if (treeData.children && Array.isArray(treeData.children)) {
    count += treeData.children.reduce((sum, child) => sum + countTreeNodes(child), 0);
  }
  
  return count;
}

function hasCircularReferences(treeData, visited = new Set()) {
  // Simulation détection références circulaires
  if (!treeData || typeof treeData !== 'object') return false;
  
  const nodeId = treeData.id || JSON.stringify(treeData);
  
  if (visited.has(nodeId)) {
    return true;
  }
  
  visited.add(nodeId);
  
  if (treeData.children && Array.isArray(treeData.children)) {
    return treeData.children.some(child => hasCircularReferences(child, new Set(visited)));
  }
  
  return false;
}

// panels/structure/tree : Panel Structure (commit 64)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
