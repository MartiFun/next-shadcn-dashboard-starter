'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import * as Sentry from "@sentry/nextjs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardAction, 
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  IconSearch,
  IconMovie,
  IconStar,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconTrendingUp,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconSettings,
  IconRefresh,
  IconGridDots,
  IconList
} from '@tabler/icons-react';
import { enhancedMediaAPI } from '@/lib/enhanced-media-api';
import { ChevronLeft, ChevronRight, CheckCircle2, Eye, Clock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  PieChart, 
  Pie as RechartsPie, 
  Label 
} from 'recharts';
import { FixedSizeGrid as Grid } from 'react-window';
import { MediaErrorBoundary } from '@/components/error-boundary';
import { 
  EmbyMovie, 
  SearchOptions, 
  MediaFilters, 
  MediaListProps,
  VirtualizedItemData,
  PerformanceMetrics
} from '@/types/media';

const { logger } = Sentry;

// Configuration de la virtualisation
const ITEM_WIDTH = 280;
const ITEM_HEIGHT = 440;
const GAP = 24;

// Composant pour un élément de film virtualisé
const MovieItem = React.memo(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: VirtualizedItemData;
}) => {
  const { items, columnCount, userId } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= items.length) {
    return <div style={style} />;
  }

  const movie = items[index];
  const router = useRouter();

  const handleClick = useCallback(() => {
    return Sentry.startSpan(
      { op: "ui.click", name: "Movie Item Click" },
      (span: any) => {
        span.setAttribute("movie.id", movie.Id);
        span.setAttribute("movie.name", movie.Name);
        
        logger.debug("Movie item clicked", { 
          movieId: movie.Id, 
          movieName: movie.Name 
        });
        
        router.push(`/dashboard/media/${movie.Id}?user=${userId}`);
      }
    );
  }, [movie.Id, movie.Name, userId, router]);

  const posterUrl = useMemo(() => {
    return enhancedMediaAPI.getOptimizedImageUrl(
      movie.Id,
      'Primary',
      {
        width: ITEM_WIDTH,
        height: Math.round(ITEM_WIDTH * 1.5),
        quality: 85,
        format: 'webp',
        tag: movie.ImageTags?.Primary,
        cropWhitespace: true,
        enableImageEnhancers: true,
      }
    );
  }, [movie.Id, movie.ImageTags?.Primary]);

  const ticksToMinutes = useCallback((ticks?: number) => {
    if (!ticks) return 0;
    return Math.round(ticks / 10000000 / 60);
  }, []);

  return (
    <div style={{
      ...style,
      left: (style.left as number) + GAP / 2,
      top: (style.top as number) + GAP / 2,
      width: (style.width as number) - GAP,
      height: (style.height as number) - GAP,
    }}>
      <div 
        className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:rotate-0.5 hover:shadow-2xl cursor-pointer w-full h-full group bg-gradient-to-t from-primary/5 to-card dark:bg-card text-card-foreground rounded-xl relative flex flex-col shadow-xs"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
        onClick={handleClick}
      >
        {/* Checkmark vu */}
        {movie.UserData?.Played && (
          <div className="absolute top-2 right-2 z-20">
            <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-lg" aria-label="Vu" />
          </div>
        )}
        
        <div className="relative w-full h-[320px] flex-shrink-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.Name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-lg"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center rounded-t-lg ${posterUrl ? 'hidden' : ''}`}>
            <IconMovie className="h-24 w-24 text-muted-foreground" />
          </div>
        </div>
        
        {/* Informations sous l'image */}
        <div className="p-3 space-y-2 flex-1 flex flex-col justify-end">
          <h3 className="font-bold text-sm text-foreground line-clamp-2" title={movie.Name}>
            {movie.Name}
          </h3>
          
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="font-medium">{movie.ProductionYear}</span>
            {movie.CommunityRating && (
              <div className="flex items-center gap-1">
                <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{movie.CommunityRating.toFixed(1)}</span>
              </div>
            )}
            {movie.RunTimeTicks && (
              <div className="flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                <span>{ticksToMinutes(movie.RunTimeTicks)}min</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MovieItem.displayName = 'MovieItem';

// Hook pour la gestion des filtres et recherche
const useMovieFilters = (
  allMovies: EmbyMovie[],
  searchOptions: SearchOptions
) => {
  return useMemo(() => {
    return Sentry.startSpan(
      { op: "filter.movies", name: "Filter and sort movies" },
      (span: any) => {
        span.setAttribute("total_movies", allMovies.length);
        span.setAttribute("search_query", searchOptions.query);
        span.setAttribute("sort_by", searchOptions.sortBy);
        span.setAttribute("has_filters", !!searchOptions.filters);

        let filtered = allMovies.filter(movie => {
          // Recherche textuelle
          const queryMatch = !searchOptions.query || 
            movie.Name.toLowerCase().includes(searchOptions.query.toLowerCase()) ||
            movie.OriginalTitle?.toLowerCase().includes(searchOptions.query.toLowerCase()) ||
            movie.ProductionYear?.toString().includes(searchOptions.query);

          // Filtres
          if (!searchOptions.filters) return queryMatch;

          const { filters } = searchOptions;

          // Filtre par genres
          const genreMatch = !filters.genres?.length || 
            filters.genres.some(genre => movie.Genres?.includes(genre));

          // Filtre par années
          const yearMatch = !filters.years || 
            (movie.ProductionYear && 
             movie.ProductionYear >= filters.years[0] && 
             movie.ProductionYear <= filters.years[1]);

          // Filtre par note
          const ratingMatch = !filters.ratings || 
            (movie.CommunityRating && 
             movie.CommunityRating >= filters.ratings[0] && 
             movie.CommunityRating <= filters.ratings[1]);

          // Filtre par durée
          const runtimeMatch = !filters.runtime || 
            (movie.RunTimeTicks && 
             Math.round(movie.RunTimeTicks / 10000000 / 60) >= filters.runtime[0] && 
             Math.round(movie.RunTimeTicks / 10000000 / 60) <= filters.runtime[1]);

          // Filtre par statut vu/non vu
          const statusMatch = !filters.status?.length || 
            filters.status.includes(movie.UserData?.Played ? 'watched' : 'unwatched');

          // Filtre par studios
          const studioMatch = !filters.studios?.length || 
            filters.studios.some(studio => 
              movie.Studios?.some(s => s.Name === studio));

          return queryMatch && genreMatch && yearMatch && ratingMatch && 
                 runtimeMatch && statusMatch && studioMatch;
        });

        // Tri
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (searchOptions.sortBy) {
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
            case 'runtime':
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
          
          if (searchOptions.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        const totalPages = Math.ceil(filtered.length / searchOptions.pageSize);
        const startIndex = (searchOptions.page - 1) * searchOptions.pageSize;
        const endIndex = startIndex + searchOptions.pageSize;
        const currentPageMovies = filtered.slice(startIndex, endIndex);

        span.setAttribute("filtered_count", filtered.length);
        span.setAttribute("total_pages", totalPages);

        logger.debug("Movies filtered and sorted", {
          totalMovies: allMovies.length,
          filteredCount: filtered.length,
          currentPage: searchOptions.page,
          totalPages,
        });

        return {
          filteredMovies: filtered,
          totalPages,
          currentPageMovies
        };
      }
    );
  }, [allMovies, searchOptions]);
};

// Hook pour les statistiques des films
const useMovieStats = (movies: EmbyMovie[]) => {
  return useMemo(() => {
    return Sentry.startSpan(
      { op: "analytics.calculate", name: "Calculate movie statistics" },
      (span: any) => {
        const totalMovies = movies.length;
        const watchedMovies = movies.filter(m => m.UserData?.Played).length;
        const totalRuntime = movies.reduce((acc, m) => 
          acc + Math.round((m.RunTimeTicks || 0) / 10000000 / 60), 0);

        // Distribution des genres
        const genreCount: Record<string, number> = {};
        movies.forEach(m => {
          if (Array.isArray(m.Genres)) {
            m.Genres.forEach(g => {
              genreCount[g] = (genreCount[g] || 0) + 1;
            });
          }
        });

        // Distribution des années
        const yearCount: Record<number, number> = {};
        movies.forEach(m => {
          if (m.ProductionYear) {
            yearCount[m.ProductionYear] = (yearCount[m.ProductionYear] || 0) + 1;
          }
        });

        // Distribution des studios
        const studioCount: Record<string, number> = {};
        movies.forEach(m => {
          if (Array.isArray(m.Studios)) {
            m.Studios.forEach(s => {
              if (s.Name) {
                studioCount[s.Name] = (studioCount[s.Name] || 0) + 1;
              }
            });
          }
        });

        const averageRating = totalMovies > 0 ? 
          movies.reduce((acc, m) => acc + (m.CommunityRating || 0), 0) / totalMovies : 0;

        span.setAttribute("total_movies", totalMovies);
        span.setAttribute("watched_movies", watchedMovies);
        span.setAttribute("total_runtime_minutes", totalRuntime);
        span.setAttribute("average_rating", averageRating);

        logger.debug("Movie statistics calculated", {
          totalMovies,
          watchedMovies,
          totalRuntime,
          averageRating,
          genreCount: Object.keys(genreCount).length,
          yearRange: [Math.min(...Object.keys(yearCount).map(Number)), Math.max(...Object.keys(yearCount).map(Number))],
        });

        return {
          totalMovies,
          watchedMovies,
          totalRuntime,
          averageRating,
          genreDistribution: genreCount,
          yearDistribution: yearCount,
          studioDistribution: studioCount,
        };
      }
    );
  }, [movies]);
};

export function EnhancedMediaMovieList({ 
  userId, 
  initialData, 
  filters: initialFilters,
  searchOptions: initialSearchOptions 
}: MediaListProps) {
  const router = useRouter();
  
  // État principal
  const [allMovies, setAllMovies] = useState<EmbyMovie[]>(initialData?.Items || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [latestMovies, setLatestMovies] = useState<EmbyMovie[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // État des filtres et recherche
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    sortBy: 'rating',
    sortOrder: 'desc',
    filters: {},
    page: 1,
    pageSize: 50,
    ...initialSearchOptions,
  });
  
  // État de l'interface
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState<Partial<PerformanceMetrics>>({});
  
  // Refs
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<Grid>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculer les dimensions de la grille
  const { width: containerWidth = 1200 } = containerRef.current?.getBoundingClientRect() || {};
  const columnCount = Math.floor((containerWidth - GAP) / (ITEM_WIDTH + GAP)) || 4;
  const rowCount = Math.ceil(allMovies.length / columnCount);

  // Charger les films avec instrumentation
  const loadMovies = useCallback(async () => {
    return Sentry.startSpan(
      { op: "media.load_movies", name: "Load Movies" },
      async (span: any) => {
        span.setAttribute("user.id", userId);
        span.setAttribute("has_initial_data", !!initialData);

        if (initialData) {
          logger.debug("Using initial movies data", { 
            userId, 
            count: initialData.Items.length 
          });
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const { result, metrics } = await enhancedMediaAPI.measurePerformance(
            () => enhancedMediaAPI.getMovies(userId),
            "Get Movies API Call"
          );

          setPerformanceMetrics(prev => ({ ...prev, ...metrics }));

          if (result.ok && result.body?.Items) {
            setAllMovies(result.body.Items);
            logger.info("Movies loaded successfully", {
              userId,
              count: result.body.Items.length,
              loadTime: metrics.loadTime,
            });
          } else {
            const errorMsg = result.statusText || 'Erreur lors du chargement des films';
            setError(errorMsg);
            logger.error("Failed to load movies", {
              userId,
              error: errorMsg,
              statusCode: result.status,
            });
          }
        } catch (err) {
          const errorMsg = 'Erreur réseau lors du chargement des films';
          setError(errorMsg);
          Sentry.captureException(err);
          logger.error("Network error loading movies", {
            userId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        } finally {
          setLoading(false);
        }
      }
    );
  }, [userId, initialData]);

  // Charger les films récents
  const loadLatestMovies = useCallback(async () => {
    return Sentry.startSpan(
      { op: "media.load_latest", name: "Load Latest Movies" },
      async (span: any) => {
        span.setAttribute("user.id", userId);

        setLatestLoading(true);

        try {
          const response = await enhancedMediaAPI.getLatestMovies(userId, 10);

          if (response.ok && Array.isArray(response.body)) {
            setLatestMovies(response.body);
            setCarouselIndex(0);
            logger.debug("Latest movies loaded", {
              userId,
              count: response.body.length,
            });
          } else {
            setLatestMovies([]);
            setCarouselIndex(0);
            logger.warn("Failed to load latest movies", {
              userId,
              error: response.statusText,
            });
          }
        } catch (err) {
          setLatestMovies([]);
          setCarouselIndex(0);
          Sentry.captureException(err);
          logger.error("Error loading latest movies", {
            userId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        } finally {
          setLatestLoading(false);
        }
      }
    );
  }, [userId]);

  // Effets
  useEffect(() => {
    if (!userId) return;
    loadMovies();
    loadLatestMovies();
  }, [userId, loadMovies, loadLatestMovies]);

  // Carousel auto-advance
  useEffect(() => {
    if (latestMovies.length <= 1) return;
    
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setCarouselIndex(idx => (idx + 1) % latestMovies.length);
    }, 5000);
    
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [latestMovies]);

  // Reset page when filters change
  useEffect(() => {
    setSearchOptions(prev => ({ ...prev, page: 1 }));
  }, [searchOptions.query, searchOptions.sortBy, searchOptions.sortOrder, searchOptions.filters]);

  // Données filtrées et statistiques
  const { filteredMovies, totalPages, currentPageMovies } = useMovieFilters(allMovies, searchOptions);
  const stats = useMovieStats(allMovies);

  // Handlers pour les filtres
  const updateSearchOptions = useCallback((updates: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFilters = useCallback((updates: Partial<MediaFilters>) => {
    setSearchOptions(prev => ({
      ...prev,
      filters: { ...prev.filters, ...updates }
    }));
  }, []);

  // Données pour la virtualisation
  const itemData: VirtualizedItemData = useMemo(() => ({
    items: viewMode === 'grid' ? currentPageMovies : filteredMovies,
    itemSize: ITEM_HEIGHT,
    columnCount,
    userId,
  }), [currentPageMovies, filteredMovies, viewMode, columnCount, userId]);

  // Préparer les données du graphique
  const chartData = useMemo(() => {
    const genreLabels = Object.keys(stats.genreDistribution);
    return genreLabels.map((genre, index) => ({
      name: genre,
      value: stats.genreDistribution[genre],
      fill: `url(#fill${genre.replace(/\s+/g, '')})`
    }));
  }, [stats.genreDistribution]);

  const totalGenres = Object.values(stats.genreDistribution).reduce((acc, val) => acc + val, 0);

  // Configuration du graphique
  const chartConfig = {
    genres: {
      label: 'Genres',
      color: 'hsl(var(--primary))'
    }
  };

  if (loading) {
    return (
      <MediaErrorBoundary>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="h-[440px] w-[280px] rounded-xl" />
            ))}
          </div>
        </div>
      </MediaErrorBoundary>
    );
  }

  if (error) {
    return (
      <MediaErrorBoundary>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadMovies} variant="outline">
              <IconRefresh className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </MediaErrorBoundary>
    );
  }

  return (
    <MediaErrorBoundary>
      <div className="space-y-6" ref={containerRef}>
        {/* En-tête avec statistiques et carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-4">
            {/* Films vus */}
            <Card className="@container/card relative overflow-hidden">
              <CardHeader>
                <CardDescription>Films vus</CardDescription>
                <CardTitle className="text-xl font-semibold tabular-nums">
                  {stats.watchedMovies.toLocaleString()}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <IconTrendingUp className="h-3 w-3 mr-1 text-primary" />
                    {stats.totalMovies > 0 ? Math.round((stats.watchedMovies / stats.totalMovies) * 100) : 0}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={stats.totalMovies > 0 ? (stats.watchedMovies / stats.totalMovies) * 100 : 0} 
                  className="h-2 bg-primary/20" 
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{stats.watchedMovies} vus</span>
                  <span>{stats.totalMovies - stats.watchedMovies} non vus</span>
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            <Card className="@container/card relative overflow-hidden">
              <CardHeader>
                <CardDescription>Genres</CardDescription>
                <CardTitle className="text-xl font-semibold">Répartition</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {chartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-[200px]"
                  >
                    <PieChart>
                      <defs>
                        {chartData.map((item, index) => (
                          <linearGradient
                            key={item.name}
                            id={`fill${item.name.replace(/\s+/g, '')}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--primary)"
                              stopOpacity={1 - index * 0.15}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--primary)"
                              stopOpacity={0.8 - index * 0.15}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <RechartsPie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        strokeWidth={2}
                        stroke="var(--background)"
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {totalGenres.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 18}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    Genres
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </RechartsPie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-muted-foreground text-sm text-center h-[200px] flex items-center justify-center">
                    Aucun genre
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Carousel films récents */}
          <div className="col-span-1 lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Films récents</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative overflow-hidden rounded-lg">
                {latestLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : latestMovies.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground bg-muted rounded-lg">
                    Aucun film récent
                  </div>
                ) : (
                  <div 
                    className="h-full w-full group cursor-pointer relative"
                    onClick={() => router.push(`/dashboard/media/${latestMovies[carouselIndex].Id}?user=${userId}`)}
                  >
                    {enhancedMediaAPI.getOptimizedImageUrl(
                      latestMovies[carouselIndex].Id,
                      'Backdrop',
                      {
                        width: 800,
                        height: 400,
                        quality: 90,
                        format: 'webp',
                        tag: latestMovies[carouselIndex].BackdropImageTags?.[0],
                      }
                    ) ? (
                      <>
                        <img
                          src={enhancedMediaAPI.getOptimizedImageUrl(
                            latestMovies[carouselIndex].Id,
                            'Backdrop',
                            {
                              width: 800,
                              height: 400,
                              quality: 90,
                              format: 'webp',
                              tag: latestMovies[carouselIndex].BackdropImageTags?.[0],
                            }
                          )}
                          alt={latestMovies[carouselIndex].Name}
                          className="absolute inset-0 w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-lg" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center z-10">
                          <h3 className="font-bold text-2xl mb-2 drop-shadow-lg px-4 line-clamp-2">
                            {latestMovies[carouselIndex].Name}
                          </h3>
                          {latestMovies[carouselIndex].ProductionYear && (
                            <p className="text-lg opacity-90 drop-shadow-lg">
                              {latestMovies[carouselIndex].ProductionYear}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
                        <IconMovie className="h-24 w-24 text-muted-foreground" />
                      </div>
                    )}

                    {/* Navigation carousel */}
                    {latestMovies.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                        {latestMovies.map((_, idx) => (
                          <button
                            key={idx}
                            className={`h-2 w-8 rounded-full transition-all ${
                              carouselIndex === idx ? 'bg-white' : 'bg-white/50'
                            } hover:bg-white/80`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCarouselIndex(idx);
                            }}
                            aria-label={`Aller au film ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconFilter className="h-5 w-5 text-primary" />
                Recherche et Filtres
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <IconList className="h-4 w-4" /> : <IconGridDots className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <IconSettings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche principale */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par titre, année..."
                  value={searchOptions.query}
                  onChange={(e) => updateSearchOptions({ query: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              {/* Tri */}
              <div className="flex gap-2">
                <Select
                  value={searchOptions.sortBy}
                  onValueChange={(value) => updateSearchOptions({ 
                    sortBy: value as SearchOptions['sortBy'] 
                  })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="year">Année</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="runtime">Durée</SelectItem>
                    <SelectItem value="dateAdded">Date d'ajout</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSearchOptions({ 
                    sortOrder: searchOptions.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                >
                  {searchOptions.sortOrder === 'asc' ? 
                    <IconSortAscending className="h-4 w-4" /> : 
                    <IconSortDescending className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>

            {/* Badges de résumé */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {filteredMovies.length} films trouvés
              </Badge>
              <Badge variant="outline">
                Page {searchOptions.page} sur {totalPages}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {stats.watchedMovies} vus
              </Badge>
              <Badge variant="outline" className="bg-accent text-accent-foreground border-accent/20">
                {stats.totalMovies - stats.watchedMovies} non vus
              </Badge>
              {performanceMetrics.loadTime && (
                <Badge variant="outline" className="text-xs">
                  Chargé en {Math.round(performanceMetrics.loadTime)}ms
                </Badge>
              )}
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                {/* TODO: Implémenter les filtres avancés ici */}
                <div className="text-sm text-muted-foreground">
                  Filtres avancés (à implémenter)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grille de films virtualisée */}
        {viewMode === 'grid' && (
          <div style={{ height: '80vh', width: '100%' }}>
            <Grid
              ref={gridRef}
              columnCount={columnCount}
              columnWidth={ITEM_WIDTH + GAP}
              height={600}
              rowCount={Math.ceil(currentPageMovies.length / columnCount)}
              rowHeight={ITEM_HEIGHT + GAP}
              width={containerWidth}
              itemData={itemData}
              overscanRowCount={2}
            >
              {MovieItem}
            </Grid>
          </div>
        )}

        {/* Vue liste (non virtualisée pour l'instant) */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {currentPageMovies.map((movie) => (
              <Card key={movie.Id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/media/${movie.Id}?user=${userId}`)}>
                <div className="flex items-center gap-4">
                  <img
                    src={enhancedMediaAPI.getOptimizedImageUrl(
                      movie.Id,
                      'Primary',
                      { width: 80, height: 120, quality: 80, format: 'webp' }
                    )}
                    alt={movie.Name}
                    className="w-16 h-24 object-cover rounded"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{movie.Name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{movie.ProductionYear}</span>
                      {movie.CommunityRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{movie.CommunityRating.toFixed(1)}</span>
                        </div>
                      )}
                      {movie.RunTimeTicks && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{Math.round(movie.RunTimeTicks / 10000000 / 60)}min</span>
                        </div>
                      )}
                      {movie.UserData?.Played && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Eye className="h-3 w-3" />
                          <span>Vu</span>
                        </div>
                      )}
                    </div>
                    {movie.Overview && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {movie.Overview}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="flex items-center justify-center gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => updateSearchOptions({ page: searchOptions.page - 1 })}
                disabled={searchOptions.page === 1}
              >
                <IconChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, searchOptions.page - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === searchOptions.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSearchOptions({ page })}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => updateSearchOptions({ page: searchOptions.page + 1 })}
                disabled={searchOptions.page >= totalPages}
              >
                Suivant
                <IconChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Message si aucun film */}
        {currentPageMovies.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconMovie className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun film trouvé</h3>
              <p className="text-muted-foreground text-center">
                {searchOptions.query ? 'Essayez de modifier vos critères de recherche' : 'Votre bibliothèque multimédia est vide'}
              </p>
              {searchOptions.query && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => updateSearchOptions({ query: '', filters: {} })}
                >
                  Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MediaErrorBoundary>
  );
}