#!/bin/sh

echo "🔍 Vérification pré-commit..."
echo ""

# Run tests
echo "🧪 Tests..."
if npm test; then
  echo "✅ Tests OK"
else
  echo "❌ Tests échoués !"
  exit 1
fi

echo ""

# Run linting
echo "🔧 Qualité code..."
if npm run lint; then
  echo "✅ Lint OK"
else
  echo "❌ Problèmes de qualité code !"
  exit 1
fi

echo ""
echo "✅ Prêt pour commit !"
echo "💡 git add . && git commit -m \"ton message\""