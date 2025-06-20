'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IconGrid3X3,
  IconList,
  IconCarousel,
  IconSettings,
  IconRefresh,
  IconDownload,
  IconShare,
  IconFilter,
  IconSortAscending,
  IconEye,
  IconHeart,
  IconMovie,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { useMovieStore } from '@/features/media/store/movie-store';
import { MovieFiltersComponent } from './filters/movie-filters';
import { MovieCardEnhanced } from './movie-card-enhanced';
import { EmbyMovie } from '@/types/media';
import { useRouter } from 'next/navigation';

// Types pour la page améliorée
interface EnhancedMediaMovieListProps {
  userId: string;
}

// Composant de statistiques en temps réel
function MovieStatsComponent() {
  const { getStats } = useMovieStore();
  const stats = useMemo(() => getStats(), [getStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Films</div>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Vus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.watched.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0}% du total
          </div>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Favoris</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.favorites.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Sélectionnés</div>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Temps total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{Math.round(stats.totalRuntime / 60)}h</div>
          <div className="text-xs text-muted-foreground">
            {(stats.totalRuntime / 60 / 24).toFixed(1)} jours
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant de sélection d'affichage
function DisplayOptionsComponent() {
  const { displayOptions, setDisplayOptions } = useMovieStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSettings className="h-5 w-5" />
          Options d'affichage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode d'affichage */}
        <div className="space-y-2">
          <Label>Mode d'affichage</Label>
          <Tabs 
            value={displayOptions.view} 
            onValueChange={(value) => setDisplayOptions({ view: value as any })}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grid">
                <IconGrid3X3 className="h-4 w-4 mr-1" />
                Grille
              </TabsTrigger>
              <TabsTrigger value="list">
                <IconList className="h-4 w-4 mr-1" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="carousel">
                <IconCarousel className="h-4 w-4 mr-1" />
                Carrousel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Densité */}
        <div className="space-y-2">
          <Label>Densité</Label>
          <Select 
            value={displayOptions.density} 
            onValueChange={(value) => setDisplayOptions({ density: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Confortable</SelectItem>
              <SelectItem value="spacious">Étendu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options d'affichage */}
        <div className="space-y-3">
          <Label>Afficher</Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-overlay" className="text-sm">Overlay d'actions</Label>
              <Switch
                id="show-overlay"
                checked={displayOptions.showOverlay}
                onCheckedChange={(checked) => setDisplayOptions({ showOverlay: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-genres" className="text-sm">Genres</Label>
              <Switch
                id="show-genres"
                checked={displayOptions.showGenres}
                onCheckedChange={(checked) => setDisplayOptions({ showGenres: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-rating" className="text-sm">Note</Label>
              <Switch
                id="show-rating"
                checked={displayOptions.showRating}
                onCheckedChange={(checked) => setDisplayOptions({ showRating: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-duration" className="text-sm">Durée</Label>
              <Switch
                id="show-duration"
                checked={displayOptions.showDuration}
                onCheckedChange={(checked) => setDisplayOptions({ showDuration: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-year" className="text-sm">Année</Label>
              <Switch
                id="show-year"
                checked={displayOptions.showYear}
                onCheckedChange={(checked) => setDisplayOptions({ showYear: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-progress" className="text-sm">Progression</Label>
              <Switch
                id="show-progress"
                checked={displayOptions.showProgress}
                onCheckedChange={(checked) => setDisplayOptions({ showProgress: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant de sélection multiple
function SelectionToolbarComponent() {
  const { selectedMovies, clearSelection, selectAll } = useMovieStore();
  const selectedCount = selectedMovies.size;

  if (selectedCount === 0) return null;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} film{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </Badge>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <IconX className="h-4 w-4 mr-1" />
              Désélectionner
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconHeart className="h-4 w-4 mr-1" />
              Ajouter aux favoris
            </Button>
            <Button variant="outline" size="sm">
              <IconEye className="h-4 w-4 mr-1" />
              Marquer comme vu
            </Button>
            <Button variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
            <Button variant="outline" size="sm">
              <IconShare className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal amélioré
export function EnhancedMediaMovieList({ userId }: EnhancedMediaMovieListProps) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    movies,
    filters,
    sort,
    displayOptions,
    pagination,
    getFilteredMovies,
    setFilters,
    setSort,
    resetFilters,
    setPagination,
    goToPage,
    toggleFavorite,
    markWatched,
    markUnwatched,
    setUserRating,
    toggleSelection,
    isMovieFavorite,
    isMovieWatched,
    getMovieProgress,
    getUserRating,
  } = useMovieStore();

  // Films filtrés et paginés
  const filteredMovies = useMemo(() => getFilteredMovies(), [getFilteredMovies]);
  
  const paginatedMovies = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredMovies.slice(startIndex, endIndex);
  }, [filteredMovies, pagination]);

  // Mise à jour de la pagination quand les films changent
  useEffect(() => {
    const totalPages = Math.ceil(filteredMovies.length / pagination.pageSize);
    setPagination({ 
      total: filteredMovies.length, 
      totalPages,
      page: Math.min(pagination.page, Math.max(1, totalPages))
    });
  }, [filteredMovies.length, pagination.pageSize, setPagination]);

  // Gestion des événements
  const handleRefresh = async () => {
    setLoading(true);
    // TODO: Implémenter le rechargement
    setTimeout(() => setLoading(false), 1000);
  };

  const handleShowDetails = (movieId: string) => {
    router.push(`/dashboard/media/${movieId}?user=${userId}`);
  };

  const handlePlay = (movieId: string) => {
    router.push(`/dashboard/media/${movieId}/play?user=${userId}`);
  };

  // Rendu conditionnel pour le mode d'affichage
  const renderMovieGrid = () => {
    const gridClasses = {
      compact: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3',
      comfortable: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4',
      spacious: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    };

    return (
      <div className={`grid ${gridClasses[displayOptions.density]}`}>
        {paginatedMovies.map((movie) => (
          <MovieCardEnhanced
            key={movie.Id}
            movie={movie}
            userId={userId}
            displayOptions={displayOptions}
            isSelected={false} // TODO: Implémenter la sélection
            isFavorite={isMovieFavorite(movie.Id)}
            isWatched={isMovieWatched(movie.Id)}
            watchProgress={getMovieProgress(movie.Id)}
            userRating={getUserRating(movie.Id)}
            onPlay={handlePlay}
            onToggleFavorite={toggleFavorite}
            onMarkWatched={markWatched}
            onMarkUnwatched={markUnwatched}
            onSetRating={setUserRating}
            onToggleSelection={toggleSelection}
            onShowDetails={handleShowDetails}
          />
        ))}
      </div>
    );
  };

  const renderMovieList = () => {
    // TODO: Implémenter le mode liste
    return <div>Mode liste non encore implémenté</div>;
  };

  const renderMovieCarousel = () => {
    // TODO: Implémenter le mode carrousel
    return <div>Mode carrousel non encore implémenté</div>;
  };

  if (loading && movies.length === 0) {
    return (
      <div className="space-y-6">
        {/* Skeleton pour les stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton pour la grille */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {[...Array(20)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Films</h1>
          <p className="text-muted-foreground">
            Gérez votre collection de {movies.length.toLocaleString()} films
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10 text-primary' : ''}
          >
            <IconFilter className="h-4 w-4 mr-2" />
            Filtres
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <MovieStatsComponent />

      {/* Barre de sélection */}
      <SelectionToolbarComponent />

      {/* Layout en deux colonnes : Filtres + Contenu */}
      <div className="flex gap-6">
        {/* Panneau de filtres */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <MovieFiltersComponent
                movies={movies}
                filters={filters}
                sort={sort}
                onFiltersChange={setFilters}
                onSortChange={setSort}
                onResetFilters={resetFilters}
              />
              <DisplayOptionsComponent />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex-1 space-y-6">
          {/* Info filtres actifs */}
          {Object.keys(filters).length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600 dark:text-orange-400">
                      {filteredMovies.length} film{filteredMovies.length > 1 ? 's' : ''} trouvé{filteredMovies.length > 1 ? 's' : ''} 
                      {movies.length !== filteredMovies.length && ` sur ${movies.length} au total`}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    <IconX className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grille/Liste/Carrousel de films */}
          {filteredMovies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <IconMovie className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun film trouvé</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {Object.keys(filters).length > 0 
                    ? 'Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.'
                    : 'Votre bibliothèque de films est vide.'
                  }
                </p>
                {Object.keys(filters).length > 0 && (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={resetFilters}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {displayOptions.view === 'grid' && renderMovieGrid()}
              {displayOptions.view === 'list' && renderMovieList()}
              {displayOptions.view === 'carousel' && renderMovieCarousel()}
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <IconChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                      return (
                        <Button
                          key={page}
                          variant={page === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Suivant
                    <IconChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages} 
                  ({pagination.total.toLocaleString()} films)
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}