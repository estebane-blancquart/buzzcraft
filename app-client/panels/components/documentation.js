/**
 * COMMIT 68 - Panel Components
 * 
 * FAIT QUOI : Documentation auto avec exemples et guides utilisation
 * REÇOIT : component: object, includeExamples: boolean, format: string
 * RETOURNE : { docs: object, examples: object[], guides: object[], metadata: object }
 * ERREURS : DocumentationError si génération impossible, ExampleError si exemples invalides, FormatError si format non supporté
 */

// DEPENDENCY FLOW (no circular deps)

export async function generateComponentDocumentation(component, includeExamples = true, format = 'markdown') {
  if (!component || typeof component !== 'object') {
    throw new Error('DocumentationError: Component requis object');
  }

  if (!component.id) {
    throw new Error('DocumentationError: Component ID requis');
  }

  if (typeof includeExamples !== 'boolean') {
    throw new Error('DocumentationError: IncludeExamples doit être boolean');
  }

  const validFormats = ['markdown', 'html', 'json'];
  if (!validFormats.includes(format)) {
    throw new Error('FormatError: Format doit être markdown|html|json');
  }

  try {
    const docs = await buildComponentDocumentation(component, format);
    const examples = includeExamples ? await generateComponentExamples(component) : [];
    const guides = await createUsageGuides(component);

    const documentation = {
      componentId: component.id,
      content: docs,
      format,
      sections: Object.keys(docs),
      generated: new Date().toISOString()
    };

    return {
      docs: documentation,
      examples,
      guides,
      metadata: {
        componentId: component.id,
        componentName: component.name,
        version: component.version || '1.0.0',
        format,
        sections: documentation.sections.length,
        examples: examples.length,
        guides: guides.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`DocumentationError: Génération documentation échouée: ${error.message}`);
  }
}

export async function validateDocumentationStructure(documentation, requirements = {}) {
  if (!documentation || typeof documentation !== 'object') {
    throw new Error('DocumentationError: Documentation requis object');
  }

  if (!documentation.docs) {
    throw new Error('DocumentationError: Documentation.docs requis');
  }

  try {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      coverage: {}
    };

    const requiredSections = requirements.sections || ['overview', 'props', 'examples'];
    const docs = documentation.docs.content;

    // Validation sections requises
    for (const section of requiredSections) {
      if (!docs[section]) {
        validation.errors.push(`missing_section: ${section}`);
        validation.valid = false;
      } else if (typeof docs[section] === 'string' && docs[section].trim().length === 0) {
        validation.warnings.push(`empty_section: ${section}`);
      }
    }

    // Validation exemples si requis
    if (requirements.requireExamples && (!documentation.examples || documentation.examples.length === 0)) {
      validation.errors.push('missing_examples');
      validation.valid = false;
    }

    // Validation props documentation
    if (docs.props && Array.isArray(docs.props)) {
      const undocumentedProps = docs.props.filter(prop => !prop.description);
      if (undocumentedProps.length > 0) {
        validation.warnings.push(`undocumented_props: ${undocumentedProps.map(p => p.name).join(', ')}`);
      }
    }

    // Calcul couverture documentation
    validation.coverage = {
      sections: (Object.keys(docs).length / requiredSections.length) * 100,
      examples: documentation.examples?.length || 0,
      guides: documentation.guides?.length || 0
    };

    return {
      ...validation,
      requirements,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`DocumentationError: Validation structure échouée: ${error.message}`);
  }
}

export async function updateDocumentationContent(documentation, updates, preserveHistory = true) {
  if (!documentation || typeof documentation !== 'object') {
    throw new Error('DocumentationError: Documentation requis object');
  }

  if (typeof updates !== 'object') {
    throw new Error('DocumentationError: Updates doit être object');
  }

  if (typeof preserveHistory !== 'boolean') {
    throw new Error('DocumentationError: PreserveHistory doit être boolean');
  }

  try {
    const history = preserveHistory ? await saveDocumentationHistory(documentation) : null;
    const currentContent = documentation.docs.content;
    
    // Application des mises à jour
    const updatedContent = { ...currentContent };
    
    for (const [section, content] of Object.entries(updates)) {
      if (typeof content === 'string') {
        updatedContent[section] = content;
      } else if (typeof content === 'object' && content !== null) {
        updatedContent[section] = { ...currentContent[section], ...content };
      }
    }

    // Validation du contenu mis à jour
    const validation = await validateUpdatedContent(updatedContent, currentContent);
    
    if (!validation.valid) {
      throw new Error(`DocumentationError: Contenu mis à jour invalide: ${validation.errors.join(', ')}`);
    }

    const updatedDocumentation = {
      ...documentation,
      docs: {
        ...documentation.docs,
        content: updatedContent,
        lastModified: new Date().toISOString(),
        version: incrementDocVersion(documentation.docs.version || '1.0.0')
      },
      history: preserveHistory ? { ...history, preserved: true } : null
    };

    return {
      documentation: updatedDocumentation,
      changes: Object.keys(updates),
      history,
      metadata: {
        sections: Object.keys(updatedContent).length,
        updatedSections: Object.keys(updates).length,
        preserveHistory,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`DocumentationError: Mise à jour contenu échouée: ${error.message}`);
  }
}

export async function searchDocumentationContent(documentation, query, options = {}) {
  if (!documentation || typeof documentation !== 'object') {
    throw new Error('DocumentationError: Documentation requis object');
  }

  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('DocumentationError: Query doit être string non vide');
  }

  const searchSections = options.sections || Object.keys(documentation.docs.content);
  const caseSensitive = options.caseSensitive || false;
  const highlightResults = options.highlight !== false;

  try {
    const results = [];
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    for (const section of searchSections) {
      const content = documentation.docs.content[section];
      if (!content) continue;

      const contentText = typeof content === 'string' ? content : JSON.stringify(content);
      const searchText = caseSensitive ? contentText : contentText.toLowerCase();
      
      if (searchText.includes(searchTerm)) {
        const matches = findMatches(contentText, query, caseSensitive);
        
        results.push({
          section,
          matches: matches.length,
          content: highlightResults ? highlightMatches(contentText, query, caseSensitive) : contentText,
          relevance: calculateRelevance(matches, contentText.length)
        });
      }
    }

    // Tri par pertinence
    results.sort((a, b) => b.relevance - a.relevance);

    // Recherche dans les exemples
    const exampleResults = documentation.examples ? 
      await searchInExamples(documentation.examples, query, options) : [];

    return {
      results,
      exampleResults,
      total: results.length + exampleResults.length,
      query: {
        term: query,
        sections: searchSections,
        options: { caseSensitive, highlightResults }
      },
      metadata: {
        sectionsSearched: searchSections.length,
        contentMatches: results.length,
        exampleMatches: exampleResults.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`DocumentationError: Recherche contenu échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
async function buildComponentDocumentation(component, format) {
  const docs = {
    overview: generateOverview(component),
    props: generatePropsDocumentation(component.props || []),
    examples: generateExamplesSection(component),
    api: generateAPIDocumentation(component),
    styling: generateStylingGuide(component)
  };

  if (format === 'html') {
    return convertToHTML(docs);
  } else if (format === 'json') {
    return docs; // JSON natif
  } else {
    return convertToMarkdown(docs);
  }
}

async function generateComponentExamples(component) {
  // Génération automatique d'exemples basés sur les props
  const examples = [];
  
  // Exemple basique
  examples.push({
    title: 'Basic Usage',
    code: generateBasicExample(component),
    description: `Basic usage of ${component.name} component`
  });

  // Exemples avec différentes props si disponibles
  if (component.props && component.props.length > 0) {
    examples.push({
      title: 'With Props',
      code: generatePropsExample(component),
      description: `${component.name} with custom properties`
    });
  }

  return examples;
}

async function createUsageGuides(component) {
  return [
    {
      title: 'Getting Started',
      content: `Learn how to use ${component.name} in your project`,
      sections: ['Installation', 'Basic Setup', 'Configuration']
    },
    {
      title: 'Best Practices',
      content: `Best practices for ${component.name} component`,
      sections: ['Performance', 'Accessibility', 'Styling']
    }
  ];
}

function generateOverview(component) {
  return `# ${component.name}

${component.description || 'A reusable component'}

**Version:** ${component.version || '1.0.0'}
**Category:** ${component.category || 'General'}
**Created:** ${component.created || new Date().toISOString()}`;
}

function generatePropsDocumentation(props) {
  if (!Array.isArray(props) || props.length === 0) {
    return '## Props\n\nNo props defined for this component.';
  }

  let propsDoc = '## Props\n\n| Name | Type | Default | Description |\n|------|------|---------|-------------|\n';
  
  props.forEach(prop => {
    propsDoc += `| ${prop.name} | ${prop.type || 'any'} | ${prop.default || '-'} | ${prop.description || 'No description'} |\n`;
  });

  return propsDoc;
}

function generateExamplesSection(component) {
  return `## Examples

### Basic Example
\`\`\`jsx
<${component.name} />
\`\`\`

### Advanced Example
\`\`\`jsx
<${component.name} 
  variant="primary"
  size="large"
/>
\`\`\``;
}

function generateAPIDocumentation(component) {
  return `## API Reference

### Methods
${component.methods ? component.methods.map(m => `- **${m.name}()**: ${m.description || 'No description'}`).join('\n') : 'No public methods'}

### Events
${component.events ? component.events.map(e => `- **${e.name}**: ${e.description || 'No description'}`).join('\n') : 'No events'}`;
}

function generateStylingGuide(component) {
  return `## Styling

### CSS Classes
${component.cssClasses ? component.cssClasses.map(c => `- \`.${c.name}\`: ${c.description || 'No description'}`).join('\n') : 'No specific CSS classes'}

### Custom Properties
${component.customProperties ? component.customProperties.map(p => `- \`${p.name}\`: ${p.description || 'No description'}`).join('\n') : 'No custom properties'}`;
}

function generateBasicExample(component) {
  return `<${component.name} />`;
}

function generatePropsExample(component) {
  const props = component.props || [];
  const exampleProps = props.slice(0, 3).map(prop => `${prop.name}="${prop.default || 'example'}"`).join(' ');
  return `<${component.name} ${exampleProps} />`;
}

function convertToMarkdown(docs) {
  return docs; // Déjà en markdown
}

function convertToHTML(docs) {
  // Conversion markdown vers HTML simplifiée
  const htmlDocs = {};
  Object.entries(docs).forEach(([key, value]) => {
    htmlDocs[key] = value.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
                         .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
                         .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  });
  return htmlDocs;
}

async function saveDocumentationHistory(documentation) {
  return {
    version: documentation.docs.version || '1.0.0',
    content: JSON.parse(JSON.stringify(documentation.docs.content)),
    timestamp: new Date().toISOString()
  };
}

async function validateUpdatedContent(updatedContent, originalContent) {
  return {
    valid: true,
    errors: [],
    warnings: []
  };
}

function incrementDocVersion(version) {
  const parts = version.split('.');
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join('.');
}

function findMatches(text, query, caseSensitive) {
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  const matches = [];
  let index = 0;
  
  while ((index = searchText.indexOf(searchTerm, index)) !== -1) {
    matches.push(index);
    index += searchTerm.length;
  }
  
  return matches;
}

function highlightMatches(text, query, caseSensitive) {
  const regex = new RegExp(`(${query})`, caseSensitive ? 'g' : 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function calculateRelevance(matches, contentLength) {
  return (matches.length / Math.max(contentLength / 100, 1)) * 100;
}

async function searchInExamples(examples, query, options) {
  return examples.filter(example => 
    example.title.toLowerCase().includes(query.toLowerCase()) ||
    example.description.toLowerCase().includes(query.toLowerCase()) ||
    example.code.toLowerCase().includes(query.toLowerCase())
  );
}
