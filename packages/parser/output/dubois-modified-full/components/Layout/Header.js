import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Dubois Plomberie MODIFIÉ
          </Link>
          <div className="space-x-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Accueil
            </Link>
            <Link href="/services" className="hover:text-accent transition-colors">
              Services
            </Link>
            <Link href="/contact" className="hover:text-accent transition-colors">
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
