// Types pour l'API Sonarr
export interface SonarrSeries {
  id: number;
  title: string;
  originalTitle: string;
  alternateTitles: Array<{
    sourceType: string;
    seriesId: number;
    title: string;
    sourceId: number;
    votes: number;
    voteCount: number;
    language: string;
    id: number;
  }>;
  sortTitle: string;
  sizeOnDisk: number;
  status: string;
  overview: string;
  network: string;
  airTime: string;
  images: Array<{
    coverType: string;
    url: string;
    remoteUrl: string;
  }>;
  seasons: Array<{
    seasonNumber: number;
    monitored: boolean;
    statistics: {
      episodeFileCount: number;
      episodeCount: number;
      totalEpisodeCount: number;
      sizeOnDisk: number;
      percentOfEpisodes: number;
    };
  }>;
  year: number;
  path: string;
  qualityProfileId: number;
  languageProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  lastInfoSync: string;
  seriesType: string;
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  statistics: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface SonarrEpisode {
  id: number;
  seriesId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  overview: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber: number;
  sceneAbsoluteEpisodeNumber: number;
  sceneEpisodeNumber: number;
  sceneSeasonNumber: number;
  unverifiedSceneNumbering: boolean;
  lastSearchTime: string;
  downloadUrl: string;
  isGrabbed: boolean;
  isDownloaded: boolean;
  episodeFile?: {
    seriesId: number;
    seasonNumber: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    sceneName: string;
    indexerFlags: number;
    quality: {
      quality: {
        id: number;
        name: string;
        source: string;
        resolution: number;
        modifier: string;
      };
      revision: {
        version: number;
        real: number;
        isRepack: boolean;
      };
    };
    mediaInfo: {
      audioBitrate: number;
      audioChannels: number;
      audioCodec: string;
      audioLanguages: string;
      audioStreamCount: number;
      videoBitrate: number;
      videoCodec: string;
      videoDynamicRangeType: string;
      videoFps: number;
      resolution: string;
      runTime: string;
      scanType: string;
      subtitles: string;
    };
    originalFilePath: string;
    qualityCutoffNotMet: boolean;
    languages: Array<{
      id: number;
      name: string;
    }>;
    releaseGroup: string;
    edition: string;
  };
}

export interface SonarrQueueItem {
  seriesId: number;
  episodeId: number;
  series: {
    id: number;
    title: string;
    path: string;
    tvdbId: number;
  };
  episode: {
    id: number;
    episodeNumber: number;
    seasonNumber: number;
    title: string;
    airDate: string;
    airDateUtc: string;
  };
  quality: {
    quality: {
      id: number;
      name: string;
      source: string;
      resolution: number;
      modifier: string;
    };
    revision: {
      version: number;
      real: number;
      isRepack: boolean;
    };
  };
  size: number;
  title: string;
  sizeleft: number;
  timeleft: string;
  estimatedCompletionTime: string;
  status: string;
  trackedDownloadStatus: string;
  statusMessages: Array<{
    title: string;
    messages: string[];
  }>;
  downloadId: string;
  protocol: string;
  downloadClient: string;
  indexer: string;
  outputPath: string;
  id: number;
}

export interface SonarrSystemStatus {
  version: string;
  startTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isNetCore: boolean;
  isDocker: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isMono: boolean;
  isMonoRuntime: boolean;
  isLinuxMusl: boolean;
  branch: string;
  authentication: string;
  sqliteVersion: string;
  migrationVersion: number;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
  startOfWeek: number;
  timeFormat: string;
  longDateFormat: string;
  shortDateFormat: string;
}

export interface SonarrDiskSpace {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
}

export interface SonarrHealth {
  source: string;
  type: string;
  message: string;
  wikiUrl: string;
}

export interface SonarrPagedResponse<T> {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDir: string;
  totalRecords: number;
  records: T[];
}

class SonarrAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/sonarr${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Sonarr API request failed:', error);
      throw error;
    }
  }

  // Système
  async getSystemStatus(): Promise<SonarrSystemStatus> {
    return this.request<SonarrSystemStatus>('/system/status');
  }

  async getHealth(): Promise<SonarrHealth[]> {
    return this.request<SonarrHealth[]>('/health');
  }

  async getDiskSpace(): Promise<SonarrDiskSpace[]> {
    return this.request<SonarrDiskSpace[]>('/diskspace');
  }

  // Séries - récupération de toutes les séries
  async getSeries(): Promise<SonarrSeries[]> {
    return this.request<SonarrSeries[]>('/series');
  }

  async getSeriesById(id: number): Promise<SonarrSeries> {
    return this.request<SonarrSeries>(`/series/${id}`);
  }

  // Recherche de séries
  async searchSeries(query: string): Promise<SonarrSeries[]> {
    return this.request<SonarrSeries[]>(`/series/lookup?term=${encodeURIComponent(query)}`);
  }

  // Épisodes
  async getEpisodes(seriesId?: number): Promise<SonarrEpisode[]> {
    const endpoint = seriesId ? `/episode?seriesId=${seriesId}` : '/episode';
    return this.request<SonarrEpisode[]>(endpoint);
  }

  // File d'attente
  async getQueue(): Promise<SonarrQueueItem[]> {
    return this.request<SonarrQueueItem[]>('/queue');
  }

  async deleteFromQueue(id: number): Promise<void> {
    return this.request<void>(`/queue?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Séries manquantes
  async getMissingEpisodes(page: number = 1, pageSize: number = 50): Promise<SonarrEpisode[]> {
    return this.request<SonarrEpisode[]>(`/wanted/missing?page=${page}&pageSize=${pageSize}`);
  }

  // Épisodes en attente de coupure
  async getCutoffUnmetEpisodes(): Promise<SonarrEpisode[]> {
    return this.request<SonarrEpisode[]>('/wanted/cutoff');
  }

  // Historique
  async getHistory(page: number = 1, pageSize: number = 20): Promise<any> {
    return this.request(`/history?page=${page}&pageSize=${pageSize}`);
  }

  // Calendrier
  async getCalendar(start?: string, end?: string): Promise<SonarrEpisode[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    return this.request<SonarrEpisode[]>(`/calendar?${params.toString()}`);
  }

  // Ajouter une série
  async addSeries(series: {
    title: string;
    tvdbId: number;
    qualityProfileId: number;
    languageProfileId: number;
    rootFolderPath: string;
    seasonFolder: boolean;
    monitored: boolean;
    addOptions: {
      searchForMissingEpisodes: boolean;
    };
  }): Promise<SonarrSeries> {
    return this.request<SonarrSeries>('/series', {
      method: 'POST',
      body: JSON.stringify(series),
    });
  }

  // Obtenir les profils de qualité
  async getQualityProfiles(): Promise<any[]> {
    return this.request<any[]>('/qualityprofile');
  }

  // Obtenir les profils de langue
  async getLanguageProfiles(): Promise<any[]> {
    return this.request<any[]>('/languageprofile');
  }

  // Obtenir les dossiers racines
  async getRootFolders(): Promise<any[]> {
    return this.request<any[]>('/rootfolder');
  }
}

export const sonarrAPI = new SonarrAPI(); 