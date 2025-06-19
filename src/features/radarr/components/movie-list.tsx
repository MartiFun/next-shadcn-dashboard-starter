'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconSearch, 
  IconMovie, 
  IconDownload, 
  IconEye, 
  IconEyeOff,
  IconStar,
  IconCalendar,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconTrendingUp,
  IconTrendingDown,
  IconFilter,
  IconSortAscending,
  IconSortDescending
} from '@tabler/icons-react';
import { radarrAPI, RadarrMovie } from '@/lib/radarr-api';

const ITEMS_PER_PAGE = 50;

export function MovieList() {
  const [allMovies, setAllMovies] = useState<RadarrMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating' | 'size'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const data = await radarrAPI.getMovies();
        setAllMovies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des films');
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  const { filteredMovies, totalPages, currentPageMovies } = useMemo(() => {
    let filtered = allMovies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.year.toString().includes(searchTerm)
    );

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'rating':
          aValue = a.ratings?.value || 0;
          bValue = b.ratings?.value || 0;
          break;
        case 'size':
          aValue = a.movieFile?.size || 0;
          bValue = b.movieFile?.size || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageMovies = filtered.slice(startIndex, endIndex);

    return {
      filteredMovies: filtered,
      totalPages,
      currentPageMovies
    };
  }, [allMovies, searchTerm, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMoviePoster = (movie: RadarrMovie) => {
    const poster = movie.images.find(img => img.coverType === 'poster');
    return poster?.remoteUrl || poster?.url || undefined;
  };

  const handleToggleMonitoring = async (movieId: number, monitored: boolean) => {
    try {
      setAllMovies(prev => prev.map(m => 
        m.id === movieId ? { ...m, monitored: !monitored } : m
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du monitoring:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[60px]" />
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-[500px] w-[280px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const downloadedMovies = allMovies.filter(m => m.hasFile).length;
  const monitoredMovies = allMovies.filter(m => m.monitored).length;
  const missingMovies = allMovies.filter(m => !m.hasFile).length;
  
  // Calcul de la durée totale de visionnage
  const totalRuntime = allMovies.reduce((acc, m) => acc + (m.runtime || 0), 0);
  const totalHours = Math.round(totalRuntime / 60);
  const totalDays = Math.round(totalHours / 24);
  const totalYears = (totalDays / 365.25).toFixed(1);
  
  // Debug pour voir les données
  console.log('Total runtime in minutes:', totalRuntime);
  console.log('Total runtime in hours:', totalHours);
  console.log('Total runtime in days:', totalDays);
  console.log('Total runtime in years:', totalYears);

  return (
    <div className="space-y-6">
      {/* Message de bienvenue et statistiques */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconMovie className="h-6 w-6" />
          Movie Library 👋
        </h2>
        <Badge variant="outline" className="text-sm">
          {allMovies.length} movies
        </Badge>
      </div>

      {/* Cartes de statistiques */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Downloaded Movies</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {downloadedMovies.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconTrendingUp className="h-3 w-3 mr-1" />
                {Math.round((downloadedMovies / allMovies.length) * 100)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
              Available <IconDownload className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {missingMovies} missing movies
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Monitored Movies</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {monitoredMovies.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconEye className="h-3 w-3 mr-1" />
                {Math.round((monitoredMovies / allMovies.length) * 100)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
              Active monitoring <IconEye className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Automatic updates
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Watch Time</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalYears} years
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <IconClock className="h-3 w-3 mr-1" />
                {totalDays} days
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
              {totalHours} hours of content <IconClock className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {totalRuntime.toLocaleString()} minutes total
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average Year</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {Math.round(allMovies.reduce((acc, m) => acc + m.year, 0) / allMovies.length)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <IconCalendar className="h-3 w-3 mr-1" />
                Era
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
              Modern collection <IconCalendar className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Recent and classic films
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Search and Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for a movie by title, year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('title')}
                className={sortBy === 'title' ? 'bg-accent' : ''}
              >
                Title
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('year')}
                className={sortBy === 'year' ? 'bg-accent' : ''}
              >
                Year
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('rating')}
                className={sortBy === 'rating' ? 'bg-accent' : ''}
              >
                Rating
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? <IconSortAscending className="h-4 w-4" /> : <IconSortDescending className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {filteredMovies.length} movies found
            </Badge>
            <Badge variant="outline">
              Page {currentPage} of {totalPages}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {downloadedMovies} downloaded
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {missingMovies} missing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Grille de films */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {currentPageMovies.map((movie) => (
          <div 
            key={movie.id} 
            className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:rotate-0.5 hover:shadow-2xl cursor-pointer h-[500px] max-w-[280px] group bg-card text-card-foreground rounded-xl border shadow-sm"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="relative w-full h-full">
              {getMoviePoster(movie) ? (
                <img
                  src={getMoviePoster(movie)}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  loading="lazy"
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${getMoviePoster(movie) ? 'hidden' : ''}`}>
                <IconMovie className="h-24 w-24 text-muted-foreground" />
              </div>
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Badges en haut à droite */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                {movie.hasFile && (
                  <Badge variant="secondary" className="text-xs bg-green-500/90 text-white border-green-500">
                    <IconDownload className="h-3 w-3 mr-1" />
                    ✓
                  </Badge>
                )}
                <Badge 
                  variant={movie.monitored ? "default" : "outline"} 
                  className="text-xs cursor-pointer bg-white/90 text-black border-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMonitoring(movie.id, movie.monitored);
                  }}
                >
                  {movie.monitored ? (
                    <IconEye className="h-3 w-3 mr-1" />
                  ) : (
                    <IconEyeOff className="h-3 w-3 mr-1" />
                  )}
                </Badge>
              </div>
              
              {/* Informations en bas */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-2" title={movie.title}>
                    {movie.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-white/90 text-sm">
                    <span className="font-medium">{movie.year}</span>
                    {movie.ratings?.value && (
                      <div className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{movie.ratings.value.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.runtime > 0 && (
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4" />
                        <span>{movie.runtime}min</span>
                      </div>
                    )}
                  </div>
                  
                  {movie.movieFile && (
                    <div className="text-white/90 text-sm font-medium">
                      <span>{formatFileSize(movie.movieFile.size)}</span>
                      <span className="mx-2">•</span>
                      <span>{movie.movieFile.quality.quality.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <IconChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentPageMovies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconMovie className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'Try modifying your search criteria' : 'Your movie library is empty'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 