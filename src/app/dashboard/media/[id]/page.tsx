/**
 * Emby Movie API - Champs récupérables (Fields=...)
 *
 * Principaux champs utiles pour la fiche film :
 * - Name, OriginalTitle, Overview, Taglines, Genres, CommunityRating, CriticRating, ProductionYear, PremiereDate, DateCreated
 * - RunTimeTicks, OfficialRating, CustomRating, Studios, People, RemoteTrailers, ExternalUrls, ProviderIds
 * - ImageTags, BackdropImageTags, MediaSources, UserData, Path, Size, Bitrate, FileName, Container
 * - CollectionType, Status, Type, IsMovie, IsSeries, IsKids, IsPremiere, IsLive, IsNews, IsSports
 * - SeriesName, SeriesId, SeasonId, EpisodeTitle, ParentId, ParentLogoItemId, ParentBackdropItemId
 * - LockedFields, Tags, TagItems, GenreItems, Artists, ArtistItems, Composers, Album, AlbumArtists
 * - Chapters, MediaStreams, Width, Height, AspectRatio, Video3DFormat, LocationType
 * - RemoteTrailers, ExternalUrls, ProviderIds, UserData, etc.
 *
 * Pour obtenir un champ spécifique, ajouter Fields=NomDuChamp à la requête.
 * Exemple : /Items?Fields=Name,Overview,Genres,People,Studios,Taglines,CommunityRating,ProductionYear,PremiereDate,DateCreated,RunTimeTicks,OfficialRating,RemoteTrailers,ExternalUrls,ProviderIds,ImageTags,BackdropImageTags,MediaSources,UserData&Ids=ID&api_key=XXX
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PageContainer from '@/components/layout/page-container';
import { IconExternalLink, IconPlayerPlay } from '@tabler/icons-react';

// Helper to fetch movie details from Emby API (with all useful fields)
async function fetchMovieDetails(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
  const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';
  const fields = [
    'Name','OriginalTitle','Overview','Taglines','Genres','CommunityRating','CriticRating','ProductionYear','PremiereDate','DateCreated',
    'RunTimeTicks','OfficialRating','CustomRating','Studios','People','RemoteTrailers','ExternalUrls','ProviderIds','ImageTags','BackdropImageTags',
    'MediaSources','UserData','Path','Size','Bitrate','FileName','Container','CollectionType','Status','Type','IsMovie','IsSeries','IsKids','IsPremiere',
    'IsLive','IsNews','IsSports','SeriesName','SeriesId','SeasonId','EpisodeTitle','ParentId','ParentLogoItemId','ParentBackdropItemId','LockedFields',
    'Tags','TagItems','GenreItems','Artists','ArtistItems','Composers','Album','AlbumArtists','Chapters','MediaStreams','Width','Height','AspectRatio',
    'Video3DFormat','LocationType'
  ].join(',');
  const res = await fetch(`${apiUrl}/Items?Fields=${fields}&Ids=${id}&api_key=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.Items?.[0] || null;
}

export default async function MovieDetailPage({ params }: { params: { id: string } }) {
  const movie = await fetchMovieDetails(params.id);
  if (!movie) return notFound();

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
        {/* Poster agrandi */}
        <div className="flex-shrink-0 w-full md:w-96 flex justify-center items-start">
          <div className="rounded-xl overflow-hidden shadow-lg border border-border bg-background w-72 h-[432px] md:w-84 md:h-[480px]">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.Name} className="w-full h-full object-cover" />
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
            <Button size="lg" className="font-semibold px-8 py-2">Play</Button>
            <Button size="lg" variant="outline" className="font-semibold px-8 py-2">My List</Button>
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
    </PageContainer>
  );
} 