const fs = require('fs').promises;
const path = require('path');

class MultiPageGenerator {
  constructor() {
    this.projectData = null;
    this.outputPath = null;
  }

  async generateProject(jsonProject, outputPath) {
    this.projectData = jsonProject;
    this.outputPath = outputPath;
    
    console.log('Ì∫Ä G√©n√©ration site multi-pages...');
    
    await this.createProjectStructure();
    await this.generateConfigurations();
    await this.generateSharedComponents();
    await this.generateAllPages();
    await this.generateAPIRoutes();
    
    console.log('‚úÖ Site multi-pages g√©n√©r√©');
  }

  async createProjectStructure() {
    const dirs = [
      'pages', 'pages/api', 'components', 'components/layout',
      'lib', 'styles', 'public'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.outputPath, dir), { recursive: true });
    }
  }

  async generateConfigurations() {
    // Package.json
    const packageJson = {
      name: this.projectData.meta.projectId,
      version: this.projectData.meta.version,
      description: this.projectData.meta.description,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.2.30',
        react: '^18.3.1',
        'react-dom': '^18.3.1'
      },
      devDependencies: {
        autoprefixer: '^10.4.20',
        eslint: '^8.57.1',
        'eslint-config-next': '^14.2.30',
        postcss: '^8.4.47',
        tailwindcss: '^3.4.13'
      }
    };

    await fs.writeFile(
      path.join(this.outputPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Next.js config
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig;
`;

    await fs.writeFile(path.join(this.outputPath, 'next.config.js'), nextConfig);

    // Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${this.projectData.config.colors.primary}',
        secondary: '${this.projectData.config.colors.secondary}',
        accent: '${this.projectData.config.colors.accent}',
      },
    },
  },
  plugins: [],
};
`;

    await fs.writeFile(path.join(this.outputPath, 'tailwind.config.js'), tailwindConfig);

    // PostCSS
    const postCssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

    await fs.writeFile(path.join(this.outputPath, 'postcss.config.js'), postCssConfig);

    // Styles
    const globalStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors;
}
`;

    await fs.writeFile(path.join(this.outputPath, 'styles/globals.css'), globalStyles);
  }

  async generateSharedComponents() {
    // Header
    const companyName = this.projectData.contentSchema.company.name.default;
    const companyPhone = this.projectData.contentSchema.company.phone.default;
    
    const headerContent = `import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();
  
  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' }
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            ${companyName}
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
          </nav>
          
          <div className="hidden md:block">
            <a
              href="tel:${companyPhone.replace(/\s/g, '')}"
              className="btn-primary"
            >
              ${companyPhone}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'components/layout/Header.js'), headerContent);

    // Footer
    const companyDesc = this.projectData.contentSchema.company.description.default;
    const companyEmail = this.projectData.contentSchema.company.email.default;
    const companyAddress = this.projectData.contentSchema.company.address.default.replace('\n', ', ');
    
    const footerContent = `export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">${companyName}</h3>
            <p className="text-gray-400 mb-4">${companyDesc}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-gray-400">
              <p>Ì≥û ${companyPhone}</p>
              <p>‚úâÔ∏è ${companyEmail}</p>
              <p>Ì≥ç ${companyAddress}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li>D√©pannage d'urgence</li>
              <li>Installation sanitaire</li>
              <li>R√©novation plomberie</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 ${companyName}. Tous droits r√©serv√©s.</p>
          <p className="mt-2 text-sm">Site cr√©√© avec <span className="text-primary">BuzzCraft</span></p>
        </div>
      </div>
    </footer>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'components/layout/Footer.js'), footerContent);

    // Layout
    const layoutContent = `import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title, description }) {
  const siteTitle = title || '${this.projectData.meta.title}';
  const siteDescription = description || '${this.projectData.meta.description}';

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'components/layout/Layout.js'), layoutContent);
  }

  async generateAllPages() {
    const pages = this.projectData.structure.pages;
    
    for (const [pageKey, pageData] of Object.entries(pages)) {
      console.log('Ì≥Ñ G√©n√©ration page:', pageKey);
      
      if (pageKey === 'home') {
        await this.generateHomePage(pageData);
      } else if (pageKey === 'services') {
        await this.generateServicesPage(pageData);
      } else if (pageKey === 'contact') {
        await this.generateContactPage(pageData);
      }
    }
  }

  async generateHomePage(pageData) {
    const companyName = this.projectData.contentSchema.company.name.default;
    const companyDesc = this.projectData.contentSchema.company.description.default;
    const servicesTitle = this.projectData.contentSchema.services.title.default;
    const servicesDesc = this.projectData.contentSchema.services.description.default;
    
    const homeContent = `import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function Home() {
  const services = [
    {
      title: 'D√©pannage d\\'urgence',
      description: 'Intervention rapide 24h/24 pour tous vos probl√®mes',
      icon: 'Ì¥ß'
    },
    {
      title: 'Installation sanitaire',
      description: 'Installation compl√®te de salles de bain et cuisines',
      icon: 'Ì∫ø'
    },
    {
      title: 'R√©novation plomberie',
      description: 'R√©novation compl√®te de votre installation',
      icon: 'Ì¥®'
    }
  ];

  return (
    <Layout title="${companyName} - Accueil" description="${companyDesc}">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-6">${companyName}</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">${companyDesc}</p>
          <div className="space-x-4">
            <Link href="/contact" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">${servicesTitle}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">${servicesDesc}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link href="/services" className="btn-primary">
              Voir tous nos services
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'pages/index.js'), homeContent);
  }

  async generateServicesPage(pageData) {
    const servicesContent = `import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function Services() {
  const services = [
    {
      id: 1,
      title: 'D√©pannage d\\'urgence',
      description: 'Intervention rapide 24h/24 pour tous vos probl√®mes de plomberie.',
      price: '√Ä partir de 80‚Ç¨',
      features: ['Intervention rapide', 'Devis gratuit', 'Garantie travaux'],
      icon: 'Ì¥ß'
    },
    {
      id: 2,
      title: 'Installation sanitaire',
      description: 'Installation compl√®te de salles de bain, cuisines et WC.',
      price: 'Sur devis',
      features: ['Conseil personnalis√©', 'Mat√©riel de qualit√©', 'Pose professionnelle'],
      icon: 'Ì∫ø'
    },
    {
      id: 3,
      title: 'R√©novation plomberie',
      description: 'R√©novation compl√®te de votre installation de plomberie.',
      price: 'Sur devis',
      features: ['Diagnostic complet', 'Mise aux normes', 'Garantie 10 ans'],
      icon: 'Ì¥®'
    }
  ];

  return (
    <Layout title="Services - Dubois Plomberie" description="Services de plomberie professionnels">
      <section className="bg-primary text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold mb-4">Nos Services</h1>
          <p className="text-xl">D√©couvrez notre gamme compl√®te de services de plomberie</p>
        </div>
      </section>
        
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="text-lg font-semibold text-primary mb-4">{service.price}</div>
                
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <span className="text-green-500 mr-2">‚úì</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href="/contact" className="block w-full btn-primary text-center">
                  Demander un devis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'pages/services.js'), servicesContent);
  }

  async generateContactPage(pageData) {
    const companyPhone = this.projectData.contentSchema.company.phone.default;
    const companyEmail = this.projectData.contentSchema.company.email.default;
    const companyAddress = this.projectData.contentSchema.company.address.default;
    
    const contactContent = `import { useState } from 'react';
import Layout from '../components/layout/Layout';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout title="Contact - Dubois Plomberie" description="Contactez-nous pour vos besoins en plomberie">
      <section className="bg-primary text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl font-bold mb-4">Nous Contacter</h1>
          <p className="text-xl">Contactez-nous pour tous vos besoins en plomberie</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-8">Informations de contact</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">Ì≥û</div>
                  <div>
                    <h3 className="font-semibold mb-1">T√©l√©phone</h3>
                    <p className="text-gray-600">${companyPhone}</p>
                    <p className="text-sm text-gray-500">Disponible 24h/24</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">‚úâÔ∏è</div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-gray-600">${companyEmail}</p>
                    <p className="text-sm text-gray-500">R√©ponse sous 24h</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">Ì≥ç</div>
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-gray-600">${companyAddress.replace('\n', ', ')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-8">Envoyez-nous un message</h2>
              
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-green-800 font-medium mb-1">Message envoy√© !</h3>
                  <p className="text-green-700">Nous vous recontacterons rapidement.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">T√©l√©phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Sujet *</label>
                      <select
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Choisir un sujet</option>
                        <option value="devis">Demande de devis</option>
                        <option value="urgence">D√©pannage d'urgence</option>
                        <option value="installation">Installation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}`;

    await fs.writeFile(path.join(this.outputPath, 'pages/contact.js'), contactContent);
  }

  async generateAPIRoutes() {
    console.log('Ì¥ß G√©n√©ration API routes...');
    
    const contactAPI = `export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    console.log('Ì≥ß Nouveau message:', { name, email, phone, subject, message });

    res.status(200).json({ 
      message: 'Message envoy√© avec succ√®s',
      data: { name, email, subject }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}`;

    await fs.writeFile(path.join(this.outputPath, 'pages/api/contact.js'), contactAPI);
  }
}

module.exports = MultiPageGenerator;
