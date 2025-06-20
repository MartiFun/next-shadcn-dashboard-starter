'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { mediaAPI } from '@/lib/media-api';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { useRouter } from 'next/navigation';
Chart.register(ArcElement, Tooltip, Legend);

const ITEMS_PER_PAGE = 50;

// Type minimal pour un film Emby (adapter selon la réponse Emby)
type EmbyMovie = {
  Id: string;
  Name: string;
  OriginalTitle?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  RunTimeTicks?: number;
  ImageTags?: { [key: string]: string };
  UserData?: { Played: boolean };
  MediaSources?: any[];
  BackdropImageTags?: string[];
  Genres?: string[];
  // ... autres champs utiles
};

function getPosterUrl(movie: EmbyMovie, userId: string) {
  // Emby: /Items/{Id}/Images/Primary?tag={Tag}&quality=90
  if (movie.ImageTags && movie.ImageTags.Primary) {
    const base = process.env.NEXT_PUBLIC_EMBY_URL;
    const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY;
    return `${base}/Items/${movie.Id}/Images/Primary?tag=${movie.ImageTags.Primary}&quality=90&api_key=${apiKey}`;
  }
  return undefined;
}

function getBackdropUrl(movie: EmbyMovie, userId: string) {
  if (movie.BackdropImageTags && Array.isArray(movie.BackdropImageTags) && movie.BackdropImageTags.length > 0) {
    const base = process.env.NEXT_PUBLIC_EMBY_URL;
    const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY;
    return `${base}/Items/${movie.Id}/Images/Backdrop/0?tag=${movie.BackdropImageTags[0]}&quality=90&api_key=${apiKey}`;
  }
  return getPosterUrl(movie, userId);
}

function ticksToMinutes(ticks?: number) {
  if (!ticks) return 0;
  return Math.round(ticks / 10000000 / 60);
}

export function MediaMovieList({ userId }: { userId: string }) {
  const router = useRouter();
  const [allMovies, setAllMovies] = useState<EmbyMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [latestMovies, setLatestMovies] = useState<EmbyMovie[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    mediaAPI.getEmbyMovies(userId).then(res => {
      if (res.ok && res.body?.Items) {
        setAllMovies(res.body.Items);
      } else {
        setError(res.statusText || 'Erreur lors du chargement des films');
      }
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLatestLoading(true);
    mediaAPI.getEmbyLatestMovies(userId).then(res => {
      if (res.ok && Array.isArray(res.body)) {
        setLatestMovies(res.body);
        setCarouselIndex(0);
      } else {
        setLatestMovies([]);
        setCarouselIndex(0);
      }
      setLatestLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (latestMovies.length <= 1) return;
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setCarouselIndex(idx => {
        if (idx < latestMovies.length - 1) {
          return idx + 1;
        } else {
          return 0;
        }
      });
    }, 3000);
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [latestMovies, userId]);

  const { filteredMovies, totalPages, currentPageMovies } = useMemo(() => {
    let filtered = allMovies.filter(movie =>
      movie.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.OriginalTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (movie.ProductionYear?.toString().includes(searchTerm) ?? false)
    );

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
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
  }, [searchTerm, sortBy, sortOrder, userId]);

  // Statistiques (adaptées Emby)
  const totalMovies = allMovies.length;
  const watchedMovies = allMovies.filter(m => m.UserData?.Played).length;
  const totalRuntime = allMovies.reduce((acc, m) => acc + ticksToMinutes(m.RunTimeTicks), 0);
  const totalHours = Math.round(totalRuntime / 60);
  const totalDays = Math.round(totalHours / 24);
  const totalYears = (totalDays / 365.25).toFixed(1);

  // Calculs pour les stats
  const genreCount: Record<string, number> = {};
  allMovies.forEach(m => {
    if (Array.isArray(m.Genres)) {
      m.Genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    }
  });
  const genreLabels = Object.keys(genreCount);
  const genreData = Object.values(genreCount);

  const avgYear = totalMovies > 0 ? Math.round(allMovies.reduce((acc, m) => acc + (m.ProductionYear || 0), 0) / totalMovies) : 0;
  const avgDuration = totalMovies > 0 ? Math.round(allMovies.reduce((acc, m) => acc + ticksToMinutes(m.RunTimeTicks), 0) / totalMovies) : 0;

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

  return (
    <div className="space-y-6">
      {/* Message de bienvenue et statistiques */}
      <div className="flex items-center justify-between space-y-2">
        <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20">
          {totalMovies} films
        </Badge>
      </div>

      {/* Layout stats + carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch mb-6 *:data-[slot=card]:bg-gradient-to-t">
        {/* 2 cartes stats à gauche (1x2) */}
        <div className="grid grid-cols-1 gap-4 col-span-1">
          {/* 1. Films vus */}
          <Card className="@container/card relative overflow-hidden max-h-[400px]">
            <CardHeader>
              <CardDescription>Films vus</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
                {watchedMovies.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <IconTrendingUp className="h-3 w-3 mr-1 text-primary" />
                  {totalMovies > 0 ? Math.round((watchedMovies / totalMovies) * 100) : 0}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 max-h-[220px]">
              <Progress value={totalMovies > 0 ? (watchedMovies / totalMovies) * 100 : 0} className="h-2 bg-primary/20" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{watchedMovies} vus</span>
                <span>{totalMovies - watchedMovies} non vus</span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Genres (pie chart) */}
          <Card className="@container/card relative overflow-hidden max-h-[400px]">
            <CardHeader>
              <CardDescription>Genres</CardDescription>
              <CardTitle className="text-xl font-semibold">Répartition</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center max-h-[220px]">
              {genreLabels.length > 0 ? (
                <Pie
                  data={{
                    labels: genreLabels,
                    datasets: [
                      {
                        data: genreData,
                        backgroundColor: [
                          // Utilise la couleur principale du thème pour le premier genre, puis palette par défaut
                          typeof window !== 'undefined'
                            ? getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#38bdf8'
                            : '#38bdf8',
                          '#38bdf8', '#fbbf24', '#f472b6', '#818cf8', '#f87171', '#34d399', '#facc15', '#60a5fa', '#f472b6', '#f87171', '#818cf8', '#a3e635', '#fbbf24', '#34d399', '#facc15', '#60a5fa', '#f472b6', '#f87171', '#818cf8',
                        ],
                      },
                    ],
                  }}
                  options={{ plugins: { legend: { display: false } }, cutout: '60%' }}
                  width={90}
                  height={90}
                />
              ) : (
                <div className="text-muted-foreground text-sm">Aucun genre</div>
              )}
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {genreLabels.slice(0, 4).map((g, i) => (
                  <span key={g} className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">{g}</span>
                ))}
                {genreLabels.length > 4 && <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">+{genreLabels.length - 4} autres</span>}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Carousel à droite, largeur 2 cartes */}
        <div className="col-span-1 lg:col-span-2 flex flex-col justify-stretch">
          <Card className="@container/card h-full flex flex-col">
            <CardHeader />
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="flex flex-col items-center w-full h-full justify-center">
                <div className="relative w-full h-full min-h-[320px] flex items-center justify-center">
                  {latestLoading ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : latestMovies.length === 0 ? (
                    <div className="flex items-center text-muted-foreground h-full w-full justify-center">Aucun film récent</div>
                  ) : (
                    <div className="flex flex-col items-center w-full h-full group">
                      <div className="absolute inset-0 w-full h-full">
                        {getBackdropUrl(latestMovies[carouselIndex], userId) ? (
                          <>
                            <img
                              src={getBackdropUrl(latestMovies[carouselIndex], userId)}
                              alt={latestMovies[carouselIndex].Name}
                              className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-102 group-hover:shadow-2xl"
                              loading="lazy"
                            />
                            {/* Overlay noir transparent réduit et animé */}
                            <div className="absolute inset-0 w-full h-full bg-black/70 rounded-lg transition-transform duration-300 group-hover:scale-102" />
                            {/* Titre centré */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                              <div className="font-bold text-xl text-white text-center drop-shadow-lg px-4 line-clamp-2" title={latestMovies[carouselIndex].Name}>
                                {latestMovies[carouselIndex].Name}
                              </div>
                              <div className="text-sm text-white/80 mt-2 drop-shadow-lg">
                                {latestMovies[carouselIndex].ProductionYear}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                            <IconMovie className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Dots navigation */}
                {latestMovies.length > 1 && !latestLoading && (
                  <div className="flex gap-2 mt-4">
                    {latestMovies.map((_, idx) => (
                      <button
                        key={idx}
                        className={`h-2 w-6 rounded-full transition-all ${carouselIndex === idx ? 'bg-primary' : 'bg-muted'} cursor-pointer`}
                        onClick={() => setCarouselIndex(idx)}
                        aria-label={`Aller au film ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5 text-primary" />
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
                className={(sortBy === 'title' ? 'bg-muted text-foreground ' : '') + 'cursor-pointer'}
              >
                Title
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('year')}
                className={(sortBy === 'year' ? 'bg-muted text-foreground ' : '') + 'cursor-pointer'}
              >
                Year
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('rating')}
                className={(sortBy === 'rating' ? 'bg-muted text-foreground ' : '') + 'cursor-pointer'}
              >
                Rating
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="cursor-pointer"
              >
                {sortOrder === 'asc' ? <IconSortAscending className="h-4 w-4" /> : <IconSortDescending className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-muted text-foreground border-border">
              {filteredMovies.length} films trouvés
            </Badge>
            <Badge variant="outline">
              Page {currentPage} of {totalPages}
            </Badge>
            <Badge variant="outline" className="bg-muted text-foreground border-border">
              {watchedMovies} vus
            </Badge>
            <Badge variant="outline" className="bg-accent text-accent-foreground border-accent/20">
              {totalMovies - watchedMovies} non vus
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Grille de films */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {currentPageMovies.map((movie) => (
          <div 
            key={movie.Id} 
            className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:rotate-0.5 hover:shadow-2xl cursor-pointer w-[180px] h-[270px] sm:w-[180px] sm:h-[270px] group bg-card text-card-foreground rounded-xl border shadow-sm mx-auto relative"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
            onClick={() => router.push(`/dashboard/media/${movie.Id}?user=${userId}`)}
          >
            {/* Checkmark vu */}
            {movie.UserData?.Played && (
              <div className="absolute top-2 right-2 z-20">
                <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-lg" aria-label="Vu" />
              </div>
            )}
            <div className="relative w-full h-full">
              {getPosterUrl(movie, userId) ? (
                <img
                  src={getPosterUrl(movie, userId)}
                  alt={movie.Name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  loading="lazy"
                  style={{ width: '180px', height: '270px', maxWidth: '100%', maxHeight: '100%' }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ${getPosterUrl(movie, userId) ? 'hidden' : ''}`} style={{ width: '180px', height: '270px', maxWidth: '100%', maxHeight: '100%' }}>
                <IconMovie className="h-24 w-24 text-muted-foreground" />
              </div>
              {/* Overlay noir permanent sous le titre */}
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-b-lg z-10" />
              {/* Informations en bas */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-2" title={movie.Name}>
                    {movie.Name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-white/90 text-sm">
                    <span className="font-medium">{movie.ProductionYear}</span>
                    {movie.CommunityRating && (
                      <div className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{movie.CommunityRating.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.RunTimeTicks && (
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4" />
                        <span>{ticksToMinutes(movie.RunTimeTicks)}min</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 px-2 text-center font-bold text-base truncate" title={movie.Name}>{movie.Name}</div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              className="cursor-pointer"
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
                    onClick={() => setCurrentPage(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="cursor-pointer"
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
              {searchTerm ? 'Try modifying your search criteria' : 'Your media library is empty'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 