'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Star, Clock, Calendar, Eye, EyeOff } from 'lucide-react';
import { BaseItemDto } from '@/types/jellyfin';
import { getJellyfinClient, JellyfinAPIClient } from '@/lib/jellyfin-api';

interface MediaCardProps {
  item: BaseItemDto;
  onPlay?: (item: BaseItemDto) => void;
  onDetails?: (item: BaseItemDto) => void;
  imageWidth?: number;
  imageHeight?: number;
  showProgress?: boolean;
  className?: string;
}

export default function MediaCard({
  item,
  onPlay,
  onDetails,
  imageWidth = 300,
  imageHeight = 450,
  showProgress = true,
  className = '',
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Générer l'URL de l'image
  const getImageUrl = () => {
    try {
      const client = getJellyfinClient();
      return client.getImageUrl(item.Id, 'Primary', {
        maxWidth: imageWidth,
        maxHeight: imageHeight,
        quality: 90,
      });
    } catch {
      return '';
    }
  };

  // Générer l'URL de l'image de fond
  const getBackdropUrl = () => {
    try {
      const client = getJellyfinClient();
      if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
        return client.getImageUrl(item.Id, 'Backdrop', {
          maxWidth: 500,
          quality: 80,
        });
      }
      return '';
    } catch {
      return '';
    }
  };

  const imageUrl = getImageUrl();
  const backdropUrl = getBackdropUrl();

  // Formatage de la durée
  const formatRuntime = (ticks?: number) => {
    return JellyfinAPIClient.formatRuntime(ticks);
  };

  // Calculer le pourcentage de progression
  const getProgressPercentage = () => {
    if (!showProgress || !item.UserData?.PlaybackPositionTicks || !item.RunTimeTicks) {
      return 0;
    }
    return (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100;
  };

  const progressPercentage = getProgressPercentage();
  const isWatched = item.UserData?.Played || false;
  const isFavorite = item.UserData?.IsFavorite || false;

  return (
    <Card className={`group overflow-hidden transition-all hover:shadow-lg ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden">
        {/* Image principale */}
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={item.Name}
            className={`h-full w-full object-cover transition-all group-hover:scale-105 ${
              !imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <div className="mb-2 text-4xl">🎬</div>
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}

        {/* Skeleton de chargement */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {/* Overlay avec les actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-full flex-col justify-between p-4">
            {/* Badges en haut */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                {item.Type && (
                  <Badge variant="secondary" className="text-xs">
                    {item.Type}
                  </Badge>
                )}
                {item.ProductionYear && (
                  <Badge variant="outline" className="text-xs">
                    {item.ProductionYear}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {isWatched && (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="mr-1 h-3 w-3" />
                    Watched
                  </Badge>
                )}
                {isFavorite && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                  </Badge>
                )}
              </div>
            </div>

            {/* Bouton de lecture au centre */}
            <div className="flex justify-center">
              {onPlay && (
                <Button
                  size="lg"
                  className="rounded-full"
                  onClick={() => onPlay(item)}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Play
                </Button>
              )}
            </div>

            {/* Informations en bas */}
            <div className="space-y-1">
              {item.RunTimeTicks && (
                <div className="flex items-center text-xs text-white">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatRuntime(item.RunTimeTicks)}
                </div>
              )}
              {item.CommunityRating && (
                <div className="flex items-center text-xs text-white">
                  <Star className="mr-1 h-3 w-3" />
                  {item.CommunityRating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {showProgress && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Titre */}
          <h3 
            className="font-semibold leading-tight line-clamp-2 cursor-pointer hover:text-primary"
            onClick={() => onDetails?.(item)}
            title={item.Name}
          >
            {item.Name}
          </h3>

          {/* Informations supplémentaires */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {item.SeriesName && (
              <p className="line-clamp-1">
                {item.SeriesName}
                {item.ParentIndexNumber && ` • S${item.ParentIndexNumber}`}
                {item.IndexNumber && `E${item.IndexNumber}`}
              </p>
            )}
            
            {item.Genres && item.Genres.length > 0 && (
              <p className="line-clamp-1">
                {item.Genres.slice(0, 3).join(', ')}
              </p>
            )}

            {item.PremiereDate && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(item.PremiereDate).getFullYear()}
              </div>
            )}
          </div>

          {/* Description courte */}
          {item.Overview && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.Overview}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}