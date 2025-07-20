#!/bin/sh

echo "🧹 Nettoyage BuzzCraft..."

# Remove build artifacts
echo "🗑️  Suppression des artefacts..."
rm -rf node_modules
rm -rf .eslintcache
rm -rf coverage
rm -rf .npm

# Clean workspaces
echo "🔄 Nettoyage des workspaces..."
if [ -d "app-client" ]; then
  rm -rf app-client/node_modules 2>/dev/null
  rm -rf app-client/dist 2>/dev/null
fi

if [ -d "app-server" ]; then
  rm -rf app-server/node_modules 2>/dev/null
fi

if [ -d "api" ]; then
  rm -rf api/node_modules 2>/dev/null
fi

# Reinstall clean
echo "📦 Réinstallation propre..."
npm install

echo ""
echo "✅ Projet nettoyé et réinstallé !"
echo "💡 Tout est propre, tu peux recommencer."