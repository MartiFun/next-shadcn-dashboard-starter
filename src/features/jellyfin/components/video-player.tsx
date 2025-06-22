'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  Subtitles,
  ArrowLeft
} from 'lucide-react';
import { BaseItemDto, PlayingSessionRequest } from '@/types/jellyfin';
import { getJellyfinClient, JellyfinAPIClient } from '@/lib/jellyfin-api';

interface VideoPlayerProps {
  item: BaseItemDto;
  onBack?: () => void;
  onPlaybackUpdate?: (progress: PlayingSessionRequest) => void;
  autoPlay?: boolean;
  startTime?: number; // Position de départ en secondes
}

export default function VideoPlayer({ 
  item, 
  onBack, 
  onPlaybackUpdate, 
  autoPlay = true,
  startTime = 0 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playSessionId] = useState(`player-${Date.now()}`);

  // Timer pour cacher les contrôles
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialiser le player HLS
  useEffect(() => {
    if (!videoRef.current) return;

    const initializePlayer = async () => {
      try {
        setLoading(true);
        const client = getJellyfinClient();
        
        // Récupérer les informations de lecture
        const playbackInfo = await client.getPlaybackInfo(item.Id, {
          UserId: client.getCurrentUserId()!,
          EnableDirectPlay: true,
          EnableDirectStream: true,
          EnableTranscoding: true,
        });

        if (!playbackInfo.MediaSources || playbackInfo.MediaSources.length === 0) {
          throw new Error('No media sources available');
        }

        const mediaSource = playbackInfo.MediaSources[0];
        
        // Essayer HLS en premier si disponible
        const hlsUrl = client.getHlsUrl(item.Id, {
          PlaySessionId: playSessionId,
          MaxStreamingBitrate: 50000000, // 50 Mbps
        });

        // Vérifier si HLS.js est nécessaire
        if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari natif HLS
          videoRef.current.src = hlsUrl;
        } else {
          // Utiliser HLS.js pour les autres navigateurs
          const { default: Hls } = await import('hls.js');
          
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
            });
            
            hlsRef.current = hls;
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoRef.current);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              if (autoPlay && videoRef.current) {
                videoRef.current.play().catch(console.error);
              }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS Error:', data);
              if (data.fatal) {
                setError('Failed to load video stream');
              }
            });
          } else {
            // Fallback vers le streaming direct
            const streamUrl = client.getStreamUrl(item.Id, {
              Static: true,
              PlaySessionId: playSessionId,
            });
            videoRef.current.src = streamUrl;
          }
        }

        // Signaler le début de lecture
        await client.reportPlaybackStart({
          ItemId: item.Id,
          PlaySessionId: playSessionId,
          CanSeek: true,
          AudioStreamIndex: 0,
          SubtitleStreamIndex: undefined,
        });

      } catch (err) {
        console.error('Player initialization error:', err);
        setError('Failed to initialize video player');
        setLoading(false);
      }
    };

    initializePlayer();

    // Nettoyage
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [item.Id, playSessionId, autoPlay]);

  // Mettre à jour la progression
  const updateProgress = useCallback(async () => {
    if (!videoRef.current || !onPlaybackUpdate) return;

    const progressData: PlayingSessionRequest = {
      ItemId: item.Id,
      PlaySessionId: playSessionId,
      PositionTicks: JellyfinAPIClient.secondsToTicks(videoRef.current.currentTime),
      IsPaused: videoRef.current.paused,
      VolumeLevel: Math.round(videoRef.current.volume * 100),
      IsMuted: videoRef.current.muted,
      CanSeek: true,
    };

    try {
      const client = getJellyfinClient();
      await client.reportPlaybackProgress(progressData);
      onPlaybackUpdate(progressData);
    } catch (error) {
      console.warn('Failed to update progress:', error);
    }
  }, [item.Id, playSessionId, onPlaybackUpdate]);

  // Gestionnaires d'événements vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (startTime > 0) {
        video.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = async () => {
      setIsPlaying(false);
      try {
        const client = getJellyfinClient();
        await client.reportPlaybackStop({
          ItemId: item.Id,
          PlaySessionId: playSessionId,
          PositionTicks: JellyfinAPIClient.secondsToTicks(video.duration),
        });
      } catch (error) {
        console.warn('Failed to report playback stop:', error);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [item.Id, playSessionId, startTime]);

  // Mettre à jour la progression périodiquement
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(updateProgress, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);

  // Gestion de l'affichage des contrôles
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Actions du player
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    updateProgress();
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seek(newTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const changeVolume = (newVolume: number) => {
    if (!videoRef.current) return;
    const volume = newVolume / 100;
    videoRef.current.volume = volume;
    setVolume(volume);
    setIsMuted(volume === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-xl">Loading video...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold">Playback Error</h3>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="relative h-screen bg-black"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullscreen}
      />

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-white">
                  <h2 className="font-semibold">{item.Name}</h2>
                  {item.ProductionYear && (
                    <p className="text-sm text-white/80">({item.ProductionYear})</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Subtitles className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={([value]) => seek(value)}
                className="w-full"
              />
              <div className="mt-2 flex justify-between text-sm text-white/80">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-30)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 fill-current" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(30)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={([value]) => changeVolume(value)}
                    />
                  </div>
                </div>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading/Buffering Indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}