/**
 * TESTS COMMIT 68 - Panel Components
 * Validation exhaustive des modules components
 */

import { 
  createComponentsLibrary, 
  validateComponentsStructure, 
  updateLibraryVersion, 
  searchComponentsLibrary 
} from '../../app-client/panels/components/library.js';

import { 
  createComponentPreview, 
  updatePreviewViewport, 
  simulateComponentInteractions, 
  capturePreviewSnapshot 
} from '../../app-client/panels/components/preview.js';

import { 
  generateComponentDocumentation, 
  validateDocumentationStructure, 
  updateDocumentationContent, 
  searchDocumentationContent 
} from '../../app-client/panels/components/documentation.js';

import { 
  createComponentsSearch, 
  updateSearchIndex, 
  performAdvancedSearch, 
  createSearchSuggestions 
} from '../../app-client/panels/components/search.js';

// === TESTS LIBRARY ===
describe('COMMIT 68 - Panel Components Library', () => {
  test('createComponentsLibrary - validation complète', async () => {
    const mockComponents = [
      { id: 'btn-1', name: 'Button', category: 'inputs', version: '1.0.0' },
      { id: 'inp-1', name: 'Input', category: 'inputs', version: '1.0.0' }
    ];

    const result = await createComponentsLibrary(mockComponents, '1.0.0', ['inputs']);
    
    expect(result).toHaveProperty('library');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('versions');
    expect(result).toHaveProperty('metadata');
    expect(result.library).toHaveLength(2);
    expect(result.metadata.total).toBe(2);
    expect(result.metadata.version).toBe('1.0.0');
  });

  test('createComponentsLibrary - erreurs typées', async () => {
    await expect(createComponentsLibrary('invalid'))
      .rejects.toThrow('LibraryError: Components doit être array');
    
    await expect(createComponentsLibrary([], 'invalid-version'))
      .rejects.toThrow('VersionError: Version doit suivre format semver');
    
    await expect(createComponentsLibrary([], '1.0.0', 'invalid'))
      .rejects.toThrow('CategoryError: CategoryFilters doit être array');
  });

  test('validateComponentsStructure - structure valide', async () => {
    const mockComponents = [
      { id: 'test-1', name: 'Test Component', category: 'test' }
    ];

    const result = await validateComponentsStructure(mockComponents);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result.valid).toBe(true);
    expect(result.components).toBe(1);
  });

  test('updateLibraryVersion - mise à jour version', async () => {
    const mockLibrary = {
      library: [{ id: 'test-1', name: 'Test', version: '1.0.0' }],
      metadata: { version: '1.0.0' }
    };

    const result = await updateLibraryVersion(mockLibrary, '1.1.0', ['feature: new component']);
    
    expect(result).toHaveProperty('library');
    expect(result).toHaveProperty('changelog');
    expect(result).toHaveProperty('migration');
    expect(result.library.metadata.version).toBe('1.1.0');
  });

  test('searchComponentsLibrary - recherche fonctionnelle', async () => {
    const mockLibrary = {
      library: [
        { id: 'btn-1', name: 'Button', description: 'A clickable button' },
        { id: 'inp-1', name: 'Input', description: 'Text input field' }
      ]
    };

    const result = await searchComponentsLibrary(mockLibrary, 'button');
    
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('total');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Button');
  });
});

// === TESTS PREVIEW ===
describe('COMMIT 68 - Panel Components Preview', () => {
  test('createComponentPreview - création preview', async () => {
    const mockComponent = { id: 'test-1', name: 'Test Component' };

    const result = await createComponentPreview(mockComponent, 'desktop', true);
    
    expect(result).toHaveProperty('preview');
    expect(result).toHaveProperty('viewport');
    expect(result).toHaveProperty('interactions');
    expect(result).toHaveProperty('metadata');
    expect(result.preview.componentId).toBe('test-1');
  });

  test('createComponentPreview - erreurs validation', async () => {
    await expect(createComponentPreview(null))
      .rejects.toThrow('PreviewError: Component requis object');
    
    await expect(createComponentPreview({}))
      .rejects.toThrow('PreviewError: Component ID requis');
    
    await expect(createComponentPreview({ id: 'test' }, 'invalid-viewport'))
      .rejects.toThrow('ViewportError: ViewportSize doit être mobile|tablet|desktop|wide');
  });

  test('updatePreviewViewport - changement viewport', async () => {
    const mockPreview = {
      preview: { componentId: 'test-1', viewport: 'desktop' },
      viewport: { size: 'desktop', width: 1200, height: 800 }
    };

    const result = await updatePreviewViewport(mockPreview, 'mobile', true);
    
    expect(result).toHaveProperty('preview');
    expect(result).toHaveProperty('viewport');
    expect(result).toHaveProperty('transition');
    expect(result.preview.viewport).toBe('mobile');
  });

  test('simulateComponentInteractions - simulation', async () => {
    const mockPreview = {
      preview: { componentId: 'test-1' }
    };
    const mockInteractions = [
      { type: 'click', duration: 1000 },
      { type: 'hover', duration: 500 }
    ];

    const result = await simulateComponentInteractions(mockPreview, mockInteractions, 3000);
    
    expect(result).toHaveProperty('simulation');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('interactions');
    expect(result.simulation.steps).toHaveLength(2);
  });

  test('capturePreviewSnapshot - capture', async () => {
    const mockPreview = {
      preview: { rendered: '<div>test</div>', componentId: 'test-1' },
      viewport: { width: 1200, height: 800 }
    };

    const result = await capturePreviewSnapshot(mockPreview, { format: 'png', quality: 0.9 });
    
    expect(result).toHaveProperty('snapshot');
    expect(result).toHaveProperty('metadata');
    expect(result.metadata.format).toBe('png');
    expect(result.metadata.quality).toBe(0.9);
  });
});

// === TESTS DOCUMENTATION ===
describe('COMMIT 68 - Panel Components Documentation', () => {
  test('generateComponentDocumentation - génération complète', async () => {
    const mockComponent = {
      id: 'test-1',
      name: 'Test Component',
      description: 'A test component',
      props: [{ name: 'variant', type: 'string', default: 'primary' }]
    };

    const result = await generateComponentDocumentation(mockComponent, true, 'markdown');
    
    expect(result).toHaveProperty('docs');
    expect(result).toHaveProperty('examples');
    expect(result).toHaveProperty('guides');
    expect(result).toHaveProperty('metadata');
    expect(result.docs.componentId).toBe('test-1');
    expect(result.docs.format).toBe('markdown');
  });

  test('generateComponentDocumentation - erreurs validation', async () => {
    await expect(generateComponentDocumentation(null))
      .rejects.toThrow('DocumentationError: Component requis object');
    
    await expect(generateComponentDocumentation({}))
      .rejects.toThrow('DocumentationError: Component ID requis');
    
    await expect(generateComponentDocumentation({ id: 'test' }, true, 'invalid'))
      .rejects.toThrow('FormatError: Format doit être markdown|html|json');
  });

  test('validateDocumentationStructure - validation structure', async () => {
    const mockDocumentation = {
      docs: {
        content: {
          overview: 'Component overview',
          props: 'Props documentation',
          examples: 'Usage examples'
        }
      },
      examples: [{ title: 'Basic', code: '<Component />' }]
    };

    const result = await validateDocumentationStructure(mockDocumentation, {
      sections: ['overview', 'props', 'examples']
    });
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('coverage');
    expect(result.valid).toBe(true);
    expect(result.coverage.sections).toBe(100);
  });

  test('updateDocumentationContent - mise à jour', async () => {
    const mockDocumentation = {
      docs: {
        content: { overview: 'Old overview' },
        version: '1.0.0'
      }
    };
    const updates = { overview: 'New overview', api: 'New API docs' };

    const result = await updateDocumentationContent(mockDocumentation, updates, true);
    
    expect(result).toHaveProperty('documentation');
    expect(result).toHaveProperty('changes');
    expect(result).toHaveProperty('history');
    expect(result.documentation.docs.content.overview).toBe('New overview');
    expect(result.changes).toContain('overview');
    expect(result.changes).toContain('api');
  });

  test('searchDocumentationContent - recherche', async () => {
    const mockDocumentation = {
      docs: {
        content: {
          overview: 'This component provides button functionality',
          props: 'Button variant prop controls appearance'
        }
      },
      examples: [
        { title: 'Button Example', description: 'Basic button usage' }
      ]
    };

    const result = await searchDocumentationContent(mockDocumentation, 'button');
    
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('exampleResults');
    expect(result).toHaveProperty('total');
    expect(result.results.length).toBeGreaterThan(0);
  });
});

// === TESTS SEARCH ===
describe('COMMIT 68 - Panel Components Search', () => {
  test('createComponentsSearch - recherche basique', async () => {
    const mockComponents = [
      { id: 'btn-1', name: 'Button', category: 'inputs', description: 'Clickable button' },
      { id: 'inp-1', name: 'Input', category: 'inputs', description: 'Text input field' },
      { id: 'car-1', name: 'Card', category: 'layout', description: 'Content card' }
    ];

    const result = await createComponentsSearch(mockComponents, 'button', { category: ['inputs'] });
    
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('index');
    expect(result).toHaveProperty('filters');
    expect(result).toHaveProperty('metadata');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Button');
  });

  test('createComponentsSearch - erreurs validation', async () => {
    await expect(createComponentsSearch('invalid'))
      .rejects.toThrow('SearchError: Components doit être array');
    
    await expect(createComponentsSearch([], 123))
      .rejects.toThrow('SearchError: SearchQuery doit être string');
    
    await expect(createComponentsSearch([], '', 'invalid'))
      .rejects.toThrow('FilterError: Filters doit être object');
  });

  test('updateSearchIndex - mise à jour index', async () => {
    const mockIndex = {
      byName: { button: ['btn-1'] },
      totalComponents: 1,
      version: '1.0.0'
    };
    const newComponents = [
      { id: 'inp-1', name: 'Input', category: 'inputs' }
    ];

    const result = await updateSearchIndex(mockIndex, newComponents, { incremental: true });
    
    expect(result).toHaveProperty('index');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('metadata');
    expect(result.index.totalComponents).toBe(2);
    expect(result.stats.newComponents).toBe(1);
  });

  test('performAdvancedSearch - recherche avancée', async () => {
    const mockComponents = [
      { id: 'btn-1', name: 'Primary Button', description: 'Main action button' },
      { id: 'btn-2', name: 'Secondary Button', description: 'Secondary action' },
      { id: 'inp-1', name: 'Text Input', description: 'Text input field' }
    ];

    const result = await performAdvancedSearch(mockComponents, 'button', {
      fields: ['name', 'description'],
      limit: 10,
      offset: 0
    });
    
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('pagination');
    expect(result).toHaveProperty('facets');
    expect(result.results).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  test('createSearchSuggestions - suggestions', async () => {
    const mockComponents = [
      { id: 'btn-1', name: 'Button', category: 'inputs' },
      { id: 'btn-2', name: 'ButtonGroup', category: 'inputs' },
      { id: 'inp-1', name: 'Input', category: 'inputs' }
    ];

    const result = await createSearchSuggestions(mockComponents, 'but', {
      maxSuggestions: 5,
      minQueryLength: 2
    });
    
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('total');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.query).toBe('but');
  });

  test('createSearchSuggestions - requête trop courte', async () => {
    const result = await createSearchSuggestions([], 'b', { minQueryLength: 2 });
    
    expect(result.suggestions).toHaveLength(0);
    expect(result.reason).toBe('query_too_short');
  });
});

// === TESTS INTÉGRATION ===
describe('COMMIT 68 - Panel Components Integration', () => {
  test('workflow complet - library → search → preview → documentation', async () => {
    // 1. Créer une bibliothèque
    const components = [
      { id: 'btn-1', name: 'Button', category: 'inputs', description: 'Click me!' }
    ];
    const library = await createComponentsLibrary(components, '1.0.0');
    expect(library.library).toHaveLength(1);

    // 2. Rechercher des composants
    const search = await createComponentsSearch(components, 'button');
    expect(search.results).toHaveLength(1);

    // 3. Créer un preview
    const preview = await createComponentPreview(search.results[0], 'desktop');
    expect(preview.preview.componentId).toBe('btn-1');

    // 4. Générer la documentation
    const docs = await generateComponentDocumentation(search.results[0], true);
    expect(docs.docs.componentId).toBe('btn-1');

    // Validation finale
    expect(library.metadata.total).toBe(1);
    expect(search.metadata.totalResults).toBe(1);
    expect(preview.metadata.componentVersion).toBeDefined();
    expect(docs.metadata.componentId).toBe('btn-1');
  });

  test('gestion erreurs cohérente', async () => {
    // Test que tous les modules ont des erreurs typées cohérentes
    const errorTests = [
      () => createComponentsLibrary('invalid'),
      () => createComponentPreview(null),
      () => generateComponentDocumentation(null),
      () => createComponentsSearch('invalid')
    ];

    for (const test of errorTests) {
      await expect(test()).rejects.toThrow(/Error:/);
    }
  });

  test('métadonnées cohérentes', async () => {
    const component = { id: 'test-1', name: 'Test', category: 'test' };
    
    const library = await createComponentsLibrary([component]);
    const preview = await createComponentPreview(component);
    const docs = await generateComponentDocumentation(component);
    const search = await createComponentsSearch([component]);

    // Tous doivent avoir un timestamp
    expect(library.metadata.timestamp).toBeDefined();
    expect(preview.metadata.timestamp).toBeDefined();
    expect(docs.metadata.timestamp).toBeDefined();
    expect(search.metadata.timestamp).toBeDefined();

    // Tous doivent référencer le même composant
    expect(library.library[0].id).toBe('test-1');
    expect(preview.preview.componentId).toBe('test-1');
    expect(docs.docs.componentId).toBe('test-1');
    expect(search.results[0].id).toBe('test-1');
  });
});

console.log('✅ TESTS COMMIT 68 - Panel Components - SUCCÈS');
