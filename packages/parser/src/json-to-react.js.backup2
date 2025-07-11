const AdminGenerator = require("./generators/admin-generator");
const fs = require('fs-extra')
const path = require('path')

class JsonToReactParser {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './output',
      verbose: options.verbose || false,
      ...options
    }
  }

  async parseProject(jsonProject, outputPath = null) {
    try {
      const startTime = Date.now()
      this.log('Ì∫Ä Starting JSON ‚Üí React parsing...')
      
      const projectPath = outputPath || path.join(this.options.outputDir, jsonProject.meta.projectId)
      
      await this.prepareProjectStructure(projectPath)
      await this.generatePackageJson(jsonProject, projectPath)
      await this.generateConfigs(jsonProject, projectPath)
      await this.generatePages(jsonProject.structure.pages, projectPath, jsonProject)
      await this.generateComponents(jsonProject, projectPath)
      await this.generateStyles(jsonProject, projectPath)
      await this.generateBuzzCraftMetadata(jsonProject, projectPath)
      
      const duration = Date.now() - startTime
      this.log(`‚úÖ Parsing completed in ${duration}ms`)
      
      return {
        success: true,
        projectPath,
        duration,
        files: await this.listGeneratedFiles(projectPath),
        stats: await this.getProjectStats(projectPath)
      }
    } catch (error) {
      this.log(`‚ùå Parsing failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        stack: error.stack
      }
    }
  }

  async prepareProjectStructure(projectPath) {
    this.log(`Ì≥Å Creating project structure: ${projectPath}`)
    
    const directories = [
      'pages', 'pages/api', 'components', 'components/Layout', 
      'components/Modules', 'lib', 'styles', 'public'
    ]
    
    if (await fs.pathExists(projectPath)) {
      await fs.remove(projectPath)
    }
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir))
    }
  }

  async generatePackageJson(jsonProject, projectPath) {
    this.log('Ì≥¶ Generating package.json...')
    
    // FIXED: Extract from meta instead of contentSchema
    const companyName = jsonProject.meta.title || jsonProject.meta.projectId
    
    const packageJson = {
      name: jsonProject.meta.projectId,
      version: jsonProject.meta.version || '1.0.0',
      private: true,
      description: `Site g√©n√©r√© par BuzzCraft - ${companyName}`,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.1.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        autoprefixer: '^10.4.17',
        eslint: '^8.56.0',
        'eslint-config-next': '^14.1.0',
        postcss: '^8.4.33',
        tailwindcss: '^3.4.1'
      },
      buzzcraft: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        originalProject: `${jsonProject.meta.projectId}.json`
      }
    }
    
    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 })
  }

  async generateConfigs(jsonProject, projectPath) {
    this.log('‚öôÔ∏è Generating configs...')
    
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false
}

module.exports = nextConfig
`
    
    const colors = jsonProject.config?.colors || {}
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${colors.primary || '#3B82F6'}',
        secondary: '${colors.secondary || '#EF4444'}',
        accent: '${colors.accent || '#10B981'}',
      },
    },
  },
  plugins: [],
}
`
    
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    
    await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig)
    await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)
    await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig)
  }

  async generatePages(pages, projectPath, jsonProject) {
    this.log('Ì≥Ñ Generating pages...')
    
    // FIXED: Extract real content from meta
    const companyName = jsonProject.meta.title || 'Entreprise'
    const companyDescription = jsonProject.meta.description || 'Description entreprise'
    const siteTitle = companyName
    
    for (const [pageName, pageData] of Object.entries(pages)) {
      await this.generatePage(pageName, pageData, projectPath, jsonProject, {
        companyName,
        companyDescription, 
        siteTitle
      })
    }
  }

  async generatePage(pageName, pageData, projectPath, jsonProject, contentData) {
    const fileName = pageName === 'home' ? 'index.js' : `${pageName}.js`
    
    const meta = pageData.meta || {}
    const title = meta.title ? 
      this.replaceVariables(meta.title, contentData) : 
      `${this.capitalize(pageName)} - ${contentData.siteTitle}`
    
    // Generate real modules JSX from structure
    const moduleJSX = this.generateModulesJSX(pageData.modules || [], contentData)
    
    const pageContent = `import Head from 'next/head'
import Layout from '../components/Layout/Layout'

export default function ${this.pascalCase(pageName)}Page() {
  return (
    <Layout>
      <Head>
        <title>${title}</title>
        <meta name="description" content="${meta.description || contentData.companyDescription}" />
      </Head>
      
      <main className="min-h-screen">
${moduleJSX}
      </main>
    </Layout>
  )
}
`
    
    await fs.writeFile(path.join(projectPath, 'pages', fileName), pageContent)
  }

  generateModulesJSX(modules, contentData) {
    if (!modules || modules.length === 0) {
      return `        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-primary mb-8">
            ${contentData.companyName}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            ${contentData.companyDescription}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">Ìæâ Site g√©n√©r√© par BuzzCraft !</h2>
            <p className="text-blue-700">
              Ce site a √©t√© automatiquement g√©n√©r√© depuis un fichier JSON en quelques millisecondes.
              Architecture Next.js optimis√©e, Tailwind CSS, et code de qualit√© professionnelle.
            </p>
          </div>
        </div>`
    }

    return modules.map(module => {
      return this.generateModuleJSX(module, 2, contentData)
    }).join('\n')
  }

  generateModuleJSX(module, indent = 0, contentData) {
    const spaces = '  '.repeat(indent + 4)
    const tag = module.tag || 'section'
    const className = module.className || ''
    
    if (module.children && module.children.length > 0) {
      const childrenJSX = module.children.map(child => 
        this.generateModuleJSX(child, indent + 1, contentData)
      ).join('\n')
      
      return `${spaces}<${tag}${className ? ` className="${className}"` : ''}>
${childrenJSX}
${spaces}</${tag}>`
    } else {
      let content = module.content || ''
      content = this.replaceVariables(content, contentData)
      
      return `${spaces}<${tag}${className ? ` className="${className}"` : ''}>${content}</${tag}>`
    }
  }

  async generateComponents(jsonProject, projectPath) {
    this.log('Ì∑© Generating components...')
    
    // FIXED: Extract from meta
    const companyName = jsonProject.meta.title || 'Site Web'
    const siteTitle = companyName
    
    const layoutContent = `import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
`

    const headerContent = `import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            ${siteTitle}
          </Link>
          <div className="space-x-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Accueil
            </Link>
            <Link href="/services" className="hover:text-accent transition-colors">
              Services
            </Link>
            <Link href="/contact" className="hover:text-accent transition-colors">
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
`

    const footerContent = `export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} ${siteTitle}. Tous droits r√©serv√©s.</p>
        <p className="text-sm text-gray-400 mt-2">Site cr√©√© avec BuzzCraft</p>
      </div>
    </footer>
  )
}
`
    
    await fs.writeFile(path.join(projectPath, 'components/Layout/Layout.js'), layoutContent)
    await fs.writeFile(path.join(projectPath, 'components/Layout/Header.js'), headerContent)
    await fs.writeFile(path.join(projectPath, 'components/Layout/Footer.js'), footerContent)
  }

  async generateStyles(jsonProject, projectPath) {
    this.log('Ìæ® Generating styles...')
    
    const globalStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

.container {
  @apply max-w-7xl mx-auto;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-bold;
}

.btn {
  @apply px-6 py-3 rounded-lg font-semibold transition-colors;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-primary/90;
}
`
    
    await fs.writeFile(path.join(projectPath, 'styles/globals.css'), globalStyles)
  }

  async generateBuzzCraftMetadata(jsonProject, projectPath) {
    this.log('Ì≥ã Generating metadata...')
    
    const metadata = {
      projectId: jsonProject.meta.projectId,
      version: jsonProject.meta.version,
      generated: new Date().toISOString(),
      buzzcraft: {
        version: '1.0.0',
        parser: 'json-to-react',
        originalFile: `${jsonProject.meta.projectId}.json`
      }
    }
    
    await fs.writeJson(path.join(projectPath, 'buzzcraft.json'), metadata, { spaces: 2 })
  }

  replaceVariables(text, contentData) {
    if (!text) return text
    
    return text
      .replace(/\{\{company\.name\}\}/g, contentData.companyName)
      .replace(/\{\{company\.description\}\}/g, contentData.companyDescription)
      .replace(/\{\{site\.title\}\}/g, contentData.siteTitle)
  }

  async listGeneratedFiles(projectPath) {
    const files = []
    
    async function scanDir(dir, basePath = '') {
      const items = await fs.readdir(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const relativePath = path.join(basePath, item)
        const stat = await fs.stat(fullPath)
        
        if (stat.isDirectory()) {
          await scanDir(fullPath, relativePath)
        } else {
          files.push(relativePath)
        }
      }
    }
    
    await scanDir(projectPath)
    return files.sort()
  }

  async getProjectStats(projectPath) {
    const files = await this.listGeneratedFiles(projectPath)
    
    return {
      totalFiles: files.length,
      pages: files.filter(f => f.startsWith('pages/') && f.endsWith('.js')).length,
      components: files.filter(f => f.startsWith('components/') && f.endsWith('.js')).length,
      configs: files.filter(f => f.endsWith('.config.js')).length
    }
  }

  log(message) {
    if (this.options.verbose) {
      console.log(message)
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  pascalCase(str) {
    return str.split(/[-_]/).map(this.capitalize).join('')
  }
}

module.exports = JsonToReactParser
