// Extension du parser pour Phase 3B - Pages multiples + Formulaires
const fs = require('fs').promises;
const path = require('path');

class ExtendedReactGenerator {
  constructor() {
    this.apiRoutes = new Set();
    this.formValidation = new Map();
  }

  async generateProject(jsonProject, outputPath) {
    console.log('��� Génération projet étendu...');
    
    // Structure Next.js
    await this.createProjectStructure(outputPath);
    
    // Générer toutes les pages
    await this.generateAllPages(jsonProject, outputPath);
    
    // Générer API routes
    await this.generateAPIRoutes(jsonProject, outputPath);
    
    // Générer components communs
    await this.generateSharedComponents(jsonProject, outputPath);
    
    console.log('✅ Projet étendu généré');
  }

  async generateAllPages(jsonProject, outputPath) {
    const pages = jsonProject.structure.pages;
    
    for (const [pageKey, pageData] of Object.entries(pages)) {
      console.log(`��� Génération page: ${pageKey}`);
      
      if (pageKey === 'home') {
        await this.generateHomePage(pageData, jsonProject, outputPath);
      } else if (pageKey === 'services') {
        await this.generateServicesPage(pageData, jsonProject, outputPath);
      } else if (pageKey === 'contact') {
        await this.generateContactPage(pageData, jsonProject, outputPath);
      } else {
        await this.generateGenericPage(pageKey, pageData, jsonProject, outputPath);
      }
    }
  }

  async generateContactPage(pageData, jsonProject, outputPath) {
    const contactContent = `import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
    }
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Nous Contacter</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Informations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Téléphone</h3>
                  <p className="text-gray-600">04 77 XX XX XX</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">contact@dubois-plomberie.fr</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Adresse</h3>
                  <p className="text-gray-600">15 rue de la République<br/>42000 Saint-Étienne</p>
                </div>
              </div>
            </div>
            
            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-green-800 font-medium mb-2">Message envoyé !</h3>
                  <p className="text-green-700">Nous vous recontacterons rapidement.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Contact - Dubois Plomberie',
      description: 'Contactez Dubois Plomberie pour tous vos besoins en plomberie à Saint-Étienne'
    }
  };
}`;

    await fs.writeFile(path.join(outputPath, 'pages/contact.js'), contactContent);
    this.apiRoutes.add('contact');
  }

  async generateServicesPage(pageData, jsonProject, outputPath) {
    const servicesContent = `import Header from '../components/Header';
import Footer from '../components/Footer';

const services = [
  {
    id: 1,
    title: 'Dépannage d\'urgence',
    description: 'Intervention rapide 24h/24 pour tous vos problèmes de plomberie.',
    price: 'À partir de 80€',
    features: ['Intervention rapide', 'Devis gratuit', 'Garantie travaux']
  },
  {
    id: 2,
    title: 'Installation sanitaire',
    description: 'Installation complète de salles de bain, cuisines et WC.',
    price: 'Sur devis',
    features: ['Conseil personnalisé', 'Matériel de qualité', 'Pose professionnelle']
  },
  {
    id: 3,
    title: 'Rénovation plomberie',
    description: 'Rénovation complète de votre installation de plomberie.',
    price: 'Sur devis',
    features: ['Diagnostic complet', 'Mise aux normes', 'Garantie 10 ans']
  }
];

export default function Services() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nos Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre gamme complète de services de plomberie pour particuliers et professionnels.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="text-lg font-medium text-blue-600 mb-4">{service.price}</div>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <a
                href="/contact"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Demander un devis
              </a>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Besoin d'un service personnalisé ?</h2>
          <p className="text-gray-600 mb-6">Nous étudions tous vos projets sur mesure.</p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Services - Dubois Plomberie',
      description: 'Services de plomberie professionnels : dépannage, installation, rénovation à Saint-Étienne'
    }
  };
}`;

    await fs.writeFile(path.join(outputPath, 'pages/services.js'), servicesContent);
  }

  async generateAPIRoutes(jsonProject, outputPath) {
    console.log('��� Génération API routes...');
    
    // API Contact
    if (this.apiRoutes.has('contact')) {
      const contactAPI = `import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, phone, message } = req.body;

    // Validation basique
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    // Configuration email (à adapter selon l'hébergement)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'contact@dubois-plomberie.fr',
      to: 'contact@dubois-plomberie.fr',
      subject: \`Nouveau message de \${name}\`,
      html: \`
        <h2>Nouveau message depuis le site web</h2>
        <p><strong>Nom:</strong> \${name}</p>
        <p><strong>Email:</strong> \${email}</p>
        <p><strong>Téléphone:</strong> \${phone || 'Non renseigné'}</p>
        <p><strong>Message:</strong></p>
        <p>\${message}</p>
      \`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}`;

      await fs.mkdir(path.join(outputPath, 'pages/api'), { recursive: true });
      await fs.writeFile(path.join(outputPath, 'pages/api/contact.js'), contactAPI);
    }

    // API Content pour future interface admin
    const contentAPI = `// API Content pour interface admin future
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Récupérer contenu
      res.status(200).json({ content: {} });
      break;
    case 'PUT':
      // Mettre à jour contenu
      res.status(200).json({ message: 'Contenu mis à jour' });
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(\`Method \${method} Not Allowed\`);
  }
}`;

    await fs.writeFile(path.join(outputPath, 'pages/api/content.js'), contentAPI);
  }

  async generateHomePage(pageData, jsonProject, outputPath) {
    // Utiliser le générateur existant mais amélioré
    const homeContent = `import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>Dubois Plomberie - Expert plombier à Saint-Étienne</title>
        <meta name="description" content="Plombier professionnel à Saint-Étienne. Dépannage 24h/24, installation sanitaire, rénovation. Devis gratuit." />
      </Head>
      
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">Dubois Plomberie</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Plombier professionnel à Saint-Étienne. Expert en dépannage, installation et rénovation depuis 15 ans.
            </p>
            <div className="space-x-4">
              <a
                href="/contact"
                className="inline-block bg-white text-blue-600 py-3 px-8 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Demander un devis
              </a>
              <a
                href="tel:0477XXXXXX"
                className="inline-block border-2 border-white text-white py-3 px-8 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                04 77 XX XX XX
              </a>
            </div>
          </div>
        </section>

        {/* Services aperçu */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Une gamme complète de services pour tous vos besoins en plomberie
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Dépannage</h3>
                <p className="text-gray-600">Intervention rapide 24h/24</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Installation</h3>
                <p className="text-gray-600">Pose sanitaire et équipements</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Rénovation</h3>
                <p className="text-gray-600">Mise aux normes complète</p>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <a
                href="/services"
                className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir tous nos services
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Besoin d'un plombier ?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Devis gratuit et intervention rapide pour tous vos travaux de plomberie à Saint-Étienne et alentours.
            </p>
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white py-4 px-10 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Demander votre devis gratuit
            </a>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
}`;

    await fs.writeFile(path.join(outputPath, 'pages/index.js'), homeContent);
  }

  async createProjectStructure(outputPath) {
    // Créer structure étendue avec API
    await fs.mkdir(outputPath, { recursive: true });
    await fs.mkdir(path.join(outputPath, 'pages'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'pages/api'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'components'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'styles'), { recursive: true });

    // Package.json avec dépendances email
    const packageJson = {
      name: 'buzzcraft-site',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.2.30',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        nodemailer: '^6.9.0'
      },
      devDependencies: {
        '@types/nodemailer': '^6.4.0',
        autoprefixer: '^10.4.20',
        eslint: '^8.57.1',
        'eslint-config-next': '^14.2.30',
        postcss: '^8.4.47',
        tailwindcss: '^3.4.13'
      }
    };

    await fs.writeFile(
      path.join(outputPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }
}

module.exports = ExtendedReactGenerator;
