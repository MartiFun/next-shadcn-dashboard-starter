'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useMovieStore } from '@/features/media/store/movie-store';
import { mediaAPI } from '@/lib/media-api';
import { useDebounce } from './use-debounce';
import { EmbyMovie, MovieFilters, MovieSort } from '@/types/media';

// Fallback si Sentry n'est pas disponible
let Sentry: any;
try {
  Sentry = require('@sentry/nextjs');
} catch {
  Sentry = {
    startSpan: (config: any, fn: any) => fn({ setAttribute: () => {}, setStatus: () => {} }),
    captureException: () => {},
  };
}

// Hook principal pour gérer les films
export function useMovies(userId: string) {
  const {
    movies,
    loading,
    error,
    setMovies,
    setLoading,
    setError,
    getFilteredMovies,
    getStats,
  } = useMovieStore();

  const loadMovies = useCallback(async () => {
    if (!userId) return;

    return Sentry.startSpan(
      {
        op: 'http.client',
        name: 'Load Emby Movies',
      },
      async (span) => {
        span.setAttribute('user.id', userId);
        setLoading(true);
        setError(null);

        try {
          const result = await mediaAPI.getEmbyMovies(userId);
          
          if (result.ok && result.body?.Items) {
            setMovies(result.body.Items);
            span.setAttribute('movies.count', result.body.Items.length);
            span.setStatus({ code: 1 }); // OK
          } else {
            const errorMsg = result.statusText || 'Erreur lors du chargement des films';
            setError(errorMsg);
            span.setAttribute('error.message', errorMsg);
            span.setStatus({ code: 2, message: errorMsg }); // ERROR
            Sentry.captureException(new Error(errorMsg));
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
          setError(errorMsg);
          span.setAttribute('error.message', errorMsg);
          span.setStatus({ code: 2, message: errorMsg });
          Sentry.captureException(err);
        } finally {
          setLoading(false);
        }
      }
    );
  }, [userId, setMovies, setLoading, setError]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const refetch = useCallback(() => {
    return loadMovies();
  }, [loadMovies]);

  const filteredMovies = useMemo(() => getFilteredMovies(), [getFilteredMovies]);
  const stats = useMemo(() => getStats(), [getStats]);

  return {
    movies: filteredMovies,
    allMovies: movies,
    loading,
    error,
    stats,
    refetch,
  };
}

// Hook pour les films récents/latest
export function useLatestMovies(userId: string) {
  const { latestMovies, setLatestMovies } = useMovieStore();

  const loadLatestMovies = useCallback(async () => {
    if (!userId) return;

    return Sentry.startSpan(
      {
        op: 'http.client',
        name: 'Load Latest Movies',
      },
      async (span) => {
        span.setAttribute('user.id', userId);

        try {
          const result = await mediaAPI.getEmbyLatestMovies(userId);
          
          if (result.ok && Array.isArray(result.body)) {
            setLatestMovies(result.body);
            span.setAttribute('latest_movies.count', result.body.length);
            span.setStatus({ code: 1 });
          } else {
            setLatestMovies([]);
            span.setStatus({ code: 2, message: 'Failed to load latest movies' });
          }
        } catch (err) {
          setLatestMovies([]);
          span.setStatus({ code: 2, message: 'Error loading latest movies' });
          Sentry.captureException(err);
        }
      }
    );
  }, [userId, setLatestMovies]);

  useEffect(() => {
    loadLatestMovies();
  }, [loadLatestMovies]);

  return {
    latestMovies,
    refetch: loadLatestMovies,
  };
}

// Hook pour la recherche avec debounce
export function useMovieSearch() {
  const { filters, setFilters } = useMovieStore();
  const debouncedSearch = useDebounce(filters.search || '', 300);

  const setSearch = useCallback((search: string) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Movie Search',
      },
      (span) => {
        span.setAttribute('search.query', search);
        span.setAttribute('search.length', search.length);
        setFilters({ search });
      }
    );
  }, [setFilters]);

  const clearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  return {
    searchTerm: filters.search || '',
    debouncedSearchTerm: debouncedSearch,
    setSearch,
    clearSearch,
  };
}

// Hook pour les filtres avancés
export function useMovieFilters() {
  const { filters, setFilters, resetFilters } = useMovieStore();

  const updateFilter = useCallback((key: keyof MovieFilters, value: any) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Update Movie Filter',
      },
      (span) => {
        span.setAttribute('filter.key', key);
        span.setAttribute('filter.value', JSON.stringify(value));
        setFilters({ [key]: value });
      }
    );
  }, [setFilters]);

  const clearFilters = useCallback(() => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Clear Movie Filters',
      },
      () => {
        resetFilters();
      }
    );
  }, [resetFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof MovieFilters];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.length > 0;
      return value !== null && value !== undefined;
    });
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

// Hook pour le tri
export function useMovieSort() {
  const { sort, setSort } = useMovieStore();

  const updateSort = useCallback((field: MovieSort['field'], order?: MovieSort['order']) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Update Movie Sort',
      },
      (span) => {
        const newOrder = order || (sort.field === field && sort.order === 'asc' ? 'desc' : 'asc');
        span.setAttribute('sort.field', field);
        span.setAttribute('sort.order', newOrder);
        setSort({ field, order: newOrder });
      }
    );
  }, [sort, setSort]);

  return {
    sort,
    updateSort,
  };
}

// Hook pour les préférences d'affichage
export function useDisplayOptions() {
  const { displayOptions, setDisplayOptions } = useMovieStore();

  const updateDisplayOption = useCallback((key: keyof typeof displayOptions, value: any) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Update Display Option',
      },
      (span) => {
        span.setAttribute('display.key', key);
        span.setAttribute('display.value', JSON.stringify(value));
        setDisplayOptions({ [key]: value });
      }
    );
  }, [setDisplayOptions]);

  return {
    displayOptions,
    updateDisplayOption,
  };
}

// Hook pour les actions utilisateur (favoris, vus, etc.)
export function useMovieActions() {
  const {
    toggleFavorite,
    markWatched,
    markUnwatched,
    setUserRating,
    isMovieFavorite,
    isMovieWatched,
    getMovieProgress,
    getUserRating,
  } = useMovieStore();

  const handleToggleFavorite = useCallback((movieId: string) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Toggle Movie Favorite',
      },
      (span) => {
        const wasFavorite = isMovieFavorite(movieId);
        span.setAttribute('movie.id', movieId);
        span.setAttribute('action', wasFavorite ? 'remove_favorite' : 'add_favorite');
        toggleFavorite(movieId);
      }
    );
  }, [toggleFavorite, isMovieFavorite]);

  const handleMarkWatched = useCallback((movieId: string, progress?: number) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Mark Movie Watched',
      },
      (span) => {
        span.setAttribute('movie.id', movieId);
        span.setAttribute('progress', progress || 100);
        markWatched(movieId, progress);
      }
    );
  }, [markWatched]);

  const handleMarkUnwatched = useCallback((movieId: string) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Mark Movie Unwatched',
      },
      (span) => {
        span.setAttribute('movie.id', movieId);
        markUnwatched(movieId);
      }
    );
  }, [markUnwatched]);

  const handleSetRating = useCallback((movieId: string, rating: number) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Set Movie Rating',
      },
      (span) => {
        span.setAttribute('movie.id', movieId);
        span.setAttribute('rating', rating);
        setUserRating(movieId, rating);
      }
    );
  }, [setUserRating]);

  return {
    toggleFavorite: handleToggleFavorite,
    markWatched: handleMarkWatched,
    markUnwatched: handleMarkUnwatched,
    setRating: handleSetRating,
    isMovieFavorite,
    isMovieWatched,
    getMovieProgress,
    getUserRating,
  };
}

// Hook pour la sélection multiple
export function useMovieSelection() {
  const {
    selectedMovies,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useMovieStore();

  const handleToggleSelection = useCallback((movieId: string) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Toggle Movie Selection',
      },
      (span) => {
        span.setAttribute('movie.id', movieId);
        span.setAttribute('was_selected', selectedMovies.has(movieId));
        toggleSelection(movieId);
      }
    );
  }, [toggleSelection, selectedMovies]);

  const handleSelectAll = useCallback(() => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Select All Movies',
      },
      () => {
        selectAll();
      }
    );
  }, [selectAll]);

  const handleClearSelection = useCallback(() => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Clear Movie Selection',
      },
      () => {
        clearSelection();
      }
    );
  }, [clearSelection]);

  return {
    selectedMovies: Array.from(selectedMovies),
    selectedCount: selectedMovies.size,
    toggleSelection: handleToggleSelection,
    selectAll: handleSelectAll,
    clearSelection: handleClearSelection,
    hasSelection: selectedMovies.size > 0,
  };
}

// Hook pour la pagination
export function useMoviePagination() {
  const { pagination, setPagination, goToPage } = useMovieStore();

  const handleGoToPage = useCallback((page: number) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Go To Page',
      },
      (span) => {
        span.setAttribute('page.from', pagination.page);
        span.setAttribute('page.to', page);
        goToPage(page);
      }
    );
  }, [goToPage, pagination.page]);

  const handleSetPageSize = useCallback((pageSize: number) => {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Set Page Size',
      },
      (span) => {
        span.setAttribute('page_size.from', pagination.pageSize);
        span.setAttribute('page_size.to', pageSize);
        setPagination({ pageSize, page: 1 });
      }
    );
  }, [setPagination, pagination.pageSize]);

  return {
    pagination,
    goToPage: handleGoToPage,
    setPageSize: handleSetPageSize,
    nextPage: () => handleGoToPage(Math.min(pagination.page + 1, pagination.totalPages)),
    prevPage: () => handleGoToPage(Math.max(pagination.page - 1, 1)),
    canGoNext: pagination.page < pagination.totalPages,
    canGoPrev: pagination.page > 1,
  };
}