const fs = require('fs-extra')
const path = require('path')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default

class ReactToJsonParser {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      ...options
    }
  }

  async parseProject(projectPath) {
    try {
      const startTime = Date.now()
      this.log('í´ Starting React â†’ JSON parsing...')
      
      const metadata = await this.loadBuzzCraftMetadata(projectPath)
      const config = await this.extractConfig(projectPath)
      const structure = await this.extractStructure(projectPath)
      const contentSchema = await this.extractContentSchema(projectPath)
      
      const jsonProject = {
        meta: metadata.meta,
        config,
        structure,
        contentSchema
      }
      
      const duration = Date.now() - startTime
      this.log(`âœ… React â†’ JSON parsing completed in ${duration}ms`)
      
      return {
        success: true,
        jsonProject,
        duration,
        stats: {
          pages: Object.keys(structure.pages || {}).length
        }
      }
    } catch (error) {
      this.log(`âŒ React â†’ JSON parsing failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        stack: error.stack
      }
    }
  }

  async loadBuzzCraftMetadata(projectPath) {
    const metadataPath = path.join(projectPath, 'buzzcraft.json')
    
    if (!await fs.pathExists(metadataPath)) {
      throw new Error('buzzcraft.json not found - not a BuzzCraft generated project')
    }
    
    const buzzcraft = await fs.readJson(metadataPath)
    this.log(`í³‹ Loaded metadata: ${buzzcraft.projectId}`)
    
    const meta = {
      projectId: buzzcraft.projectId,
      version: buzzcraft.version || '1.0.0',
      title: await this.extractTitleFromHeader(projectPath),
      description: await this.extractDescriptionFromPage(projectPath),
      created: buzzcraft.generated,
      lastModified: buzzcraft.generated,
      author: 'BUZZCRAFT',
      buzzcraft_version: buzzcraft.buzzcraft?.version || '1.0.0'
    }
    
    return { meta, buzzcraft }
  }

  /**
   * FIXED: Extract title from Header.js - correct AST traversal
   */
  async extractTitleFromHeader(projectPath) {
    const headerPath = path.join(projectPath, 'components/Layout/Header.js')
    
    if (!await fs.pathExists(headerPath)) {
      return 'Site Web'
    }
    
    const code = await fs.readFile(headerPath, 'utf8')
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    })
    
    let title = 'Site Web'
    let foundInLink = false
    
    traverse(ast, {
      JSXElement(path) {
        // Look for Link component with href="/"
        if (path.node.openingElement.name.name === 'Link') {
          const href = path.node.openingElement.attributes.find(attr => 
            attr.name && attr.name.name === 'href' && 
            attr.value && attr.value.value === '/'
          )
          
          if (href && !foundInLink) {
            // Get the text content inside this Link
            path.traverse({
              JSXText(textPath) {
                const text = textPath.node.value.trim()
                if (text && text.length > 0) {
                  title = text
                  foundInLink = true
                  textPath.stop() // Stop after finding the first text
                }
              }
            })
          }
        }
      }
    })
    
    this.log(`í¿·ï¸ Extracted title: "${title}"`)
    return title
  }

  /**
   * FIXED: Extract description from index.js - correct meta tag parsing
   */
  async extractDescriptionFromPage(projectPath) {
    const indexPath = path.join(projectPath, 'pages/index.js')
    
    if (!await fs.pathExists(indexPath)) {
      return 'Description entreprise'
    }
    
    const code = await fs.readFile(indexPath, 'utf8')
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    })
    
    let description = 'Description entreprise'
    
    traverse(ast, {
      JSXElement(path) {
        // Look for meta tag with name="description"
        if (path.node.openingElement.name.name === 'meta') {
          const nameAttr = path.node.openingElement.attributes.find(attr =>
            attr.name && attr.name.name === 'name' &&
            attr.value && attr.value.value === 'description'
          )
          
          if (nameAttr) {
            const contentAttr = path.node.openingElement.attributes.find(attr =>
              attr.name && attr.name.name === 'content'
            )
            
            if (contentAttr && contentAttr.value && contentAttr.value.value) {
              description = contentAttr.value.value
            }
          }
        }
      }
    })
    
    this.log(`í³ Extracted description: "${description}"`)
    return description
  }

  async extractConfig(projectPath) {
    const tailwindPath = path.join(projectPath, 'tailwind.config.js')
    
    let config = {
      domain: 'example.com'
    }
    
    if (await fs.pathExists(tailwindPath)) {
      const tailwindCode = await fs.readFile(tailwindPath, 'utf8')
      
      const colorMatches = {
        primary: tailwindCode.match(/primary:\s*['"`]([^'"`]+)['"`]/),
        secondary: tailwindCode.match(/secondary:\s*['"`]([^'"`]+)['"`]/),
        accent: tailwindCode.match(/accent:\s*['"`]([^'"`]+)['"`]/)
      }
      
      const colors = {}
      Object.keys(colorMatches).forEach(key => {
        if (colorMatches[key]) {
          colors[key] = colorMatches[key][1]
        }
      })
      
      if (Object.keys(colors).length > 0) {
        config.colors = colors
      }
    }
    
    return config
  }

  async extractStructure(projectPath) {
    const pagesDir = path.join(projectPath, 'pages')
    
    if (!await fs.pathExists(pagesDir)) {
      throw new Error('Pages directory not found')
    }
    
    const pageFiles = await fs.readdir(pagesDir)
    const jsPages = pageFiles.filter(file => 
      file.endsWith('.js') && 
      !file.startsWith('_') && 
      !file.includes('api')
    )
    
    const pages = {}
    
    for (const pageFile of jsPages) {
      const pageName = pageFile === 'index.js' ? 'home' : pageFile.replace('.js', '')
      const route = pageName === 'home' ? '/' : `/${pageName}`
      
      pages[pageName] = {
        route,
        modules: []
      }
    }
    
    return { pages }
  }

  async extractContentSchema(projectPath) {
    return {}
  }

  log(message) {
    if (this.options.verbose) {
      console.log(message)
    }
  }
}

module.exports = ReactToJsonParser
