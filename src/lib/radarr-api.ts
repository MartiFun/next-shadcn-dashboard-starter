// Types pour l'API Radarr
export interface RadarrMovie {
  id: number;
  title: string;
  originalTitle: string;
  alternateTitles: Array<{
    sourceType: string;
    movieId: number;
    title: string;
    sourceId: number;
    votes: number;
    voteCount: number;
    language: string;
    id: number;
  }>;
  secondaryYearSourceId: number;
  sortTitle: string;
  sizeOnDisk: number;
  status: string;
  overview: string;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  images: Array<{
    coverType: string;
    url: string;
    remoteUrl: string;
  }>;
  website: string;
  year: number;
  hasFile: boolean;
  youTubeTrailerId: string;
  studio: string;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  isAvailable: boolean;
  folderName: string;
  runtime: number;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  movieFile?: {
    movieId: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
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
  collection?: {
    name: string;
    tmdbId: number;
    images: Array<{
      coverType: string;
      url: string;
      remoteUrl: string;
    }>;
  };
}

export interface RadarrSystemStatus {
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

export interface RadarrQueueItem {
  movieId: number;
  movie: {
    id: number;
    title: string;
    year: number;
    path: string;
    tmdbId: number;
    imdbId: string;
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

export interface RadarrDiskSpace {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
}

export interface RadarrHealth {
  source: string;
  type: string;
  message: string;
  wikiUrl: string;
}

export interface RadarrPagedResponse<T> {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDir: string;
  totalRecords: number;
  records: T[];
}

class RadarrAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/radarr${endpoint}`;
    
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
      console.error('Radarr API request failed:', error);
      throw error;
    }
  }

  // Système
  async getSystemStatus(): Promise<RadarrSystemStatus> {
    return this.request<RadarrSystemStatus>('/system/status');
  }

  async getHealth(): Promise<RadarrHealth[]> {
    return this.request<RadarrHealth[]>('/health');
  }

  async getDiskSpace(): Promise<RadarrDiskSpace[]> {
    return this.request<RadarrDiskSpace[]>('/diskspace');
  }

  // Films - récupération de tous les films (pagination côté client)
  async getMovies(): Promise<RadarrMovie[]> {
    return this.request<RadarrMovie[]>('/movies');
  }

  async getMovie(id: number): Promise<RadarrMovie> {
    return this.request<RadarrMovie>(`/movies/${id}`);
  }

  // Recherche de films
  async searchMovie(query: string): Promise<RadarrMovie[]> {
    return this.request<RadarrMovie[]>(`/search?term=${encodeURIComponent(query)}`);
  }

  // File d'attente
  async getQueue(): Promise<RadarrQueueItem[]> {
    return this.request<RadarrQueueItem[]>('/queue');
  }

  async deleteFromQueue(id: number): Promise<void> {
    return this.request<void>(`/queue?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Films manquants
  async getMissingMovies(page: number = 1, pageSize: number = 50): Promise<RadarrMovie[]> {
    return this.request<RadarrMovie[]>(`/wanted/missing?page=${page}&pageSize=${pageSize}`);
  }

  // Films en attente de coupure
  async getCutoffUnmetMovies(): Promise<RadarrMovie[]> {
    return this.request<RadarrMovie[]>('/wanted/cutoff');
  }

  // Historique
  async getHistory(page: number = 1, pageSize: number = 20): Promise<any> {
    return this.request(`/history?page=${page}&pageSize=${pageSize}`);
  }

  // Calendrier
  async getCalendar(start?: string, end?: string): Promise<RadarrMovie[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    return this.request<RadarrMovie[]>(`/calendar?${params.toString()}`);
  }

  // Ajouter un film
  async addMovie(movie: {
    title: string;
    tmdbId: number;
    qualityProfileId: number;
    rootFolderPath: string;
    monitored: boolean;
    minimumAvailability: string;
    addOptions: {
      searchForMovie: boolean;
    };
  }): Promise<RadarrMovie> {
    return this.request<RadarrMovie>('/movies', {
      method: 'POST',
      body: JSON.stringify(movie),
    });
  }

  // Obtenir les profils de qualité
  async getQualityProfiles(): Promise<any[]> {
    return this.request<any[]>('/qualityprofile');
  }

  // Obtenir les dossiers racines
  async getRootFolders(): Promise<any[]> {
    return this.request<any[]>('/rootfolder');
  }
}

export const radarrAPI = new RadarrAPI(); 