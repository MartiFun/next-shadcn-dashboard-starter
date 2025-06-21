// API Media améliorée avec instrumentation Sentry et optimisations
import * as Sentry from "@sentry/nextjs";
import { 
  EmbyMovie, 
  EmbyUser, 
  EmbyQueryResult, 
  ApiResponse, 
  MediaError, 
  CacheEntry, 
  MediaCache as MediaCacheInterface, 
  ImageOptions, 
  SearchOptions, 
  MediaFilters,
  PerformanceMetrics
} from '@/types/media';

const { logger } = Sentry;

// Variables d'environnement
const EMBY_BASE_URL = typeof window !== 'undefined' ? 
  (window as any).ENV?.NEXT_PUBLIC_EMBY_URL || '' : 
  '';
const EMBY_API_KEY = typeof window !== 'undefined' ? 
  (window as any).ENV?.NEXT_PUBLIC_EMBY_API_KEY || '' : 
  '';

// Configuration du cache avec TTL
const CACHE_TTL = {
  MOVIES: 5 * 60 * 1000, // 5 minutes
  LATEST_MOVIES: 2 * 60 * 1000, // 2 minutes
  USERS: 30 * 60 * 1000, // 30 minutes
  MOVIE_DETAILS: 10 * 60 * 1000, // 10 minutes
};

class MediaCache {
  private cache: MediaCacheInterface = {
    movies: null,
    latestMovies: null,
    users: null,
    movieDetails: {},
  };

  private isExpired<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return true;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  get<T>(key: keyof MediaCacheInterface): T | null {
    return Sentry.startSpan(
      { op: "cache.get", name: `Get cache entry: ${key}` },
      (span: any) => {
        span.setAttribute("cache.key", key);
        
        const entry = this.cache[key] as CacheEntry<T> | null;
        const expired = this.isExpired(entry);
        
        span.setAttribute("cache.hit", !expired && !!entry);
        span.setAttribute("cache.expired", expired);
        
        if (expired || !entry) {
          logger.debug(logger.fmt`Cache miss for key: ${key}`, { key, expired });
          return null;
        }
        
        logger.debug(logger.fmt`Cache hit for key: ${key}`, { key });
        return entry.data;
      }
    );
  }

  set<T>(key: keyof MediaCacheInterface, data: T, ttl: number): void {
    return Sentry.startSpan(
      { op: "cache.set", name: `Set cache entry: ${key}` },
      (span: any) => {
        span.setAttribute("cache.key", key);
        span.setAttribute("cache.ttl", ttl);
        
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        
        (this.cache as any)[key] = entry;
        logger.debug(logger.fmt`Cache set for key: ${key}`, { key, ttl });
      }
    );
  }

  getMovieDetails(movieId: string): EmbyMovie | null {
    return Sentry.startSpan(
      { op: "cache.get", name: "Get movie details from cache" },
      (span: any) => {
        span.setAttribute("movie.id", movieId);
        
        const entry = this.cache.movieDetails[movieId];
        const expired = this.isExpired(entry);
        
        span.setAttribute("cache.hit", !expired && !!entry);
        span.setAttribute("cache.expired", expired);
        
        if (expired || !entry) {
          logger.debug(logger.fmt`Movie details cache miss: ${movieId}`, { movieId });
          return null;
        }
        
        logger.debug(logger.fmt`Movie details cache hit: ${movieId}`, { movieId });
        return entry.data;
      }
    );
  }

  setMovieDetails(movieId: string, data: EmbyMovie): void {
    return Sentry.startSpan(
      { op: "cache.set", name: "Set movie details in cache" },
      (span: any) => {
        span.setAttribute("movie.id", movieId);
        
        this.cache.movieDetails[movieId] = {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL.MOVIE_DETAILS,
        };
        
        logger.debug(logger.fmt`Movie details cached: ${movieId}`, { movieId });
      }
    );
  }

  clearMovieDetails(movieId: string): void {
    delete this.cache.movieDetails[movieId];
    logger.debug(logger.fmt`Cleared movie cache: ${movieId}`, { movieId });
  }

  clear(): void {
    this.cache = {
      movies: null,
      latestMovies: null,
      users: null,
      movieDetails: {},
    };
    logger.info("Media cache cleared");
  }
}

class EnhancedMediaAPI {
  private baseUrl: string;
  private apiKey: string;
  private cache: MediaCache;

  constructor() {
    this.baseUrl = EMBY_BASE_URL;
    this.apiKey = EMBY_API_KEY;
    this.cache = new MediaCache();

    if (!this.baseUrl || !this.apiKey) {
      logger.warn("Emby configuration missing", {
        hasBaseUrl: !!this.baseUrl,
        hasApiKey: !!this.apiKey,
      });
    }
  }

  private createMediaError(message: string, statusCode?: number, context?: Record<string, any>): MediaError {
    const error = new Error(message) as MediaError;
    error.name = 'MediaError';
    error.statusCode = statusCode;
    error.context = context;
    return error;
  }

  private async fetchWithInstrumentation<T>(
    url: string,
    options: RequestInit = {},
    operationName: string
  ): Promise<ApiResponse<T>> {
    return Sentry.startSpan(
      { op: "http.client", name: operationName },
      async (span: any) => {
        const startTime = performance.now();
        
        span.setAttribute("http.method", options.method || 'GET');
        span.setAttribute("http.url", url);
        
        try {
          logger.debug(logger.fmt`Making API request: ${operationName}`, { url, method: options.method || 'GET' });
          
          const response = await fetch(url, {
            ...options,
            headers: {
              'X-Emby-Token': this.apiKey,
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          const responseTime = performance.now() - startTime;
          span.setAttribute("http.status_code", response.status);
          span.setAttribute("http.response_time", responseTime);

          if (!response.ok) {
            const errorText = await response.text();
            const error = this.createMediaError(
              `API request failed: ${response.statusText}`,
              response.status,
              { url, responseText: errorText }
            );
            
            Sentry.captureException(error);
            logger.error(logger.fmt`API request failed: ${operationName}`, {
              status: response.status,
              statusText: response.statusText,
              url,
              responseTime,
            });

            return {
              ok: false,
              status: response.status,
              statusText: response.statusText,
              body: null,
              error,
            };
          }

          const body = await response.json();
          
          logger.info(logger.fmt`API request successful: ${operationName}`, {
            status: response.status,
            responseTime,
            dataSize: JSON.stringify(body).length,
          });

          return {
            ok: true,
            status: response.status,
            statusText: response.statusText,
            body,
          };

        } catch (error) {
          const responseTime = performance.now() - startTime;
          const mediaError = this.createMediaError(
            `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            0,
            { url, originalError: error }
          );

          span.setAttribute("error", true);
          span.setAttribute("http.response_time", responseTime);
          
          Sentry.captureException(mediaError);
          logger.error(logger.fmt`Network error in ${operationName}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            url,
            responseTime,
          });

          return {
            ok: false,
            status: 0,
            statusText: 'Network Error',
            body: null,
            error: mediaError,
          };
        }
      }
    );
  }

  // Optimisation des URLs d'images Emby
  getOptimizedImageUrl(
    itemId: string,
    imageType: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb' = 'Primary',
    options: ImageOptions = {}
  ): string {
    return Sentry.startSpan(
      { op: "image.url_generation", name: "Generate optimized image URL" },
      (span: any) => {
        span.setAttribute("image.item_id", itemId);
        span.setAttribute("image.type", imageType);
        span.setAttribute("image.width", options.width || 0);
        span.setAttribute("image.height", options.height || 0);
        span.setAttribute("image.quality", options.quality || 90);

        const params = new URLSearchParams();
        params.append('api_key', this.apiKey);
        
        if (options.width) params.append('Width', options.width.toString());
        if (options.height) params.append('Height', options.height.toString());
        if (options.quality) params.append('Quality', options.quality.toString());
        if (options.format) params.append('Format', options.format);
        if (options.tag) params.append('Tag', options.tag);
        if (options.cropWhitespace !== undefined) params.append('CropWhitespace', options.cropWhitespace.toString());
        if (options.enableImageEnhancers !== undefined) params.append('EnableImageEnhancers', options.enableImageEnhancers.toString());
        if (options.addPlayedIndicator !== undefined) params.append('AddPlayedIndicator', options.addPlayedIndicator.toString());
        if (options.percentPlayed !== undefined) params.append('PercentPlayed', options.percentPlayed.toString());
        if (options.unplayedCount !== undefined) params.append('UnplayedCount', options.unplayedCount.toString());
        if (options.backgroundColor) params.append('BackgroundColor', options.backgroundColor);

        const url = `${this.baseUrl}/Items/${itemId}/Images/${imageType}?${params.toString()}`;
        
        logger.debug(logger.fmt`Generated optimized image URL for ${itemId}`, {
          itemId,
          imageType,
          options,
          url,
        });

        return url;
      }
    );
  }

  // Test de l'authentification avec instrumentation
  async testAuth(): Promise<ApiResponse<any>> {
    return this.fetchWithInstrumentation<any>(
      `${this.baseUrl}/System/Info`,
      {},
      "Test Emby Authentication"
    );
  }

  // Récupération des utilisateurs avec cache
  async getUsers(): Promise<ApiResponse<{ Items: EmbyUser[] }>> {
    return Sentry.startSpan(
      { op: "media.get_users", name: "Get Emby Users" },
      async () => {
        // Vérifier le cache d'abord
        const cached = this.cache.get<{ Items: EmbyUser[] }>('users');
        if (cached) {
          logger.debug("Using cached users data");
          return {
            ok: true,
            status: 200,
            statusText: 'OK (Cached)',
            body: cached,
          };
        }

        const response = await this.fetchWithInstrumentation<{ Items: EmbyUser[] }>(
          `${this.baseUrl}/Users/Query?api_key=${this.apiKey}`,
          {},
          "Get Emby Users"
        );

        if (response.ok && response.body) {
          this.cache.set('users', response.body, CACHE_TTL.USERS);
        }

        return response;
      }
    );
  }

  // Récupération des films avec cache et filtres avancés
  async getMovies(
    userId: string,
    options: Partial<SearchOptions> = {}
  ): Promise<ApiResponse<EmbyQueryResult<EmbyMovie>>> {
    return Sentry.startSpan(
      { op: "media.get_movies", name: "Get Emby Movies" },
      async (span: any) => {
        span.setAttribute("user.id", userId);
        span.setAttribute("search.query", options.query || '');
        span.setAttribute("search.sort_by", options.sortBy || 'rating');
        span.setAttribute("search.page", options.page || 1);
        span.setAttribute("search.page_size", options.pageSize || 50);

        // Vérifier le cache pour les requêtes simples (sans filtres)
        const isSimpleQuery = !options.query && !options.filters && options.page === 1;
        if (isSimpleQuery) {
          const cached = this.cache.get<EmbyQueryResult<EmbyMovie>>('movies');
          if (cached) {
            logger.debug("Using cached movies data", { userId });
            return {
              ok: true,
              status: 200,
              statusText: 'OK (Cached)',
              body: cached,
            };
          }
        }

        const params = new URLSearchParams({
          Recursive: 'true',
          IncludeItemTypes: 'Movie',
          Fields: 'Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData,People,Studios,Overview,Taglines,OfficialRating,CriticRating,RemoteTrailers,ExternalUrls,ProviderIds,MediaSources',
          UserId: userId,
          api_key: this.apiKey,
        });

        // Ajouter les paramètres de recherche et tri
        if (options.query) {
          params.append('SearchTerm', options.query);
        }

        if (options.sortBy) {
          const sortMap: Record<string, string> = {
            title: 'SortName',
            year: 'ProductionYear',
            rating: 'CommunityRating',
            runtime: 'RunTimeTicks',
            dateAdded: 'DateCreated',
          };
          params.append('SortBy', sortMap[options.sortBy] || 'SortName');
          params.append('SortOrder', options.sortOrder === 'asc' ? 'Ascending' : 'Descending');
        }

        if (options.page && options.pageSize) {
          params.append('StartIndex', ((options.page - 1) * options.pageSize).toString());
          params.append('Limit', options.pageSize.toString());
        }

        // Ajouter les filtres
        if (options.filters) {
          if (options.filters.genres?.length) {
            params.append('Genres', options.filters.genres.join(','));
          }
          if (options.filters.years) {
            params.append('Years', `${options.filters.years[0]},${options.filters.years[1]}`);
          }
          if (options.filters.studios?.length) {
            params.append('Studios', options.filters.studios.join(','));
          }
        }

        const url = `${this.baseUrl}/Users/${userId}/Items?${params.toString()}`;
        const response = await this.fetchWithInstrumentation<EmbyQueryResult<EmbyMovie>>(
          url,
          {},
          "Get Emby Movies"
        );

        // Mettre en cache seulement les requêtes simples
        if (response.ok && response.body && isSimpleQuery) {
          this.cache.set('movies', response.body, CACHE_TTL.MOVIES);
        }

        return response;
      }
    );
  }

  // Récupération des films récents avec cache
  async getLatestMovies(userId: string, limit: number = 10): Promise<ApiResponse<EmbyMovie[]>> {
    return Sentry.startSpan(
      { op: "media.get_latest_movies", name: "Get Latest Emby Movies" },
      async (span: any) => {
        span.setAttribute("user.id", userId);
        span.setAttribute("limit", limit);

        // Vérifier le cache
        const cached = this.cache.get<EmbyMovie[]>('latestMovies');
        if (cached) {
          logger.debug("Using cached latest movies data", { userId, limit });
          return {
            ok: true,
            status: 200,
            statusText: 'OK (Cached)',
            body: cached,
          };
        }

        const params = new URLSearchParams({
          IncludeItemTypes: 'Movie',
          Limit: limit.toString(),
          Fields: 'Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData,Overview',
          api_key: this.apiKey,
        });

        const url = `${this.baseUrl}/Users/${userId}/Items/Latest?${params.toString()}`;
        const response = await this.fetchWithInstrumentation<EmbyMovie[]>(
          url,
          {},
          "Get Latest Emby Movies"
        );

        if (response.ok && response.body) {
          this.cache.set('latestMovies', response.body, CACHE_TTL.LATEST_MOVIES);
        }

        return response;
      }
    );
  }

  // Récupération des détails d'un film avec cache
  async getMovieDetails(movieId: string, userId: string): Promise<ApiResponse<EmbyMovie>> {
    return Sentry.startSpan(
      { op: "media.get_movie_details", name: "Get Movie Details" },
      async (span: any) => {
        span.setAttribute("movie.id", movieId);
        span.setAttribute("user.id", userId);

        // Vérifier le cache
        const cached = this.cache.getMovieDetails(movieId);
        if (cached) {
          logger.debug(logger.fmt`Using cached movie details: ${movieId}`, { movieId, userId });
          return {
            ok: true,
            status: 200,
            statusText: 'OK (Cached)',
            body: cached,
          };
        }

        const params = new URLSearchParams({
          Fields: 'Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData,People,Studios,Overview,Taglines,OfficialRating,CriticRating,RemoteTrailers,ExternalUrls,ProviderIds,MediaSources,Chapters',
          UserId: userId,
          api_key: this.apiKey,
        });

        const url = `${this.baseUrl}/Users/${userId}/Items/${movieId}?${params.toString()}`;
        const response = await this.fetchWithInstrumentation<EmbyMovie>(
          url,
          {},
          "Get Movie Details"
        );

        if (response.ok && response.body) {
          this.cache.setMovieDetails(movieId, response.body);
        }

        return response;
      }
    );
  }

  // Gestion des favoris avec instrumentation
  async toggleFavorite(movieId: string, userId: string, isFavorite: boolean): Promise<ApiResponse<any>> {
    return Sentry.startSpan(
      { op: "media.toggle_favorite", name: "Toggle Movie Favorite" },
      async (span: any) => {
        span.setAttribute("movie.id", movieId);
        span.setAttribute("user.id", userId);
        span.setAttribute("is_favorite", isFavorite);

        const method = isFavorite ? 'DELETE' : 'POST';
        const url = `${this.baseUrl}/Users/${userId}/FavoriteItems/${movieId}?api_key=${this.apiKey}`;

        const response = await this.fetchWithInstrumentation<any>(
          url,
          { method },
          `${isFavorite ? 'Remove from' : 'Add to'} Favorites`
        );

        // Invalider le cache des détails du film
        if (response.ok) {
          this.cache.clearMovieDetails(movieId);
        }

        return response;
      }
    );
  }

  // Informations de lecture avec instrumentation
  async getPlaybackInfo(movieId: string, userId: string): Promise<ApiResponse<any>> {
    return Sentry.startSpan(
      { op: "media.playback_info", name: "Get Playback Info" },
      async (span: any) => {
        span.setAttribute("movie.id", movieId);
        span.setAttribute("user.id", userId);

        const url = `${this.baseUrl}/Items/${movieId}/PlaybackInfo?UserId=${userId}&api_key=${this.apiKey}`;
        
        return this.fetchWithInstrumentation<any>(
          url,
          {
            method: 'POST',
            body: JSON.stringify({
              Id: movieId,
              UserId: userId,
            }),
          },
          "Get Playback Info"
        );
      }
    );
  }

  // Métriques de performance
  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; metrics: Partial<PerformanceMetrics> }> {
    return Sentry.startSpan(
      { op: "performance.measure", name: `Measure: ${operationName}` },
      async (span: any) => {
        const startTime = performance.now();
        
        try {
          const result = await operation();
          const endTime = performance.now();
          const totalTime = endTime - startTime;

          const metrics: Partial<PerformanceMetrics> = {
            loadTime: totalTime,
          };

          span.setAttribute("performance.load_time", totalTime);
          span.setAttribute("performance.success", true);

          logger.info(logger.fmt`Performance measurement: ${operationName}`, {
            operationName,
            loadTime: totalTime,
            success: true,
          });

          return { result, metrics };

        } catch (error) {
          const endTime = performance.now();
          const totalTime = endTime - startTime;

          span.setAttribute("performance.load_time", totalTime);
          span.setAttribute("performance.success", false);
          span.setAttribute("error", true);

          logger.error(logger.fmt`Performance measurement failed: ${operationName}`, {
            operationName,
            loadTime: totalTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          throw error;
        }
      }
    );
  }

  // Nettoyage du cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Instance singleton
export const enhancedMediaAPI = new EnhancedMediaAPI();

// Export des types et utilitaires
export { MediaCache, CACHE_TTL };
export type { PerformanceMetrics };