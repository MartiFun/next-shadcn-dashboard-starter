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
import MovieDetailView from '@/features/media/components/media-detail-view';
import { cookies } from 'next/headers';

async function fetchMovieDetails(id: string, userId: string) {
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
  const res = await fetch(`${apiUrl}/Items?Fields=${fields}&Ids=${id}&UserId=${userId}&api_key=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.Items?.[0] || null;
}

export default async function MovieDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { user?: string } }) {
  const userId = searchParams?.user;
  if (!userId) {
    return <div className="text-destructive">Aucun utilisateur sélectionné</div>;
  }
  const movie = await fetchMovieDetails(params.id, userId);
  if (!movie) {
    notFound();
  }
  return <MovieDetailView movie={movie} userId={userId} />;
} 