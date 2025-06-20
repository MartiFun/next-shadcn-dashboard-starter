'use client';

import PageContainer from '@/components/layout/page-container';
import { MediaMovieList } from '@/features/media/components/media-movie-list';
import { useEffect, useState } from 'react';
import { mediaAPI } from '@/lib/media-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helpers pour cookie
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name: string): string | null {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, null as string | null);
}

export default function MediaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    setUsersLoading(true);
    mediaAPI.getEmbyUsers().then(res => {
      if (res.ok && res.body?.Items) {
        setUsers(res.body.Items);
        // Initialiser depuis cookie si présent
        const cookieUserId = getCookie('emby_user_id');
        if (cookieUserId && res.body.Items.some((u: any) => u.Id === cookieUserId)) {
          setSelectedUserId(cookieUserId);
        } else if (res.body.Items.length > 0) {
          setSelectedUserId(res.body.Items[0].Id);
        }
      }
      setUsersLoading(false);
    });
  }, []);

  // Persiste le userId à chaque changement
  useEffect(() => {
    if (selectedUserId) setCookie('emby_user_id', selectedUserId);
  }, [selectedUserId]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Media</h1>
          <div className="min-w-[220px]">
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={usersLoading || users.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={usersLoading ? 'Chargement...' : 'Sélectionner un utilisateur'} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.Id} value={user.Id}>
                    {user.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedUserId && <MediaMovieList userId={selectedUserId} />}
      </div>
    </PageContainer>
  );
}

