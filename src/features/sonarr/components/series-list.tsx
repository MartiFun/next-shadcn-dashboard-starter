'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconDeviceTv, 
  IconSearch, 
  IconDownload, 
  IconStar,
  IconCalendar,
  IconClock,
  IconEye,
  IconEyeOff,
  IconTrendingUp,
  IconTrendingDown,
  IconFilter,
  IconSparkles,
  IconDownload as IconDownload2,
  IconCheck,
  IconSortAscending,
  IconSortDescending,
  IconDatabase
} from '@tabler/icons-react';
import { sonarrAPI, SonarrSeries } from '@/lib/sonarr-api';

export function SeriesList() {
  const [series, setSeries] = useState<SonarrSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'status' | 'episodes'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const data = await sonarrAPI.getSeries();
        setSeries(data);
      } catch (err) {
        console.error('Error loading series:', err);
        setError(err instanceof Error ? err.message : 'Error loading series');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const filteredAndSortedSeries = useMemo(() => {
    let filtered = series;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

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
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'episodes':
          aValue = a.statistics.episodeFileCount;
          bValue = b.statistics.episodeFileCount;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [series, searchTerm, sortBy, sortOrder]);

  const paginatedSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSeries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedSeries, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedSeries.length / itemsPerPage);

  const getSeriesPoster = (series: SonarrSeries) => {
    const poster = series.images.find(img => img.coverType === 'poster');
    return poster?.remoteUrl || poster?.url || undefined;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeriesStats = () => {
    if (!series.length) return { total: 0, monitored: 0, downloaded: 0, totalEpisodes: 0, downloadedEpisodes: 0, averageYear: 0 };
    
    const monitored = series.filter(s => s.monitored).length;
    const downloaded = series.filter(s => s.statistics.episodeFileCount > 0).length;
    const totalEpisodes = series.reduce((acc, s) => acc + s.statistics.totalEpisodeCount, 0);
    const downloadedEpisodes = series.reduce((acc, s) => acc + s.statistics.episodeFileCount, 0);
    const years = series.map(s => s.year).filter(y => y > 0);
    const averageYear = years.length > 0 ? Math.round(years.reduce((acc, y) => acc + y, 0) / years.length) : 0;
    
    return {
      total: series.length,
      monitored,
      downloaded,
      totalEpisodes,
      downloadedEpisodes,
      averageYear
    };
  };

  const stats = getSeriesStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconDeviceTv className="h-6 w-6" />
            Series Library 📺
          </h2>
          <Badge variant="outline" className="text-sm">
            TV Shows Manager
          </Badge>
        </div>

        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-64" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <IconTrendingDown className="h-5 w-5" />
            Loading Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconDeviceTv className="h-6 w-6" />
          Series Library 📺
        </h2>
        <Badge variant="outline" className="text-sm">
          TV Shows Manager
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Series</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconDeviceTv className="h-3 w-3 mr-1" />
                TV Shows
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
              {stats.monitored} monitored <IconDeviceTv className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {stats.downloaded} with episodes
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Episodes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.totalEpisodes}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconDownload className="h-3 w-3 mr-1" />
                {stats.downloadedEpisodes} Downloaded
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
              {stats.downloadedEpisodes > 0 ? Math.round((stats.downloadedEpisodes / stats.totalEpisodes) * 100) : 0}% complete <IconDownload className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Across all series
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average Year</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.averageYear}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <IconCalendar className="h-3 w-3 mr-1" />
                Release Year
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-yellow-600">
              Average release <IconCalendar className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Based on {series.filter(s => s.year > 0).length} series
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Library Size</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatFileSize(series.reduce((acc, s) => acc + s.sizeOnDisk, 0))}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <IconDatabase className="h-3 w-3 mr-1" />
                Total Size
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
              On disk storage <IconDatabase className="size-4" />
            </div>
            <div className="text-muted-foreground">
              All episodes combined
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Contrôles de recherche et tri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and organize your TV series
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search series by title, original title, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="year-desc">Newest First</option>
              <option value="year-asc">Oldest First</option>
              <option value="episodes-desc">Most Episodes</option>
              <option value="episodes-asc">Least Episodes</option>
              <option value="status-asc">Status A-Z</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {paginatedSeries.length} of {filteredAndSortedSeries.length} series
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Liste des séries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {paginatedSeries.map((series) => (
          <div 
            key={series.id} 
            className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:rotate-0.5 hover:shadow-2xl cursor-pointer h-[500px] max-w-[280px] group bg-card text-card-foreground rounded-xl border shadow-sm"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="relative w-full h-full">
              {getSeriesPoster(series) ? (
                <img
                  src={getSeriesPoster(series)}
                  alt={series.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  loading="lazy"
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${getSeriesPoster(series) ? 'hidden' : ''}`}>
                <IconDeviceTv className="h-24 w-24 text-muted-foreground" />
              </div>
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Badges en haut à droite */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                {series.statistics.episodeFileCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-500/90 text-white border-green-500">
                    <IconDownload className="h-3 w-3 mr-1" />
                    {series.statistics.episodeFileCount}
                  </Badge>
                )}
                <Badge 
                  variant={series.monitored ? "default" : "outline"} 
                  className="text-xs cursor-pointer bg-white/90 text-black border-white/20"
                >
                  {series.monitored ? (
                    <IconEye className="h-3 w-3 mr-1" />
                  ) : (
                    <IconEyeOff className="h-3 w-3 mr-1" />
                  )}
                </Badge>
              </div>
              
              {/* Informations en bas */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-2" title={series.title}>
                    {series.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-white/90 text-sm">
                    <span className="font-medium">{series.year}</span>
                    {series.ratings?.value && (
                      <div className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{series.ratings.value.toFixed(1)}</span>
                      </div>
                    )}
                    {series.runtime > 0 && (
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4" />
                        <span>{series.runtime}min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-white/90 text-sm font-medium">
                    <span>{series.statistics.episodeFileCount}/{series.statistics.totalEpisodeCount} episodes</span>
                    {series.sizeOnDisk > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(series.sizeOnDisk)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {!loading && filteredAndSortedSeries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconDeviceTv className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No series found' : 'No series in library'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? `No series match "${searchTerm}". Try a different search term.`
                : 'Your TV series library is empty. Add some series to get started.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 