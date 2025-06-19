import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';
import { SonarrOverview } from '@/features/sonarr/components/sonarr-overview';
import { SeriesList } from '@/features/sonarr/components/series-list';
import { QueueList } from '@/features/sonarr/components/queue-list';
import { SeriesSearch } from '@/features/sonarr/components/series-search';
import { IconDeviceTv, IconDownload, IconDatabase, IconList, IconSearch, IconExternalLink, IconMovie } from '@tabler/icons-react';

export const metadata = {
  title: 'Dashboard : Sonarr - TV Series Manager'
};

export default function SonarrPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <IconDeviceTv className="h-6 w-6" />
              Sonarr - TV Series Manager
            </h2>
            <a
              href={process.env.NEXT_PUBLIC_SONARR_URL || 'http://192.168.1.128:8989'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <IconExternalLink className="h-4 w-4" />
              Open Sonarr Web Interface
            </a>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconDatabase className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="series" 
              className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] cursor-pointer px-4"
            >
              <IconList className="h-4 w-4" />
              Series
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
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SonarrOverview />
          </TabsContent>

          <TabsContent value="series" className="space-y-4">
            <SeriesList />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <SeriesSearch />
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <QueueList />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
