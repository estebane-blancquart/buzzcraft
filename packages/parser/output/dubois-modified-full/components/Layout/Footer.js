export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Dubois Plomberie MODIFIÉ. Tous droits réservés.</p>
        <p className="text-sm text-gray-400 mt-2">Site créé avec BuzzCraft</p>
      </div>
    </footer>
  )
}
