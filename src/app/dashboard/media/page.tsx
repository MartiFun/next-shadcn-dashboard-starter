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

export default function MediaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    setUsersLoading(true);
    mediaAPI.getEmbyUsers().then(res => {
      if (res.ok && res.body?.Items) {
        setUsers(res.body.Items);
        if (res.body.Items.length > 0) setSelectedUserId(res.body.Items[0].Id);
      }
      setUsersLoading(false);
    });
  }, []);

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

