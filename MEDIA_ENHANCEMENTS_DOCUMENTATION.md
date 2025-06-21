# Documentation des Améliorations Media

Cette documentation détaille les améliorations complètes apportées aux pages Media et Media Detail, incluant l'instrumentation Sentry, l'optimisation des performances et l'amélioration de l'expérience utilisateur.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Instrumentation Sentry](#instrumentation-sentry)
4. [Optimisations d'images](#optimisations-dimages)
5. [Gestion d'erreur](#gestion-derreur)
6. [Cache intelligent](#cache-intelligent)
7. [Performance et virtualisation](#performance-et-virtualisation)
8. [Filtres et recherche avancés](#filtres-et-recherche-avancés)
9. [Types TypeScript](#types-typescript)
10. [Guide de migration](#guide-de-migration)

## Vue d'ensemble

Les améliorations apportées visent à transformer l'expérience media en une solution robuste, performante et observable. Les principales améliorations incluent :

- **Instrumentation Sentry complète** pour l'observabilité
- **Cache intelligent** avec TTL pour optimiser les performances
- **Optimisation des images Emby** avec paramètres avancés
- **Gestion d'erreur robuste** avec error boundaries
- **Virtualisation** pour les grandes listes
- **Filtres et recherche avancés**
- **Types TypeScript stricts** pour la sécurité

## Architecture

### Composants principaux

```
src/
├── types/media.ts                           # Types TypeScript stricts
├── lib/enhanced-media-api.ts                # API améliorée avec Sentry
├── components/error-boundary.tsx            # Error boundaries
├── features/media/components/
│   ├── enhanced-media-movie-list.tsx        # Liste améliorée
│   └── media-detail-view.tsx                # Vue détail améliorée
```

### Flux de données

```
User Action → Component → Enhanced API → Sentry Spans → Cache Check → Emby API → Response Processing → UI Update
```

## Instrumentation Sentry

### Configuration de base

L'instrumentation Sentry est configurée dans `instrumentation-client.ts` avec :

```typescript
Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] })
  ],
  _experiments: { enableLogs: true },
});
```

### Spans et traces

Chaque opération importante est instrumentée avec des spans :

```typescript
return Sentry.startSpan(
  { op: "media.load_movies", name: "Load Movies" },
  async (span) => {
    span.setAttribute("user.id", userId);
    span.setAttribute("total_movies", count);
    // ... opération
  }
);
```

### Types de spans utilisés

- `media.load_movies` - Chargement des films
- `media.get_latest` - Films récents
- `media.toggle_favorite` - Gestion des favoris
- `cache.get/set` - Opérations de cache
- `http.client` - Requêtes API
- `ui.click` - Interactions utilisateur
- `filter.movies` - Filtrage et tri
- `analytics.calculate` - Calculs statistiques
- `performance.measure` - Métriques de performance

### Logs structurés

```typescript
const { logger } = Sentry;

logger.info(logger.fmt`Movies loaded successfully: ${count}`, {
  userId,
  count,
  loadTime: metrics.loadTime,
});

logger.error(logger.fmt`Failed to load movies: ${error}`, {
  userId,
  error: errorMsg,
  statusCode: result.status,
});
```

## Optimisations d'images

### API d'optimisation

```typescript
enhancedMediaAPI.getOptimizedImageUrl(
  itemId,
  imageType,
  {
    width: 280,
    height: 420,
    quality: 85,
    format: 'webp',
    tag: movie.ImageTags?.Primary,
    cropWhitespace: true,
    enableImageEnhancers: true,
  }
);
```

### Types d'images supportés

- `Primary` - Affiche principale
- `Backdrop` - Image de fond
- `Logo` - Logo du film
- `Thumb` - Miniature

### Paramètres d'optimisation

```typescript
interface ImageOptions {
  width?: number;           // Largeur fixe
  height?: number;          // Hauteur fixe
  quality?: number;         // 0-100, défaut 90
  format?: 'original' | 'gif' | 'jpg' | 'png' | 'webp';
  tag?: string;             // Tag de cache Emby
  cropWhitespace?: boolean; // Recadrage automatique
  enableImageEnhancers?: boolean; // Améliorations d'image
  addPlayedIndicator?: boolean;   // Indicateur "vu"
  percentPlayed?: number;   // Pourcentage de lecture
  backgroundColor?: string; // Couleur de fond
}
```

## Gestion d'erreur

### Error Boundary

```typescript
import { MediaErrorBoundary } from '@/components/error-boundary';

<MediaErrorBoundary>
  <EnhancedMediaMovieList userId={userId} />
</MediaErrorBoundary>
```

### Types d'erreurs capturées

- Erreurs React (composants)
- Erreurs réseau (API)
- Erreurs de parsing (JSON)
- Erreurs de cache
- Erreurs d'images

### Fallback UI

L'error boundary fournit :
- Message d'erreur utilisateur-friendly
- ID d'erreur Sentry pour le support
- Bouton de retry
- Détails techniques (développeur)

## Cache intelligent

### Configuration TTL

```typescript
const CACHE_TTL = {
  MOVIES: 5 * 60 * 1000,        // 5 minutes
  LATEST_MOVIES: 2 * 60 * 1000, // 2 minutes
  USERS: 30 * 60 * 1000,        // 30 minutes
  MOVIE_DETAILS: 10 * 60 * 1000, // 10 minutes
};
```

### Stratégies de cache

1. **Cache de requête simple** - Films principaux
2. **Cache par ID** - Détails de films individuels
3. **Invalidation intelligente** - Après modifications
4. **Expiration automatique** - Basée sur TTL

### API de cache

```typescript
// Récupération avec cache
const cached = this.cache.get<EmbyMovie[]>('movies');
if (cached) {
  return { ok: true, body: cached };
}

// Mise en cache après récupération
if (response.ok && response.body) {
  this.cache.set('movies', response.body, CACHE_TTL.MOVIES);
}

// Invalidation spécifique
this.cache.clearMovieDetails(movieId);
```

## Performance et virtualisation

### Virtualisation de grille

```typescript
import { FixedSizeGrid as Grid } from 'react-window';

<Grid
  columnCount={columnCount}
  columnWidth={ITEM_WIDTH + GAP}
  height={600}
  rowCount={Math.ceil(movies.length / columnCount)}
  rowHeight={ITEM_HEIGHT + GAP}
  width={containerWidth}
  itemData={itemData}
  overscanRowCount={2}
>
  {MovieItem}
</Grid>
```

### Métriques de performance

```typescript
interface PerformanceMetrics {
  loadTime: number;         // Temps de chargement
  renderTime: number;       // Temps de rendu
  apiResponseTime: number;  // Temps de réponse API
  imageLoadTime: number;    // Temps de chargement d'images
  scrollPerformance: number; // Performance de défilement
}
```

### Optimisations appliquées

- **Lazy loading** des images
- **Memoization** des composants coûteux
- **Debouncing** de la recherche
- **Pagination** intelligente
- **Overscan** minimal pour la virtualisation

## Filtres et recherche avancés

### Options de recherche

```typescript
interface SearchOptions {
  query: string;                    // Recherche textuelle
  sortBy: 'title' | 'year' | 'rating' | 'runtime' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
  filters: Partial<MediaFilters>;
  page: number;
  pageSize: number;
}
```

### Filtres disponibles

```typescript
interface MediaFilters {
  genres: string[];                 // Filtres par genre
  years: [number, number];          // Plage d'années
  ratings: [number, number];        // Plage de notes
  runtime: [number, number];        // Plage de durée
  status: ('watched' | 'unwatched')[]; // Statut vu/non vu
  quality: string[];                // Qualité vidéo
  studios: string[];                // Studios
}
```

### Hooks personnalisés

```typescript
// Hook pour les filtres
const useMovieFilters = (allMovies, searchOptions) => {
  return useMemo(() => {
    // Logique de filtrage et tri avec instrumentation Sentry
  }, [allMovies, searchOptions]);
};

// Hook pour les statistiques
const useMovieStats = (movies) => {
  return useMemo(() => {
    // Calcul des statistiques avec traces Sentry
  }, [movies]);
};
```

## Types TypeScript

### Types principaux

```typescript
// Film Emby complet
interface EmbyMovie {
  Id: string;
  Name: string;
  ProductionYear?: number;
  CommunityRating?: number;
  // ... 100+ propriétés typées
}

// Réponse API standardisée
interface ApiResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  body: T | null;
  error?: Error;
}

// Cache avec TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
```

### Types d'erreur

```typescript
interface MediaError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}
```

### Props de composants

```typescript
interface MediaListProps {
  userId: string;
  initialData?: EmbyQueryResult<EmbyMovie>;
  filters?: Partial<MediaFilters>;
  searchOptions?: Partial<SearchOptions>;
}
```

## Guide de migration

### Étape 1 : Installation des dépendances

```bash
# Dépendances principales
npm install @sentry/nextjs react-window react-window-infinite-loader

# Types TypeScript
npm install -D @types/react-window
```

### Étape 2 : Configuration Sentry

1. Copier la configuration dans `instrumentation-client.ts`
2. Ajouter les variables d'environnement Sentry
3. Configurer le DSN dans les configs

### Étape 3 : Migration des types

```typescript
// Ancien
type EmbyMovie = {
  Id: string;
  Name: string;
  // types minimaux
};

// Nouveau
import { EmbyMovie } from '@/types/media';
// types complets avec 100+ propriétés
```

### Étape 4 : Migration de l'API

```typescript
// Ancien
import { mediaAPI } from '@/lib/media-api';

// Nouveau
import { enhancedMediaAPI } from '@/lib/enhanced-media-api';

// Utilisation avec cache et instrumentation
const response = await enhancedMediaAPI.getMovies(userId);
```

### Étape 5 : Migration des composants

```typescript
// Ancien
import { MediaMovieList } from '@/features/media/components/media-movie-list';

// Nouveau
import { EnhancedMediaMovieList } from '@/features/media/components/enhanced-media-movie-list';

<EnhancedMediaMovieList
  userId={userId}
  initialData={data}
  searchOptions={{ sortBy: 'rating', pageSize: 50 }}
/>
```

### Étape 6 : Ajout de l'error boundary

```typescript
import { MediaErrorBoundary } from '@/components/error-boundary';

// Wrapper autour des composants media
<MediaErrorBoundary>
  <EnhancedMediaMovieList userId={userId} />
</MediaErrorBoundary>
```

### Étape 7 : Optimisation des images

```typescript
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
  }
);
```

## Tests de régression

### Tests unitaires

```typescript
import { enhancedMediaAPI } from '@/lib/enhanced-media-api';

describe('Enhanced Media API', () => {
  test('should cache movies correctly', async () => {
    const response1 = await enhancedMediaAPI.getMovies('user1');
    const response2 = await enhancedMediaAPI.getMovies('user1');
    
    expect(response2.statusText).toBe('OK (Cached)');
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

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { EnhancedMediaMovieList } from './enhanced-media-movie-list';

describe('Enhanced Media Movie List', () => {
  test('should load and display movies', async () => {
    render(<EnhancedMediaMovieList userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('films trouvés')).toBeInTheDocument();
    });
  });

  test('should handle search and filtering', async () => {
    render(<EnhancedMediaMovieList userId="test-user" />);
    
    const searchInput = screen.getByPlaceholderText('Rechercher par titre, année...');
    fireEvent.change(searchInput, { target: { value: 'Inception' } });
    
    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
    });
  });
});
```

### Tests de performance

```typescript
describe('Performance Tests', () => {
  test('should handle large datasets efficiently', async () => {
    const startTime = performance.now();
    
    render(
      <EnhancedMediaMovieList 
        userId="test-user" 
        initialData={{ Items: generateLargeMovieList(10000) }}
      />
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // < 1 seconde
  });
});
```

## Monitoring et alertes

### Métriques Sentry à surveiller

1. **Temps de chargement** - `media.load_movies` spans
2. **Taux d'erreur** - Erreurs API et composants
3. **Performance du cache** - Hit/miss ratios
4. **Temps de réponse API** - `http.client` spans
5. **Erreurs d'images** - Échecs de chargement

### Alertes recommandées

```yaml
# Alertes Sentry
- name: "High API Error Rate"
  condition: "error_rate > 5%"
  timeframe: "5 minutes"

- name: "Slow Movie Loading"
  condition: "avg(media.load_movies) > 3000ms"
  timeframe: "10 minutes"

- name: "Low Cache Hit Rate"
  condition: "cache_hit_rate < 80%"
  timeframe: "15 minutes"
```

## Optimisations futures

### Améliorations prévues

1. **Service Worker** pour le cache offline
2. **Streaming** pour les très grandes listes
3. **Préchargement intelligent** des images
4. **Recherche full-text** avec indexation
5. **Synchronisation temps réel** avec Emby
6. **Filtres géographiques** par localisation
7. **Recommandations ML** basées sur l'historique

### Roadmap technique

- **Q1 2024** - Service Worker et cache offline
- **Q2 2024** - Recherche full-text et indexation
- **Q3 2024** - Synchronisation temps réel
- **Q4 2024** - Intelligence artificielle et recommandations

## Conclusion

Ces améliorations transforment l'interface media en une solution entreprise robuste avec :

- **Observabilité complète** via Sentry
- **Performance optimisée** avec virtualisation et cache
- **Expérience utilisateur améliorée** avec filtres avancés
- **Fiabilité accrue** avec error boundaries
- **Maintenabilité** via TypeScript strict

L'architecture modulaire permet une évolution continue et l'ajout progressif de nouvelles fonctionnalités tout en maintenant la compatibilité et les performances.