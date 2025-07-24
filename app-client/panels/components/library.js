/**
 * COMMIT 68 - Panel Components
 * 
 * FAIT QUOI : Bibliothèque composants avec versioning et gestion categories
 * REÇOIT : components: object[], version: string, categoryFilters?: string[]
 * RETOURNE : { library: object[], categories: object, versions: object, metadata: object }
 * ERREURS : LibraryError si bibliothèque corrompue, VersionError si version invalide, CategoryError si catégorie inexistante
 */

// DEPENDENCY FLOW (no circular deps)

export async function createComponentsLibrary(components = [], version = '1.0.0', categoryFilters = []) {
  if (!Array.isArray(components)) {
    throw new Error('LibraryError: Components doit être array');
  }

  if (typeof version !== 'string' || !version.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error('VersionError: Version doit suivre format semver');
  }

  if (!Array.isArray(categoryFilters)) {
    throw new Error('CategoryError: CategoryFilters doit être array');
  }

  try {
    const filteredComponents = categoryFilters.length > 0 
      ? components.filter(comp => categoryFilters.includes(comp.category))
      : components;

    const categories = groupComponentsByCategory(filteredComponents);
    const versions = await getVersionHistory(version);
    
    const library = filteredComponents.map(component => ({
      ...component,
      version,
      lastModified: new Date().toISOString(),
      dependencies: extractDependencies(component)
    }));

    return {
      library,
      categories,
      versions,
      metadata: {
        total: library.length,
        version,
        filters: categoryFilters,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`LibraryError: Création bibliothèque échouée: ${error.message}`);
  }
}

export async function validateComponentsStructure(components, schema = {}) {
  if (!Array.isArray(components)) {
    throw new Error('LibraryError: Components doit être array');
  }

  if (typeof schema !== 'object') {
    throw new Error('LibraryError: Schema doit être object');
  }

  try {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      components: components.length
    };

    for (const component of components) {
      // Validation structure obligatoire
      if (!component.id || typeof component.id !== 'string') {
        validation.errors.push(`missing_component_id: ${component.name || 'unknown'}`);
        validation.valid = false;
        continue;
      }

      if (!component.name || typeof component.name !== 'string') {
        validation.errors.push(`missing_component_name: ${component.id}`);
        validation.valid = false;
      }

      if (!component.category) {
        validation.warnings.push(`missing_category: ${component.id}`);
      }

      // Validation props si présentes
      if (component.props && !Array.isArray(component.props)) {
        validation.errors.push(`invalid_props_structure: ${component.id}`);
        validation.valid = false;
      }

      // Validation schema custom
      if (schema.requiredFields) {
        for (const field of schema.requiredFields) {
          if (!component[field]) {
            validation.warnings.push(`missing_${field}: ${component.id}`);
          }
        }
      }
    }

    // Validation unicité IDs
    const ids = components.map(c => c.id).filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      validation.errors.push(`duplicate_ids: ${duplicates.join(', ')}`);
      validation.valid = false;
    }

    return {
      ...validation,
      duplicates: duplicates.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`LibraryError: Validation structure échouée: ${error.message}`);
  }
}

export async function updateLibraryVersion(currentLibrary, newVersion, changes = []) {
  if (!currentLibrary || typeof currentLibrary !== 'object') {
    throw new Error('LibraryError: CurrentLibrary requis object');
  }

  if (typeof newVersion !== 'string' || !newVersion.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error('VersionError: NewVersion doit suivre format semver');
  }

  if (!Array.isArray(changes)) {
    throw new Error('LibraryError: Changes doit être array');
  }

  try {
    const oldVersion = currentLibrary.metadata?.version || '0.0.0';
    const versionComparison = compareVersions(oldVersion, newVersion);

    if (versionComparison >= 0) {
      throw new Error(`VersionError: Nouvelle version ${newVersion} doit être supérieure à ${oldVersion}`);
    }

    const updatedLibrary = {
      ...currentLibrary,
      library: currentLibrary.library.map(component => ({
        ...component,
        version: newVersion,
        lastModified: new Date().toISOString()
      })),
      metadata: {
        ...currentLibrary.metadata,
        version: newVersion,
        previousVersion: oldVersion,
        changes,
        updatedAt: new Date().toISOString()
      }
    };

    const changelog = await generateChangelog(oldVersion, newVersion, changes);

    return {
      library: updatedLibrary,
      changelog,
      migration: {
        from: oldVersion,
        to: newVersion,
        breaking: versionComparison === -1 && parseInt(newVersion.split('.')[0]) > parseInt(oldVersion.split('.')[0]),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`LibraryError: Mise à jour version échouée: ${error.message}`);
  }
}

export async function searchComponentsLibrary(library, query, options = {}) {
  if (!library || !Array.isArray(library.library)) {
    throw new Error('LibraryError: Library requis avec propriété library array');
  }

  if (typeof query !== 'string') {
    throw new Error('LibraryError: Query doit être string');
  }

  const searchFields = options.fields || ['name', 'description', 'category'];
  const caseSensitive = options.caseSensitive || false;
  const exactMatch = options.exactMatch || false;

  try {
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    const results = library.library.filter(component => {
      return searchFields.some(field => {
        const fieldValue = component[field];
        if (!fieldValue) return false;
        
        const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();
        return exactMatch ? value === searchTerm : value.includes(searchTerm);
      });
    });

    const grouped = groupComponentsByCategory(results);
    
    return {
      results,
      grouped,
      total: results.length,
      query: {
        term: query,
        fields: searchFields,
        options: { caseSensitive, exactMatch }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`LibraryError: Recherche bibliothèque échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
function groupComponentsByCategory(components) {
  return components.reduce((groups, component) => {
    const category = component.category || 'uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(component);
    return groups;
  }, {});
}

async function getVersionHistory(currentVersion) {
  // Mock version history
  return {
    current: currentVersion,
    history: ['1.0.0', '0.9.0', '0.8.0'],
    latest: currentVersion
  };
}

function extractDependencies(component) {
  // Extract dependencies from component definition
  return component.dependencies || [];
}

function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }
  return 0;
}

async function generateChangelog(oldVersion, newVersion, changes) {
  return {
    version: newVersion,
    previousVersion: oldVersion,
    changes: changes.map(change => ({
      ...change,
      timestamp: new Date().toISOString()
    })),
    generatedAt: new Date().toISOString()
  };
}
