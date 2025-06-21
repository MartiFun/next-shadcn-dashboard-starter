# Guide de Migration - Améliorations Media

Ce guide vous accompagne dans la migration des pages Media existantes vers la nouvelle version améliorée avec Sentry, optimisations et fonctionnalités avancées.

## Table des matières

1. [Pré-requis](#pré-requis)
2. [Checklist de migration](#checklist-de-migration)
3. [Migration étape par étape](#migration-étape-par-étape)
4. [Tests et validation](#tests-et-validation)
5. [Rollback (retour en arrière)](#rollback-retour-en-arrière)
6. [FAQ et troubleshooting](#faq-et-troubleshooting)

## Pré-requis

### Versions requises

- **Node.js**: 18.17+ ou 20.5+
- **Next.js**: 13.4+ ou 14.0+
- **React**: 18.0+
- **TypeScript**: 5.0+

### Dépendances additionnelles

```bash
# Installation des nouvelles dépendances
npm install @sentry/nextjs react-window recharts

# Dépendances de développement
npm install -D @types/react-window
```

### Configuration environnement

Ajoutez ces variables à votre `.env.local` :

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DISABLED=false

# Variables Emby existantes (vérifiez qu'elles sont présentes)
NEXT_PUBLIC_EMBY_URL=http://your-emby-server:8096/emby
NEXT_PUBLIC_EMBY_API_KEY=your_emby_api_key
```

## Checklist de migration

### Phase 1 : Préparation

- [ ] Sauvegarde des fichiers existants
- [ ] Installation des dépendances
- [ ] Configuration Sentry
- [ ] Tests de l'environnement de développement

### Phase 2 : Migration des types

- [ ] Ajout du fichier `src/types/media.ts`
- [ ] Mise à jour des imports dans les composants existants
- [ ] Validation TypeScript

### Phase 3 : Migration de l'API

- [ ] Ajout du fichier `src/lib/enhanced-media-api.ts`
- [ ] Mise à jour des appels API existants
- [ ] Tests des nouvelles fonctionnalités de cache

### Phase 4 : Migration des composants

- [ ] Ajout de l'error boundary
- [ ] Migration vers les nouveaux composants
- [ ] Tests des nouvelles fonctionnalités

### Phase 5 : Tests et validation

- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de performance
- [ ] Validation UX

## Migration étape par étape

### Étape 1 : Sauvegarde et préparation

```bash
# Créer une branche de migration
git checkout -b feature/media-enhancements

# Sauvegarder les fichiers existants
cp src/features/media/components/media-movie-list.tsx src/features/media/components/media-movie-list.tsx.backup
cp src/features/media/components/media-detail-view.tsx src/features/media/components/media-detail-view.tsx.backup
cp src/lib/media-api.ts src/lib/media-api.ts.backup
```

### Étape 2 : Installation et configuration

```bash
# Installation des dépendances
npm install @sentry/nextjs react-window recharts @types/react-window

# Vérification de l'installation
npm ls @sentry/nextjs react-window recharts
```

### Étape 3 : Configuration Sentry

1. **Copier la configuration client** :
```typescript
// src/instrumentation-client.ts (mise à jour)
import * as Sentry from "@sentry/nextjs";

if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] })
    ],
    sendDefaultPii: true,
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: true,
    _experiments: { enableLogs: true },
  });
}
```

2. **Tester la configuration** :
```bash
npm run dev
# Vérifiez la console pour les messages Sentry
```

### Étape 4 : Migration des types

1. **Copier le fichier de types** :
```bash
# Copier src/types/media.ts depuis les améliorations
```

2. **Mettre à jour les imports existants** :
```typescript
// Ancien (dans media-movie-list.tsx)
type EmbyMovie = {
  Id: string;
  Name: string;
  // ... types minimaux
};

// Nouveau
import { EmbyMovie, SearchOptions, MediaFilters } from '@/types/media';
```

### Étape 5 : Migration de l'API

1. **Copier la nouvelle API** :
```bash
# Copier src/lib/enhanced-media-api.ts
```

2. **Mise à jour progressive des appels** :
```typescript
// Dans vos composants existants
// Ancien
import { mediaAPI } from '@/lib/media-api';

// Nouveau (mise à jour progressive)
import { enhancedMediaAPI } from '@/lib/enhanced-media-api';

// Exemple de migration d'un appel
// Ancien
const response = await mediaAPI.getEmbyMovies(userId);

// Nouveau
const response = await enhancedMediaAPI.getMovies(userId);
```

### Étape 6 : Migration des composants (approche progressive)

#### Option A : Migration complète (recommandée)

1. **Copier les nouveaux composants** :
```bash
# Copier tous les nouveaux composants
cp enhanced-media-movie-list.tsx src/features/media/components/
cp error-boundary.tsx src/components/
```

2. **Mettre à jour les imports dans vos pages** :
```typescript
// src/app/dashboard/media/page.tsx
// Ancien
import { MediaMovieList } from '@/features/media/components/media-movie-list';

// Nouveau
import { EnhancedMediaMovieList } from '@/features/media/components/enhanced-media-movie-list';
import { MediaErrorBoundary } from '@/components/error-boundary';

export default function MediaPage() {
  return (
    <MediaErrorBoundary>
      <EnhancedMediaMovieList userId={userId} />
    </MediaErrorBoundary>
  );
}
```

#### Option B : Migration progressive (pour les projets critiques)

1. **Garder les deux versions** :
```typescript
// Utiliser un feature flag pour basculer
const useEnhancedMedia = process.env.NEXT_PUBLIC_USE_ENHANCED_MEDIA === 'true';

return useEnhancedMedia ? (
  <MediaErrorBoundary>
    <EnhancedMediaMovieList userId={userId} />
  </MediaErrorBoundary>
) : (
  <MediaMovieList userId={userId} />
);
```

2. **Tests A/B** :
```typescript
// Tests avec une portion d'utilisateurs
const isInTestGroup = Math.random() < 0.1; // 10% des utilisateurs

return isInTestGroup ? <EnhancedVersion /> : <OriginalVersion />;
```

### Étape 7 : Configuration des optimisations d'images

```typescript
// Mise à jour de vos composants pour utiliser les images optimisées
// Ancien
const posterUrl = `${base}/Items/${movie.Id}/Images/Primary?api_key=${apiKey}`;

// Nouveau
const posterUrl = enhancedMediaAPI.getOptimizedImageUrl(
  movie.Id,
  'Primary',
  {
    width: 280,
    height: 420,
    quality: 85,
    format: 'webp',
    cropWhitespace: true,
    enableImageEnhancers: true,
  }
);
```

## Tests et validation

### Tests unitaires

```bash
# Créer des tests pour les nouvelles fonctionnalités
touch src/lib/__tests__/enhanced-media-api.test.ts
touch src/components/__tests__/error-boundary.test.tsx
```

Exemple de test :

```typescript
// src/lib/__tests__/enhanced-media-api.test.ts
import { enhancedMediaAPI } from '../enhanced-media-api';

describe('Enhanced Media API', () => {
  beforeEach(() => {
    enhancedMediaAPI.clearCache();
  });

  test('should cache API responses', async () => {
    const userId = 'test-user';
    
    // Premier appel
    const response1 = await enhancedMediaAPI.getMovies(userId);
    expect(response1.ok).toBe(true);
    
    // Deuxième appel (devrait utiliser le cache)
    const response2 = await enhancedMediaAPI.getMovies(userId);
    expect(response2.statusText).toContain('Cached');
  });

  test('should generate optimized image URLs', () => {
    const url = enhancedMediaAPI.getOptimizedImageUrl('movie1', 'Primary', {
      width: 300,
      height: 450,
      quality: 90,
      format: 'webp'
    });
    
    expect(url).toContain('Width=300');
    expect(url).toContain('Height=450');
    expect(url).toContain('Quality=90');
    expect(url).toContain('Format=webp');
  });
});
```

### Tests d'intégration

```bash
# Exécuter les tests
npm run test

# Tests de régression
npm run test:regression
```

### Tests de performance

```typescript
// Tests de charge avec de grandes listes
describe('Performance Tests', () => {
  test('should handle 10000 movies efficiently', async () => {
    const startTime = performance.now();
    
    const largeMovieList = generateMockMovies(10000);
    
    render(
      <EnhancedMediaMovieList 
        userId="test-user" 
        initialData={{ Items: largeMovieList }}
      />
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(2000); // < 2 secondes
  });
});
```

### Validation manuelle

1. **Tests de fonctionnalités** :
   - [ ] Chargement initial des films
   - [ ] Recherche et filtres
   - [ ] Pagination
   - [ ] Carousel des films récents
   - [ ] Navigation vers les détails
   - [ ] Gestion des favoris

2. **Tests d'erreur** :
   - [ ] Erreur réseau (déconnecter le wifi)
   - [ ] Erreur serveur Emby (arrêter Emby)
   - [ ] Images manquantes
   - [ ] Utilisateur invalide

3. **Tests de performance** :
   - [ ] Temps de chargement initial
   - [ ] Fluidité du scroll
   - [ ] Réactivité de la recherche
   - [ ] Performance de la virtualisation

## Rollback (retour en arrière)

### Plan de rollback immédiat

Si vous rencontrez des problèmes critiques :

```bash
# Rollback rapide avec feature flag
export NEXT_PUBLIC_USE_ENHANCED_MEDIA=false

# Ou rollback de code
git revert HEAD~n  # n = nombre de commits à annuler
```

### Rollback progressif

```typescript
// Désactiver fonctionnalité par fonctionnalité
const config = {
  useEnhancedAPI: false,      // Revenir à l'ancienne API
  useVirtualization: false,   // Désactiver la virtualisation
  useSentryLogging: false,    // Désactiver Sentry temporairement
  useImageOptimization: false // Revenir aux images non optimisées
};
```

### Rollback complet

```bash
# Restaurer les fichiers de sauvegarde
cp src/features/media/components/media-movie-list.tsx.backup src/features/media/components/media-movie-list.tsx
cp src/features/media/components/media-detail-view.tsx.backup src/features/media/components/media-detail-view.tsx
cp src/lib/media-api.ts.backup src/lib/media-api.ts

# Désinstaller les nouvelles dépendances si nécessaire
npm uninstall react-window recharts @types/react-window

# Revenir au commit précédent
git reset --hard HEAD~1
```

## FAQ et troubleshooting

### Problèmes courants

#### Q : Les images ne se chargent pas avec la nouvelle API
**R :** Vérifiez la configuration Emby et les paramètres d'optimisation :

```typescript
// Debug des URLs d'images
console.log('Image URL:', enhancedMediaAPI.getOptimizedImageUrl(movieId, 'Primary'));

// Vérifiez les variables d'environnement
console.log('Emby URL:', process.env.NEXT_PUBLIC_EMBY_URL);
console.log('API Key:', process.env.NEXT_PUBLIC_EMBY_API_KEY?.substring(0, 8) + '...');
```

#### Q : Erreur "Cannot find module '@sentry/nextjs'"
**R :** Réinstallez Sentry et vérifiez la configuration :

```bash
npm uninstall @sentry/nextjs
npm install @sentry/nextjs
npm run build  # Vérifiez qu'il n'y a pas d'erreurs de build
```

#### Q : La virtualisation ne fonctionne pas correctement
**R :** Vérifiez les dimensions du conteneur :

```typescript
// Debug des dimensions
console.log('Container width:', containerRef.current?.getBoundingClientRect().width);
console.log('Column count:', columnCount);
console.log('Item count:', movies.length);
```

#### Q : Performance dégradée après migration
**R :** Vérifiez les points suivants :

1. **Cache correctement configuré** :
```typescript
// Vérifiez que le cache fonctionne
console.log('Cache hit rate:', /* calculer le ratio */);
```

2. **Virtualisation active** :
```typescript
// S'assurer que la virtualisation est utilisée pour les grandes listes
const shouldVirtualize = movies.length > 100;
```

3. **Images optimisées** :
```typescript
// Utiliser des images WebP et de taille appropriée
const imageOptions = {
  width: 280,
  height: 420,
  quality: 85,
  format: 'webp'
};
```

### Commandes de debug

```bash
# Analyser la taille du bundle
npm run build
npm run analyze

# Vérifier les deps
npm ls @sentry/nextjs react-window recharts

# Nettoyer et reconstruire
rm -rf .next node_modules
npm install
npm run build
```

### Monitoring post-migration

1. **Métriques Sentry à surveiller** :
   - Temps de chargement des pages media
   - Taux d'erreur API
   - Performance du cache
   - Erreurs JavaScript

2. **Métriques côté serveur** :
   - Charge CPU/RAM
   - Temps de réponse Emby
   - Bande passante images

3. **Métriques utilisateur** :
   - Temps de première interaction
   - Core Web Vitals
   - Taux de rebond

### Support et assistance

Si vous rencontrez des problèmes non résolus :

1. **Vérifiez les logs Sentry** pour les erreurs détaillées
2. **Consultez la documentation Emby** pour les paramètres API
3. **Activez le mode debug** pour plus de détails :

```typescript
// Mode debug temporaire
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Enhanced Media API Debug Info:', {
    cacheStatus: /* état du cache */,
    apiResponse: /* dernière réponse API */,
    performanceMetrics: /* métriques */
  });
}
```

## Conclusion

Cette migration apporte des améliorations significatives :

- **Observabilité** : Monitoring complet avec Sentry
- **Performance** : Cache intelligent et virtualisation
- **Fiabilité** : Gestion d'erreur robuste
- **UX** : Interface améliorée et fonctionnalités avancées

La migration progressive permet de minimiser les risques tout en bénéficiant des nouvelles fonctionnalités. N'hésitez pas à tester chaque étape en environnement de développement avant de déployer en production.

**Bonne migration ! 🚀**