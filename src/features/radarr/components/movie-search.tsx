'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconSearch, 
  IconMovie, 
  IconPlus,
  IconStar,
  IconCalendar,
  IconClock,
  IconEye,
  IconEyeOff,
  IconTrendingUp,
  IconTrendingDown,
  IconFilter,
  IconSparkles,
  IconDownload,
  IconCheck
} from '@tabler/icons-react';
import { radarrAPI, RadarrMovie } from '@/lib/radarr-api';

export function MovieSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RadarrMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingMovie, setAddingMovie] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [qualityProfiles, setQualityProfiles] = useState<any[]>([]);
  const [rootFolders, setRootFolders] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Charger les profils de qualité et dossiers racines au montage
  useEffect(() => {
    const loadRadarrConfig = async () => {
      try {
        const [profiles, folders] = await Promise.all([
          radarrAPI.getQualityProfiles(),
          radarrAPI.getRootFolders()
        ]);
        setQualityProfiles(profiles);
        setRootFolders(folders);
      } catch (err) {
        console.error('Erreur lors du chargement de la configuration Radarr:', err);
      }
    };

    loadRadarrConfig();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const results = await radarrAPI.searchMovie(searchTerm);
      setSearchResults(results);
      
      // Ajouter à l'historique des recherches
      if (!recentSearches.includes(searchTerm)) {
        setRecentSearches(prev => [searchTerm, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async (movie: RadarrMovie) => {
    try {
      setAddingMovie(movie.tmdbId);
      setError(null);
      setSuccessMessage(null);
      
      // Utiliser le premier profil de qualité et dossier racine disponibles
      const defaultQualityProfileId = qualityProfiles.length > 0 ? qualityProfiles[0].id : 1;
      const defaultRootFolderPath = rootFolders.length > 0 ? rootFolders[0].path : '/Data/Movies';
      
      // Préparer les données du film pour l'ajout
      const movieData = {
        title: movie.title,
        tmdbId: movie.tmdbId,
        qualityProfileId: defaultQualityProfileId,
        rootFolderPath: defaultRootFolderPath,
        monitored: true,
        minimumAvailability: 'released',
        addOptions: {
          searchForMovie: true, // Commencer la recherche automatiquement
        },
      };

      console.log('Ajout du film avec les données:', movieData);

      // Ajouter le film via l'API Radarr
      const addedMovie = await radarrAPI.addMovie(movieData);
      
      console.log('Film ajouté avec succès:', addedMovie);
      
      // Retirer le film des résultats de recherche
      setSearchResults(prev => prev.filter(m => m.tmdbId !== movie.tmdbId));
      
      // Afficher un message de succès
      setSuccessMessage(`${movie.title} a été ajouté et la recherche de téléchargement a commencé !`);
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du film:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du film');
    } finally {
      setAddingMovie(null);
    }
  };

  const getMoviePoster = (movie: RadarrMovie) => {
    const poster = movie.images.find(img => img.coverType === 'poster');
    return poster?.remoteUrl || poster?.url || undefined;
  };

  const formatDate = (dateString: string | number) => {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'number') return dateString.toString();
    return new Date(dateString).getFullYear();
  };

  const getSearchStats = () => {
    const totalResults = searchResults.length;
    const withRatings = searchResults.filter(m => m.ratings?.value && m.ratings.value > 0).length;
    const recentMovies = searchResults.filter(m => m.year >= new Date().getFullYear() - 2).length;
    const averageRating = withRatings > 0 
      ? searchResults.reduce((acc, m) => acc + (m.ratings?.value || 0), 0) / withRatings 
      : 0;

    return { totalResults, withRatings, recentMovies, averageRating };
  };

  const stats = getSearchStats();

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconSearch className="h-6 w-6" />
          Search Movies 🔍
        </h2>
        <Badge variant="outline" className="text-sm">
          TMDB Database
        </Badge>
      </div>

      {/* Barre de recherche moderne */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5" />
            Smart Search
          </CardTitle>
          <CardDescription>
            Find and add new movies to your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Enter a movie title (e.g., Inception, Avatar, etc.)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchTerm.trim()}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                <>
                  <IconSearch className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <IconTrendingDown className="h-5 w-5" />
              Search Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Message de succès */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <IconCheck className="h-5 w-5" />
              Movie Added Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-300">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques des résultats */}
      {searchResults.length > 0 && (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Results Found</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.totalResults}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <IconSearch className="h-3 w-3 mr-1" />
                  Movies
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
                Search successful <IconSearch className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Based on TMDB
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Rated Movies</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.withRatings}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <IconStar className="h-3 w-3 mr-1" />
                  {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/10` : 'N/A'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-yellow-600">
                Average rating <IconStar className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Ratings available
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Recent Movies</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.recentMovies}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <IconCalendar className="h-3 w-3 mr-1" />
                  &lt; 2 years
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
                Recent releases <IconCalendar className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Last few years
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Ready to Add</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.totalResults}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <IconPlus className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
                One-click add <IconPlus className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Automatic monitoring
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMovie className="h-5 w-5" />
              Search Results
            </CardTitle>
            <CardDescription>
              {searchResults.length} movie{searchResults.length > 1 ? 's' : ''} found for &quot;{searchTerm}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((movie) => (
                <div 
                  key={movie.tmdbId} 
                  className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group bg-card text-card-foreground rounded-xl border shadow-sm"
                >
                  <div className="relative">
                    {getMoviePoster(movie) ? (
                      <img
                        src={getMoviePoster(movie)}
                        alt={movie.title}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${getMoviePoster(movie) ? 'hidden' : ''}`}>
                      <IconMovie className="h-24 w-24 text-muted-foreground" />
                    </div>
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Badges en haut */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                      <Badge variant="secondary" className="text-xs bg-white/90 text-black">
                        {formatDate(movie.year)}
                      </Badge>
                      {movie.ratings?.value && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500/90 text-white">
                          <IconStar className="h-3 w-3 mr-1" />
                          {movie.ratings.value.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Bouton d'ajout en bas */}
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddMovie(movie);
                        }}
                        disabled={addingMovie === movie.tmdbId}
                        className="w-full bg-white/90 text-black hover:bg-white border-white/20"
                        size="sm"
                      >
                        {addingMovie === movie.tmdbId ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                            Adding...
                          </div>
                        ) : (
                          <>
                            <IconPlus className="h-4 w-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Informations du film */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm line-clamp-2" title={movie.title}>
                        {movie.title}
                      </h4>
                      {movie.originalTitle !== movie.title && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {movie.originalTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {movie.runtime > 0 && (
                        <div className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          <span>{movie.runtime}min</span>
                        </div>
                      )}
                    </div>

                    {movie.overview && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {movie.overview}
                      </p>
                    )}

                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.slice(0, 3).map((genre, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                        {movie.genres.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{movie.genres.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* États vides */}
      {!loading && searchTerm && searchResults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconMovie className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground text-center">
              No results for &quot;{searchTerm}&quot;. Try with a different title.
            </p>
          </CardContent>
        </Card>
      )}

      {!searchTerm && searchResults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to search</h3>
            <p className="text-muted-foreground text-center">
              Enter a movie title to start your search and add it to your library
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 