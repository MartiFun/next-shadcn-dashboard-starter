'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Film, 
  Tv, 
  Clock, 
  Star, 
  TrendingUp, 
  Settings,
  LogOut,
  RefreshCw,
  Search,
  User
} from 'lucide-react';
import JellyfinLogin from '@/features/jellyfin/components/jellyfin-login';
import MediaCard from '@/features/jellyfin/components/media-card';
import { getJellyfinClient } from '@/lib/jellyfin-api';
import { BaseItemDto, ItemsResult } from '@/types/jellyfin';

// Hook simulé pour l'authentification Jellyfin (en attendant que Zustand fonctionne)
const useJellyfinAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const login = async (serverUrl: string, username: string, password: string) => {
    // Logique de connexion simulée pour le moment
    setIsLoading(true);
    try {
      // Cette logique sera remplacée par le vrai hook quand Zustand fonctionnera
      console.log('Login attempt:', { serverUrl, username });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      setIsAuthenticated(true);
      setUser({ name: username });
      setError(null);
    } catch (err) {
      setError('Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    clearError,
  };
};

export default function JellyfinPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error, user, login, logout, clearError } = useJellyfinAuth();
  
  const [movies, setMovies] = useState<BaseItemDto[]>([]);
  const [series, setSeries] = useState<BaseItemDto[]>([]);
  const [recentItems, setRecentItems] = useState<BaseItemDto[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Charger les médias quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadMediaData();
    }
  }, [isAuthenticated]);

  const loadMediaData = async () => {
    setIsLoadingMedia(true);
    setMediaError(null);
    
    try {
      // Pour l'instant, on simule les données
      // Cette logique sera remplacée par de vrais appels API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées
      const mockMovies: BaseItemDto[] = [
        {
          Id: '1',
          Name: 'The Matrix',
          Type: 'Movie',
          ServerId: 'server1',
          LocationType: 'FileSystem',
          IsFolder: false,
          ProductionYear: 1999,
          RunTimeTicks: 82800000000, // 2h 18m en ticks
          Genres: ['Action', 'Sci-Fi'],
          CommunityRating: 8.7,
          Overview: 'A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix.',
          ImageTags: { Primary: 'tag1' },
          UserData: {
            Played: false,
            PlaybackPositionTicks: 0,
            IsFavorite: false,
          },
        },
        {
          Id: '2',
          Name: 'Inception',
          Type: 'Movie',
          ServerId: 'server1',
          LocationType: 'FileSystem',
          IsFolder: false,
          ProductionYear: 2010,
          RunTimeTicks: 88200000000, // 2h 27m en ticks
          Genres: ['Action', 'Thriller', 'Sci-Fi'],
          CommunityRating: 8.8,
          Overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
          ImageTags: { Primary: 'tag2' },
          UserData: {
            Played: true,
            PlaybackPositionTicks: 44100000000, // 50% regardé
            IsFavorite: true,
          },
        },
      ];

      const mockSeries: BaseItemDto[] = [
        {
          Id: '3',
          Name: 'Breaking Bad',
          Type: 'Series',
          ServerId: 'server1',
          LocationType: 'FileSystem',
          IsFolder: true,
          ProductionYear: 2008,
          Genres: ['Drama', 'Crime', 'Thriller'],
          CommunityRating: 9.5,
          Overview: 'A high school chemistry teacher turned methamphetamine producer partners with a former student to secure his family\'s financial future.',
          ImageTags: { Primary: 'tag3' },
          UserData: {
            Played: false,
            IsFavorite: true,
          },
        },
      ];

      setMovies(mockMovies);
      setSeries(mockSeries);
      setRecentItems([...mockMovies, ...mockSeries]);
      
    } catch (err) {
      setMediaError('Failed to load media data');
      console.error('Failed to load media:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handlePlay = (item: BaseItemDto) => {
    // Rediriger vers la page de lecture
    router.push(`/dashboard/jellyfin/watch/${item.Id}`);
  };

  const handleDetails = (item: BaseItemDto) => {
    // Rediriger vers la page de détails
    router.push(`/dashboard/jellyfin/details/${item.Id}`);
  };

  const handleRefresh = () => {
    if (isAuthenticated) {
      loadMediaData();
    }
  };

  // Si non authentifié, afficher le formulaire de connexion
  if (!isAuthenticated) {
    return (
      <JellyfinLogin
        onLogin={login}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
      />
    );
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jellyfin Media Server</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Browse your media library.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movies.length}</div>
              <p className="text-xs text-muted-foreground">
                Available in your library
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TV Series</CardTitle>
              <Tv className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{series.length}</div>
              <p className="text-xs text-muted-foreground">
                Series in your collection
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Continue Watching</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentItems.filter(item => item.UserData?.PlaybackPositionTicks).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items in progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentItems.filter(item => item.UserData?.IsFavorite).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Your favorite items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {mediaError && (
          <Alert variant="destructive">
            <AlertDescription>{mediaError}</AlertDescription>
          </Alert>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="series">TV Series</TabsTrigger>
            <TabsTrigger value="continue">Continue Watching</TabsTrigger>
          </TabsList>

          {/* Recently Added */}
          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recently Added</h2>
              <Badge variant="secondary">{recentItems.length} items</Badge>
            </div>
            
            {isLoadingMedia ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {recentItems.map((item) => (
                  <MediaCard
                    key={item.Id}
                    item={item}
                    onPlay={handlePlay}
                    onDetails={handleDetails}
                    showProgress={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Movies */}
          <TabsContent value="movies" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Movies</h2>
              <Badge variant="secondary">{movies.length} movies</Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {movies.map((movie) => (
                <MediaCard
                  key={movie.Id}
                  item={movie}
                  onPlay={handlePlay}
                  onDetails={handleDetails}
                  showProgress={true}
                />
              ))}
            </div>
          </TabsContent>

          {/* TV Series */}
          <TabsContent value="series" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">TV Series</h2>
              <Badge variant="secondary">{series.length} series</Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {series.map((show) => (
                <MediaCard
                  key={show.Id}
                  item={show}
                  onPlay={handlePlay}
                  onDetails={handleDetails}
                  showProgress={true}
                />
              ))}
            </div>
          </TabsContent>

          {/* Continue Watching */}
          <TabsContent value="continue" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Continue Watching</h2>
              <Badge variant="secondary">
                {recentItems.filter(item => item.UserData?.PlaybackPositionTicks).length} items
              </Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {recentItems
                .filter(item => item.UserData?.PlaybackPositionTicks && item.UserData.PlaybackPositionTicks > 0)
                .map((item) => (
                  <MediaCard
                    key={item.Id}
                    item={item}
                    onPlay={handlePlay}
                    onDetails={handleDetails}
                    showProgress={true}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}