'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconDownload, 
  IconDeviceTv, 
  IconClock,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCheck,
  IconPlayerPause,
  IconPlayerPlay
} from '@tabler/icons-react';
import { sonarrAPI, SonarrQueueItem } from '@/lib/sonarr-api';

export function QueueList() {
  const [queue, setQueue] = useState<SonarrQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const data = await sonarrAPI.getQueue();
        
        // Debug: log the actual response structure
        console.log('Sonarr queue response:', data);
        
        // Handle different response structures
        let queueItems: SonarrQueueItem[] = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          queueItems = data;
        } else if (data && typeof data === 'object' && 'records' in (data as any)) {
          // Paged response with records
          queueItems = (data as any).records || [];
        } else if (data && typeof data === 'object' && 'queue' in (data as any)) {
          // Nested queue property
          queueItems = (data as any).queue || [];
        } else {
          console.warn('Unexpected queue response structure:', data);
          queueItems = [];
        }
        
        // Ensure all items are valid
        queueItems = queueItems.filter(item => item && typeof item === 'object' && item.id);
        
        // Debug: log individual queue items
        queueItems.forEach((item, index) => {
          console.log(`Queue item ${index}:`, {
            id: item.id,
            title: item.title,
            series: item.series,
            episode: item.episode,
            quality: item.quality,
            status: item.status
          });
        });
        
        setQueue(queueItems);
      } catch (err) {
        console.error('Error loading queue:', err);
        setError(err instanceof Error ? err.message : 'Error loading queue');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    
    // Rafraîchir la file d'attente toutes les 30 secondes
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveFromQueue = async (id: number) => {
    try {
      await sonarrAPI.deleteFromQueue(id);
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error removing from queue:', err);
      setError('Failed to remove item from queue');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeLeft = (timeLeft: string) => {
    if (!timeLeft || timeLeft === '00:00:00') return 'Unknown';
    return timeLeft;
  };

  const getQueueStats = () => {
    if (!queue.length) return { total: 0, downloading: 0, paused: 0, completed: 0, totalSize: 0 };
    
    const downloading = queue.filter(item => item.status === 'downloading').length;
    const paused = queue.filter(item => item.status === 'paused').length;
    const completed = queue.filter(item => item.status === 'completed').length;
    const totalSize = queue.reduce((acc, item) => acc + (item.size || 0), 0);
    
    return {
      total: queue.length,
      downloading,
      paused,
      completed,
      totalSize
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paused':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading':
        return <IconDownload className="h-3 w-3 mr-1" />;
      case 'paused':
        return <IconPlayerPause className="h-3 w-3 mr-1" />;
      case 'completed':
        return <IconCheck className="h-3 w-3 mr-1" />;
      case 'failed':
        return <IconAlertTriangle className="h-3 w-3 mr-1" />;
      default:
        return <IconClock className="h-3 w-3 mr-1" />;
    }
  };

  const stats = getQueueStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconDownload className="h-6 w-6" />
            Download Queue 📥
          </h2>
          <Badge variant="outline" className="text-sm">
            Active Downloads
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

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
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
          <IconDownload className="h-6 w-6" />
          Download Queue 📥
        </h2>
        <Badge variant="outline" className="text-sm">
          Active Downloads
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconDownload className="h-3 w-3 mr-1" />
                In Queue
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
              {stats.downloading} downloading <IconDownload className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {stats.paused} paused
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Downloading</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.downloading}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconPlayerPlay className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
              Currently downloading <IconPlayerPlay className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Episodes in progress
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Paused</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.paused}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <IconPlayerPause className="h-3 w-3 mr-1" />
                On Hold
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-yellow-600">
              Temporarily paused <IconPlayerPause className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Waiting to resume
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatFileSize(stats.totalSize)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <IconDeviceTv className="h-3 w-3 mr-1" />
                Episodes
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
              Total download size <IconDeviceTv className="size-4" />
            </div>
            <div className="text-muted-foreground">
              All queue items
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Liste de la file d'attente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDownload className="h-5 w-5" />
            Queue Items
          </CardTitle>
          <CardDescription>
            {queue.length} items in download queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconDownload className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Queue is empty</h3>
              <p className="text-muted-foreground text-center">
                No downloads are currently in progress. Add some series to start downloading.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue
                .filter(item => item && item.id) // Filtrer les éléments invalides
                .map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate" title={item.series?.title || item.title || 'Unknown Series'}>
                          {item.series?.title || item.title || 'Unknown Series'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.episode?.seasonNumber && item.episode?.episodeNumber ? 
                            `S${item.episode.seasonNumber}E${item.episode.episodeNumber}` : 
                            item.episode?.title || 'Unknown Episode'
                          } • {item.episode?.title || 'Unknown Episode'} • {item.quality?.quality?.name || 'Unknown Quality'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(item.status || 'unknown')}
                        >
                          {getStatusIcon(item.status || 'unknown')}
                          {item.status || 'Unknown'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromQueue(item.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p className="font-medium">{formatFileSize(item.size || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium">{formatFileSize(item.sizeleft || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Left</p>
                        <p className="font-medium">{formatTimeLeft(item.timeleft || '')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <p className="font-medium">
                          {item.size && item.sizeleft ? 
                            Math.round(((item.size - item.sizeleft) / item.size) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    {item.size && item.sizeleft && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round(((item.size - item.sizeleft) / item.size) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Messages de statut */}
                    {item.statusMessages && item.statusMessages.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {item.statusMessages.map((message, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            <span className="font-medium">{message.title}:</span> {message.messages.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 