'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VideoPlayer from '@/features/jellyfin/components/video-player';
import { BaseItemDto, PlayingSessionRequest } from '@/types/jellyfin';
import { getJellyfinClient } from '@/lib/jellyfin-api';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true);
        const client = getJellyfinClient();
        
        // Récupérer les détails du média
        const itemData = await client.getItem(itemId, 
          'MediaSources,MediaStreams,Chapters,People,Studios,Genres,Taglines,Overview'
        );
        
        setItem(itemData);
      } catch (err) {
        console.error('Failed to load media item:', err);
        setError('Failed to load media details');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const handleBack = () => {
    router.back();
  };

  const handlePlaybackUpdate = async (progress: PlayingSessionRequest) => {
    try {
      const client = getJellyfinClient();
      await client.reportPlaybackProgress(progress);
    } catch (error) {
      console.warn('Failed to update playback progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-xl">Loading media...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Media Not Found</h2>
          <p className="mb-6 text-gray-300">{error || 'The requested media could not be found.'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculer la position de départ si le média a été partiellement regardé
  const startTime = item.UserData?.PlaybackPositionTicks 
    ? Math.floor(item.UserData.PlaybackPositionTicks / 10000000) // Convertir ticks en secondes
    : 0;

  return (
    <VideoPlayer
      item={item}
      onBack={handleBack}
      onPlaybackUpdate={handlePlaybackUpdate}
      autoPlay={true}
      startTime={startTime}
    />
  );
}