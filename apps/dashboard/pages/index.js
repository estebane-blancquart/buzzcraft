import Head from 'next/head'
import ProjectStats from '../components/dashboard/ProjectStats'
import ProjectsList from '../components/dashboard/ProjectsList'

export default function Dashboard() {
  return (
    <div>
      <Head>
        <title>BUZZCRAFT - Dashboard</title>
        <meta name="description" content="Dashboard de gestion des projets BuzzCraft" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">
                  🚀 BUZZCRAFT
                </h1>
                <span className="ml-3 text-gray-500">Dashboard</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  API Connectée
                </div>
                
                <button
                  onClick={() => window.open('http://localhost:4001', '_blank')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
                >
                  🎨 Ouvrir Editor
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <ProjectStats />
          
          {/* Projects List */}
          <ProjectsList />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
              BuzzCraft Dashboard v1.0.0 - Générateur de sites professionnels
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}