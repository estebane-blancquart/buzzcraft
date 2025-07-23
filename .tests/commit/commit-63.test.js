/**
 * TESTS COMMIT 63 - Panel Editor
 * Validation code + visual + preview + collaboration
 */

import { 
  initializeCodeEditor, 
  validateCodeSyntax, 
  updateEditorContent, 
  getEditorStatus 
} from '../../app-client/panels/editor/code.js';

import { 
  initializeVisualEditor, 
  validateCanvasStructure, 
  addElementToCanvas, 
  getVisualEditorStatus 
} from '../../app-client/panels/editor/visual.js';

import { 
  initializePreview, 
  validatePreviewContent, 
  updatePreviewViewport, 
  getPreviewPerformance 
} from '../../app-client/panels/editor/preview.js';

import { 
  initializeCollaboration, 
  validateCollabPermissions, 
  synchronizeCollabChanges, 
  getCollaborationStatus 
} from '../../app-client/panels/editor/collaboration.js';

describe('COMMIT 63 - Panel Editor', () => {
  
  describe('Code Editor', () => {
    test('initializeCodeEditor - initialise éditeur avec config', async () => {
      const config = { autocompletion: true, linting: true };
      const content = 'console.log("Hello World");';
      const result = await initializeCodeEditor(config, content, 'javascript');
      
      expect(result.editor.id).toBeDefined();
      expect(result.editor.language).toBe('javascript');
      expect(result.content).toBe(content);
      expect(result.features).toContain('syntaxHighlighting');
    });

    test('validateCodeSyntax - valide syntaxe par langage', async () => {
      const jsCode = 'function test() { return true; }';
      const result = await validateCodeSyntax(jsCode, 'javascript');
      
      expect(result.valid).toBe(true);
      expect(result.language).toBe('javascript');
      expect(result.errors).toHaveLength(0);
    });

    test('updateEditorContent - met à jour contenu avec historique', async () => {
      const editor = {
        id: 'test-editor',
        content: 'old content',
        cursor: { line: 1, column: 1 },
        history: { undoStack: [], redoStack: [] },
        performance: { changeCount: 0 },
        language: 'javascript'
      };
      
      const result = await updateEditorContent(editor, 'new content that is longer', 'replace');
      
      expect(result.updated).toBe(true);
      expect(result.content).toBe('new content that is longer');
      expect(result.changes.delta).toBeGreaterThan(0);
    });

    test('erreurs code editor - gère erreurs appropriées', async () => {
      await expect(initializeCodeEditor(null)).rejects.toThrow('EditorError');
      await expect(initializeCodeEditor({}, '', 'invalid')).rejects.toThrow('LanguageError');
      await expect(updateEditorContent(null, 'test')).rejects.toThrow('EditorError');
    });
  });

  describe('Visual Editor', () => {
    test('initializeVisualEditor - initialise éditeur visuel', async () => {
      const config = { canvasWidth: 1200, showGrid: true };
      const result = await initializeVisualEditor(config);
      
      expect(result.editor.id).toBeDefined();
      expect(result.canvas.width).toBe(1200);
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.interactions.dragAndDrop.enabled).toBe(true);
    });

    test('validateCanvasStructure - valide structure canvas', async () => {
      const canvas = {
        id: 'test-canvas',
        elements: [
          { id: 'elem1', type: 'text', position: { x: 10, y: 10 }, size: { width: 100, height: 50 } }
        ]
      };
      const result = await validateCanvasStructure(canvas);
      
      expect(result.valid).toBe(true);
      expect(result.elements).toBe(1);
      expect(result.performance.complexity).toBe('low');
    });

    test('addElementToCanvas - ajoute élément au canvas', async () => {
      const editor = {
        canvas: { elements: [], selectedElement: null },
        components: [{ id: 'text-block', name: 'Text', props: {} }],
        history: { undoStack: [] },
        performance: { elementsCount: 0 }
      };
      
      const result = await addElementToCanvas(editor, 'text-block', { x: 50, y: 50 });
      
      expect(result.added).toBe(true);
      expect(result.element.type).toBe('text-block');
      expect(result.position).toEqual({ x: 50, y: 50 });
    });

    test('erreurs visual editor - gère erreurs appropriées', async () => {
      await expect(initializeVisualEditor(null)).rejects.toThrow('VisualError');
      await expect(addElementToCanvas(null, 'test')).rejects.toThrow('CanvasError');
      await expect(addElementToCanvas({ canvas: { elements: [] }, components: [] }, 'missing')).rejects.toThrow('ComponentError');
    });
  });

  describe('Preview', () => {
    test('initializePreview - initialise preview avec viewports', async () => {
      const config = { defaultViewport: 'mobile', enableInteractions: true };
      const result = await initializePreview(config);
      
      expect(result.preview.id).toBeDefined();
      expect(result.viewport.current).toBe('mobile');
      expect(result.simulation.interactions.enabled).toBe(true);
    });

    test('validatePreviewContent - valide contenu preview', async () => {
      const content = {
        html: '<div>Test</div>',
        css: 'div { color: red; }',
        javascript: 'console.log("test");'
      };
      const result = await validatePreviewContent(content);
      
      expect(result.valid).toBe(true);
      expect(result.renderable).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('updatePreviewViewport - change viewport', async () => {
      const preview = {
        viewport: {
          current: 'desktop',
          dimensions: { width: 1440, height: 900 },
          presets: {
            mobile: { width: 375, height: 667, device: 'iPhone' },
            desktop: { width: 1440, height: 900, device: 'Desktop' }
          }
        },
        simulation: { responsive: { enabled: true, breakpoints: { mobile: 576, tablet: 768 } } },
        performance: {}
      };
      
      const result = await updatePreviewViewport(preview, 'mobile');
      
      expect(result.updated).toBe(true);
      expect(result.viewport.name).toBe('mobile');
      expect(result.viewport.dimensions.width).toBe(375);
    });

    test('erreurs preview - gère erreurs appropriées', async () => {
      await expect(initializePreview(null)).rejects.toThrow('PreviewError');
      await expect(updatePreviewViewport(null, 'mobile')).rejects.toThrow('ViewportError');
      await expect(updatePreviewViewport({ viewport: { presets: {} } }, 'invalid')).rejects.toThrow('ViewportError');
    });
  });

  describe('Collaboration', () => {
    test('initializeCollaboration - initialise session collaborative', async () => {
      const config = { projectId: 'test-project', maxUsers: 5 };
      const user = { id: 'user1', name: 'Test User', role: 'editor' };
      const result = await initializeCollaboration(config, 'session-123', user);
      
      expect(result.session.id).toBe('session-123');
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe('user1');
      expect(result.sync.enabled).toBe(true);
    });

    test('validateCollabPermissions - valide permissions utilisateur', async () => {
      const collabData = {
        permissions: {
          'user1': { read: true, write: true, admin: false }
        }
      };
      const result = await validateCollabPermissions(collabData, 'user1', 'edit');
      
      expect(result.allowed).toBe(true);
      expect(result.action).toBe('edit');
      expect(result.requiredPermission).toBe('write');
    });

    test('synchronizeCollabChanges - synchronise opérations', async () => {
      const collabData = {
        sync: {
          operations: [],
          conflicts: [],
          version: 1
        },
        session: { settings: { conflictResolution: 'merge' } }
      };
      
      const operation = {
        type: 'insert',
        data: { target: 'element1', content: 'new text' },
        userId: 'user1'
      };
      
      const result = await synchronizeCollabChanges(collabData, operation);
      
      expect(result.synchronized).toBe(true);
      expect(result.operationId).toBeDefined();
      expect(result.version).toBe(2);
    });

    test('erreurs collaboration - gère erreurs appropriées', async () => {
      await expect(initializeCollaboration(null, 'session', {})).rejects.toThrow('CollabError');
      await expect(initializeCollaboration({}, null, {})).rejects.toThrow('SessionError');
      await expect(validateCollabPermissions(null, 'user', 'edit')).rejects.toThrow('PermissionError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('structure modules - 4 fonctions par module', () => {
      // Code Editor : 4 fonctions
      expect(typeof initializeCodeEditor).toBe('function');
      expect(typeof validateCodeSyntax).toBe('function');
      expect(typeof updateEditorContent).toBe('function');
      expect(typeof getEditorStatus).toBe('function');

      // Visual Editor : 4 fonctions  
      expect(typeof initializeVisualEditor).toBe('function');
      expect(typeof validateCanvasStructure).toBe('function');
      expect(typeof addElementToCanvas).toBe('function');
      expect(typeof getVisualEditorStatus).toBe('function');

      // Preview : 4 fonctions
      expect(typeof initializePreview).toBe('function');
      expect(typeof validatePreviewContent).toBe('function');
      expect(typeof updatePreviewViewport).toBe('function');
      expect(typeof getPreviewPerformance).toBe('function');

      // Collaboration : 4 fonctions
      expect(typeof initializeCollaboration).toBe('function');
      expect(typeof validateCollabPermissions).toBe('function');
      expect(typeof synchronizeCollabChanges).toBe('function');
      expect(typeof getCollaborationStatus).toBe('function');
    });

    test('timestamps - présents dans tous les retours', async () => {
      const codeResult = await initializeCodeEditor({}, '', 'javascript');
      const visualResult = await initializeVisualEditor({});
      const previewResult = await initializePreview({});
      const collabResult = await initializeCollaboration({}, 'session', { id: 'user', role: 'editor' });
      
      expect(codeResult.timestamp).toBeDefined();
      expect(visualResult.timestamp).toBeDefined();
      expect(previewResult.timestamp).toBeDefined();
      expect(collabResult.timestamp).toBeDefined();
    });

    test('erreurs typées - format correct', async () => {
      const errorTests = [
        { fn: () => initializeCodeEditor(null), type: 'EditorError' },
        { fn: () => initializeVisualEditor(null), type: 'VisualError' },
        { fn: () => initializePreview(null), type: 'PreviewError' },
        { fn: () => initializeCollaboration(null, 'session', {}), type: 'CollabError' }
      ];

      for (const test of errorTests) {
        await expect(test.fn()).rejects.toThrow(test.type);
      }
    });
  });
});
