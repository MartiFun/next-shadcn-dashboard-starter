import * as Sentry from "@sentry/nextjs";
import { 
  AuthenticationResult, 
  AuthenticateByNameRequest,
  BaseItemDto,
  ItemsQuery,
  ItemsResult,
  SearchHintsQuery,
  SearchHintsResult,
  PlaybackInfoRequest,
  PlaybackInfoResponse,
  PlayingSessionRequest,
  StreamingParams,
  CommandRequest,
  MessageRequest,
  SessionInfo,
  JellyfinUser
} from '@/types/jellyfin';

interface JellyfinConfig {
  baseUrl: string;
  apiKey?: string;
  deviceId: string;
  deviceName: string;
  appName: string;
  appVersion: string;
}

class JellyfinAPIClient {
  private config: JellyfinConfig;
  private accessToken: string | null = null;
  private userId: string | null = null;
  private user: JellyfinUser | null = null;

  constructor(config: JellyfinConfig) {
    this.config = config;
    this.loadStoredAuth();
  }

  /**
   * Charge l'authentification stockée de manière sécurisée
   */
  private loadStoredAuth(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedAuth = localStorage.getItem('jellyfin-auth');
        if (storedAuth) {
          const auth = JSON.parse(storedAuth);
          this.accessToken = auth.accessToken;
          this.userId = auth.userId;
          this.user = auth.user;
        }
      } catch (error) {
        console.warn('Failed to load stored auth:', error);
        this.clearStoredAuth();
      }
    }
  }

  /**
   * Stocke l'authentification de manière sécurisée
   */
  private storeAuth(authResult: AuthenticationResult): void {
    if (typeof window !== 'undefined') {
      try {
        const authData = {
          accessToken: authResult.AccessToken,
          userId: authResult.User.Id,
          user: authResult.User,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24h expiration
        };
        localStorage.setItem('jellyfin-auth', JSON.stringify(authData));
        this.accessToken = authResult.AccessToken;
        this.userId = authResult.User.Id;
        this.user = authResult.User;
      } catch (error) {
        Sentry.captureException(error);
        console.error('Failed to store auth:', error);
      }
    }
  }

  /**
   * Supprime l'authentification stockée
   */
  private clearStoredAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jellyfin-auth');
    }
    this.accessToken = null;
    this.userId = null;
    this.user = null;
  }

  /**
   * Effectue une requête API avec gestion d'erreur et monitoring Sentry
   */
  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `${options.method || 'GET'} ${endpoint}`,
      },
      async (span: any) => {
        const url = `${this.config.baseUrl}${endpoint}`;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        };

        // Ajouter le token d'authentification si disponible et requis
        if (requiresAuth && this.accessToken) {
          headers['X-Emby-Token'] = this.accessToken;
        } else if (requiresAuth && this.config.apiKey) {
          headers['X-Emby-Token'] = this.config.apiKey;
        }

        // Ajouter les informations du dispositif
        headers['X-Emby-Client'] = this.config.appName;
        headers['X-Emby-Device-Name'] = this.config.deviceName;
        headers['X-Emby-Device-Id'] = this.config.deviceId;
        headers['X-Emby-Client-Version'] = this.config.appVersion;

        span.setAttribute("http.url", url);
        span.setAttribute("http.method", options.method || 'GET');

        try {
          const response = await fetch(url, {
            ...options,
            headers,
          });

          span.setAttribute("http.status_code", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            span.setAttribute("error", true);
            span.setAttribute("error.message", error.message);
            
            Sentry.captureException(error, {
              extra: {
                url,
                status: response.status,
                statusText: response.statusText,
                responseText: errorText
              }
            });

            // Si erreur 401, nettoyer l'auth stockée
            if (response.status === 401) {
              this.clearStoredAuth();
            }

            throw error;
          }

          const data = await response.json();
          return data;
        } catch (error) {
          span.setAttribute("error", true);
          span.setAttribute("error.message", error instanceof Error ? error.message : 'Unknown error');
          
          Sentry.captureException(error, {
            extra: { url, endpoint }
          });
          throw error;
        }
      }
    );
  }

  /**
   * Construit une URL de paramètres de requête
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  // === AUTHENTIFICATION ===

  /**
   * Authentification par nom d'utilisateur et mot de passe
   */
  async authenticateByName(credentials: AuthenticateByNameRequest): Promise<AuthenticationResult> {
    const authData = {
      ...credentials,
      DeviceId: credentials.DeviceId || this.config.deviceId,
      DeviceName: credentials.DeviceName || this.config.deviceName,
      AppName: credentials.AppName || this.config.appName,
      AppVersion: credentials.AppVersion || this.config.appVersion,
    };

    const result = await this.apiRequest<AuthenticationResult>(
      '/Users/AuthenticateByName',
      {
        method: 'POST',
        body: JSON.stringify(authData),
      },
      false
    );

    this.storeAuth(result);
    return result;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (this.userId) {
      try {
        await this.apiRequest(
          '/Sessions/Logout',
          {
            method: 'POST',
            body: JSON.stringify({ UserId: this.userId }),
          }
        );
      } catch (error) {
        // Log but don't throw - we want to clear local auth even if server call fails
        console.warn('Logout request failed:', error);
      }
    }
    
    this.clearStoredAuth();
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.userId);
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  getCurrentUser(): JellyfinUser | null {
    return this.user;
  }

  /**
   * Récupère l'ID de l'utilisateur actuellement connecté
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // === NAVIGATION ET RECHERCHE ===

  /**
   * Récupère les éléments de la bibliothèque
   */
  async getItems(query: ItemsQuery = {}): Promise<ItemsResult> {
    const userId = query.UserId || this.userId;
    if (!userId) throw new Error('User ID required');

    const queryString = this.buildQueryString(query);
    return this.apiRequest<ItemsResult>(`/Users/${userId}/Items?${queryString}`);
  }

  /**
   * Récupère les films
   */
  async getMovies(query: Omit<ItemsQuery, 'IncludeItemTypes'> = {}): Promise<ItemsResult> {
    return this.getItems({
      ...query,
      IncludeItemTypes: 'Movie',
      Fields: 'Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData,People,Studios',
    });
  }

  /**
   * Récupère les séries
   */
  async getSeries(query: Omit<ItemsQuery, 'IncludeItemTypes'> = {}): Promise<ItemsResult> {
    return this.getItems({
      ...query,
      IncludeItemTypes: 'Series',
      Fields: 'Genres,ProductionYear,ImageTags,BackdropImageTags,CommunityRating,UserData,People,Studios',
    });
  }

  /**
   * Récupère les derniers éléments ajoutés
   */
  async getLatestItems(itemTypes: string = 'Movie,Series', limit: number = 20): Promise<BaseItemDto[]> {
    const userId = this.userId;
    if (!userId) throw new Error('User ID required');

    const queryString = this.buildQueryString({
      IncludeItemTypes: itemTypes,
      Limit: limit,
      Fields: 'Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData',
    });

    return this.apiRequest<BaseItemDto[]>(`/Users/${userId}/Items/Latest?${queryString}`);
  }

  /**
   * Recherche dans la bibliothèque
   */
  async searchHints(query: SearchHintsQuery): Promise<SearchHintsResult> {
    const queryString = this.buildQueryString(query);
    return this.apiRequest<SearchHintsResult>(`/Search/Hints?${queryString}`);
  }

  // === DÉTAILS DES MÉDIAS ===

  /**
   * Récupère les détails d'un élément spécifique
   */
  async getItem(itemId: string, fields?: string): Promise<BaseItemDto> {
    const userId = this.userId;
    if (!userId) throw new Error('User ID required');

    const queryString = fields ? this.buildQueryString({ Fields: fields }) : '';
    return this.apiRequest<BaseItemDto>(`/Users/${userId}/Items/${itemId}?${queryString}`);
  }

  /**
   * Récupère l'URL d'une image
   */
  getImageUrl(
    itemId: string, 
    imageType: string = 'Primary', 
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): string {
    const queryString = this.buildQueryString(options);
    const separator = queryString ? '?' : '';
    return `${this.config.baseUrl}/Items/${itemId}/Images/${imageType}${separator}${queryString}`;
  }

  // === STREAMING ===

  /**
   * Récupère les informations de lecture pour un média
   */
  async getPlaybackInfo(itemId: string, request: PlaybackInfoRequest): Promise<PlaybackInfoResponse> {
    return this.apiRequest<PlaybackInfoResponse>(
      `/Items/${itemId}/PlaybackInfo`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Génère l'URL de streaming pour un média
   */
  getStreamUrl(itemId: string, params: StreamingParams = {}): string {
    const allParams = {
      ...params,
      api_key: this.accessToken,
    };
    
    const queryString = this.buildQueryString(allParams);
    return `${this.config.baseUrl}/Videos/${itemId}/stream?${queryString}`;
  }

  /**
   * Génère l'URL HLS pour un média
   */
  getHlsUrl(itemId: string, params: Omit<StreamingParams, 'Static'> = {}): string {
    const queryString = this.buildQueryString({
      ...params,
      api_key: this.accessToken,
    });
    return `${this.config.baseUrl}/Videos/${itemId}/master.m3u8?${queryString}`;
  }

  /**
   * Récupère l'URL des sous-titres
   */
  getSubtitleUrl(itemId: string, subtitleId: string, format: string = 'srt'): string {
    return `${this.config.baseUrl}/Videos/${itemId}/${subtitleId}/Subtitles.${format}?api_key=${this.accessToken}`;
  }

  // === GESTION DES SESSIONS DE LECTURE ===

  /**
   * Signale le début de lecture d'un média
   */
  async reportPlaybackStart(request: PlayingSessionRequest): Promise<void> {
    await this.apiRequest(
      '/Sessions/Playing',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Met à jour la progression de lecture
   */
  async reportPlaybackProgress(request: PlayingSessionRequest): Promise<void> {
    await this.apiRequest(
      '/Sessions/Playing/Progress',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Signale l'arrêt de lecture
   */
  async reportPlaybackStop(request: PlayingSessionRequest): Promise<void> {
    await this.apiRequest(
      '/Sessions/Playing/Stopped',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // === GESTION DES SESSIONS ===

  /**
   * Récupère les sessions actives
   */
  async getSessions(): Promise<SessionInfo[]> {
    return this.apiRequest<SessionInfo[]>('/Sessions');
  }

  /**
   * Envoie une commande à une session
   */
  async sendCommand(sessionId: string, command: CommandRequest): Promise<void> {
    await this.apiRequest(
      `/Sessions/${sessionId}/Command`,
      {
        method: 'POST',
        body: JSON.stringify(command),
      }
    );
  }

  /**
   * Envoie un message à une session
   */
  async sendMessage(sessionId: string, message: MessageRequest): Promise<void> {
    await this.apiRequest(
      `/Sessions/${sessionId}/Message`,
      {
        method: 'POST',
        body: JSON.stringify(message),
      }
    );
  }

  // === UTILITAIRES ===

  /**
   * Teste la connexion au serveur
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.apiRequest('/System/Info/Public', {}, false);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les informations du serveur
   */
  async getServerInfo(): Promise<any> {
    return this.apiRequest('/System/Info/Public', {}, false);
  }

  /**
   * Convertit les ticks Jellyfin en secondes
   */
  static ticksToSeconds(ticks: number): number {
    return Math.floor(ticks / 10000000);
  }

  /**
   * Convertit les secondes en ticks Jellyfin
   */
  static secondsToTicks(seconds: number): number {
    return Math.floor(seconds * 10000000);
  }

  /**
   * Formate la durée en format lisible
   */
  static formatRuntime(ticks?: number): string {
    if (!ticks) return '';
    
    const seconds = JellyfinAPIClient.ticksToSeconds(ticks);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// Instance singleton du client API
let jellyfinClient: JellyfinAPIClient | null = null;

/**
 * Initialise le client Jellyfin avec la configuration
 */
export function initializeJellyfinClient(config: JellyfinConfig): JellyfinAPIClient {
  jellyfinClient = new JellyfinAPIClient(config);
  return jellyfinClient;
}

/**
 * Récupère l'instance du client Jellyfin
 */
export function getJellyfinClient(): JellyfinAPIClient {
  if (!jellyfinClient) {
    throw new Error('Jellyfin client not initialized. Call initializeJellyfinClient first.');
  }
  return jellyfinClient;
}

export { JellyfinAPIClient };
export type { JellyfinConfig };