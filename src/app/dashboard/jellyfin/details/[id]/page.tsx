'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Star, 
  Clock, 
  Calendar, 
  Users, 
  Building, 
  ArrowLeft,
  Heart,
  HeartOff,
  Download,
  Share,
  MoreHorizontal
} from 'lucide-react';
import { BaseItemDto } from '@/types/jellyfin';
import { getJellyfinClient, JellyfinAPIClient } from '@/lib/jellyfin-api';

export default function MediaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItemDetails = async () => {
      try {
        setLoading(true);
        const client = getJellyfinClient();
        
        // Récupérer tous les détails du média
        const itemData = await client.getItem(itemId, 
          'MediaSources,MediaStreams,Chapters,People,Studios,Genres,Taglines,Overview,ParentId,Path,ProviderIds'
        );
        
        setItem(itemData);
      } catch (err) {
        console.error('Failed to load media details:', err);
        setError('Failed to load media details');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadItemDetails();
    }
  }, [itemId]);

  const handleBack = () => {
    router.back();
  };

  const handlePlay = () => {
    router.push(`/dashboard/jellyfin/watch/${itemId}`);
  };

  const handleToggleFavorite = async () => {
    // TODO: Implémenter la logique pour marquer/démarquer comme favori
    console.log('Toggle favorite for:', itemId);
  };

  const getImageUrl = (imageType: string = 'Primary') => {
    if (!item) return '';
    try {
      const client = getJellyfinClient();
      return client.getImageUrl(item.Id, imageType, {
        maxWidth: 500,
        quality: 90,
      });
    } catch {
      return '';
    }
  };

  const getBackdropUrl = () => {
    if (!item?.BackdropImageTags?.length) return '';
    try {
      const client = getJellyfinClient();
      return client.getImageUrl(item.Id, 'Backdrop', {
        maxWidth: 1920,
        quality: 80,
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-xl">Loading details...</div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !item) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Media Not Found</h2>
            <p className="mb-6 text-muted-foreground">{error || 'The requested media could not be found.'}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const backdropUrl = getBackdropUrl();
  const primaryImageUrl = getImageUrl('Primary');
  const isFavorite = item.UserData?.IsFavorite || false;
  const isWatched = item.UserData?.Played || false;
  const progressPercentage = item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
    ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      {backdropUrl && (
        <div 
          className="relative h-96 bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        </div>
      )}

      <PageContainer>
        <div className={`${backdropUrl ? '-mt-32' : 'pt-8'} relative`}>
          {/* Back Button */}
          <div className="mb-6">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Poster and Quick Actions */}
            <div className="lg:col-span-1">
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={item.Name}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full max-w-sm mx-auto aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="mb-2 text-4xl">🎬</div>
                    <p>No Poster</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                <Button onClick={handlePlay} size="lg" className="w-full">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  {progressPercentage > 5 ? 'Continue Watching' : 'Play'}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFavorite}
                    className="flex-1"
                  >
                    {isFavorite ? (
                      <HeartOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4" />
                    )}
                    {isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {progressPercentage > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details and Metadata */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Basic Info */}
              <div>
                <h1 className="text-4xl font-bold mb-2">{item.Name}</h1>
                {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                  <p className="text-lg text-muted-foreground mb-2">{item.OriginalTitle}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {item.ProductionYear && (
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {item.ProductionYear}
                    </div>
                  )}
                  
                  {item.RunTimeTicks && (
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {JellyfinAPIClient.formatRuntime(item.RunTimeTicks)}
                    </div>
                  )}
                  
                  {item.CommunityRating && (
                    <div className="flex items-center">
                      <Star className="mr-1 h-4 w-4" />
                      {item.CommunityRating.toFixed(1)}
                    </div>
                  )}

                  {item.OfficialRating && (
                    <Badge variant="outline">{item.OfficialRating}</Badge>
                  )}
                </div>

                {/* Genres */}
                {item.Genres && item.Genres.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.Genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Overview */}
              {item.Overview && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.Overview}
                  </p>
                </div>
              )}

              {/* Taglines */}
              {item.Taglines && item.Taglines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Taglines</h3>
                  <div className="space-y-1">
                    {item.Taglines.map((tagline, index) => (
                      <p key={index} className="text-muted-foreground italic">
                        "{tagline}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Cast and Crew */}
              {item.People && item.People.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cast & Crew</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {item.People.slice(0, 12).map((person) => (
                      <div key={person.Id || person.Name} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{person.Name}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.Role || person.Type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Studios */}
              {item.Studios && item.Studios.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Studios</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.Studios.map((studio) => (
                      <Badge key={studio.Id || studio.Name} variant="outline">
                        <Building className="mr-1 h-3 w-3" />
                        {studio.Name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.Container && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Container:</span>
                      <span>{item.Container.toUpperCase()}</span>
                    </div>
                  )}
                  
                  {item.Size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span>{(item.Size / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                    </div>
                  )}

                  {item.DateCreated && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Added:</span>
                      <span>{new Date(item.DateCreated).toLocaleDateString()}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Media Streams Info */}
                  {item.MediaStreams && item.MediaStreams.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Media Streams</h4>
                      {item.MediaStreams
                        .filter(stream => stream.Type === 'Video')
                        .map((stream, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Video:</span>
                              <span>
                                {stream.Width}x{stream.Height} • {stream.Codec?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      
                      {item.MediaStreams
                        .filter(stream => stream.Type === 'Audio')
                        .map((stream, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Audio:</span>
                              <span>
                                {stream.Codec?.toUpperCase()} • {stream.Channels} channels
                                {stream.Language && ` • ${stream.Language}`}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}