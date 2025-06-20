'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconHeart,
  IconHeartFilled,
  IconEye,
  IconEyeOff,
  IconStar,
  IconStarFilled,
  IconClock,
  IconCalendar,
  IconPlay,
  IconDownload,
  IconShare,
  IconMoreVertical,
  IconBookmark,
  IconBookmarkFilled,
  IconMovie,
  IconInfoCircle,
} from '@tabler/icons-react';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { EmbyMovie, MovieDisplayOptions } from '@/types/media';

interface MovieCardEnhancedProps {
  movie: EmbyMovie;
  userId: string;
  displayOptions: MovieDisplayOptions;
  isSelected?: boolean;
  isFavorite?: boolean;
  isWatched?: boolean;
  watchProgress?: number;
  userRating?: number | null;
  onPlay?: (movieId: string) => void;
  onToggleFavorite?: (movieId: string) => void;
  onMarkWatched?: (movieId: string) => void;
  onMarkUnwatched?: (movieId: string) => void;
  onSetRating?: (movieId: string, rating: number) => void;
  onToggleSelection?: (movieId: string) => void;
  onShowDetails?: (movieId: string) => void;
}

export function MovieCardEnhanced({
  movie,
  userId,
  displayOptions,
  isSelected = false,
  isFavorite = false,
  isWatched = false,
  watchProgress = 0,
  userRating = null,
  onPlay,
  onToggleFavorite,
  onMarkWatched,
  onMarkUnwatched,
  onSetRating,
  onToggleSelection,
  onShowDetails,
}: MovieCardEnhancedProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // URLs pour les images
  const getPosterUrl = () => {
    if (movie.ImageTags && movie.ImageTags.Primary) {
      const base = process.env.NEXT_PUBLIC_EMBY_URL;
      const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY;
      return `${base}/Items/${movie.Id}/Images/Primary?tag=${movie.ImageTags.Primary}&quality=90&api_key=${apiKey}`;
    }
    return null;
  };

  const getBackdropUrl = () => {
    if (movie.BackdropImageTags && movie.BackdropImageTags.length > 0) {
      const base = process.env.NEXT_PUBLIC_EMBY_URL;
      const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY;
      return `${base}/Items/${movie.Id}/Images/Backdrop/0?tag=${movie.BackdropImageTags[0]}&quality=90&api_key=${apiKey}`;
    }
    return getPosterUrl();
  };

  // Utilitaires
  const formatDuration = (ticks?: number) => {
    if (!ticks) return null;
    const minutes = Math.round(ticks / 10000000 / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  };

  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : null;
  };

  const getQualityBadge = () => {
    const streams = movie.MediaSources?.[0]?.MediaStreams;
    const videoStream = streams?.find(s => s.Type === 'Video');
    
    if (videoStream?.Height) {
      if (videoStream.Height >= 2160) return '4K';
      if (videoStream.Height >= 1080) return 'HD';
      if (videoStream.Height >= 720) return 'HD';
    }
    return null;
  };

  const getMainActors = () => {
    return movie.People?.filter(p => p.Type === 'Actor').slice(0, 3) || [];
  };

  const getDirector = () => {
    return movie.People?.find(p => p.Type === 'Director')?.Name;
  };

  // Gestion des événements
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (displayOptions.showOverlay) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onShowDetails) {
      onShowDetails(movie.Id);
    } else {
      router.push(`/dashboard/media/${movie.Id}?user=${userId}`);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(movie.Id);
    } else {
      router.push(`/dashboard/media/${movie.Id}/play?user=${userId}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(movie.Id);
  };

  const handleWatchedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWatched) {
      onMarkUnwatched?.(movie.Id);
    } else {
      onMarkWatched?.(movie.Id);
    }
  };

  const handleRatingClick = (e: React.MouseEvent, rating: number) => {
    e.stopPropagation();
    onSetRating?.(movie.Id, rating);
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection?.(movie.Id);
  };

  // Classes CSS dynamiques
  const cardClasses = [
    'group relative overflow-hidden transition-all duration-300 cursor-pointer',
    'hover:scale-[1.02] hover:shadow-2xl',
    displayOptions.density === 'compact' ? 'h-[200px]' : 
    displayOptions.density === 'comfortable' ? 'h-[280px]' : 'h-[320px]',
    isSelected ? 'ring-2 ring-primary ring-offset-2' : '',
    'bg-card text-card-foreground rounded-xl border shadow-sm',
  ].filter(Boolean).join(' ');

  const imageClasses = [
    'absolute inset-0 w-full h-full object-cover transition-all duration-500',
    isHovered ? 'scale-110' : 'scale-100',
    imageLoaded ? 'opacity-100' : 'opacity-0',
  ].join(' ');

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <Card 
        className={cardClasses}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Sélection checkbox */}
        {onToggleSelection && (
          <div className="absolute top-2 left-2 z-30">
            <Button
              size="sm"
              variant={isSelected ? "default" : "secondary"}
              className="h-6 w-6 p-0 rounded-full"
              onClick={handleSelectionClick}
            >
              {isSelected && <CheckCircle2 className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {/* Badges de statut */}
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-1">
          {isWatched && (
            <Badge variant="secondary" className="bg-green-500/80 text-white text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Vu
            </Badge>
          )}
          {isFavorite && (
            <Badge variant="secondary" className="bg-red-500/80 text-white text-xs">
              <IconHeartFilled className="h-3 w-3 mr-1" />
              Favori
            </Badge>
          )}
          {getQualityBadge() && (
            <Badge variant="secondary" className="bg-blue-500/80 text-white text-xs">
              {getQualityBadge()}
            </Badge>
          )}
          {movie.CollectionName && (
            <Badge variant="secondary" className="bg-purple-500/80 text-white text-xs">
              Collection
            </Badge>
          )}
        </div>

        {/* Image principale */}
        <div className="relative w-full h-full">
          {getPosterUrl() && !imageError ? (
            <img
              src={getPosterUrl()!}
              alt={movie.Name}
              className={imageClasses}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <IconMovie className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Overlay de progression */}
          {watchProgress > 0 && watchProgress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${watchProgress}%` }}
              />
            </div>
          )}

          {/* Overlay noir et contenu */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${isHovered || displayOptions.showOverlay ? 'opacity-100' : 'opacity-60'}`}>
            
            {/* Contenu principal en bas */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="space-y-2">
                {/* Titre */}
                <h3 className="font-bold text-lg leading-tight line-clamp-2" title={movie.Name}>
                  {movie.Name}
                </h3>

                {/* Informations de base */}
                <div className="flex items-center gap-3 text-sm text-white/90">
                  {displayOptions.showYear && movie.ProductionYear && (
                    <span className="flex items-center gap-1">
                      <IconCalendar className="h-3 w-3" />
                      {movie.ProductionYear}
                    </span>
                  )}
                  
                  {displayOptions.showRating && movie.CommunityRating && (
                    <span className="flex items-center gap-1">
                      <IconStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {formatRating(movie.CommunityRating)}
                    </span>
                  )}
                  
                  {displayOptions.showDuration && movie.RunTimeTicks && (
                    <span className="flex items-center gap-1">
                      <IconClock className="h-3 w-3" />
                      {formatDuration(movie.RunTimeTicks)}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {displayOptions.showGenres && movie.Genres && movie.Genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.Genres.slice(0, 3).map(genre => (
                      <Badge key={genre} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                        {genre}
                      </Badge>
                    ))}
                    {movie.Genres.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                        +{movie.Genres.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Synopsis (mode étendu uniquement) */}
                {displayOptions.density === 'spacious' && movie.Overview && (
                  <p className="text-sm text-white/80 line-clamp-2">
                    {movie.Overview}
                  </p>
                )}

                {/* Acteurs principaux (mode étendu uniquement) */}
                {displayOptions.density === 'spacious' && getMainActors().length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span className="text-xs text-white/70 line-clamp-1">
                      {getMainActors().map(actor => actor.Name).join(', ')}
                    </span>
                  </div>
                )}

                {/* Réalisateur (mode étendu uniquement) */}
                {displayOptions.density === 'spacious' && getDirector() && (
                  <div className="text-xs text-white/70">
                    Réalisé par {getDirector()}
                  </div>
                )}
              </div>
            </div>

            {/* Overlay d'actions au survol */}
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm">
                  {/* Bouton play */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="h-10 w-10 rounded-full p-0 bg-primary hover:bg-primary/80"
                        onClick={handlePlayClick}
                      >
                        <IconPlay className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Lire le film</TooltipContent>
                  </Tooltip>

                  {/* Bouton favori */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={handleFavoriteClick}
                      >
                        {isFavorite ? 
                          <IconHeartFilled className="h-4 w-4 text-red-500" /> : 
                          <IconHeart className="h-4 w-4" />
                        }
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</TooltipContent>
                  </Tooltip>

                  {/* Bouton vu/non vu */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={handleWatchedToggle}
                      >
                        {isWatched ? 
                          <IconEye className="h-4 w-4 text-green-500" /> : 
                          <IconEyeOff className="h-4 w-4" />
                        }
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isWatched ? 'Marquer comme non vu' : 'Marquer comme vu'}</TooltipContent>
                  </Tooltip>

                  {/* Menu d'actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0"
                      >
                        <IconMoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShowDetails?.(movie.Id); }}>
                        <IconInfoCircle className="h-4 w-4 mr-2" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO: Share */ }}>
                        <IconShare className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO: Download */ }}>
                        <IconDownload className="h-4 w-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      
                      {/* Note utilisateur */}
                      <div className="px-2 py-1">
                        <div className="text-sm font-medium mb-1">Note personnelle</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={(e) => handleRatingClick(e, rating)}
                              className="hover:scale-110 transition-transform"
                            >
                              {(userRating || 0) >= rating ? 
                                <IconStarFilled className="h-3 w-3 text-yellow-400" /> : 
                                <IconStar className="h-3 w-3 text-gray-400" />
                              }
                            </button>
                          ))}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Titre en dessous (mode compact uniquement) */}
        {displayOptions.density === 'compact' && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <p className="font-medium text-sm truncate px-2" title={movie.Name}>
              {movie.Name}
            </p>
            {movie.ProductionYear && (
              <p className="text-xs text-muted-foreground">
                {movie.ProductionYear}
              </p>
            )}
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}