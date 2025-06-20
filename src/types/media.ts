// Types pour les films Emby et fonctionnalités média
export interface EmbyMovie {
  Id: string;
  Name: string;
  OriginalTitle?: string;
  ProductionYear?: number;
  CommunityRating?: number;
  RunTimeTicks?: number;
  ImageTags?: { [key: string]: string };
  UserData?: { 
    Played: boolean;
    PlayedPercentage?: number;
    PlayCount?: number;
    LastPlayedDate?: string;
    IsFavorite?: boolean;
  };
  MediaSources?: Array<{
    Id: string;
    VideoType?: string;
    Container?: string;
    Size?: number;
    MediaStreams?: Array<{
      Type: string;
      Codec?: string;
      Width?: number;
      Height?: number;
      DisplayTitle?: string;
    }>;
  }>;
  BackdropImageTags?: string[];
  Genres?: string[];
  Studios?: Array<{ Name: string }>;
  People?: Array<{
    Name: string;
    Role?: string;
    Type: string;
    PrimaryImageTag?: string;
  }>;
  Overview?: string;
  Taglines?: string[];
  OfficialRating?: string;
  CriticRating?: number;
  DateCreated?: string;
  PremiereDate?: string;
  Budget?: number;
  Revenue?: number;
  OriginalLanguage?: string;
  Countries?: string[];
  CollectionName?: string;
  SeriesName?: string;
  Tags?: string[];
  ProviderIds?: {
    Imdb?: string;
    Tmdb?: string;
  };
}

export interface MovieFilters {
  search?: string;
  genres?: string[];
  years?: [number, number];
  rating?: [number, number];
  duration?: [number, number];
  watched?: boolean | null;
  favorite?: boolean | null;
  officialRating?: string[];
  studios?: string[];
  languages?: string[];
  countries?: string[];
  tags?: string[];
  collections?: string[];
}

export interface MovieSort {
  field: 'title' | 'year' | 'rating' | 'duration' | 'dateAdded' | 'lastPlayed' | 'playCount';
  order: 'asc' | 'desc';
}

export interface MovieDisplayOptions {
  view: 'grid' | 'list' | 'carousel';
  density: 'compact' | 'comfortable' | 'spacious';
  showOverlay: boolean;
  showGenres: boolean;
  showRating: boolean;
  showDuration: boolean;
  showYear: boolean;
  showProgress: boolean;
}

export interface MovieStats {
  total: number;
  watched: number;
  unwatched: number;
  favorites: number;
  totalRuntime: number;
  averageRating: number;
  averageYear: number;
  genreDistribution: Record<string, number>;
  yearDistribution: Record<number, number>;
  ratingDistribution: Record<string, number>;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MovieSearchResult {
  movies: EmbyMovie[];
  stats: MovieStats;
  pagination: PaginationState;
}