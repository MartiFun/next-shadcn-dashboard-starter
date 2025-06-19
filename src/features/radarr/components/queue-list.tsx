'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconDownload, 
  IconX, 
  IconPlayerPause, 
  IconPlayerPlay,
  IconClock,
  IconFile,
  IconAlertTriangle
} from '@tabler/icons-react';
import { radarrAPI, RadarrQueueItem } from '@/lib/radarr-api';

export function QueueList() {
  const [queue, setQueue] = useState<RadarrQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const data = await radarrAPI.getQueue();
        
        // Debug: log the actual response structure
        console.log('Radarr queue response:', data);
        
        // Handle different response structures
        let queueItems: RadarrQueueItem[] = [];
        
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
          console.log(`Radarr queue item ${index}:`, {
            id: item.id,
            title: item.title,
            movie: item.movie,
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
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveFromQueue = async (id: number) => {
    try {
      await radarrAPI.deleteFromQueue(id);
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error removing from queue:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeLeft = (timeleft: string) => {
    if (!timeleft || timeleft === '00:00:00') return 'Completed';
    return timeleft;
  };

  const getProgressPercentage = (item: RadarrQueueItem) => {
    if (item.size === 0) return 0;
    const downloaded = item.size - item.sizeleft;
    return (downloaded / item.size) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'downloading':
        return 'Downloading';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Loading Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <IconDownload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No downloads in progress</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Download Queue ({queue.length})</h2>
        <Badge variant="outline">
          {queue.filter(item => item.status.toLowerCase() === 'downloading').length} in progress
        </Badge>
      </div>

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
                <CardTitle className="text-base truncate" title={item.movie?.title || item.title || 'Unknown Title'}>
                  {item.movie?.title || item.title || 'Unknown Title'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {item.movie?.year || 'N/A'} • {item.quality?.quality?.name || 'Unknown Quality'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(item.status)} text-white border-0`}
                >
                  {getStatusText(item.status)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFromQueue(item.id)}
                  className="h-8 w-8 p-0 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:scale-110"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">
                  {Math.round(getProgressPercentage(item))}%
                </span>
              </div>
              <Progress value={getProgressPercentage(item)} className="h-2" />
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <IconFile className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Taille</p>
                  <p className="font-medium">{formatFileSize(item.size || 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <IconDownload className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Restant</p>
                  <p className="font-medium">{formatFileSize(item.sizeleft || 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Temps restant</p>
                  <p className="font-medium">{formatTimeLeft(item.timeleft || '')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <IconDownload className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium truncate" title={item.downloadClient || 'Unknown'}>
                    {item.downloadClient || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages d'état */}
            {item.statusMessages && item.statusMessages.length > 0 && (
              <div className="space-y-2">
                {item.statusMessages.map((message, index) => (
                  <div key={index} className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">{message.title}</p>
                    {message.messages.map((msg, msgIndex) => (
                      <p key={msgIndex} className="text-xs text-muted-foreground mt-1">
                        {msg}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {item.status?.toLowerCase() === 'downloading' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="transition-all duration-200 hover:bg-yellow-500 hover:text-white hover:scale-105"
                >
                  <IconPlayerPause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {item.status?.toLowerCase() === 'paused' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="transition-all duration-200 hover:bg-green-500 hover:text-white hover:scale-105"
                >
                  <IconPlayerPlay className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRemoveFromQueue(item.id)}
                className="transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:scale-105"
              >
                <IconX className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 