'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconExternalLink } from '@tabler/icons-react';

export default function MediaPage() {
  const jellyfinUrl = process.env.NEXT_PUBLIC_JELLYFIN_URL;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media</h1>
          <p className="text-muted-foreground">
            Access your Jellyfin media server
          </p>
        </div>
        {jellyfinUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(jellyfinUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <IconExternalLink className="h-4 w-4" />
            Open Jellyfin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jellyfin Media Server</CardTitle>
        </CardHeader>
        <CardContent>
          {jellyfinUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={jellyfinUrl}
                className="h-full w-full rounded-lg border"
                title="Jellyfin Media Server"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Jellyfin URL not configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

