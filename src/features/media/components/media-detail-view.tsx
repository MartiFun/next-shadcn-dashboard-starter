'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PageContainer from '@/components/layout/page-container';
import { IconExternalLink, IconPlayerPlay } from '@tabler/icons-react';
import { MediaPlayerComponent } from '@/components/media-player';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface StreamInfo {
  hlsUrl: string;
  subtitles: {
    src: string;
    label: string;
    srcLang: string;
    default?: boolean;
  }[];
  movieId: string;
  mediaSourceId: string;
  playSessionId: string;
}

export default function MovieDetailView({ movie, userId }: { movie: any, userId: string }) {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [isFavorite, setIsFavorite] = useState(movie.UserData?.IsFavorite || false);
  const router = useRouter();

  // Fonction pour récupérer l'état favori à jour depuis Emby
  const fetchFavoriteStatus = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
    const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';
    try {
      const res = await fetch(`${apiUrl}/Users/${userId}/Items/${movie.Id}?api_key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Emby UserData response:', data);
        setIsFavorite(!!data.UserData && !!data.UserData.IsFavorite);
      } else {
        setIsFavorite(false);
      }
    } catch (e) {
      setIsFavorite(false);
    }
  };

  // Synchronise l'état favori au montage et si l'id ou userId change
  useEffect(() => {
    fetchFavoriteStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.Id, userId]);

  const handlePlayClick = async () => {
    const mediaSource = movie.MediaSources?.[0];
    if (!mediaSource) {
      toast.error('No playable media source found for this item.');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
    const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';

    try {
      // Appeler l'API PlaybackInfo pour obtenir les informations de streaming optimisées
      const playbackInfoUrl = `${apiUrl}/Items/${movie.Id}/PlaybackInfo?UserId=${userId}&api_key=${apiKey}`;
      console.log('Calling PlaybackInfo API:', playbackInfoUrl);
      
      const playbackResponse = await fetch(playbackInfoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Id: movie.Id,
          UserId: userId, // Utiliser l'utilisateur sélectionné
        }),
      });

      if (!playbackResponse.ok) {
        throw new Error(`PlaybackInfo failed: ${playbackResponse.status}`);
      }

      const playbackInfo = await playbackResponse.json();
      console.log('PlaybackInfo response:', playbackInfo);

      // Extraire l'URL de transcodage ou construire l'URL de streaming direct
      let hlsUrl: string;
      
      if (playbackInfo.MediaSources?.[0]?.TranscodingUrl) {
        // Cas 1: Transcodage nécessaire
        hlsUrl = `${apiUrl}${playbackInfo.MediaSources[0].TranscodingUrl}`;
        console.log('Using TranscodingUrl:', hlsUrl);
      } else {
        // Cas 2: Direct Stream possible
        const mediaSource = playbackInfo.MediaSources[0];
        const playSessionId = playbackInfo.PlaySessionId;
        
        // Forcer le transcodage car le fichier source (MKV + EAC3) n'est pas compatible HLS
        hlsUrl = `${apiUrl}/Videos/${movie.Id}/master.m3u8?MediaSourceId=${mediaSource.Id}&PlaySessionId=${playSessionId}&api_key=${apiKey}&AudioCodec=aac&VideoCodec=h264&MaxWidth=1920&MaxHeight=1080&VideoBitRate=8000000&AudioBitRate=128000&AudioChannels=2&AudioSampleRate=48000`;
        console.log('Using Forced Transcoding HLS URL:', hlsUrl);
      }

      console.log('Emby HLS Stream URL (final):', hlsUrl);

      const subtitles = (mediaSource.MediaStreams || [])
        .filter((stream: any) => stream.Type === 'Subtitle' && stream.IsTextSubtitleStream)
        .map((stream: any) => ({
          src: `/api/emby/subtitles?itemId=${movie.Id}&mediaSourceId=${mediaSource.Id}&index=${stream.Index}&format=vtt`,
          label: stream.DisplayTitle || stream.Language || `Subtitle ${stream.Index}`,
          srcLang: stream.Language || 'en',
          default: stream.Index === mediaSource.DefaultSubtitleStreamIndex,
        }));
        
      console.log('Available Subtitles (using proxy):', subtitles);
      setStreamInfo({ 
        hlsUrl, 
        subtitles,
        movieId: movie.Id,
        mediaSourceId: mediaSource.Id,
        playSessionId: playbackInfo.PlaySessionId
      });
    } catch (error) {
      console.error('Error getting playback info:', error);
      toast.error('Failed to get streaming information. Please try again.');
    }
  };

  const handleToggleFavorite = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
    const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';

    const url = `${apiUrl}/Users/${userId}/FavoriteItems/${movie.Id}?api_key=${apiKey}`;
    const method = isFavorite ? 'DELETE' : 'POST';

    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      const response = await fetch(url, { method });

      if (response.ok) {
        toast.success(isFavorite ? 'Removed from My List' : 'Added to My List');
        // Rafraîchir l'état favori depuis Emby
        fetchFavoriteStatus();
      } else {
        const errorText = await response.text();
        toast.error(`Failed to update list: ${errorText}`);
        // Revert optimistic update
        setIsFavorite(isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('An error occurred while updating your list.');
      // Revert optimistic update
      setIsFavorite(isFavorite);
    }
  };

  // Helper for runtime
  function ticksToMinutes(ticks?: number) {
    if (!ticks) return 0;
    return Math.round(ticks / 10000000 / 60);
  }

  // Image URL helpers
  const posterUrl = movie.ImageTags?.Primary
    ? `${process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby'}/Items/${movie.Id}/Images/Primary?tag=${movie.ImageTags.Primary}&quality=90&api_key=${process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863'}`
    : undefined;
  const backdropUrl = movie.BackdropImageTags?.length
    ? `${process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby'}/Items/${movie.Id}/Images/Backdrop/0?tag=${movie.BackdropImageTags[0]}&quality=90&api_key=${process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863'}`
    : posterUrl;

  const cast = Array.isArray(movie.People)
    ? movie.People.filter((p: any) => p.Type === 'Actor').slice(0, 8)
    : [];

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto py-8">
        {/* Bouton retour */}
        <button
          onClick={() => router.push(`/dashboard/media?user=${userId}`)}
          className="absolute left-4 top-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 hover:bg-muted border border-border shadow transition cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Retour</span>
        </button>
        {/* Poster agrandi */}
        <div className="flex-shrink-0 w-full md:w-96 flex justify-center items-start">
          <div className="rounded-xl overflow-hidden shadow-lg border border-border bg-background w-72 h-[432px] md:w-84 md:h-[480px] relative">
            {posterUrl ? (
              <div className="relative w-full h-full">
                <img src={posterUrl} alt={movie.Name} className="w-full h-full object-cover" />
                {/* Checkmark vu en overlay sur l'image */}
                {movie.UserData?.Played && (
                  <div className="absolute top-2 right-2 z-20">
                    <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-lg" aria-label="Vu" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">No Image</div>
            )}
          </div>
        </div>
        {/* Right side: info and actions */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Top info box with backdrop agrandi */}
          <div className="relative rounded-xl overflow-hidden border border-border bg-background shadow-md min-h-[240px]">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt="Backdrop"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
                style={{ zIndex: 0 }}
              />
            )}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 p-6">
              <div className="flex flex-col gap-1 flex-1">
                <h1 className="text-2xl font-bold leading-tight mb-1">{movie.Name}</h1>
                {movie.OriginalTitle && movie.OriginalTitle !== movie.Name && (
                  <div className="text-sm text-muted-foreground italic">{movie.OriginalTitle}</div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-base font-medium">
                  {movie.ProductionYear && <span>{movie.ProductionYear}</span>}
                  {movie.PremiereDate && <span>Premiere: {new Date(movie.PremiereDate).toLocaleDateString()}</span>}
                  {movie.RunTimeTicks && <span>{ticksToMinutes(movie.RunTimeTicks)} min</span>}
                  {movie.OfficialRating && <span>{movie.OfficialRating}</span>}
                  {movie.CommunityRating && <span>⭐ {movie.CommunityRating.toFixed(1)}</span>}
                  {movie.CriticRating && <span>Critics: {movie.CriticRating.toFixed(1)}</span>}
                  {movie.Genres && movie.Genres.length > 0 && <span>{movie.Genres.join(', ')}</span>}
                  {movie.Studios && movie.Studios.length > 0 && <span>Studio: {movie.Studios.map((s: any) => s.Name).join(', ')}</span>}
                  {movie.Status && <span>Status: {movie.Status}</span>}
                </div>
                {movie.Taglines && movie.Taglines.length > 0 && (
                  <div className="text-base text-muted-foreground italic mt-1">{movie.Taglines[0]}</div>
                )}
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="font-semibold px-8 py-2 transition hover:bg-primary/90 cursor-pointer"
              onClick={handlePlayClick}
            >
              Play
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold px-8 py-2 transition hover:bg-muted cursor-pointer"
              onClick={handleToggleFavorite}
            >
              {isFavorite ? 'Remove from List' : 'Add to My List'}
            </Button>
          </div>
          {/* Description */}
          {movie.Overview && (
            <div className="text-base text-muted-foreground max-w-2xl leading-relaxed">
              {movie.Overview}
            </div>
          )}
          {/* Trailers */}
          {movie.RemoteTrailers && movie.RemoteTrailers.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold mb-2 text-base">Trailers</div>
              <div className="flex flex-row gap-2 flex-wrap">
                {movie.RemoteTrailers.map((trailer: any, idx: number) => (
                  <Button
                    key={idx}
                    asChild
                    size="sm"
                    variant="default"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <a href={trailer.Url} target="_blank" rel="noopener noreferrer">
                      <IconPlayerPlay className="w-4 h-4 mr-1" />
                      {trailer.Name || 'Trailer'}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* External Links */}
          {movie.ExternalUrls && movie.ExternalUrls.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold mb-2 text-base">External Links</div>
              <div className="flex flex-row gap-2 flex-wrap">
                {movie.ExternalUrls.map((link: any, idx: number) => (
                  <Button
                    key={idx}
                    asChild
                    size="sm"
                    variant="default"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <a href={link.Url} target="_blank" rel="noopener noreferrer">
                      <IconExternalLink className="w-4 h-4 mr-1" />
                      {link.Name || link.Url}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* Cast */}
          {cast.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold mb-2 text-base">Cast</div>
              <div className="flex flex-row gap-4 flex-wrap">
                {cast.map((person: any) => {
                  // Try to get actor image from Emby
                  const actorImg = person.PrimaryImageTag
                    ? `${process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby'}/Items/${person.Id}/Images/Primary?tag=${person.PrimaryImageTag}&quality=80&api_key=${process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863'}`
                    : undefined;
                  return (
                    <div key={person.Id} className="flex flex-col items-center w-16">
                      <Avatar className="w-12 h-12 mb-1">
                        {actorImg ? (
                          <AvatarImage src={actorImg} alt={person.Name} className="object-cover object-center w-full h-full" />
                        ) : (
                          <AvatarFallback>{person.Name?.[0]}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-xs text-center truncate w-full">{person.Name}</span>
                      {person.Role && <span className="text-[10px] text-muted-foreground text-center truncate w-full">{person.Role}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Provider IDs */}
          {movie.ProviderIds && typeof movie.ProviderIds === 'object' && (
            <div className="mt-2">
              <div className="font-semibold mb-2 text-base">Provider IDs</div>
              <div className="flex flex-row gap-4 flex-wrap text-xs">
                {Object.entries(movie.ProviderIds as Record<string, string>).map(([key, value]) => (
                  <span key={key} className="bg-muted px-2 py-1 rounded text-muted-foreground">{key}: {value}</span>
                ))}
              </div>
            </div>
          )}
          {/* User Data */}
          {movie.UserData && (
            <div className="mt-2">
              <div className="font-semibold mb-2 text-base">Your Data</div>
              <div className="flex flex-row gap-4 flex-wrap text-xs">
                {movie.UserData.Played && <span className="bg-muted px-2 py-1 rounded text-muted-foreground">Played</span>}
                {movie.UserData.IsFavorite && <span className="bg-muted px-2 py-1 rounded text-muted-foreground">Favorite</span>}
                {typeof movie.UserData.Rating === 'number' && <span className="bg-muted px-2 py-1 rounded text-muted-foreground">Your Rating: {movie.UserData.Rating}</span>}
                {typeof movie.UserData.PlayCount === 'number' && <span className="bg-muted px-2 py-1 rounded text-muted-foreground">Play Count: {movie.UserData.PlayCount}</span>}
                {movie.UserData.LastPlayedDate && <span className="bg-muted px-2 py-1 rounded text-muted-foreground">Last Played: {new Date(movie.UserData.LastPlayedDate).toLocaleDateString()}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
      {streamInfo && (
        <MediaPlayerComponent
          streamInfo={streamInfo}
          onClose={() => setStreamInfo(null)}
        />
      )}
    </PageContainer>
  );
} 