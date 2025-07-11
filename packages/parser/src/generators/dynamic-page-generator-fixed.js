const fs = require('fs');
const path = require('path');

class DynamicPageGeneratorFixed {
  constructor(jsonProject, outputPath) {
    this.jsonProject = jsonProject;
    this.outputPath = outputPath;
    this.contentSchema = jsonProject.contentSchema || {};
  }

  generateDynamicPages() {
    console.log('��� Génération pages dynamiques avec services...');
    
    // IMPORTANT: Écraser les pages statiques par des dynamiques
    this.generateDynamicHomePage();
    this.generateDynamicServicesPage();
    this.generateDynamicContactPage();
    
    console.log('✅ Pages dynamiques avec services générées');
  }

  generateDynamicHomePage() {
    const homeContent = `import { useState, useEffect } from 'react';

export default function Home({ initialContent }) {
  const [content, setContent] = useState(initialContent);

  const company = content?.company || {};
  const services = content?.services || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
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
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">
              {company.name || 'Nom de votre entreprise'}
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {company.description || 'Description de votre entreprise'}
            </p>
            <div className="space-x-4">
              <a className="bg-white text-red-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block" href="/contact">
                Demander un devis
              </a>
            </div>
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {services.title || 'Nos Services'}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {services.description || 'Découvrez notre gamme complète de services'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">���</div>
                <h3 className="text-xl font-semibold mb-3">
                  {services.service1_title || 'Service 1'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {services.service1_description || 'Description service 1'}
                </p>
                <p className="font-semibold text-red-500">
                  {services.service1_price || 'Tarif sur demande'}
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">���</div>
                <h3 className="text-xl font-semibold mb-3">
                  {services.service2_title || 'Service 2'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {services.service2_description || 'Description service 2'}
                </p>
                <p className="font-semibold text-red-500">
                  {services.service2_price || 'Tarif sur demande'}
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-3">
                  {services.service3_title || 'Service 3'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {services.service3_description || 'Description service 3'}
                </p>
                <p className="font-semibold text-red-500">
                  {services.service3_price || 'Tarif sur demande'}
                </p>
              </div>
            </div>
            <div className="text-center mt-10">
              <a className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors inline-block" href="/services">
                Voir tous nos services
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
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
                <li>{services.service1_title || 'Service 1'}</li>
                <li>{services.service2_title || 'Service 2'}</li>
                <li>{services.service3_title || 'Service 3'}</li>
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

// CRITIQUE: getServerSideProps pour rendre la page dynamique
export async function getServerSideProps(context) {
  try {
    // URL absolue pour la requête interne
    const baseUrl = process.env.VERCEL_URL 
      ? \`https://\${process.env.VERCEL_URL}\`
      : 'http://localhost:3405';
    
    const response = await fetch(\`\${baseUrl}/api/content\`);
    const content = await response.json();
    
    console.log('Home SSR: Content loaded:', content);
    
    return {
      props: {
        initialContent: content
      }
    };
  } catch (error) {
    console.error('Home SSR Error:', error);
    
    // Fallback data
    return {
      props: {
        initialContent: {
          company: {
            name: 'Dubois Plomberie',
            description: 'Plombier professionnel à Saint-Étienne depuis 15 ans',
            phone: '04 77 XX XX XX',
            email: 'contact@dubois-plomberie.fr',
            address: '15 rue de la République, 42000 Saint-Étienne'
          },
          services: {
            title: 'Nos Services',
            description: 'Services professionnels',
            service1_title: 'Service 1',
            service1_description: 'Description 1',
            service1_price: 'Prix 1'
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
    console.log('��� Page d\'accueil dynamique avec services générée');
  }

  generateDynamicServicesPage() {
    const servicesContent = `import { useState, useEffect } from 'react';

export default function Services({ initialContent }) {
  const [content, setContent] = useState(initialContent);
  
  const company = content?.company || {};
  const services = content?.services || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {services.title || 'Nos Services'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {services.description || 'Découvrez notre expertise professionnelle'}
            </p>
          </div>
          
          {/* Services détaillés */}
          <div className="grid md:grid-cols-1 gap-12 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-6">���</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {services.service1_title || 'Service 1'}
                  </h2>
                  <p className="text-red-500 font-semibold text-lg">
                    {services.service1_price || 'Tarif sur demande'}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {services.service1_description || 'Description détaillée du service 1'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-6">���</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {services.service2_title || 'Service 2'}
                  </h2>
                  <p className="text-red-500 font-semibold text-lg">
                    {services.service2_price || 'Tarif sur demande'}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {services.service2_description || 'Description détaillée du service 2'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-6">⚙️</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {services.service3_title || 'Service 3'}
                  </h2>
                  <p className="text-red-500 font-semibold text-lg">
                    {services.service3_price || 'Tarif sur demande'}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {services.service3_description || 'Description détaillée du service 3'}
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a className="bg-red-500 text-white px-8 py-4 rounded-lg hover:bg-red-600 transition-colors inline-block text-lg font-semibold" href="/contact">
              Demander un devis gratuit
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
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
    const baseUrl = process.env.VERCEL_URL 
      ? \`https://\${process.env.VERCEL_URL}\`
      : 'http://localhost:3405';
    
    const response = await fetch(\`\${baseUrl}/api/content\`);
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
          company: { name: 'Entreprise' },
          services: { title: 'Services' }
        }
      }
    };
  }
}`;

    fs.writeFileSync(
      path.join(this.outputPath, 'pages/services.js'),
      servicesContent
    );
    console.log('��� Page services dynamique avec services détaillés générée');
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
        <div className="container mx-auto px-4">
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

      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contactez-nous</h1>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Nos coordonnées</h2>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4 text-red-500">���</span>
                    <div>
                      <p className="font-semibold text-lg">Téléphone</p>
                      <p className="text-gray-600 text-lg">{company.phone || 'Téléphone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-3xl mr-4 text-red-500">✉️</span>
                    <div>
                      <p className="font-semibold text-lg">Email</p>
                      <p className="text-gray-600 text-lg">{company.email || 'Email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-3xl mr-4 text-red-500">���</span>
                    <div>
                      <p className="font-semibold text-lg">Adresse</p>
                      <p className="text-gray-600 text-lg">{company.address || 'Adresse'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6">Envoyez-nous un message</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" rows="5"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-red-500 text-white py-3 px-6 rounded-md hover:bg-red-600 transition-colors font-semibold text-lg">
                    Envoyer le message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
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
    const baseUrl = process.env.VERCEL_URL 
      ? \`https://\${process.env.VERCEL_URL}\`
      : 'http://localhost:3405';
    
    const response = await fetch(\`\${baseUrl}/api/content\`);
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
          company: { name: 'Entreprise' }
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
}

module.exports = DynamicPageGeneratorFixed;
