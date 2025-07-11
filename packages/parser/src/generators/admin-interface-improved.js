// Interface admin améliorée avec formulaires dynamiques

function generateImprovedAdminInterface(contentSchema, projectId) {
  const entities = Object.keys(contentSchema);
  
  return `import { useState, useEffect } from 'react';

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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-600">Projet: ${projectId}</p>
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
      
      {/* Message de confirmation */}
      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
          <p className="text-blue-700">{message}</p>
        </div>
      )}
      
      {/* Contenu principal */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          ${entities.map(entity => generateEntityForm(entity, contentSchema[entity])).join('\n          ')}
        </div>
      </main>
    </div>
  );
}`;
}

function generateEntityForm(entity, fields) {
  const fieldInputs = Object.entries(fields).map(([fieldName, fieldConfig]) => 
    generateFieldInput(entity, fieldName, fieldConfig)
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

function generateFieldInput(entity, fieldName, fieldConfig) {
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

module.exports = { generateImprovedAdminInterface };
