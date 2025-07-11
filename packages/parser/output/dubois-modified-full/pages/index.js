import Head from 'next/head'
import Layout from '../components/Layout/Layout'

export default function HomePage() {
  return (
    <Layout>
      <Head>
        <title>Accueil - Dubois Plomberie MODIFIÉ</title>
        <meta name="description" content="{{company.description}}" />
      </Head>
      
      <main className="min-h-screen">
            <section></section>
            <section></section>
      </main>
    </Layout>
  )
}
