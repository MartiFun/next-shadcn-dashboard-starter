import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';
import { RadarrOverview } from '@/features/radarr/components/radarr-overview';
import { MovieList } from '@/features/radarr/components/movie-list';
import { QueueList } from '@/features/radarr/components/queue-list';
import { MovieSearch } from '@/features/radarr/components/movie-search';
import { IconMovie, IconDownload, IconDatabase, IconList, IconSearch, IconExternalLink, IconDeviceTv } from '@tabler/icons-react';

export default function RadarrPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <IconMovie className="h-6 w-6" />
              Radarr - Movie Manager
            </h2>
            <a
              href={process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <IconExternalLink className="h-4 w-4" />
              Open Radarr Web Interface
            </a>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 gap-2">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconDatabase className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="movies" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconMovie className="h-4 w-4" />
              Movies
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconSearch className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger 
              value="queue" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconDownload className="h-4 w-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger 
              value="missing" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconList className="h-4 w-4" />
              Missing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <RadarrOverview />
          </TabsContent>
          
          <TabsContent value="movies" className="space-y-4">
            <MovieList />
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4">
            <MovieSearch />
          </TabsContent>
          
          <TabsContent value="queue" className="space-y-4">
            <QueueList />
          </TabsContent>
          
          <TabsContent value="missing" className="space-y-4">
            <div className="text-center py-8">
              <IconList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Missing movies feature coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
