const DynamicPageGenerator = require("./dynamic-page-generator");
const fs = require('fs');
const path = require('path');

class AdminGenerator {
  constructor(jsonProject, outputPath) {
    this.jsonProject = jsonProject;
    this.outputPath = outputPath;
    this.contentSchema = jsonProject.contentSchema || {};
    this.projectId = jsonProject.meta?.projectId || 'unknown';
    console.log('��� AdminGenerator initialisé pour:', this.projectId);
  }

  generate() {
    console.log('��� Génération interface admin améliorée...');
    
    try {
      this.createAdminStructure();
      this.generateImprovedAdminInterface();
      this.generateAdminAPI();
      this.generateDatabaseConfig();
      this.updatePackageJson();
    // Génération pages dynamiques qui lisent lAPI
    const dynamicGen = new DynamicPageGenerator(this.jsonProject, this.outputPath);
    dynamicGen.generateDynamicPages();
      
      console.log('✅ Interface admin améliorée générée avec succès');
    } catch (error) {
      console.error('❌ Erreur génération admin:', error.message);
    }
  }

  createAdminStructure() {
    const adminDirs = [
      'pages/admin',
      'pages/api/admin', 
      'pages/api/content',
      'lib/database',
      'database'
    ];

    adminDirs.forEach(dir => {
      const fullPath = path.join(this.outputPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`��� Créé: ${dir}`);
      }
    });
  }

  generateImprovedAdminInterface() {
    const entities = Object.keys(this.contentSchema);
    
    const adminContent = `import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      setContent(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const updateContent = async (entity, field, value) => {
    setSaving(true);
    setMessage('��� Sauvegarde en cours...');
    
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, field, value })
      });
      
      if (response.ok) {
        setContent(prev => ({
          ...prev,
          [entity]: { ...prev[entity], [field]: value }
        }));
        setMessage('✅ Contenu mis à jour avec succès');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setMessage('❌ Erreur lors de la mise à jour');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement administration...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-600">Projet: ${this.projectId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="/" 
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              ��� Voir le site
            </a>
            <div className="text-sm text-gray-500">
              Créé avec <span className="font-semibold text-blue-600">BuzzCraft</span>
            </div>
          </div>
        </div>
      </header>
      
      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
          <p className="text-blue-700">{message}</p>
        </div>
      )}
      
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          ${entities.map(entity => this.generateEntityForm(entity)).join('\n          ')}
        </div>
      </main>
    </div>
  );
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/admin/index.js'),
      adminContent
    );
    console.log('��� Généré: interface admin avec formulaires');
  }

  generateEntityForm(entity) {
    const fields = this.contentSchema[entity];
    const fieldInputs = Object.entries(fields).map(([fieldName, fieldConfig]) => 
      this.generateFieldInput(entity, fieldName, fieldConfig)
    ).join('\n            ');

    return `{/* Section ${entity} */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">${entity}</h2>
              <p className="text-sm text-gray-600">Modifiez les informations ${entity}</p>
            </div>
            <div className="p-6 space-y-4">
              ${fieldInputs}
            </div>
          </div>`;
  }

  generateFieldInput(entity, fieldName, fieldConfig) {
    const inputType = fieldConfig.type === 'email' ? 'email' : 
                     fieldConfig.type === 'tel' ? 'tel' : 
                     fieldConfig.type === 'textarea' ? 'textarea' : 'text';
    
    if (inputType === 'textarea') {
      return `<div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ${fieldConfig.label} ${fieldConfig.required ? '*' : ''}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  defaultValue={content.${entity}?.${fieldName} || ''}
                  onBlur={(e) => updateContent('${entity}', '${fieldName}', e.target.value)}
                  placeholder="Saisissez ${fieldConfig.label.toLowerCase()}"
                />
              </div>`;
    }
    
    return `<div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ${fieldConfig.label} ${fieldConfig.required ? '*' : ''}
              </label>
              <input
                type="${inputType}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={content.${entity}?.${fieldName} || ''}
                onBlur={(e) => updateContent('${entity}', '${fieldName}', e.target.value)}
                placeholder="Saisissez ${fieldConfig.label.toLowerCase()}"
              />
            </div>`;
  }

  generateAdminAPI() {
    // API Content (lecture)
    const contentAPI = `export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Données de base du projet
      const mockContent = {
        company: {
          name: 'Dubois Plomberie',
          description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
          phone: '04 77 XX XX XX',
          email: 'contact@dubois-plomberie.fr',
          address: '15 rue de la République, 42000 Saint-Étienne'
        }
      };
      res.status(200).json(mockContent);
    } catch (error) {
      res.status(500).json({ error: 'Erreur récupération contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

    // API Admin (écriture)
    const adminAPI = `export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { entity, field, value } = req.body;
      
      // Log de la modification
      console.log('[ADMIN UPDATE]', {
        entity,
        field, 
        value,
        timestamp: new Date().toISOString()
      });
      
      // TODO: Sauvegarder en SQLite
      // Pour l'instant, on simule le succès
      
      res.status(200).json({ 
        success: true, 
        message: \`\${entity}.\${field} mis à jour\`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[ADMIN ERROR]', error);
      res.status(500).json({ error: 'Erreur mise à jour contenu' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/api/content/index.js'),
      contentAPI
    );
    
    fs.writeFileSync(
      path.join(this.outputPath, 'pages/api/admin/content.js'),
      adminAPI
    );
    
    console.log('��� Généré: API routes admin améliorées');
  }

  generateDatabaseConfig() {
    const dbConfig = `// Configuration SQLite - BuzzCraft Admin
// TODO: Implémenter SQLite avec better-sqlite3

const config = {
  dbPath: './database/content.db',
  tables: {
    content: \`
      CREATE TABLE IF NOT EXISTS content (
        entity TEXT,
        field TEXT,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (entity, field)
      )
    \`
  }
};

module.exports = config;`;

    fs.writeFileSync(
      path.join(this.outputPath, 'lib/database/index.js'),
      dbConfig
    );
    console.log('��� Généré: configuration database');
  }

  updatePackageJson() {
    try {
      const packageJsonPath = path.join(this.outputPath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      packageJson.dependencies = {
        ...packageJson.dependencies,
        'better-sqlite3': '^8.7.0'
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('��� Mis à jour: package.json');
    } catch (error) {
      console.error('❌ Erreur mise à jour package.json:', error.message);
    }
  }
}

module.exports = AdminGenerator;
