// Types pour l'API Jellyfin basés sur la documentation
export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
  Configuration: {
    AudioLanguagePreference?: string;
    PlayDefaultAudioTrack: boolean;
    SubtitleLanguagePreference?: string;
    DisplayMissingEpisodes: boolean;
    GroupedFolders: string[];
    SubtitleMode: string;
    EnableLocalPassword: boolean;
    OrderedViews: string[];
    LatestItemsExcludes: string[];
    MyMediaExcludes: string[];
    HidePlayedInLatest: boolean;
    RememberAudioSelections: boolean;
    RememberSubtitleSelections: boolean;
    EnableNextEpisodeAutoPlay: boolean;
  };
  Policy: {
    IsAdministrator: boolean;
    IsHidden: boolean;
    IsDisabled: boolean;
    EnabledDevices: string[];
    EnableAllDevices: boolean;
    EnabledChannels: string[];
    EnableAllChannels: boolean;
    EnabledFolders: string[];
    EnableAllFolders: boolean;
    InvalidLoginAttemptCount: number;
    LoginAttemptsBeforeLockout: number;
    MaxActiveSessions: number;
    EnablePublicSharing: boolean;
    BlockedMediaFolders: string[];
    BlockedChannels: string[];
    RemoteClientBitrateLimit: number;
    AuthenticationProviderId: string;
    PasswordResetProviderId: string;
    SyncPlayAccess: string;
  };
}

export interface AuthenticationResult {
  User: JellyfinUser;
  SessionInfo: SessionInfo;
  AccessToken: string;
  ServerId: string;
}

export interface SessionInfo {
  Id: string;
  UserId: string;
  UserName: string;
  Client: string;
  LastActivityDate: string;
  LastPlaybackCheckIn: string;
  DeviceName: string;
  DeviceId: string;
  ApplicationVersion: string;
  AppIconUrl?: string;
  SupportedCommands: string[];
  QueueableMediaTypes: string[];
  PlayableMediaTypes: string[];
  PlayState?: PlayState;
  AdditionalUsers: any[];
  Capabilities: {
    PlayableMediaTypes: string[];
    SupportedCommands: string[];
    SupportsMediaControl: boolean;
    SupportsContentUploading: boolean;
    SupportsPersistentIdentifier: boolean;
    SupportsSync: boolean;
  };
  RemoteEndPoint?: string;
  NowPlayingItem?: BaseItemDto;
  DeviceType: string;
  NowViewingItem?: BaseItemDto;
  TranscodingInfo?: TranscodingInfo;
}

export interface PlayState {
  CanSeek: boolean;
  IsPaused: boolean;
  IsMuted: boolean;
  RepeatMode: string;
  ShuffleMode: string;
  MaxStreamingBitrate?: number;
  PositionTicks?: number;
  PlaybackStartTimeTicks?: number;
  VolumeLevel?: number;
  Brightness?: number;
  AspectRatio?: string;
  PlayMethod: string;
  LiveStreamId?: string;
  PlaySessionId?: string;
  PlaybackRate?: number;
  BufferedRanges?: any[];
}

export interface BaseItemDto {
  Id: string;
  Name: string;
  OriginalTitle?: string;
  ServerId: string;
  Type: string;
  LocationType: string;
  PremiereDate?: string;
  CriticRating?: number;
  CommunityRating?: number;
  OfficialRating?: string;
  RunTimeTicks?: number;
  ProductionYear?: number;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  IsFolder: boolean;
  ParentId?: string;
  UserData?: UserItemDataDto;
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
  ArtistItems?: NameGuidPair[];
  Album?: string;
  CollectionType?: string;
  DisplayOrder?: string;
  AlbumId?: string;
  AlbumPrimaryImageTag?: string;
  SeriesPrimaryImageTag?: string;
  AlbumArtist?: string;
  AlbumArtists?: NameGuidPair[];
  SeasonName?: string;
  MediaStreams?: MediaStream[];
  VideoType?: string;
  ImageTags?: { [key: string]: string };
  BackdropImageTags?: string[];
  ScreenshotImageTags?: string[];
  ParentLogoImageTag?: string;
  ParentArtItemId?: string;
  ParentArtImageTag?: string;
  SeriesThumbImageTag?: string;
  ImageBlurHashes?: { [key: string]: { [key: string]: string } };
  SeriesStudio?: string;
  ParentThumbItemId?: string;
  ParentThumbImageTag?: string;
  ParentPrimaryImageItemId?: string;
  ParentPrimaryImageTag?: string;
  Chapters?: ChapterInfo[];
  LocationType2?: string;
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
  IsSeries?: boolean;
  IsLive?: boolean;
  IsNews?: boolean;
  IsKids?: boolean;
  IsPremiere?: boolean;
  TimerId?: string;
  NormalizationGain?: number;
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
  DateAdded?: string;
  People?: BaseItemPerson[];
  Studios?: NameGuidPair[];
  GenreItems?: NameGuidPair[];
  ParentBackdropItemId?: string;
  ParentBackdropImageTags?: string[];
  LocalTrailerCount?: number;
  RemoteTrailers?: MediaUrl[];
  ProviderIds?: { [key: string]: string };
  IsHD?: boolean;
  IsShortcut?: boolean;
  ShortcutPath?: string;
  EnableMediaSourceDisplay?: boolean;
  Taglines?: string[];
  Keywords?: string[];
  Overview?: string;
  Genres?: string[];
  PlayAccess?: string;
  RemoteTrailerCount?: number;
  DateLastSaved?: string;
  DateLastRefreshed?: string;
  AspectRatio?: string;
  Path?: string;
  EnableMediaSourceDisplay2?: boolean;
  FileName?: string;
  Size?: number;
}

export interface UserItemDataDto {
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

export interface MediaStream {
  Codec?: string;
  CodecTag?: string;
  Language?: string;
  ColorRange?: string;
  ColorSpace?: string;
  ColorTransfer?: string;
  ColorPrimaries?: string;
  Comment?: string;
  TimeBase?: string;
  CodecTimeBase?: string;
  Title?: string;
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
  Type?: string;
  AspectRatio?: string;
  Index?: number;
  Score?: number;
  IsExternal?: boolean;
  DeliveryMethod?: string;
  DeliveryUrl?: string;
  IsExternalUrl?: boolean;
  IsTextSubtitleStream?: boolean;
  SupportsExternalStream?: boolean;
  Path?: string;
  PixelFormat?: string;
  Level?: number;
  IsAnamorphic?: boolean;
}

export interface ChapterInfo {
  StartPositionTicks?: number;
  Name?: string;
  ImagePath?: string;
  ImageDateModified?: string;
  ImageTag?: string;
}

export interface BaseItemPerson {
  Name?: string;
  Id?: string;
  Role?: string;
  Type?: string;
  PrimaryImageTag?: string;
  ImageBlurHashes?: { [key: string]: { [key: string]: string } };
}

export interface NameGuidPair {
  Name?: string;
  Id?: string;
}

export interface MediaUrl {
  Url?: string;
  Name?: string;
}

export interface TranscodingInfo {
  AudioCodec?: string;
  VideoCodec?: string;
  Container?: string;
  IsVideoDirect?: boolean;
  IsAudioDirect?: boolean;
  Bitrate?: number;
  Framerate?: number;
  CompletionPercentage?: number;
  Width?: number;
  Height?: number;
  AudioChannels?: number;
  HardwareAccelerationType?: string;
  TranscodeReasons?: string[];
}

export interface MediaSourceInfo {
  Protocol?: string;
  Id?: string;
  Path?: string;
  EncoderPath?: string;
  EncoderProtocol?: string;
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
  MediaStreams?: MediaStream[];
  MediaAttachments?: MediaAttachment[];
  Formats?: string[];
  Bitrate?: number;
  Timestamp?: string;
  RequiredHttpHeaders?: { [key: string]: string };
  DirectStreamUrl?: string;
}

export interface MediaAttachment {
  Codec?: string;
  CodecTag?: string;
  Comment?: string;
  Index?: number;
  FileName?: string;
  MimeType?: string;
  DeliveryUrl?: string;
}

export interface PlaybackInfoResponse {
  MediaSources?: MediaSourceInfo[];
  PlaySessionId?: string;
  ErrorCode?: string;
}

// Types pour les requêtes d'authentification
export interface AuthenticateByNameRequest {
  Username: string;
  Pw?: string;
  PwHash?: string;
  DeviceId?: string;
  DeviceName?: string;
  AppName?: string;
  AppVersion?: string;
}

export interface QuickConnectRequest {
  Secret: string;
  DeviceId: string;
}

// Types pour les paramètres de requête
export interface ItemsQuery {
  UserId?: string;
  IncludeItemTypes?: string;
  ExcludeItemTypes?: string;
  MediaTypes?: string;
  IsFolder?: boolean;
  IsPlayed?: boolean;
  IsFavorite?: boolean;
  IsUnplayed?: boolean;
  StartIndex?: number;
  Limit?: number;
  Recursive?: boolean;
  SortBy?: string;
  SortOrder?: 'Ascending' | 'Descending';
  SearchTerm?: string;
  NameStartsWithOrGreater?: string;
  NameStartsWith?: string;
  NameLessThan?: string;
  ParentId?: string;
  Fields?: string;
  ImageTypeLimit?: number;
  EnableImageTypes?: string;
  EnableUserData?: boolean;
  GenreIds?: string;
  Genres?: string;
  Years?: string;
  MinYear?: number;
  MaxYear?: number;
  MinCriticRating?: number;
  MaxCriticRating?: number;
  MinCommunityRating?: number;
  MaxCommunityRating?: number;
  HasImdbId?: boolean;
  HasTmdbId?: boolean;
  HasOverview?: boolean;
}

export interface SearchHintsQuery {
  SearchTerm: string;
  IncludeItemTypes?: string;
  IncludeMedia?: boolean;
  IncludePeople?: boolean;
  IncludeArtists?: boolean;
  IncludeGenres?: boolean;
  IncludeStudios?: boolean;
  Limit?: number;
}

export interface PlaybackInfoRequest {
  UserId: string;
  DeviceProfile?: any;
  MaxStreamingBitrate?: number;
  StartTimeTicks?: number;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  MediaSourceId?: string;
  LiveStreamId?: string;
  EnableDirectPlay?: boolean;
  EnableDirectStream?: boolean;
  AllowVideoStreamCopy?: boolean;
  AllowAudioStreamCopy?: boolean;
}

export interface StreamingParams {
  VideoCodec?: string;
  AudioCodec?: string;
  MaxWidth?: number;
  MaxHeight?: number;
  VideoBitrate?: number;
  AudioBitrate?: number;
  AudioChannels?: number;
  AudioSampleRate?: number;
  Framerate?: number;
  Profile?: string;
  Level?: number;
  Static?: boolean;
  PlaySessionId?: string;
  api_key?: string;
  SubtitleStreamIndex?: number;
  SubtitleMethod?: 'Hls' | 'External' | 'Embed' | 'Encode';
  SegmentLength?: number;
  MinSegments?: number;
  BreakOnNonKeyFrames?: boolean;
}

export interface PlayingSessionRequest {
  ItemId: string;
  PlaySessionId: string;
  CanSeek?: boolean;
  PlaybackStartTime?: string;
  AudioStreamIndex?: number;
  SubtitleStreamIndex?: number;
  VolumeLevel?: number;
  IsMuted?: boolean;
  IsPaused?: boolean;
  RepeatMode?: string;
  ShuffleMode?: string;
  PositionTicks?: number;
  PlaybackRate?: number;
  Brightness?: number;
  AspectRatio?: string;
  PlayMethod?: string;
  Failed?: boolean;
  NextMediaType?: string;
  PlaylistItemId?: string;
}

export interface CommandRequest {
  Name: string;
  Arguments?: { [key: string]: any };
}

export interface MessageRequest {
  Text: string;
  Header?: string;
  TimeoutMs?: number;
}

export interface ItemsResult {
  Items: BaseItemDto[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface SearchHintsResult {
  SearchHints: SearchHint[];
  TotalRecordCount: number;
}

export interface SearchHint {
  ItemId: string;
  Id: string;
  Name: string;
  MatchedTerm?: string;
  IndexNumber?: number;
  ProductionYear?: number;
  ParentIndexNumber?: number;
  PrimaryImageTag?: string;
  ThumbImageTag?: string;
  ThumbImageItemId?: string;
  BackdropImageTag?: string;
  BackdropImageItemId?: string;
  Type: string;
  IsFolder?: boolean;
  RunTimeTicks?: number;
  MediaType?: string;
  StartDate?: string;
  EndDate?: string;
  Series?: string;
  Status?: string;
  Album?: string;
  AlbumId?: string;
  AlbumArtist?: string;
  Artists?: string[];
  SongCount?: number;
  EpisodeCount?: number;
  ChannelId?: string;
  ChannelName?: string;
  PrimaryImageAspectRatio?: number;
}