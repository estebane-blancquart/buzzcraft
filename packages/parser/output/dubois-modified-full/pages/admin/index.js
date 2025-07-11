import { useState, useEffect } from 'react';

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
      console.log('Admin loaded content:', data);
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
            <p className="text-sm text-gray-600">Projet: dubois-modified-full</p>
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
          {/* Section company */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">company</h2>
              <p className="text-sm text-gray-600">Modifiez les informations company</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={content.company?.name || ''}
                onBlur={(e) => updateContent('company', 'name', e.target.value)}
                placeholder="Saisissez nom de l'entreprise"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  defaultValue={content.company?.description || ''}
                  onBlur={(e) => updateContent('company', 'description', e.target.value)}
                  placeholder="Saisissez description"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={content.company?.phone || ''}
                onBlur={(e) => updateContent('company', 'phone', e.target.value)}
                placeholder="Saisissez téléphone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={content.company?.email || ''}
                onBlur={(e) => updateContent('company', 'email', e.target.value)}
                placeholder="Saisissez email"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète 
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  defaultValue={content.company?.address || ''}
                  onBlur={(e) => updateContent('company', 'address', e.target.value)}
                  placeholder="Saisissez adresse complète"
                />
              </div>
            </div>
          </div>
          {/* Section services */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">services</h2>
              <p className="text-sm text-gray-600">Modifiez les informations services</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la section 
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={content.services?.title || ''}
                onBlur={(e) => updateContent('services', 'title', e.target.value)}
                placeholder="Saisissez titre de la section"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description 
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  defaultValue={content.services?.description || ''}
                  onBlur={(e) => updateContent('services', 'description', e.target.value)}
                  placeholder="Saisissez description"
                />
              </div>
            </div>
          </div>
          
          {/* Section Debug */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">��� Debug - Contenu Actuel</h2>
            </div>
            <div className="p-6">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}