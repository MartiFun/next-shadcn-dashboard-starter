// Types stricts pour l'API Emby et les fonctionnalités media
export interface EmbyImageTags {
  Primary?: string;
  Art?: string;
  Banner?: string;
  Logo?: string;
  Thumb?: string;
  Disc?: string;
  Box?: string;
  Screenshot?: string;
  Menu?: string;
  Chapter?: string;
  BoxRear?: string;
  Profile?: string;
}

export interface EmbyUserData {
  Rating?: number;
  PlayedPercentage?: number;
  UnplayedItemCount?: number;
  PlaybackPositionTicks?: number;
  PlayCount?: number;
  IsFavorite?: boolean;
  Likes?: boolean;
  LastPlayedDate?: string;
  Played?: boolean;
  Key?: string;
  ItemId?: string;
}

export interface EmbyMediaStream {
  Codec?: string;
  TimeBase?: string;
  CodecTimeBase?: string;
  VideoRange?: string;
  VideoRangeType?: string;
  VideoDoViTitle?: string;
  LocalizedUndefined?: string;
  LocalizedDefault?: string;
  LocalizedForced?: string;
  LocalizedExternal?: string;
  DisplayTitle?: string;
  NalLengthSize?: string;
  IsInterlaced?: boolean;
  IsAVC?: boolean;
  ChannelLayout?: string;
  BitRate?: number;
  BitDepth?: number;
  RefFrames?: number;
  PacketLength?: number;
  Channels?: number;
  SampleRate?: number;
  IsDefault?: boolean;
  IsForced?: boolean;
  Height?: number;
  Width?: number;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  Profile?: string;
  Type?: 'Video' | 'Audio' | 'Subtitle';
  AspectRatio?: string;
  Index?: number;
  Score?: number;
  IsExternal?: boolean;
  DeliveryMethod?: string;
  Language?: string;
  IsTextSubtitleStream?: boolean;
  SupportsExternalStream?: boolean;
  Path?: string;
  PixelFormat?: string;
  Level?: number;
  IsAnamorphic?: boolean;
}

export interface EmbyMediaSource {
  Protocol?: string;
  Id?: string;
  Path?: string;
  Type?: string;
  Container?: string;
  Size?: number;
  Name?: string;
  IsRemote?: boolean;
  ETag?: string;
  RunTimeTicks?: number;
  ReadAtNativeFramerate?: boolean;
  IgnoreDts?: boolean;
  IgnoreIndex?: boolean;
  GenPtsInput?: boolean;
  SupportsTranscoding?: boolean;
  SupportsDirectStream?: boolean;
  SupportsDirectPlay?: boolean;
  IsInfiniteStream?: boolean;
  RequiresOpening?: boolean;
  OpenToken?: string;
  RequiresClosing?: boolean;
  LiveStreamId?: string;
  BufferMs?: number;
  RequiresLooping?: boolean;
  SupportsProbing?: boolean;
  VideoType?: string;
  IsoType?: string;
  Video3DFormat?: string;
  MediaStreams?: EmbyMediaStream[];
  MediaAttachments?: any[];
  Formats?: string[];
  Bitrate?: number;
  Timestamp?: string;
  RequiredHttpHeaders?: Record<string, string>;
  TranscodingUrl?: string;
  TranscodingSubProtocol?: string;
  TranscodingContainer?: string;
  AnalyzeDurationMs?: number;
  DefaultAudioStreamIndex?: number;
  DefaultSubtitleStreamIndex?: number;
}

export interface EmbyPerson {
  Id?: string;
  Name?: string;
  Role?: string;
  Type?: 'Actor' | 'Director' | 'Writer' | 'Producer';
  PrimaryImageTag?: string;
  ImageBlurHashes?: Record<string, Record<string, string>>;
}

export interface EmbyStudio {
  Name?: string;
  Id?: string;
}

export interface EmbyGenre {
  Name?: string;
  Id?: string;
}

export interface EmbyRemoteTrailer {
  Url?: string;
  Name?: string;
}

export interface EmbyExternalUrl {
  Name?: string;
  Url?: string;
}

export interface EmbyMovie {
  Id: string;
  Name: string;
  ServerId?: string;
  ETag?: string;
  SourceType?: string;
  PlaylistItemId?: string;
  DateCreated?: string;
  DateLastMediaAdded?: string;
  ExtraType?: string;
  AirsBeforeSeasonNumber?: number;
  AirsAfterSeasonNumber?: number;
  AirsBeforeEpisodeNumber?: number;
  CanDelete?: boolean;
  CanDownload?: boolean;
  HasSubtitles?: boolean;
  PreferredMetadataLanguage?: string;
  PreferredMetadataCountryCode?: string;
  SupportsSync?: boolean;
  Container?: string;
  SortName?: string;
  ForcedSortName?: string;
  Video3DFormat?: string;
  PremiereDate?: string;
  ExternalUrls?: EmbyExternalUrl[];
  MediaSources?: EmbyMediaSource[];
  CriticRating?: number;
  ProductionLocations?: string[];
  Path?: string;
  EnableMediaSourceDisplay?: boolean;
  OfficialRating?: string;
  CustomRating?: string;
  ChannelId?: string;
  ChannelName?: string;
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
  CommunityRating?: number;
  CumulativeRunTimeTicks?: number;
  RunTimeTicks?: number;
  PlayAccess?: string;
  AspectRatio?: string;
  ProductionYear?: number;
  IsPlaceHolder?: boolean;
  Number?: string;
  ChannelNumber?: string;
  IndexNumber?: number;
  IndexNumberEnd?: number;
  ParentIndexNumber?: number;
  RemoteTrailers?: EmbyRemoteTrailer[];
  ProviderIds?: Record<string, string>;
  IsHD?: boolean;
  IsFolder?: boolean;
  ParentId?: string;
  Type?: string;
  People?: EmbyPerson[];
  Studios?: EmbyStudio[];
  GenreItems?: EmbyGenre[];
  ParentLogoItemId?: string;
  ParentBackdropItemId?: string;
  ParentBackdropImageTags?: string[];
  LocalTrailerCount?: number;
  UserData?: EmbyUserData;
  RecursiveItemCount?: number;
  ChildCount?: number;
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  SpecialFeatureCount?: number;
  DisplayPreferencesId?: string;
  Status?: string;
  AirTime?: string;
  AirDays?: string[];
  Tags?: string[];
  PrimaryImageAspectRatio?: number;
  Artists?: string[];
  ArtistItems?: any[];
  Album?: string;
  CollectionType?: string;
  DisplayOrder?: string;
  AlbumId?: string;
  AlbumPrimaryImageTag?: string;
  SeriesPrimaryImageTag?: string;
  AlbumArtist?: string;
  AlbumArtists?: any[];
  SeasonName?: string;
  MediaStreams?: EmbyMediaStream[];
  VideoType?: string;
  PartCount?: number;
  MediaSourceCount?: number;
  ImageTags?: EmbyImageTags;
  BackdropImageTags?: string[];
  ScreenshotImageTags?: string[];
  ParentLogoImageTag?: string;
  ParentArtItemId?: string;
  ParentArtImageTag?: string;
  SeriesThumbImageTag?: string;
  ImageBlurHashes?: Record<string, Record<string, string>>;
  SeriesStudio?: string;
  ParentThumbItemId?: string;
  ParentThumbImageTag?: string;
  ParentPrimaryImageItemId?: string;
  ParentPrimaryImageTag?: string;
  Chapters?: any[];
  LocationType?: string;
  IsoType?: string;
  MediaType?: string;
  EndDate?: string;
  LockedFields?: string[];
  TrailerCount?: number;
  MovieCount?: number;
  SeriesCount?: number;
  ProgramCount?: number;
  EpisodeCount?: number;
  SongCount?: number;
  AlbumCount?: number;
  ArtistCount?: number;
  MusicVideoCount?: number;
  LockData?: boolean;
  Width?: number;
  Height?: number;
  CameraMake?: string;
  CameraModel?: string;
  Software?: string;
  ExposureTime?: number;
  FocalLength?: number;
  ImageOrientation?: string;
  Aperture?: number;
  ShutterSpeed?: number;
  Latitude?: number;
  Longitude?: number;
  Altitude?: number;
  IsoSpeedRating?: number;
  SeriesTimerId?: string;
  ProgramId?: string;
  ChannelPrimaryImageTag?: string;
  StartDate?: string;
  CompletionPercentage?: number;
  IsRepeat?: boolean;
  EpisodeTitle?: string;
  ChannelType?: string;
  Audio?: string;
  IsMovie?: boolean;
  IsSports?: boolean;
  IsNews?: boolean;
  IsKids?: boolean;
  IsPremiere?: boolean;
  TimerId?: string;
  NormalizationGain?: number;
  OriginalTitle?: string;
}

export interface EmbyQueryResult<T> {
  Items: T[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface EmbyUser {
  Id: string;
  Name: string;
  ServerId?: string;
  ConnectUserName?: string;
  ConnectUserId?: string;
  ConnectLinkType?: string;
  IsHidden?: boolean;
  IsHiddenRemotely?: boolean;
  IsDisabled?: boolean;
  DateCreated?: string;
  DateLastActivity?: string;
  Configuration?: {
    AudioLanguagePreference?: string;
    PlayDefaultAudioTrack?: boolean;
    SubtitleLanguagePreference?: string;
    DisplayMissingEpisodes?: boolean;
    GroupedFolders?: string[];
    SubtitleMode?: string;
    DisplayCollectionsView?: boolean;
    EnableLocalPassword?: boolean;
    OrderedViews?: string[];
    LatestItemsExcludes?: string[];
    MyMediaExcludes?: string[];
    HidePlayedInLatest?: boolean;
    RememberAudioSelections?: boolean;
    RememberSubtitleSelections?: boolean;
    EnableNextEpisodeAutoPlay?: boolean;
  };
  Policy?: {
    IsAdministrator?: boolean;
    IsHidden?: boolean;
    IsHiddenRemotely?: boolean;
    IsDisabled?: boolean;
    MaxParentalRating?: number;
    BlockedTags?: string[];
    EnableUserPreferenceAccess?: boolean;
    AccessSchedules?: any[];
    BlockUnratedItems?: string[];
    EnableRemoteControlOfOtherUsers?: boolean;
    EnableSharedDeviceControl?: boolean;
    EnableRemoteAccess?: boolean;
    EnableLiveTvManagement?: boolean;
    EnableLiveTvAccess?: boolean;
    EnableMediaPlayback?: boolean;
    EnableAudioPlaybackTranscoding?: boolean;
    EnableVideoPlaybackTranscoding?: boolean;
    EnablePlaybackRemuxing?: boolean;
    EnableContentDeletion?: boolean;
    EnableContentDeletionFromFolders?: string[];
    EnableContentDownloading?: boolean;
    EnableSyncTranscoding?: boolean;
    EnableMediaConversion?: boolean;
    EnabledDevices?: string[];
    EnableAllDevices?: boolean;
    EnabledChannels?: string[];
    EnableAllChannels?: boolean;
    EnabledFolders?: string[];
    EnableAllFolders?: boolean;
    InvalidLoginAttemptCount?: number;
    LoginAttemptsBeforeLockout?: number;
    MaxActiveSessions?: number;
    EnablePublicSharing?: boolean;
    BlockedMediaFolders?: string[];
    BlockedChannels?: string[];
    RemoteClientBitrateLimit?: number;
    AuthenticationProviderId?: string;
    PasswordResetProviderId?: string;
    SyncPlayAccess?: string;
  };
  PrimaryImageTag?: string;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface MediaCache {
  movies: CacheEntry<EmbyQueryResult<EmbyMovie>> | null;
  latestMovies: CacheEntry<EmbyMovie[]> | null;
  users: CacheEntry<{ Items: EmbyUser[] }> | null;
  movieDetails: Record<string, CacheEntry<EmbyMovie> | null>;
}

// Filter and search types
export interface MediaFilters {
  genres: string[];
  years: [number, number];
  ratings: [number, number];
  runtime: [number, number];
  status: ('watched' | 'unwatched')[];
  quality: string[];
  studios: string[];
}

export interface SearchOptions {
  query: string;
  sortBy: 'title' | 'year' | 'rating' | 'runtime' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
  filters: Partial<MediaFilters>;
  page: number;
  pageSize: number;
}

// Stream types
export interface StreamInfo {
  hlsUrl: string;
  subtitles: SubtitleTrack[];
  movieId: string;
  mediaSourceId: string;
  playSessionId: string;
}

export interface SubtitleTrack {
  src: string;
  label: string;
  srcLang: string;
  default?: boolean;
}

// Image optimization types
export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'original' | 'gif' | 'jpg' | 'png' | 'webp';
  tag?: string;
  cropWhitespace?: boolean;
  enableImageEnhancers?: boolean;
  addPlayedIndicator?: boolean;
  percentPlayed?: number;
  unplayedCount?: number;
  backgroundColor?: string;
}

// API Response types
export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  body: T | null;
  error?: Error;
}

// Error types
export interface MediaError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

// Analytics types
export interface MediaAnalytics {
  totalMovies: number;
  watchedMovies: number;
  totalRuntime: number;
  averageRating: number;
  genreDistribution: Record<string, number>;
  yearDistribution: Record<number, number>;
  studioDistribution: Record<string, number>;
  ratingDistribution: Record<string, number>;
}

// Component prop types
export interface MediaListProps {
  userId: string;
  initialData?: EmbyQueryResult<EmbyMovie>;
  filters?: Partial<MediaFilters>;
  searchOptions?: Partial<SearchOptions>;
}

export interface MediaDetailProps {
  movie: EmbyMovie;
  userId: string;
  onFavoriteToggle?: (movieId: string, isFavorite: boolean) => void;
  onPlayClick?: (movie: EmbyMovie) => void;
}

// Virtualization types
export interface VirtualizedItemData {
  items: EmbyMovie[];
  itemSize: number;
  columnCount: number;
  userId: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  imageLoadTime: number;
  scrollPerformance: number;
}