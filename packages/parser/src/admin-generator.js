const fs = require('fs').promises;
const path = require('path');

class AdminGenerator {
  constructor() {
    this.contentFields = [];
    this.projectData = null;
  }

  async generateAdminSystem(jsonProject, outputPath) {
    this.projectData = jsonProject;
    
    console.log('ÌæõÔ∏è G√©n√©ration syst√®me admin...');
    
    // 1. Analyser contentSchema pour g√©n√©rer interface
    this.analyzeContentSchema(jsonProject.contentSchema);
    
    // 2. Cr√©er structure admin
    await this.createAdminStructure(outputPath);
    
    // 3. G√©n√©rer interface admin
    await this.generateAdminInterface(outputPath);
    
    // 4. G√©n√©rer API content
    await this.generateContentAPI(outputPath);
    
    // 5. Modifier pages existantes pour utiliser content dynamique
    await this.updatePagesForDynamicContent(outputPath);
    
    // 6. G√©n√©rer syst√®me de persistance
    await this.generateContentPersistence(outputPath);
    
    console.log('‚úÖ Syst√®me admin g√©n√©r√©');
  }

  analyzeContentSchema(contentSchema) {
    this.contentFields = [];
    
    Object.keys(contentSchema).forEach(entity => {
      Object.keys(contentSchema[entity]).forEach(field => {
        const fieldDef = contentSchema[entity][field];
        this.contentFields.push({
          entity,
          field,
          type: fieldDef.type,
          label: fieldDef.label,
          required: fieldDef.required || false,
          default: fieldDef.default || ''
        });
      });
    });
    
    console.log(`Ì≥ä ${this.contentFields.length} champs √©ditables d√©tect√©s`);
  }

  async createAdminStructure(outputPath) {
    // Dossiers admin
    const adminDirs = [
      'pages/admin',
      'components/admin',
      'lib/content',
      'data'
    ];
    
    for (const dir of adminDirs) {
      await fs.mkdir(path.join(outputPath, dir), { recursive: true });
    }
  }

  async generateAdminInterface(outputPath) {
    console.log('Ìæ® G√©n√©ration interface admin...');
    
    // Page admin principale
    const adminPageContent = `import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';

export default function AdminDashboard() {
  const router = useRouter();
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/admin/content');
      const data = await response.json();
      setContent(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      
      if (response.ok) {
        setLastSaved(new Date());
        setHasChanges(false);
        
        // Notifier succ√®s
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = 'Contenu sauvegard√© avec succ√®s !';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleChange = (entity, field, value) => {
    setContent(prev => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const previewSite = () => {
    window.open('/', '_blank');
  };

  if (loading) {
    return (
      <Layout title="Administration - Chargement...">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du contenu...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administration - ${this.projectData.meta.title}">
      <div className="min-h-screen bg-gray-50">
        {/* Header admin */}
        <div className="bg-white border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                <p className="text-gray-600">Modifiez le contenu de votre site</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Derni√®re sauvegarde : {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                
                <button
                  onClick={previewSite}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Ì±ÅÔ∏è Voir le site
                </button>
                
                <button
                  onClick={saveContent}
                  disabled={saving || !hasChanges}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>Ì≤æ Sauvegarder</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu admin */}
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            ${this.generateFormSections()}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Protection admin (basique)
export async function getServerSideProps(context) {
  // TODO: Impl√©menter authentification admin
  // Pour l'instant, acc√®s libre en d√©veloppement
  return { props: {} };
}`;

    await fs.writeFile(path.join(outputPath, 'pages/admin/index.js'), adminPageContent);
  }

  generateFormSections() {
    const sections = {};
    
    // Grouper les champs par entit√©
    this.contentFields.forEach(field => {
      if (!sections[field.entity]) {
        sections[field.entity] = [];
      }
      sections[field.entity].push(field);
    });

    let formHTML = '';
    
    Object.keys(sections).forEach(entity => {
      const entityTitle = entity.charAt(0).toUpperCase() + entity.slice(1);
      
      formHTML += `
            {/* Section ${entityTitle} */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                Ì≥ù ${entityTitle}
              </h2>
              
              <div className="grid gap-6">`;
      
      sections[entity].forEach(field => {
        if (field.type === 'textarea') {
          formHTML += `
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ${field.label} ${field.required ? '*' : ''}
                  </label>
                  <textarea
                    rows="4"
                    value={content.${entity}?.${field.field} || ''}
                    onChange={(e) => handleChange('${entity}', '${field.field}', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="${field.default}"
                  />
                </div>`;
        } else {
          formHTML += `
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ${field.label} ${field.required ? '*' : ''}
                  </label>
                  <input
                    type="${field.type}"
                    value={content.${entity}?.${field.field} || ''}
                    onChange={(e) => handleChange('${entity}', '${field.field}', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="${field.default}"
                  />
                </div>`;
        }
      });
      
      formHTML += `
              </div>
            </div>`;
    });

    return formHTML;
  }

  async generateContentAPI(outputPath) {
    console.log('Ì¥ß G√©n√©ration API content...');
    
    // API admin/content
    const contentAPIContent = `import fs from 'fs';
import path from 'path';

// Fichier de persistance content (en production: vraie BDD)
const contentFilePath = path.join(process.cwd(), 'data', 'content.json');

// Donn√©es par d√©faut depuis contentSchema
const defaultContent = ${JSON.stringify(this.generateDefaultContent(), null, 2)};

function ensureDataDir() {
  const dataDir = path.dirname(contentFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadContent() {
  try {
    ensureDataDir();
    if (fs.existsSync(contentFilePath)) {
      const data = fs.readFileSync(contentFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lecture content:', error);
  }
  return defaultContent;
}

function saveContent(content) {
  try {
    ensureDataDir();
    fs.writeFileSync(contentFilePath, JSON.stringify(content, null, 2));
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde content:', error);
    return false;
  }
}

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const content = loadContent();
        res.status(200).json(content);
      } catch (error) {
        res.status(500).json({ error: 'Erreur chargement contenu' });
      }
      break;

    case 'PUT':
      try {
        const newContent = req.body;
        const saved = saveContent(newContent);
        
        if (saved) {
          // TODO: Trigger regeneration/reload du site principal
          console.log('Ì≥ù Contenu mis √† jour:', Object.keys(newContent));
          
          res.status(200).json({ 
            message: 'Contenu sauvegard√© avec succ√®s',
            timestamp: new Date().toISOString(),
            content: newContent 
          });
        } else {
          res.status(500).json({ error: 'Erreur sauvegarde' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Erreur traitement donn√©es' });
      }
      break;

    case 'POST':
      try {
        const { entity, field, value } = req.body;
        const content = loadContent();
        
        if (!content[entity]) {
          content[entity] = {};
        }
        content[entity][field] = value;
        
        const saved = saveContent(content);
        if (saved) {
          res.status(200).json({ 
            message: 'Champ mis √† jour',
            entity,
            field,
            value,
            content 
          });
        } else {
          res.status(500).json({ error: 'Erreur sauvegarde' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Erreur mise √† jour champ' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      res.status(405).end(\`Method \${method} Not Allowed\`);
  }
}`;

    await fs.writeFile(path.join(outputPath, 'pages/api/admin/content.js'), contentAPIContent);
    
    // API publique pour r√©cup√©rer content depuis les pages
    const publicContentAPI = `import fs from 'fs';
import path from 'path';

const contentFilePath = path.join(process.cwd(), 'data', 'content.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (fs.existsSync(contentFilePath)) {
      const data = fs.readFileSync(contentFilePath, 'utf8');
      const content = JSON.parse(data);
      res.status(200).json(content);
    } else {
      // Retourner donn√©es par d√©faut si fichier n'existe pas
      const defaultContent = ${JSON.stringify(this.generateDefaultContent(), null, 2)};
      res.status(200).json(defaultContent);
    }
  } catch (error) {
    console.error('Erreur API content:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}`;

    await fs.writeFile(path.join(outputPath, 'pages/api/content.js'), publicContentAPI);
  }

  generateDefaultContent() {
    const defaultContent = {};
    
    this.contentFields.forEach(field => {
      if (!defaultContent[field.entity]) {
        defaultContent[field.entity] = {};
      }
      defaultContent[field.entity][field.field] = field.default;
    });
    
    return defaultContent;
  }

  async updatePagesForDynamicContent(outputPath) {
    console.log('Ì¥Ñ Mise √† jour pages pour contenu dynamique...');
    
    // Hook React pour charger le contenu
    const useContentHook = `import { useState, useEffect } from 'react';

export function useContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch('/api/content');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Erreur chargement contenu:', error);
        // Utiliser donn√©es par d√©faut en cas d'erreur
        setContent(${JSON.stringify(this.generateDefaultContent(), null, 2)});
      }
      setLoading(false);
    }

    fetchContent();
  }, []);

  return { content, loading };
}

export default useContent;`;

    await fs.writeFile(path.join(outputPath, 'lib/content/useContent.js'), useContentHook);
    
    // Mettre √† jour Header pour utiliser contenu dynamique
    await this.updateHeaderWithDynamicContent(outputPath);
  }

  async updateHeaderWithDynamicContent(outputPath) {
    const dynamicHeader = `import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContent } from '../../lib/content/useContent';

export default function Header() {
  const router = useRouter();
  const { content, loading } = useContent();
  
  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' }
  ];

  // Donn√©es par d√©faut pendant le chargement
  const companyName = loading ? '${this.projectData.contentSchema.company.name.default}' : (content?.company?.name || '${this.projectData.contentSchema.company.name.default}');
  const companyPhone = loading ? '${this.projectData.contentSchema.company.phone.default}' : (content?.company?.phone || '${this.projectData.contentSchema.company.phone.default}');

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            {companyName}
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={\`transition-colors \${
                  router.pathname === item.href
                    ? 'text-primary font-medium'
                    : 'text-gray-700 hover:text-primary'
                }\`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Lien admin (visible uniquement en dev) */}
            {process.env.NODE_ENV === 'development' && (
              <Link
                href="/admin"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                ÌæõÔ∏è Admin
              </Link>
            )}
          </nav>
          
          <div className="hidden md:block">
            <a
              href={\`tel:\${companyPhone.replace(/\\s/g, '')}\`}
              className="btn-primary"
            >
              {companyPhone}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}`;

    await fs.writeFile(path.join(outputPath, 'components/layout/Header.js'), dynamicHeader);
  }

  async generateContentPersistence(outputPath) {
    console.log('Ì≤æ G√©n√©ration syst√®me persistance...');
    
    // Cr√©er fichier content initial
    const initialContent = this.generateDefaultContent();
    
    await fs.mkdir(path.join(outputPath, 'data'), { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'data/content.json'),
      JSON.stringify(initialContent, null, 2)
    );
    
    console.log('‚úÖ Fichier content.json initial cr√©√©');
  }
}

module.exports = AdminGenerator;
