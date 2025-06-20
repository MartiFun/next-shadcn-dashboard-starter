import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  EmbyMovie, 
  MovieFilters, 
  MovieSort, 
  MovieDisplayOptions, 
  MovieStats,
  PaginationState 
} from '@/types/media';

interface MovieState {
  // Data
  movies: EmbyMovie[];
  loading: boolean;
  error: string | null;
  
  // Filters & Search
  filters: MovieFilters;
  sort: MovieSort;
  
  // Display preferences
  displayOptions: MovieDisplayOptions;
  
  // Pagination
  pagination: PaginationState;
  
  // User preferences (persisted)
  favorites: Set<string>;
  watchHistory: Record<string, { watchedAt: string; progress?: number }>;
  userRatings: Record<string, number>;
  
  // UI state
  selectedMovies: Set<string>;
  hoveredMovie: string | null;
  
  // Latest/featured
  latestMovies: EmbyMovie[];
  featuredMovie: EmbyMovie | null;
}

interface MovieActions {
  // Data management
  setMovies: (movies: EmbyMovie[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filters & Search
  setFilters: (filters: Partial<MovieFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: MovieSort) => void;
  
  // Display preferences
  setDisplayOptions: (options: Partial<MovieDisplayOptions>) => void;
  
  // Pagination
  setPagination: (pagination: Partial<PaginationState>) => void;
  goToPage: (page: number) => void;
  
  // User actions
  toggleFavorite: (movieId: string) => void;
  markWatched: (movieId: string, progress?: number) => void;
  markUnwatched: (movieId: string) => void;
  setUserRating: (movieId: string, rating: number) => void;
  
  // Selection
  toggleSelection: (movieId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setHoveredMovie: (movieId: string | null) => void;
  
  // Latest/featured
  setLatestMovies: (movies: EmbyMovie[]) => void;
  setFeaturedMovie: (movie: EmbyMovie | null) => void;
  
  // Computed getters
  getFilteredMovies: () => EmbyMovie[];
  getStats: () => MovieStats;
  isMovieFavorite: (movieId: string) => boolean;
  isMovieWatched: (movieId: string) => boolean;
  getMovieProgress: (movieId: string) => number;
  getUserRating: (movieId: string) => number | null;
}

const defaultDisplayOptions: MovieDisplayOptions = {
  view: 'grid',
  density: 'comfortable',
  showOverlay: true,
  showGenres: true,
  showRating: true,
  showDuration: true,
  showYear: true,
  showProgress: true,
};

const defaultSort: MovieSort = {
  field: 'title',
  order: 'asc',
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0,
};

type StoreType = MovieState & MovieActions;

export const useMovieStore = create<StoreType>()(
  persist(
    (set, get) => ({
      // Initial state
      movies: [],
      loading: false,
      error: null,
      filters: {},
      sort: defaultSort,
      displayOptions: defaultDisplayOptions,
      pagination: defaultPagination,
      favorites: new Set(),
      watchHistory: {},
      userRatings: {},
      selectedMovies: new Set(),
      hoveredMovie: null,
      latestMovies: [],
      featuredMovie: null,

      // Actions
      setMovies: (movies: EmbyMovie[]) => set({ movies, error: null }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error, loading: false }),

      setFilters: (newFilters: Partial<MovieFilters>) => set((state: StoreType) => ({
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 }
      })),
      
      resetFilters: () => set((state: StoreType) => ({
        filters: {},
        pagination: { ...state.pagination, page: 1 }
      })),
      
      setSort: (sort: MovieSort) => set({ sort }),
      
      setDisplayOptions: (options: Partial<MovieDisplayOptions>) => set((state: StoreType) => ({
        displayOptions: { ...state.displayOptions, ...options }
      })),
      
      setPagination: (newPagination: Partial<PaginationState>) => set((state: StoreType) => ({
        pagination: { ...state.pagination, ...newPagination }
      })),
      
      goToPage: (page: number) => set((state: StoreType) => ({
        pagination: { ...state.pagination, page }
      })),
      
      toggleFavorite: (movieId: string) => set((state: StoreType) => {
        const newFavorites = new Set(state.favorites);
        if (newFavorites.has(movieId)) {
          newFavorites.delete(movieId);
        } else {
          newFavorites.add(movieId);
        }
        return { favorites: newFavorites };
      }),
      
      markWatched: (movieId: string, progress = 100) => set((state: StoreType) => ({
        watchHistory: {
          ...state.watchHistory,
          [movieId]: { watchedAt: new Date().toISOString(), progress }
        }
      })),
      
      markUnwatched: (movieId: string) => set((state: StoreType) => {
        const newHistory = { ...state.watchHistory };
        delete newHistory[movieId];
        return { watchHistory: newHistory };
      }),
      
      setUserRating: (movieId: string, rating: number) => set((state: StoreType) => ({
        userRatings: { ...state.userRatings, [movieId]: rating }
      })),
      
      toggleSelection: (movieId: string) => set((state: StoreType) => {
        const newSelection = new Set(state.selectedMovies);
        if (newSelection.has(movieId)) {
          newSelection.delete(movieId);
        } else {
          newSelection.add(movieId);
        }
        return { selectedMovies: newSelection };
      }),
      
      selectAll: () => {
        const filteredMovies = get().getFilteredMovies();
        set({ selectedMovies: new Set(filteredMovies.map(m => m.Id)) });
      },
      
      clearSelection: () => set({ selectedMovies: new Set() }),
      
      setHoveredMovie: (movieId: string | null) => set({ hoveredMovie: movieId }),
      
      setLatestMovies: (latestMovies: EmbyMovie[]) => set({ latestMovies }),
      
      setFeaturedMovie: (featuredMovie: EmbyMovie | null) => set({ featuredMovie }),
      
      // Computed getters
      getFilteredMovies: (): EmbyMovie[] => {
        const { movies, filters, sort } = get();
        let filtered = [...movies];
        
        // Apply filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter((movie: EmbyMovie) =>
            movie.Name.toLowerCase().includes(searchLower) ||
            movie.OriginalTitle?.toLowerCase().includes(searchLower) ||
            movie.Overview?.toLowerCase().includes(searchLower) ||
            movie.Genres?.some((g: string) => g.toLowerCase().includes(searchLower)) ||
            movie.People?.some((p: any) => p.Name.toLowerCase().includes(searchLower))
          );
        }
        
        if (filters.genres && filters.genres.length > 0) {
          filtered = filtered.filter((movie: EmbyMovie) =>
            movie.Genres?.some((g: string) => filters.genres!.includes(g))
          );
        }
        
        if (filters.years) {
          const [minYear, maxYear] = filters.years;
          filtered = filtered.filter(movie =>
            movie.ProductionYear && 
            movie.ProductionYear >= minYear && 
            movie.ProductionYear <= maxYear
          );
        }
        
        if (filters.rating) {
          const [minRating, maxRating] = filters.rating;
          filtered = filtered.filter(movie =>
            movie.CommunityRating && 
            movie.CommunityRating >= minRating && 
            movie.CommunityRating <= maxRating
          );
        }
        
        if (filters.watched !== null && filters.watched !== undefined) {
          const { watchHistory } = get();
          filtered = filtered.filter(movie => {
            const isWatched = movie.UserData?.Played || watchHistory[movie.Id];
            return filters.watched ? isWatched : !isWatched;
          });
        }
        
        if (filters.favorite !== null && filters.favorite !== undefined) {
          const { favorites } = get();
          filtered = filtered.filter(movie => {
            const isFavorite = movie.UserData?.IsFavorite || favorites.has(movie.Id);
            return filters.favorite ? isFavorite : !isFavorite;
          });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sort.field) {
            case 'title':
              aValue = a.Name.toLowerCase();
              bValue = b.Name.toLowerCase();
              break;
            case 'year':
              aValue = a.ProductionYear || 0;
              bValue = b.ProductionYear || 0;
              break;
            case 'rating':
              aValue = a.CommunityRating || 0;
              bValue = b.CommunityRating || 0;
              break;
            case 'duration':
              aValue = a.RunTimeTicks || 0;
              bValue = b.RunTimeTicks || 0;
              break;
            case 'dateAdded':
              aValue = new Date(a.DateCreated || 0).getTime();
              bValue = new Date(b.DateCreated || 0).getTime();
              break;
            default:
              return 0;
          }
          
          if (sort.order === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        return filtered;
      },
      
      getStats: (): MovieStats => {
        const { movies, favorites, watchHistory } = get();
        const filteredMovies = get().getFilteredMovies();
        
        const watched = filteredMovies.filter(m => 
          m.UserData?.Played || watchHistory[m.Id]
        ).length;
        
        const favCount = filteredMovies.filter(m => 
          m.UserData?.IsFavorite || favorites.has(m.Id)
        ).length;
        
        const totalRuntime = filteredMovies.reduce((acc: number, m: EmbyMovie) => 
          acc + (m.RunTimeTicks ? Math.round(m.RunTimeTicks / 10000000 / 60) : 0), 0
        );
        
        const averageRating = filteredMovies.reduce((acc: number, m: EmbyMovie) => 
          acc + (m.CommunityRating || 0), 0
        ) / filteredMovies.length || 0;
        
        const averageYear = filteredMovies.reduce((acc: number, m: EmbyMovie) => 
          acc + (m.ProductionYear || 0), 0
        ) / filteredMovies.length || 0;
        
        const genreDistribution: Record<string, number> = {};
        filteredMovies.forEach((m: EmbyMovie) => {
          m.Genres?.forEach((g: string) => {
            genreDistribution[g] = (genreDistribution[g] || 0) + 1;
          });
        });
        
        const yearDistribution: Record<number, number> = {};
        filteredMovies.forEach((m: EmbyMovie) => {
          if (m.ProductionYear) {
            yearDistribution[m.ProductionYear] = (yearDistribution[m.ProductionYear] || 0) + 1;
          }
        });
        
        const ratingDistribution: Record<string, number> = {};
        filteredMovies.forEach((m: EmbyMovie) => {
          if (m.OfficialRating) {
            ratingDistribution[m.OfficialRating] = (ratingDistribution[m.OfficialRating] || 0) + 1;
          }
        });
        
        return {
          total: filteredMovies.length,
          watched,
          unwatched: filteredMovies.length - watched,
          favorites: favCount,
          totalRuntime,
          averageRating,
          averageYear,
          genreDistribution,
          yearDistribution,
          ratingDistribution,
        };
      },
      
      isMovieFavorite: (movieId: string): boolean => {
        const { favorites, movies } = get();
        const movie = movies.find((m: EmbyMovie) => m.Id === movieId);
        return movie?.UserData?.IsFavorite || favorites.has(movieId) || false;
      },
      
      isMovieWatched: (movieId: string): boolean => {
        const { watchHistory, movies } = get();
        const movie = movies.find((m: EmbyMovie) => m.Id === movieId);
        return movie?.UserData?.Played || !!watchHistory[movieId] || false;
      },
      
      getMovieProgress: (movieId: string): number => {
        const { watchHistory, movies } = get();
        const movie = movies.find((m: EmbyMovie) => m.Id === movieId);
        return movie?.UserData?.PlayedPercentage || 
               watchHistory[movieId]?.progress || 
               (get().isMovieWatched(movieId) ? 100 : 0);
      },
      
      getUserRating: (movieId: string): number | null => {
        const { userRatings } = get();
        return userRatings[movieId] || null;
      },
    }),
    {
      name: 'movie-store',
      partialize: (state: StoreType) => ({
        displayOptions: state.displayOptions,
        favorites: Array.from(state.favorites),
        watchHistory: state.watchHistory,
        userRatings: state.userRatings,
      }),
      onRehydrateStorage: () => (state: any) => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites);
        }
      },
    }
  )
);