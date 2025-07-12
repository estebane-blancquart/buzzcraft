import Head from 'next/head'
import Layout from '../components/Layout/Layout'
import HeroSection from "../components/Modules/HeroSection"
import ServicesPreview from "../components/Modules/ServicesPreview"

export async function getServerSideProps() {
  try {
    const response = await fetch("http://localhost:3201/api/content")
    const content = await response.json()
    return { props: { content } }
  } catch (error) {
    return { props: { content: { company: {}, services: {} } } }
  }
}

export default function HomePage({ content }) {
  return (
    <Layout>
      <Head>
        <title>Accueil - Dubois Plomberie</title>
        <meta name="description" content="Plomberie Saint-Étienne" />
      </Head>
      <main className="min-h-screen">
        <HeroSection content={content} />
        <ServicesPreview content={content} />
      </main>
    </Layout>
  )
}
