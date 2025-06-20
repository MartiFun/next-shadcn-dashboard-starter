'use client';

import React, { useEffect, useRef } from 'react';
import * as MediaPlayer from '@/components/ui/media-player';
import MuxVideo from '@mux/mux-video-react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

interface MediaPlayerComponentProps {
  streamInfo: StreamInfo;
  onClose: () => void;
}

export function MediaPlayerComponent({ streamInfo, onClose }: MediaPlayerComponentProps) {
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
  const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';

  // Fonction pour informer Emby que la lecture a commencé
  const notifyPlaybackStarted = async () => {
    try {
      await fetch(`${apiUrl}/Sessions/Playing?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: streamInfo.movieId,
          MediaSourceId: streamInfo.mediaSourceId,
          PlaySessionId: streamInfo.playSessionId,
          CanSeek: true,
          IsPaused: false,
          IsMuted: false,
          PlayMethod: 'Transcode',
          QueueableMediaTypes: ['Video'],
        }),
      });
      console.log('Playback started notification sent to Emby');
    } catch (error) {
      console.error('Failed to notify playback started:', error);
    }
  };

  // Fonction pour informer Emby de la progression
  const notifyPlaybackProgress = async (positionTicks: number, isPaused: boolean = false) => {
    try {
      await fetch(`${apiUrl}/Sessions/Playing/Progress?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: streamInfo.movieId,
          MediaSourceId: streamInfo.mediaSourceId,
          PlaySessionId: streamInfo.playSessionId,
          CanSeek: true,
          IsPaused: isPaused,
          IsMuted: false,
          PlayMethod: 'Transcode',
          QueueableMediaTypes: ['Video'],
          PositionTicks: positionTicks,
          EventName: isPaused ? 'Pause' : 'TimeUpdate',
        }),
      });
    } catch (error) {
      console.error('Failed to notify playback progress:', error);
    }
  };

  // Fonction pour informer Emby que la lecture s'est arrêtée
  const notifyPlaybackStopped = async () => {
    try {
      await fetch(`${apiUrl}/Sessions/Playing/Stopped?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: streamInfo.movieId,
          MediaSourceId: streamInfo.mediaSourceId,
          PlaySessionId: streamInfo.playSessionId,
          CanSeek: true,
          IsPaused: false,
          IsMuted: false,
          PlayMethod: 'Transcode',
          QueueableMediaTypes: ['Video'],
        }),
      });
      console.log('Playback stopped notification sent to Emby');
    } catch (error) {
      console.error('Failed to notify playback stopped:', error);
    }
  };

  // Nettoyer les intervalles et notifier l'arrêt
  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    notifyPlaybackStopped();
    onClose();
  };

  // Démarrer les notifications de progression
  useEffect(() => {
    notifyPlaybackStarted();
    
    // Notifier la progression toutes les 10 secondes
    progressIntervalRef.current = setInterval(() => {
      // On peut récupérer la position actuelle depuis le lecteur si nécessaire
      notifyPlaybackProgress(0); // Pour l'instant, on envoie 0
    }, 10000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      notifyPlaybackStopped();
    };
  }, []);

  // Ajouter les pistes de sous-titres au vidéo après le montage
  useEffect(() => {
    if (videoRef.current && streamInfo.subtitles.length > 0) {
      // Supprimer les anciennes pistes
      const existingTracks = videoRef.current.querySelectorAll('track');
      existingTracks.forEach(track => track.remove());

      // Ajouter les nouvelles pistes
      streamInfo.subtitles.forEach((subtitle, index) => {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.src = subtitle.src;
        track.label = subtitle.label;
        track.srclang = subtitle.srcLang;
        track.default = subtitle.default || false;
        videoRef.current?.appendChild(track);
      });

      console.log('Subtitles tracks added to video:', streamInfo.subtitles);
    }
  }, [streamInfo.subtitles]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-4xl">
        <MediaPlayer.Root>
          <MediaPlayer.Video asChild>
            <MuxVideo 
              ref={videoRef}
              src={streamInfo.hlsUrl}
            />
          </MediaPlayer.Video>
          <MediaPlayer.Loading />
          <MediaPlayer.Error />
          <MediaPlayer.VolumeIndicator />
          <MediaPlayer.Controls>
            <MediaPlayer.ControlsOverlay />
            <MediaPlayer.Play />
            <MediaPlayer.SeekBackward />
            <MediaPlayer.SeekForward />
            <MediaPlayer.Volume />
            <MediaPlayer.Seek />
            <MediaPlayer.Time />
            <MediaPlayer.Settings />
            <MediaPlayer.PiP />
            <MediaPlayer.Fullscreen />
          </MediaPlayer.Controls>
        </MediaPlayer.Root>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-background rounded-full h-10 w-10 z-50 hover:bg-muted focus-visible:ring-0"
          aria-label="Close player"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
} 