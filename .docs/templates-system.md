# Templates System

## Double système
**Structure :** `inputs/templates/structure/` → JSON hiérarchique
**Code :** `inputs/templates/code/` → Fichiers Handlebars

## Hiérarchie DOM
```
project → pages → sections → divs/lists/forms → components
```

**Components types :** button, a, p, h, image, video
**Containers types :** div, list, form
**Responsive :** 3/2/1 colonnes selon device

## Compilation
```
JSON structure → extractAllComponents → findComponentByType → compile template
```

## Templates Components
- **button.tsx.hbs** : Bouton avec href optionnel
- **a.tsx.hbs** : Lien avec target
- **p.tsx.hbs** : Paragraphe simple
- **h.tsx.hbs** : Titre h1-h6 dynamique
- **image.tsx.hbs** : Image avec src/alt
- **video.tsx.hbs** : Vidéo avec contrôles

## Variables disponibles
```
{{id}} {{type}} {{content}} {{classname}} {{href}} {{src}} {{alt}}
```