# 06-schema.md

Structure project.json avec hiérarchie DOM stricte.

## 📋 Organisation

Le project.json est la source unique de vérité pour générer les 5 services. 
Il contient toute la structure DOM du site, les données de contenu, et les métadonnées du projet. 
Ce fichier permet de reconstruire entièrement l'application à partir de zéro.

**Construction hiérarchique :**
```
project (métadonnées + config globale)
  └── pages[] ( gestion du seo + style )
      └── sections[] ( gestion du responsive + style )
          └── containers[] ( gestion du positionnement + style )
              └── components[] ( gestion du contenu + style )
```

**Types de containers :**
- **div** : zone libre
- **form** : formulaire avec method
- **list** : liste avec tag ul/ol

**Types de components :**
heading, paragraph, button, image, video, link, input avec propriétés spécifiques selon le type.

## 🔧 Fonctionnement

Le schema impose une hiérarchie stricte qui élimine les ambiguïtés de construction. 
La validation vérifie la cohérence structurelle et l'existence des propriétés requises. 
Les propriétés manquantes sont automatiquement complétées par des defaults appropriés au type d'élément.