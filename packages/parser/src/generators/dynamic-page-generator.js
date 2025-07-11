const fs = require('fs');
const path = require('path');

class DynamicPageGenerator {
  constructor(jsonProject, outputPath) {
    this.jsonProject = jsonProject;
    this.outputPath = outputPath;
    this.contentSchema = jsonProject.contentSchema || {};
  }

  generateDynamicPages() {
    console.log('��� Génération pages dynamiques (lecture API content)...');
    
    // Générer pages qui lisent depuis l'API
    this.generateDynamicHomePage();
    this.generateDynamicContactPage();
    this.generateDynamicServicesPage();
    
    console.log('✅ Pages dynamiques générées');
  }

  generateDynamicHomePage() {
    const homeContent = `import { useState, useEffect } from 'react';

export default function Home({ initialContent }) {
  const [content, setContent] = useState(initialContent);

  // Optionnel : refresh périodique du contenu
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/content');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Erreur refresh contenu:', error);
      }
    }, 30000); // Refresh toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const company = content?.company || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <a className="text-2xl font-bold text-red-500" href="/">
              {company.name || 'Nom entreprise'}
            </a>
            <nav className="hidden md:flex space-x-8">
              <a className="transition-colors text-red-500 font-medium" href="/">Accueil</a>
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/services">Services</a>
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/contact">Contact</a>
            </nav>
            <div className="hidden md:block">
              <a href={\`tel:\${company.phone}\`} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                {company.phone || 'Téléphone'}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-red-500 text-white py-20">
          <div className="container text-center">
            <h1 className="text-5xl font-bold mb-6">
              {company.name || 'Nom de votre entreprise'}
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {company.description || 'Description de votre entreprise'}
            </p>
            <div className="space-x-4">
              <a className="bg-white text-red-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" href="/contact">
                Demander un devis
              </a>
            </div>
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Découvrez notre gamme complète de services</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">���</div>
                <h3 className="text-xl font-semibold mb-3">Dépannage d'urgence</h3>
                <p className="text-gray-600">Intervention rapide 24h/24 pour tous vos problèmes</p>
              </div>
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">���</div>
                <h3 className="text-xl font-semibold mb-3">Installation sanitaire</h3>
                <p className="text-gray-600">Installation complète de salles de bain et cuisines</p>
              </div>
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-3">Rénovation plomberie</h3>
                <p className="text-gray-600">Rénovation complète de votre installation</p>
              </div>
            </div>
            <div className="text-center mt-10">
              <a className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors" href="/services">
                Voir tous nos services
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{company.name || 'Votre entreprise'}</h3>
              <p className="text-gray-400 mb-4">{company.description || 'Description entreprise'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>��� {company.phone || 'Téléphone'}</p>
                <p>✉️ {company.email || 'Email'}</p>
                <p>��� {company.address || 'Adresse'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Dépannage d'urgence</li>
                <li>Installation sanitaire</li>
                <li>Rénovation plomberie</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 {company.name || 'Votre entreprise'}. Tous droits réservés.</p>
            <p className="mt-2 text-sm">Site créé avec <span className="text-red-500">BuzzCraft</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Récupération du contenu côté serveur
export async function getServerSideProps() {
  try {
    // En production, cette URL sera relative au domaine du site
    const response = await fetch('http://localhost:3403/api/content');
    const content = await response.json();
    
    return {
      props: {
        initialContent: content
      }
    };
  } catch (error) {
    console.error('Erreur récupération contenu:', error);
    
    // Fallback avec données par défaut
    return {
      props: {
        initialContent: {
          company: {
            name: 'Dubois Plomberie',
            description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
            phone: '04 77 XX XX XX',
            email: 'contact@dubois-plomberie.fr',
            address: '15 rue de la République, 42000 Saint-Étienne'
          }
        }
      }
    };
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/index.js'),
      homeContent
    );
    console.log('��� Page d\'accueil dynamique générée');
  }

  generateDynamicContactPage() {
    const contactContent = `import { useState, useEffect } from 'react';

export default function Contact({ initialContent }) {
  const [content, setContent] = useState(initialContent);

  const company = content?.company || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <a className="text-2xl font-bold text-red-500" href="/">
              {company.name || 'Nom entreprise'}
            </a>
            <nav className="hidden md:flex space-x-8">
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/">Accueil</a>
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/services">Services</a>
              <a className="transition-colors text-red-500 font-medium" href="/contact">Contact</a>
            </nav>
            <div className="hidden md:block">
              <a href={\`tel:\${company.phone}\`} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                {company.phone || 'Téléphone'}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contactez-nous</h1>
            
            <div className="grid md:grid-cols-2 gap-12">
              {/* Informations de contact */}
              <div>
                <h2 className="text-2xl font-semibold mb-6">Nos coordonnées</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">���</span>
                    <div>
                      <p className="font-semibold">Téléphone</p>
                      <p className="text-gray-600">{company.phone || 'Téléphone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">✉️</span>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-600">{company.email || 'Email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">���</span>
                    <div>
                      <p className="font-semibold">Adresse</p>
                      <p className="text-gray-600">{company.address || 'Adresse'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire de contact */}
              <div>
                <h2 className="text-2xl font-semibold mb-6">Envoyez-nous un message</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="4"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
                    Envoyer le message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="text-center text-gray-400">
            <p>© 2025 {company.name || 'Votre entreprise'}. Tous droits réservés.</p>
            <p className="mt-2 text-sm">Site créé avec <span className="text-red-500">BuzzCraft</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await fetch('http://localhost:3403/api/content');
    const content = await response.json();
    
    return {
      props: {
        initialContent: content
      }
    };
  } catch (error) {
    return {
      props: {
        initialContent: {
          company: {
            name: 'Dubois Plomberie',
            description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
            phone: '04 77 XX XX XX',
            email: 'contact@dubois-plomberie.fr',
            address: '15 rue de la République, 42000 Saint-Étienne'
          }
        }
      }
    };
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/contact.js'),
      contactContent
    );
    console.log('��� Page contact dynamique générée');
  }

  generateDynamicServicesPage() {
    // Similaire pour la page services...
    const servicesContent = `import { useState, useEffect } from 'react';

export default function Services({ initialContent }) {
  const [content, setContent] = useState(initialContent);
  const company = content?.company || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header identique */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <a className="text-2xl font-bold text-red-500" href="/">
              {company.name || 'Nom entreprise'}
            </a>
            <nav className="hidden md:flex space-x-8">
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/">Accueil</a>
              <a className="transition-colors text-red-500 font-medium" href="/services">Services</a>
              <a className="transition-colors text-gray-700 hover:text-red-500" href="/contact">Contact</a>
            </nav>
            <div className="hidden md:block">
              <a href={\`tel:\${company.phone}\`} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                {company.phone || 'Téléphone'}
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-16">
        <div className="container">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Nos Services</h1>
          <p className="text-center text-gray-600 mb-12">Services de qualité professionnelle</p>
          
          {/* Services grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">���</div>
              <h3 className="text-xl font-semibold mb-3">Dépannage d'urgence</h3>
              <p className="text-gray-600 mb-4">Intervention rapide 24h/24</p>
              <p className="font-semibold text-red-500">À partir de 80€</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">���</div>
              <h3 className="text-xl font-semibold mb-3">Installation</h3>
              <p className="text-gray-600 mb-4">Installation complète</p>
              <p className="font-semibold text-red-500">Devis gratuit</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-3">Rénovation</h3>
              <p className="text-gray-600 mb-4">Rénovation complète</p>
              <p className="font-semibold text-red-500">Sur mesure</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="text-center text-gray-400">
            <p>© 2025 {company.name || 'Votre entreprise'}. Tous droits réservés.</p>
            <p className="mt-2 text-sm">Site créé avec <span className="text-red-500">BuzzCraft</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await fetch('http://localhost:3403/api/content');
    const content = await response.json();
    
    return {
      props: {
        initialContent: content
      }
    };
  } catch (error) {
    return {
      props: {
        initialContent: {
          company: {
            name: 'Dubois Plomberie',
            description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
            phone: '04 77 XX XX XX',
            email: 'contact@dubois-plomberie.fr',
            address: '15 rue de la République, 42000 Saint-Étienne'
          }
        }
      }
    };
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/services.js'),
      servicesContent
    );
    console.log('��� Page services dynamique générée');
  }
}

module.exports = DynamicPageGenerator;
