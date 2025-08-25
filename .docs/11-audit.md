# 11-audit.md

Audit systématique à 4 niveaux d'échelle pour s'assurer que chaque composant du projet soit parfait sous tous les angles.

**Principe :** Chaque échelle a ses propres critères spécifiques + les 6 dimensions de qualité universelles.

## 📏 **Échelles d'audit**

### 🔬 **MICRO - Fonction/Classe (10-50 lignes)**

- **Scope :** Une fonction ou classe spécifique
- **Focus :** Implémentation pure, logique interne

### 📦 **MODULE - Fichier (100-500 lignes)**

- **Scope :** Un fichier complet avec toutes ses fonctions
- **Focus :** Cohérence interne, interfaces, responsabilités

### 🏗️ **SERVICE - Couche complète (1000+ lignes)**

- **Scope :** Un service entier (app-api, app-server, app-client)
- **Focus :** Architecture interne, patterns, communication

### 🌐 **SYSTÈME - Projet entier**

- **Scope :** Tous les services + communication inter-services
- **Focus :** Architecture globale, workflows bout-en-bout


## 🔍 **Dimensions de qualité universelles**

### 📐 **1. Architecture & Responsabilités**

#### 🔬 **Niveau MICRO**

```
□ La fonction fait UNE seule chose clairement définie
□ Paramètres d'entrée logiques et complets
□ Valeur de retour cohérente avec le rôle
□ Aucune responsabilité cachée ou side-effect non documenté
□ Nom de fonction décrit exactement ce qu'elle fait
□ Longueur appropriée (max 50 lignes)
```

#### 📦 **Niveau MODULE**

```
□ Module placé dans la bonne couche (cores/, engines/, probes/, etc.)
□ Toutes les fonctions liées à une responsabilité commune
□ Exports/imports cohérents avec le rôle du module
□ Aucune dépendance circulaire
□ Interface publique claire et minimale
□ Fonctions internes bien isolées (non exportées)
```

#### 🏗️ **Niveau SERVICE**

```
□ Service respecte sa couche architecturale (API/Server/Client)
□ Pas d'import cross-service direct
□ Structure de dossiers logique et cohérente
□ Séparation claire des responsabilités par module
□ Interfaces de communication bien définies
□ Configuration externalisée
```

#### 🌐 **Niveau SYSTÈME**

```
□ Pattern 13 CALLS respecté dans tous les workflows
□ Machine à états cohérente sur tous les services
□ Communication inter-services via API seulement
□ Aucun couplage direct entre app-client et app-server
□ Architecture en couches respectée partout
□ Données qui transitent sans transformation incohérente
```

### 🎨 **2. Qualité & Beauté du code**

#### 🔬 **Niveau MICRO**

```
□ Code lisible sans commentaires explicatifs
□ Variables nommées de façon évidente et précise
□ Aucun magic number ou string
□ Indentation et formatting parfaits
□ Logique claire et linéaire
□ Aucune complexité cognitive inutile
```

#### 📦 **Niveau MODULE**

```
□ Style de code homogène dans tout le fichier
□ Ordre des fonctions logique (publiques puis privées)
□ Imports organisés et groupés logiquement  
□ Aucun code mort ou commenté
□ JSDoc complet sur toutes les fonctions publiques
□ Constantes regroupées en haut de fichier
```

#### 🏗️ **Niveau SERVICE**

```
□ Conventions de nommage cohérentes dans tout le service
□ Structure de fichiers logique et prévisible
□ Tous les modules suivent le même template
□ Configuration centralisée (package.json, configs/)
□ Documentation à jour dans chaque module
□ Aucun TODO/FIXME en production
```

#### 🌐 **Niveau SYSTÈME**

```
□ Style guide respecté sur tous les services
□ Mêmes outils de formatting (Prettier, ESLint)
□ Documentation complète et synchronisée (.docs/)
□ Versions des dépendances cohérentes
□ Gitignore et configs uniformes
□ README à jour dans chaque service
```

### 🏗️ **3. Design patterns & Cohérence**

#### 🔬 **Niveau MICRO**

```
□ Pattern de retour { success, data/error } respecté
□ Validation des paramètres selon le pattern standard
□ Gestion d'erreurs avec try/catch approprié
□ Logs au format [MODULE] Action: details
□ Même niveau d'abstraction dans la fonction
□ Pas de mélange de logiques différentes
```

#### 📦 **Niveau MODULE**

```
□ Toutes les fonctions suivent les mêmes patterns
□ Gestion d'erreurs homogène dans le module
□ Validation des inputs cohérente
□ Logs préfixés avec le nom du module
□ Exports suivent la convention établie
□ Aucune duplication de logique
```

#### 🏗️ **Niveau SERVICE**

```
□ Tous les modules du service suivent les mêmes patterns
□ Structure de répertoires cohérente
□ Gestion d'erreurs uniforme dans le service
□ Configuration et constantes centralisées
□ Tests organisés selon la même structure
□ Scripts package.json homogènes avec les autres services
```

#### 🌐 **Niveau SYSTÈME**

```
□ Pattern 13 CALLS implémenté identiquement partout
□ Même format de réponse API sur tous les endpoints
□ États de la machine à états nommés pareil partout
□ Logs système traçables d'un bout à l'autre
□ Même stratégie d'authentification/autorisation
□ Patterns React cohérents (hooks, components)
```

### 🔒 **4. Robustesse & Edge cases**

#### 🔬 **Niveau MICRO**

```
□ Tous les paramètres validés avant utilisation
□ Gestion des cas null/undefined/vides
□ Comportement défini pour tous les inputs possibles
□ Aucune exception non gérée possible
□ Valeurs de retour cohérentes même en erreur
□ Timeout sur les opérations potentiellement lentes
```

#### 📦 **Niveau MODULE**

```
□ Tous les cas d'erreur de chaque fonction gérés
□ Rollback possible en cas d'opération partielle
□ État du module prévisible après chaque opération
□ Gestion des ressources (files, connections) propre
□ Aucune fuite mémoire possible
□ Tests couvrent les edge cases principaux
```

#### 🏗️ **Niveau SERVICE**

```
□ Service démarre et s'arrête proprement
□ Gestion des pannes de dépendances externes
□ Graceful shutdown implémenté
□ Monitoring et health checks présents
□ Configuration par défaut fonctionnelle
□ Logs d'erreur suffisamment détaillés pour le debug
```

#### 🌐 **Niveau SYSTÈME**

```
□ Aucun workflow ne peut laisser le système dans un état incohérent
□ Rollback complet possible sur tous les workflows
□ Gestion des pannes en cascade entre services
□ Détection d'états corrompus et récupération automatique
□ Sauvegarde des données critiques
□ Plan de disaster recovery documenté
```

### 📊 **5. Performance & Optimisation**

#### 🔬 **Niveau MICRO**

```
□ Algorithme optimal pour le cas d'usage
□ Aucun calcul redondant dans la fonction
□ Variables temporaires libérées correctement
□ Pas de regex complexe en boucle
□ Opérations async non-bloquantes quand approprié
□ Complexité temporelle acceptable
```

#### 📦 **Niveau MODULE**

```
□ Cache implémenté pour les opérations coûteuses
□ I/O minimisées (batching, réutilisation)
□ Aucune duplication d'opérations entre fonctions  
□ Gestion mémoire optimisée
□ Pas de fuite de ressources (files, streams)
□ Profiling effectué sur les fonctions critiques
```

#### 🏗️ **Niveau SERVICE**

```
□ Architecture scalable horizontalement
□ Base de données optimisée (indexes, requêtes)
□ Middleware de cache approprié
□ Compression des réponses activée
□ Monitoring des performances en place
□ Pagination implémentée pour les gros datasets
```

#### 🌐 **Niveau SYSTÈME**

```
□ Communication inter-services optimisée
□ Aucun goulot d'étranglement identifié
□ Load balancing configuré si nécessaire
□ CDN pour les assets statiques
□ Optimisation du bundle client
□ Métriques de performance globales trackées
```

### 🧪 **6. Testabilité & Maintenabilité**

#### 🔬 **Niveau MICRO**

```
□ Fonction pure quand possible (sans side effects)
□ Dépendances injectées ou mockables
□ État d'entrée et sortie prédictibles
□ Cas de test évidents et documentés
□ Debugging facile avec des logs appropriés
□ Documentation inline suffisante
```

#### 📦 **Niveau MODULE**

```
□ Interface publique stable et bien documentée
□ Fonctions testables indépendamment
□ Mocks et stubs facilement créables
□ Tests unitaires couvrent les cas principaux
□ Documentation du module complète
□ Refactoring possible sans casser l'API
```

#### 🏗️ **Niveau SERVICE**

```
□ Tests d'intégration complets
□ Configuration externalisée et overridable
□ Logs suffisants pour le troubleshooting production
□ Documentation API à jour
□ Versioning des APIs externes
□ Migration et upgrade path documentés
```

#### 🌐 **Niveau SYSTÈME**

```
□ Tests end-to-end automatisés
□ Environnements de test identiques à la production
□ Monitoring et alerting configurés
□ Documentation complète du système
□ Processus de déploiement automatisé
□ Rollback plan testé et documenté
```
