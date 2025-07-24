/**
 * COMMIT 68 - Panel Components
 * 
 * FAIT QUOI : Recherche intelligente avec indexation et filtres avancés
 * REÇOIT : components: object[], searchQuery: string, filters: object
 * RETOURNE : { results: object[], index: object, filters: object, metadata: object }
 * ERREURS : SearchError si recherche échoue, IndexError si indexation impossible, FilterError si filtres invalides
 */

// DEPENDENCY FLOW (no circular deps)

export async function createComponentsSearch(components = [], searchQuery = '', filters = {}) {
  if (!Array.isArray(components)) {
    throw new Error('SearchError: Components doit être array');
  }

  if (typeof searchQuery !== 'string') {
    throw new Error('SearchError: SearchQuery doit être string');
  }

  if (typeof filters !== 'object') {
    throw new Error('FilterError: Filters doit être object');
  }

  try {
    // Création de l'index de recherche
    const searchIndex = await buildSearchIndex(components);
    
    // Application des filtres
    const filteredComponents = await applyFilters(components, filters);
    
    // Recherche dans les composants filtrés
    const results = searchQuery.trim() 
      ? await performSearch(filteredComponents, searchQuery, searchIndex)
      : filteredComponents;

    return {
      results,
      index: {
        totalComponents: components.length,
        indexedFields: Object.keys(searchIndex),
        lastBuilt: new Date().toISOString()
      },
      filters: {
        applied: Object.keys(filters).length,
        active: filters,
        available: getAvailableFilters(components)
      },
      metadata: {
        query: searchQuery,
        totalResults: results.length,
        filteredFrom: filteredComponents.length,
        totalComponents: components.length,
        searchTime: Date.now(),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`SearchError: Création recherche échouée: ${error.message}`);
  }
}

export async function updateSearchIndex(currentIndex, newComponents, options = {}) {
  if (!currentIndex || typeof currentIndex !== 'object') {
    throw new Error('IndexError: CurrentIndex requis object');
  }

  if (!Array.isArray(newComponents)) {
    throw new Error('IndexError: NewComponents doit être array');
  }

  const incremental = options.incremental !== false;
  const rebuildThreshold = options.rebuildThreshold || 100;

  try {
    const existingComponentsCount = currentIndex.totalComponents || 0;
    const shouldRebuild = !incremental || newComponents.length > rebuildThreshold;

    let updatedIndex;

    if (shouldRebuild) {
      // Reconstruction complète de l'index
      updatedIndex = await buildSearchIndex(newComponents);
    } else {
      // Mise à jour incrémentale
      updatedIndex = await updateIndexIncremental(currentIndex, newComponents);
    }

    const indexStats = {
      previousComponents: existingComponentsCount,
      newComponents: newComponents.length,
      totalComponents: updatedIndex.totalComponents,
      rebuildPerformed: shouldRebuild,
      indexSize: calculateIndexSize(updatedIndex)
    };

    return {
      index: {
        ...updatedIndex,
        lastUpdated: new Date().toISOString(),
        version: incrementIndexVersion(currentIndex.version || '1.0.0')
      },
      stats: indexStats,
      metadata: {
        updateType: shouldRebuild ? 'full_rebuild' : 'incremental',
        componentsAdded: newComponents.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`IndexError: Mise à jour index échouée: ${error.message}`);
  }
}

export async function performAdvancedSearch(components, query, options = {}) {
  if (!Array.isArray(components)) {
    throw new Error('SearchError: Components doit être array');
  }

  if (typeof query !== 'string') {
    throw new Error('SearchError: Query doit être string');
  }

  const searchOptions = {
    fuzzy: options.fuzzy || false,
    exactMatch: options.exactMatch || false,
    fields: options.fields || ['name', 'description', 'category'],
    boost: options.boost || {},
    limit: options.limit || 50,
    offset: options.offset || 0
  };

  try {
    // Parsing de la requête pour détecter les opérateurs
    const parsedQuery = parseSearchQuery(query);
    
    // Construction des critères de recherche
    const searchCriteria = await buildSearchCriteria(parsedQuery, searchOptions);
    
    // Exécution de la recherche avec scoring
    const searchResults = await executeAdvancedSearch(components, searchCriteria);
    
    // Application de la pagination
    const paginatedResults = applyPagination(searchResults, searchOptions.limit, searchOptions.offset);
    
    // Calcul des facettes pour le filtrage
    const facets = await calculateSearchFacets(searchResults, components);

    return {
      results: paginatedResults.items,
      pagination: {
        total: searchResults.length,
        limit: searchOptions.limit,
        offset: searchOptions.offset,
        pages: Math.ceil(searchResults.length / searchOptions.limit),
        currentPage: Math.floor(searchOptions.offset / searchOptions.limit) + 1
      },
      facets,
      query: {
        original: query,
        parsed: parsedQuery,
        options: searchOptions
      },
      metadata: {
        totalMatches: searchResults.length,
        returnedResults: paginatedResults.items.length,
        searchTime: paginatedResults.searchTime,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`SearchError: Recherche avancée échouée: ${error.message}`);
  }
}

export async function createSearchSuggestions(components, partialQuery, options = {}) {
  if (!Array.isArray(components)) {
    throw new Error('SearchError: Components doit être array');
  }

  if (typeof partialQuery !== 'string') {
    throw new Error('SearchError: PartialQuery doit être string');
  }

  const suggestionOptions = {
    maxSuggestions: options.maxSuggestions || 10,
    minQueryLength: options.minQueryLength || 2,
    includePopular: options.includePopular !== false,
    includeSimilar: options.includeSimilar !== false
  };

  try {
    if (partialQuery.length < suggestionOptions.minQueryLength) {
      return {
        suggestions: [],
        query: partialQuery,
        reason: 'query_too_short',
        metadata: {
          minLength: suggestionOptions.minQueryLength,
          currentLength: partialQuery.length
        }
      };
    }

    const suggestions = [];

    // Suggestions basées sur les noms de composants
    const nameSuggestions = await generateNameSuggestions(components, partialQuery);
    suggestions.push(...nameSuggestions);

    // Suggestions basées sur les catégories
    const categorySuggestions = await generateCategorySuggestions(components, partialQuery);
    suggestions.push(...categorySuggestions);

    // Suggestions basées sur les descriptions
    const descriptionSuggestions = await generateDescriptionSuggestions(components, partialQuery);
    suggestions.push(...descriptionSuggestions);

    // Suggestions populaires si demandées
    if (suggestionOptions.includePopular) {
      const popularSuggestions = await getPopularSearchTerms(components, partialQuery);
      suggestions.push(...popularSuggestions);
    }

    // Suggestions similaires si demandées
    if (suggestionOptions.includeSimilar) {
      const similarSuggestions = await getSimilarSearchTerms(partialQuery);
      suggestions.push(...similarSuggestions);
    }

    // Déduplication et tri par pertinence
    const uniqueSuggestions = deduplicateSuggestions(suggestions);
    const rankedSuggestions = rankSuggestions(uniqueSuggestions, partialQuery);
    const limitedSuggestions = rankedSuggestions.slice(0, suggestionOptions.maxSuggestions);

    return {
      suggestions: limitedSuggestions,
      query: partialQuery,
      total: uniqueSuggestions.length,
      returned: limitedSuggestions.length,
      metadata: {
        options: suggestionOptions,
        sources: {
          names: nameSuggestions.length,
          categories: categorySuggestions.length,
          descriptions: descriptionSuggestions.length,
          popular: suggestionOptions.includePopular ? 0 : 0, // Mock
          similar: suggestionOptions.includeSimilar ? 0 : 0   // Mock
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`SearchError: Création suggestions échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
async function buildSearchIndex(components) {
  const index = {
    byName: {},
    byCategory: {},
    byDescription: {},
    byTags: {},
    totalComponents: components.length
  };

  components.forEach(component => {
    // Index par nom
    if (component.name) {
      const nameKey = component.name.toLowerCase();
      if (!index.byName[nameKey]) index.byName[nameKey] = [];
      index.byName[nameKey].push(component.id);
    }

    // Index par catégorie
    if (component.category) {
      const categoryKey = component.category.toLowerCase();
      if (!index.byCategory[categoryKey]) index.byCategory[categoryKey] = [];
      index.byCategory[categoryKey].push(component.id);
    }

    // Index par description
    if (component.description) {
      const words = component.description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          if (!index.byDescription[word]) index.byDescription[word] = [];
          index.byDescription[word].push(component.id);
        }
      });
    }

    // Index par tags
    if (component.tags && Array.isArray(component.tags)) {
      component.tags.forEach(tag => {
        const tagKey = tag.toLowerCase();
        if (!index.byTags[tagKey]) index.byTags[tagKey] = [];
        index.byTags[tagKey].push(component.id);
      });
    }
  });

  return index;
}

async function applyFilters(components, filters) {
  let filtered = [...components];

  if (filters.category && Array.isArray(filters.category)) {
    filtered = filtered.filter(comp => filters.category.includes(comp.category));
  }

  if (filters.tags && Array.isArray(filters.tags)) {
    filtered = filtered.filter(comp => 
      comp.tags && comp.tags.some(tag => filters.tags.includes(tag))
    );
  }

  if (filters.version) {
    filtered = filtered.filter(comp => comp.version === filters.version);
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(comp => {
      const compDate = new Date(comp.created || comp.lastModified || Date.now());
      return compDate >= new Date(start) && compDate <= new Date(end);
    });
  }

  return filtered;
}

async function performSearch(components, query, searchIndex) {
  const queryLower = query.toLowerCase();
  const results = [];

  components.forEach(component => {
    let score = 0;

    // Score basé sur le nom (poids élevé)
    if (component.name && component.name.toLowerCase().includes(queryLower)) {
      score += 10;
      if (component.name.toLowerCase().startsWith(queryLower)) {
        score += 5; // Bonus pour début de nom
      }
    }

    // Score basé sur la description
    if (component.description && component.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Score basé sur la catégorie
    if (component.category && component.category.toLowerCase().includes(queryLower)) {
      score += 3;
    }

    // Score basé sur les tags
    if (component.tags && component.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 2;
    }

    if (score > 0) {
      results.push({ ...component, searchScore: score });
    }
  });

  // Tri par score décroissant
  return results.sort((a, b) => b.searchScore - a.searchScore);
}

function getAvailableFilters(components) {
  const filters = {
    categories: [...new Set(components.map(c => c.category).filter(Boolean))],
    tags: [...new Set(components.flatMap(c => c.tags || []))],
    versions: [...new Set(components.map(c => c.version).filter(Boolean))]
  };

  return filters;
}

// === FIX BUG 1: updateIndexIncremental corrigé ===
async function updateIndexIncremental(currentIndex, newComponents) {
  const updatedIndex = JSON.parse(JSON.stringify(currentIndex));
  
  // Ajout des nouveaux composants à l'index existant
  const newComponentsIndex = await buildSearchIndex(newComponents);
  
  // Fusion des indexes - FIX: vérification existence avant accès
  Object.keys(newComponentsIndex).forEach(indexType => {
    if (indexType === 'totalComponents') return;
    
    Object.keys(newComponentsIndex[indexType]).forEach(key => {
      // FIX: Initialisation de l'index type s'il n'existe pas
      if (!updatedIndex[indexType]) {
        updatedIndex[indexType] = {};
      }
      
      if (!updatedIndex[indexType][key]) {
        updatedIndex[indexType][key] = [];
      }
      updatedIndex[indexType][key].push(...newComponentsIndex[indexType][key]);
    });
  });

  updatedIndex.totalComponents += newComponents.length;
  return updatedIndex;
}

function calculateIndexSize(index) {
  return JSON.stringify(index).length;
}

function incrementIndexVersion(version) {
  const parts = version.split('.');
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join('.');
}

function parseSearchQuery(query) {
  // Parse simple pour opérateurs de base
  return {
    terms: query.split(/\s+/).filter(term => term.length > 0),
    operators: [], // Mock - aucun opérateur pour l'instant
    exact: query.includes('"'),
    original: query
  };
}

async function buildSearchCriteria(parsedQuery, options) {
  return {
    terms: parsedQuery.terms,
    fields: options.fields,
    fuzzy: options.fuzzy,
    exactMatch: options.exactMatch,
    boost: options.boost
  };
}

async function executeAdvancedSearch(components, criteria) {
  const startTime = Date.now();
  
  const results = components.filter(component => {
    return criteria.terms.some(term => {
      return criteria.fields.some(field => {
        const fieldValue = component[field];
        if (!fieldValue) return false;
        
        return criteria.exactMatch 
          ? fieldValue.toLowerCase() === term.toLowerCase()
          : fieldValue.toLowerCase().includes(term.toLowerCase());
      });
    });
  });

  const searchTime = Date.now() - startTime;
  return results.map(result => ({ ...result, searchTime }));
}

function applyPagination(results, limit, offset) {
  const startTime = Date.now();
  const items = results.slice(offset, offset + limit);
  
  return {
    items,
    searchTime: Date.now() - startTime
  };
}

async function calculateSearchFacets(results, allComponents) {
  return {
    categories: getValueCounts(results, 'category'),
    tags: getValueCounts(results.flatMap(r => r.tags || []), null),
    versions: getValueCounts(results, 'version')
  };
}

function getValueCounts(items, field) {
  const counts = {};
  
  if (field) {
    items.forEach(item => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
  } else {
    // Pour les arrays aplatis comme les tags
    items.forEach(value => {
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
  }
  
  return counts;
}

async function generateNameSuggestions(components, query) {
  return components
    .filter(comp => comp.name && comp.name.toLowerCase().includes(query.toLowerCase()))
    .map(comp => ({
      text: comp.name,
      type: 'name',
      component: comp.id,
      score: comp.name.toLowerCase().indexOf(query.toLowerCase()) === 0 ? 10 : 5
    }));
}

async function generateCategorySuggestions(components, query) {
  const categories = [...new Set(components.map(c => c.category).filter(Boolean))];
  
  return categories
    .filter(cat => cat.toLowerCase().includes(query.toLowerCase()))
    .map(cat => ({
      text: cat,
      type: 'category',
      score: cat.toLowerCase().indexOf(query.toLowerCase()) === 0 ? 8 : 4
    }));
}

async function generateDescriptionSuggestions(components, query) {
  const suggestions = [];
  
  components.forEach(comp => {
    if (comp.description && comp.description.toLowerCase().includes(query.toLowerCase())) {
      // Extrait des mots autour du terme recherché
      const words = comp.description.split(/\s+/);
      const queryIndex = words.findIndex(word => word.toLowerCase().includes(query.toLowerCase()));
      
      if (queryIndex >= 0) {
        const contextStart = Math.max(0, queryIndex - 2);
        const contextEnd = Math.min(words.length, queryIndex + 3);
        const context = words.slice(contextStart, contextEnd).join(' ');
        
        suggestions.push({
          text: context,
          type: 'description',
          component: comp.id,
          score: 3
        });
      }
    }
  });
  
  return suggestions;
}

async function getPopularSearchTerms(components, query) {
  // Mock - retourne des termes populaires fictifs
  const popular = ['button', 'input', 'form', 'card', 'modal'];
  
  return popular
    .filter(term => term.includes(query.toLowerCase()))
    .map(term => ({
      text: term,
      type: 'popular',
      score: 6
    }));
}

async function getSimilarSearchTerms(query) {
  // Mock - retourne des termes similaires fictifs
  const similar = {
    'but': ['button', 'submit'],
    'inp': ['input', 'field'],
    'for': ['form', 'formik'],
    'car': ['card', 'container'],
    'mod': ['modal', 'dialog']
  };
  
  const key = query.substring(0, 3).toLowerCase();
  const terms = similar[key] || [];
  
  return terms.map(term => ({
    text: term,
    type: 'similar',
    score: 4
  }));
}

function deduplicateSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter(suggestion => {
    const key = `${suggestion.text}-${suggestion.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankSuggestions(suggestions, query) {
  return suggestions.sort((a, b) => {
    // Tri par score puis par pertinence par rapport à la requête
    const scoreA = a.score + (a.text.toLowerCase().startsWith(query.toLowerCase()) ? 5 : 0);
    const scoreB = b.score + (b.text.toLowerCase().startsWith(query.toLowerCase()) ? 5 : 0);
    
    return scoreB - scoreA;
  });
}
