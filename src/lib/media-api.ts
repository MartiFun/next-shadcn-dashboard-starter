// Abstraction pour l'API Media (pourra être remplacée plus tard)
import { radarrAPI, RadarrMovie } from './radarr-api';

export type MediaMovie = RadarrMovie;

const EMBY_BASE_URL = process.env.NEXT_PUBLIC_EMBY_URL;
const EMBY_API_KEY = process.env.NEXT_PUBLIC_EMBY_API_KEY;

export const mediaAPI = {
  getMovies: radarrAPI.getMovies.bind(radarrAPI),
  // On pourra ajouter d'autres méthodes ici plus tard
  async testEmbyAuth(debug = false) {
    if (!EMBY_BASE_URL || !EMBY_API_KEY) {
      if (debug) return { ok: false, status: 0, statusText: 'Missing config', body: null };
      return false;
    }
    try {
      const res = await fetch(`${EMBY_BASE_URL}/System/Info`, {
        headers: {
          'X-Emby-Token': EMBY_API_KEY,
        },
      });
      const body = await res.text();
      if (debug) {
        return { ok: res.ok, status: res.status, statusText: res.statusText, body };
      }
      return res.ok;
    } catch (e: any) {
      if (debug) return { ok: false, status: 0, statusText: e?.message || 'Erreur', body: null };
      return false;
    }
  },
  async getEmbyUsers() {
    if (!EMBY_BASE_URL || !EMBY_API_KEY) {
      return { ok: false, status: 0, statusText: 'Missing config', body: null };
    }
    try {
      const url = `${EMBY_BASE_URL}/Users/Query?api_key=${EMBY_API_KEY}`;
      const res = await fetch(url);
      const body = await res.json();
      return { ok: res.ok, status: res.status, statusText: res.statusText, body };
    } catch (e: any) {
      return { ok: false, status: 0, statusText: e?.message || 'Erreur', body: null };
    }
  },
  async getEmbyMovies(userId: string) {
    if (!EMBY_BASE_URL || !EMBY_API_KEY) {
      return { ok: false, status: 0, statusText: 'Missing config', body: null };
    }
    try {
      const url = `${EMBY_BASE_URL}/Users/${userId}/Items?Recursive=true&IncludeItemTypes=Movie&Fields=Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData`;
      const res = await fetch(url, {
        headers: {
          'X-Emby-Token': EMBY_API_KEY,
        },
      });
      const body = await res.json();
      return { ok: res.ok, status: res.status, statusText: res.statusText, body };
    } catch (e: any) {
      return { ok: false, status: 0, statusText: e?.message || 'Erreur', body: null };
    }
  },
  async getEmbyLatestMovies(userId: string) {
    if (!EMBY_BASE_URL || !EMBY_API_KEY) {
      return { ok: false, status: 0, statusText: 'Missing config', body: null };
    }
    try {
      const url = `${EMBY_BASE_URL}/Users/${userId}/Items/Latest?IncludeItemTypes=Movie&Limit=5&IsPlayed=false&Fields=Genres,ProductionYear,RunTimeTicks,ImageTags,BackdropImageTags,CommunityRating,UserData`;
      const res = await fetch(url, {
        headers: {
          'X-Emby-Token': EMBY_API_KEY,
        },
      });
      const body = await res.json();
      return { ok: res.ok, status: res.status, statusText: res.statusText, body };
    } catch (e: any) {
      return { ok: false, status: 0, statusText: e?.message || 'Erreur', body: null };
    }
  },
}; 