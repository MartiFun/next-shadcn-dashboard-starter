'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconSearch, 
  IconDeviceTv, 
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
import { sonarrAPI, SonarrSeries } from '@/lib/sonarr-api';

export function SeriesSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SonarrSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSeries, setAddingSeries] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [qualityProfiles, setQualityProfiles] = useState<any[]>([]);
  const [languageProfiles, setLanguageProfiles] = useState<any[]>([]);
  const [rootFolders, setRootFolders] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Charger les profils de qualité, langue et dossiers racines au montage
  useEffect(() => {
    const loadSonarrConfig = async () => {
      try {
        const [profiles, langProfiles, folders] = await Promise.all([
          sonarrAPI.getQualityProfiles(),
          sonarrAPI.getLanguageProfiles(),
          sonarrAPI.getRootFolders()
        ]);
        setQualityProfiles(profiles);
        setLanguageProfiles(langProfiles);
        setRootFolders(folders);
      } catch (err) {
        console.error('Erreur lors du chargement de la configuration Sonarr:', err);
      }
    };

    loadSonarrConfig();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const results = await sonarrAPI.searchSeries(searchTerm);
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

  const handleAddSeries = async (series: SonarrSeries) => {
    try {
      setAddingSeries(series.tvdbId);
      setError(null);
      setSuccessMessage(null);
      
      // Utiliser le premier profil de qualité, langue et dossier racine disponibles
      const defaultQualityProfileId = qualityProfiles.length > 0 ? qualityProfiles[0].id : 1;
      const defaultLanguageProfileId = languageProfiles.length > 0 ? languageProfiles[0].id : 1;
      const defaultRootFolderPath = rootFolders.length > 0 ? rootFolders[0].path : '/Data/TV';
      
      // Préparer les données de la série pour l'ajout
      const seriesData = {
        title: series.title,
        tvdbId: series.tvdbId,
        qualityProfileId: defaultQualityProfileId,
        languageProfileId: defaultLanguageProfileId,
        rootFolderPath: defaultRootFolderPath,
        seasonFolder: true,
        monitored: true,
        addOptions: {
          searchForMissingEpisodes: true, // Commencer la recherche automatiquement
        },
      };

      console.log('Ajout de la série avec les données:', seriesData);

      // Ajouter la série via l'API Sonarr
      const addedSeries = await sonarrAPI.addSeries(seriesData);
      
      console.log('Série ajoutée avec succès:', addedSeries);
      
      // Retirer la série des résultats de recherche
      setSearchResults(prev => prev.filter(s => s.tvdbId !== series.tvdbId));
      
      // Afficher un message de succès
      setSuccessMessage(`${series.title} a été ajoutée et la recherche d'épisodes a commencé !`);
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la série:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la série');
    } finally {
      setAddingSeries(null);
    }
  };

  const getSeriesPoster = (series: SonarrSeries) => {
    const poster = series.images.find(img => img.coverType === 'poster');
    return poster?.remoteUrl || poster?.url || undefined;
  };

  const formatDate = (dateString: string | number) => {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'number') return dateString.toString();
    return new Date(dateString).getFullYear();
  };

  const getSearchStats = () => {
    const totalResults = searchResults.length;
    const withRatings = searchResults.filter(s => s.ratings?.value && s.ratings.value > 0).length;
    const recentSeries = searchResults.filter(s => s.year >= new Date().getFullYear() - 2).length;
    const averageRating = withRatings > 0 
      ? searchResults.reduce((acc, s) => acc + (s.ratings?.value || 0), 0) / withRatings 
      : 0;

    return { totalResults, withRatings, recentSeries, averageRating };
  };

  const stats = getSearchStats();

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconSearch className="h-6 w-6" />
          Search TV Series 🔍
        </h2>
        <Badge variant="outline" className="text-sm">
          TVDB Database
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
            Find and add new TV series to your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Enter a TV series title (e.g., Breaking Bad, Game of Thrones, etc.)"
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
              Series Added Successfully
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
                  Series
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
                Search successful <IconSearch className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Based on TVDB
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Rated Series</CardDescription>
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
              <CardDescription>Recent Series</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.recentSeries}
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
              <IconDeviceTv className="h-5 w-5" />
              Search Results
            </CardTitle>
            <CardDescription>
              {searchResults.length} series found for &quot;{searchTerm}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((series) => (
                <div 
                  key={series.tvdbId} 
                  className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group bg-card text-card-foreground rounded-xl border shadow-sm"
                >
                  <div className="relative">
                    {getSeriesPoster(series) ? (
                      <img
                        src={getSeriesPoster(series)}
                        alt={series.title}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${getSeriesPoster(series) ? 'hidden' : ''}`}>
                      <IconDeviceTv className="h-24 w-24 text-muted-foreground" />
                    </div>
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Badges en haut */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                      <Badge variant="secondary" className="text-xs bg-white/90 text-black">
                        {formatDate(series.year)}
                      </Badge>
                      {series.ratings?.value && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500/90 text-white">
                          <IconStar className="h-3 w-3 mr-1" />
                          {series.ratings.value.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Bouton d'ajout en bas */}
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSeries(series);
                        }}
                        disabled={addingSeries === series.tvdbId}
                        className="w-full bg-white/90 text-black hover:bg-white border-white/20"
                        size="sm"
                      >
                        {addingSeries === series.tvdbId ? (
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
                  
                  {/* Informations de la série */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm line-clamp-2" title={series.title}>
                        {series.title}
                      </h4>
                      {series.originalTitle !== series.title && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {series.originalTitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {series.runtime > 0 && (
                        <div className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          <span>{series.runtime}min</span>
                        </div>
                      )}
                    </div>

                    {series.overview && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {series.overview}
                      </p>
                    )}

                    {series.genres && series.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {series.genres.slice(0, 3).map((genre, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                        {series.genres.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{series.genres.length - 3}
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
            <IconDeviceTv className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No series found</h3>
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
              Enter a TV series title to start your search and add it to your library
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 