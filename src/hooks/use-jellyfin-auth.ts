import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Sentry from "@sentry/nextjs";
import { getJellyfinClient, initializeJellyfinClient } from '@/lib/jellyfin-api';
import { JellyfinUser, AuthenticationResult } from '@/types/jellyfin';

interface JellyfinAuthState {
  // État d'authentification
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: JellyfinUser | null;
  
  // Configuration du serveur
  serverUrl: string | null;
  isServerConfigured: boolean;
  
  // Actions
  login: (serverUrl: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setServerUrl: (url: string) => void;
  checkAuthStatus: () => Promise<boolean>;
  initialize: () => void;
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  deviceId: typeof window !== 'undefined' 
    ? localStorage.getItem('jellyfin-device-id') || crypto.randomUUID() 
    : 'web-dashboard',
  deviceName: 'Dashboard Web',
  appName: 'Next.js Dashboard',
  appVersion: '1.0.0',
};

// Générer et sauvegarder un device ID unique si nécessaire
if (typeof window !== 'undefined' && !localStorage.getItem('jellyfin-device-id')) {
  localStorage.setItem('jellyfin-device-id', DEFAULT_CONFIG.deviceId);
}

export const useJellyfinAuth = create<JellyfinAuthState>()(
  persist(
    (set, get) => ({
      // État initial
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      serverUrl: null,
      isServerConfigured: false,

      // Action de connexion
      login: async (serverUrl: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Nettoyer l'URL du serveur
          const cleanServerUrl = serverUrl.replace(/\/$/, '');
          
          // Initialiser le client avec la nouvelle URL
          const client = initializeJellyfinClient({
            baseUrl: cleanServerUrl,
            ...DEFAULT_CONFIG,
          });

          // Tester la connexion
          const isConnected = await client.testConnection();
          if (!isConnected) {
            throw new Error('Unable to connect to Jellyfin server. Please check the URL and try again.');
          }

          // Tenter l'authentification
          const authResult: AuthenticationResult = await client.authenticateByName({
            Username: username,
            Pw: password,
          });

          set({
            isAuthenticated: true,
            isLoading: false,
            user: authResult.User,
            serverUrl: cleanServerUrl,
            isServerConfigured: true,
            error: null,
          });

          // Log de succès pour Sentry
          Sentry.addBreadcrumb({
            message: 'User successfully authenticated',
            category: 'auth',
            level: 'info',
            data: {
              userId: authResult.User.Id,
              username: authResult.User.Name,
            },
          });

        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Authentication failed. Please check your credentials.';
          
          set({
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
            user: null,
          });

          // Capturer l'erreur dans Sentry
          Sentry.captureException(error, {
            tags: {
              context: 'jellyfin_auth',
              action: 'login',
            },
            extra: {
              serverUrl,
              username,
            },
          });

          throw error;
        }
      },

      // Action de déconnexion
      logout: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const client = getJellyfinClient();
          if (client.isAuthenticated()) {
            await client.logout();
          }
        } catch (error) {
          // Log l'erreur mais ne pas empêcher la déconnexion locale
          console.warn('Server logout failed:', error);
          Sentry.captureException(error, {
            tags: { context: 'jellyfin_auth', action: 'logout' },
          });
        } finally {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });

          Sentry.addBreadcrumb({
            message: 'User logged out',
            category: 'auth',
            level: 'info',
          });
        }
      },

      // Nettoyer les erreurs
      clearError: () => {
        set({ error: null });
      },

      // Définir l'URL du serveur
      setServerUrl: (url: string) => {
        const cleanUrl = url.replace(/\/$/, '');
        set({ 
          serverUrl: cleanUrl, 
          isServerConfigured: !!cleanUrl,
          error: null,
        });
      },

      // Vérifier le statut d'authentification
      checkAuthStatus: async (): Promise<boolean> => {
        const state = get();
        
        if (!state.serverUrl || !state.isServerConfigured) {
          return false;
        }

        try {
          // Initialiser le client si nécessaire
          let client;
          try {
            client = getJellyfinClient();
          } catch {
            client = initializeJellyfinClient({
              baseUrl: state.serverUrl,
              ...DEFAULT_CONFIG,
            });
          }

          // Vérifier si l'utilisateur est toujours authentifié
          const isAuth = client.isAuthenticated();
          const currentUser = client.getCurrentUser();

          if (isAuth && currentUser) {
            // Tester une requête simple pour valider le token
            try {
              await client.getServerInfo();
              
              set({
                isAuthenticated: true,
                user: currentUser,
                error: null,
              });
              
              return true;
            } catch (error) {
              // Token invalide, nettoyer l'auth
              await client.logout();
              set({
                isAuthenticated: false,
                user: null,
                error: 'Session expired. Please log in again.',
              });
              return false;
            }
          } else {
            set({
              isAuthenticated: false,
              user: null,
            });
            return false;
          }
        } catch (error) {
          console.warn('Auth status check failed:', error);
          set({
            isAuthenticated: false,
            user: null,
            error: 'Unable to verify authentication status.',
          });
          return false;
        }
      },

      // Initialiser le client si possible
      initialize: () => {
        const state = get();
        
        if (state.serverUrl && state.isServerConfigured) {
          try {
            initializeJellyfinClient({
              baseUrl: state.serverUrl,
              ...DEFAULT_CONFIG,
            });
            
            // Vérifier le statut d'auth de manière asynchrone
            state.checkAuthStatus().catch(console.warn);
          } catch (error) {
            console.warn('Client initialization failed:', error);
          }
        }
      },
    }),
    {
      name: 'jellyfin-auth-storage',
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        isServerConfigured: state.isServerConfigured,
        // Ne pas persister l'auth - elle sera rechargée depuis le client
      }),
    }
  )
);

// Hook personnalisé pour les actions courantes
export const useJellyfinActions = () => {
  const { login, logout, clearError, setServerUrl, checkAuthStatus, initialize } = useJellyfinAuth();
  
  return {
    login,
    logout,
    clearError,
    setServerUrl,
    checkAuthStatus,
    initialize,
  };
};

// Hook pour les informations de l'utilisateur
export const useJellyfinUser = () => {
  const { user, isAuthenticated, isLoading } = useJellyfinAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    userId: user?.Id || null,
    username: user?.Name || null,
    isAdmin: user?.Policy?.IsAdministrator || false,
  };
};

// Hook pour la gestion des erreurs
export const useJellyfinError = () => {
  const { error, clearError } = useJellyfinAuth();
  
  return {
    error,
    hasError: !!error,
    clearError,
  };
};

// Hook pour la configuration du serveur
export const useJellyfinServer = () => {
  const { serverUrl, isServerConfigured, setServerUrl } = useJellyfinAuth();
  
  return {
    serverUrl,
    isServerConfigured,
    setServerUrl,
  };
};