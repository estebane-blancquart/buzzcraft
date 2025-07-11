import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>BUZZCRAFT - Dashboard</title>
      </Head>
      <main className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-4xl font-bold text-blue-600">
          🚀 BUZZCRAFT Dashboard
        </h1>
        <p className="mt-4 text-gray-600">
          Environnement de développement opérationnel !
        </p>
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold">Status</h2>
          <div className="mt-2">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            API Connected
          </div>
        </div>
      </main>
    </div>
  )
}
