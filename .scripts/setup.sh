#!/bin/sh

echo "🚀 BuzzCraft Setup..."

# Check Node version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
  echo "❌ Node.js 18+ requis (actuel: $(node -v))"
  exit 1
fi

# Install dependencies
echo "📦 Installation des dépendances..."
npm install

# Create directories if needed
echo "📁 Création des dossiers..."
mkdir -p app-server/states/void
mkdir -p app-server/states/draft
mkdir -p app-server/states/built

echo ""
echo "✅ Setup terminé !"
echo "💡 Prochaines étapes :"
echo "   npm test           # Tests"
echo "   npm run lint       # Qualité code"
echo "   npm run clean      # Nettoyer si problème"