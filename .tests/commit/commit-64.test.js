/**
 * TESTS COMMIT 64 - Panel Structure
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Navigator
import {
  createStructureNavigator, validateNavigatorStructure, updateNavigatorSelection, getNavigatorStatus
} from '../../app-client/panels/structure/navigator.js';

// Editor
import {
  createStructureEditor, validateStructureChanges, applyStructureChanges, getStructureEditorStatus
} from '../../app-client/panels/structure/editor.js';

// Search
import {
  createStructureSearch, executeStructureSearch, updateSearchIndex, getSearchStatus
} from '../../app-client/panels/structure/search.js';

// Tree
import {
  createStructureTree, validateTreeStructure, updateTreeNodes, getTreeStatus
} from '../../app-client/panels/structure/tree.js';

// Breadcrumb
import {
  createStructureBreadcrumb, validateBreadcrumbPath, navigateBreadcrumbPath, getBreadcrumbStatus
} from '../../app-client/panels/structure/breadcrumb.js';

describe('COMMIT 64 - Panel Structure', () => {

  describe('Navigator', () => {
    test('createStructureNavigator crée navigator basique', async () => {
      const structure = { root: { children: [] } };
      const result = await createStructureNavigator(structure, 'tree', 2);
      
      expect(result.navigator.mode).toBe('tree');
      expect(result.navigator.expandLevel).toBe(2);
      expect(Array.isArray(result.tree)).toBe(true);
      expect(Array.isArray(result.expanded)).toBe(true);
      expect(result.actions.expand).toBe(true);
    });

    test('validateNavigatorStructure valide structure', async () => {
      const structure = { root: { children: [] } };
      const navigator = await createStructureNavigator(structure);
      const result = await validateNavigatorStructure(navigator, structure);
      
      expect(result.valid).toBe(true);
      expect(typeof result.treeNodes).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    test('rejette structure invalide', async () => {
      await expect(createStructureNavigator(null)).rejects.toThrow('NavigatorError');
      await expect(createStructureNavigator({}, 'invalid')).rejects.toThrow('NavigatorError');
    });
  });

  describe('Editor', () => {
    test('createStructureEditor crée éditeur basique', async () => {
      const structure = { root: true };
      const result = await createStructureEditor(structure, true);
      
      expect(result.editor.mode).toBe('edit');
      expect(result.editor.validation).toBe('realtime');
      expect(typeof result.structure).toBe('object');
      expect(Array.isArray(result.changes)).toBe(true);
    });

    test('validateStructureChanges valide changements', async () => {
      const structure = { root: true };
      const changes = [
        { type: 'add', target: 'components', data: { name: 'Button' } },
        { type: 'rename', target: 'old-name', newName: 'new-name' }
      ];
      const result = await validateStructureChanges(structure, changes);
      
      expect(result.valid).toBe(true);
      expect(result.changesCount).toBe(2);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('rejette changements invalides', async () => {
      const structure = { root: true };
      const invalidChanges = [{ type: 'invalid' }];
      const result = await validateStructureChanges(structure, invalidChanges);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Search', () => {
    test('createStructureSearch crée moteur basique', async () => {
      const structure = { components: {}, pages: {} };
      const result = await createStructureSearch(structure, {}, true);
      
      expect(result.search.type).toBe('fulltext');
      expect(result.search.indexing).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.index).toBe('object');
      expect(typeof result.filters).toBe('object');
    });

    test('executeStructureSearch exécute recherche', async () => {
      const structure = { components: {} };
      const searchEngine = await createStructureSearch(structure);
      const result = await executeStructureSearch(searchEngine, 'button');
      
      expect(result.executed).toBe(true);
      expect(result.query).toBe('button');
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.totalResults).toBe('number');
      expect(typeof result.executionTime).toBe('number');
    });

    test('rejette query vide', async () => {
      const structure = { components: {} };
      const searchEngine = await createStructureSearch(structure);
      
      await expect(executeStructureSearch(searchEngine, '')).rejects.toThrow('SearchError');
      await expect(executeStructureSearch(searchEngine, '   ')).rejects.toThrow('SearchError');
    });
  });

  describe('Tree', () => {
    test('createStructureTree crée arbre basique', async () => {
      const treeData = { id: 'root', children: [] };
      const result = await createStructureTree(treeData, {}, true);
      
      expect(typeof result.tree).toBe('object');
      expect(typeof result.virtualized).toBe('boolean');
      expect(typeof result.performance).toBe('object');
      expect(typeof result.render).toBe('object');
    });

    test('validateTreeStructure valide arbre', async () => {
      const treeData = { id: 'root', children: [] };
      const tree = await createStructureTree(treeData);
      const result = await validateTreeStructure(tree);
      
      expect(result.valid).toBe(true);
      expect(typeof result.nodeCount).toBe('number');
      expect(typeof result.virtualized).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    test('updateTreeNodes applique mises à jour', async () => {
      const treeData = { id: 'root', children: [] };
      const tree = await createStructureTree(treeData);
      const updates = [{ type: 'add', nodeId: 'root', data: { name: 'New Node' } }];
      const result = await updateTreeNodes(tree, updates);
      
      expect(result.updated).toBe(true);
      expect(Array.isArray(result.appliedUpdates)).toBe(true);
      expect(Array.isArray(result.failedUpdates)).toBe(true);
    });
  });

  describe('Breadcrumb', () => {
    test('createStructureBreadcrumb crée breadcrumb basique', async () => {
      const currentPath = ['components', 'buttons', 'primary'];
      const result = await createStructureBreadcrumb(currentPath);
      
      expect(Array.isArray(result.breadcrumb)).toBe(true);
      expect(typeof result.navigation).toBe('object');
      expect(Array.isArray(result.history)).toBe(true);
      expect(typeof result.actions).toBe('object');
    });

    test('validateBreadcrumbPath valide chemin', async () => {
      const currentPath = ['components', 'buttons'];
      const breadcrumb = await createStructureBreadcrumb(currentPath);
      const result = await validateBreadcrumbPath(breadcrumb, currentPath);
      
      expect(result.valid).toBe(true);
      expect(result.breadcrumbItems).toBeGreaterThan(0);
      expect(result.pathDepth).toBe(2);
    });

    test('navigateBreadcrumbPath navigue vers index', async () => {
      const currentPath = ['components', 'buttons', 'primary'];
      const breadcrumb = await createStructureBreadcrumb(currentPath);
      const result = await navigateBreadcrumbPath(breadcrumb, 1);
      
      expect(result.navigated).toBe(true);
      expect(Array.isArray(result.targetPath)).toBe(true);
      expect(typeof result.targetItem).toBe('object');
    });

    test('rejette navigation invalide', async () => {
      const breadcrumb = await createStructureBreadcrumb(['test']);
      
      await expect(navigateBreadcrumbPath(breadcrumb, -1)).rejects.toThrow('BreadcrumbError');
      await expect(navigateBreadcrumbPath(breadcrumb, 999)).rejects.toThrow('BreadcrumbError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Navigator
      expect(typeof createStructureNavigator).toBe('function');
      expect(typeof validateNavigatorStructure).toBe('function');
      expect(typeof updateNavigatorSelection).toBe('function');
      expect(typeof getNavigatorStatus).toBe('function');

      // Editor
      expect(typeof createStructureEditor).toBe('function');
      expect(typeof validateStructureChanges).toBe('function');
      expect(typeof applyStructureChanges).toBe('function');
      expect(typeof getStructureEditorStatus).toBe('function');

      // Search
      expect(typeof createStructureSearch).toBe('function');
      expect(typeof executeStructureSearch).toBe('function');
      expect(typeof updateSearchIndex).toBe('function');
      expect(typeof getSearchStatus).toBe('function');

      // Tree
      expect(typeof createStructureTree).toBe('function');
      expect(typeof validateTreeStructure).toBe('function');
      expect(typeof updateTreeNodes).toBe('function');
      expect(typeof getTreeStatus).toBe('function');

      // Breadcrumb
      expect(typeof createStructureBreadcrumb).toBe('function');
      expect(typeof validateBreadcrumbPath).toBe('function');
      expect(typeof navigateBreadcrumbPath).toBe('function');
      expect(typeof getBreadcrumbStatus).toBe('function');
    });

    test('timestamps présents dans tous les retours', async () => {
      const structure = { root: true };
      const treeData = { id: 'root' };
      const currentPath = ['test'];

      const navigator = await createStructureNavigator(structure);
      const editor = await createStructureEditor(structure);
      const search = await createStructureSearch(structure);
      const tree = await createStructureTree(treeData);
      const breadcrumb = await createStructureBreadcrumb(currentPath);

      expect(navigator.timestamp).toBeDefined();
      expect(editor.timestamp).toBeDefined();
      expect(search.timestamp).toBeDefined();
      expect(tree.timestamp).toBeDefined();
      expect(breadcrumb.timestamp).toBeDefined();

      // Validation format timestamp ISO
      expect(new Date(navigator.timestamp).toISOString()).toBe(navigator.timestamp);
      expect(new Date(editor.timestamp).toISOString()).toBe(editor.timestamp);
      expect(new Date(search.timestamp).toISOString()).toBe(search.timestamp);
      expect(new Date(tree.timestamp).toISOString()).toBe(tree.timestamp);
      expect(new Date(breadcrumb.timestamp).toISOString()).toBe(breadcrumb.timestamp);
    });

    test('gestion erreurs typées cohérente', async () => {
      // Navigator
      await expect(createStructureNavigator(null)).rejects.toThrow('NavigatorError');
      await expect(validateNavigatorStructure(null, {})).rejects.toThrow('NavigatorError');

      // Editor
      await expect(createStructureEditor(null)).rejects.toThrow('EditorError');
      await expect(validateStructureChanges(null, [])).rejects.toThrow('EditorError');

      // Search
      await expect(createStructureSearch(null)).rejects.toThrow('SearchError');
      await expect(executeStructureSearch({}, null)).rejects.toThrow('SearchError');

      // Tree
      await expect(createStructureTree(null)).rejects.toThrow('TreeError');
      await expect(validateTreeStructure(null)).rejects.toThrow('TreeError');

      // Breadcrumb
      await expect(createStructureBreadcrumb(null)).rejects.toThrow('BreadcrumbError');
      await expect(validateBreadcrumbPath(null, [])).rejects.toThrow('BreadcrumbError');
    });

    test('status functions retournent structure cohérente', async () => {
      const structure = { root: true };
      const treeData = { id: 'root' };
      const currentPath = ['test'];

      const navigator = await createStructureNavigator(structure);
      const editor = await createStructureEditor(structure);
      const search = await createStructureSearch(structure);
      const tree = await createStructureTree(treeData);
      const breadcrumb = await createStructureBreadcrumb(currentPath);

      const navStatus = await getNavigatorStatus(navigator);
      const editorStatus = await getStructureEditorStatus(editor, structure);
      const searchStatus = await getSearchStatus(search);
      const treeStatus = await getTreeStatus(tree);
      const breadcrumbStatus = await getBreadcrumbStatus(breadcrumb);

      // Tous ont un status
      expect(navStatus.status).toBeDefined();
      expect(editorStatus.status).toBeDefined();
      expect(searchStatus.status).toBeDefined();
      expect(treeStatus.status).toBeDefined();
      expect(breadcrumbStatus.status).toBeDefined();

      // Tous ont un lastUpdate/lastEdit
      expect(navStatus.lastUpdate || navStatus.lastEdit).toBeDefined();
      expect(editorStatus.lastUpdate || editorStatus.lastEdit).toBeDefined();
      expect(searchStatus.lastUpdate || searchStatus.lastEdit).toBeDefined();
      expect(treeStatus.lastUpdate || treeStatus.lastEdit).toBeDefined();
      expect(breadcrumbStatus.lastUpdate || breadcrumbStatus.lastEdit).toBeDefined();
    });
  });

});
