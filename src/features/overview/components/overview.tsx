'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconTrendingUp, 
  IconTrendingDown,
  IconMovie,
  IconDeviceTv,
  IconDownload,
  IconDatabase,
  IconAlertTriangle,
  IconCheck,
  IconServer,
  IconDeviceFloppy,
  IconActivity,
  IconClock,
  IconStar,
  IconFile,
  IconSend,
  IconCalendar,
  IconDeviceDesktop,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import { radarrAPI, RadarrSystemStatus, RadarrDiskSpace, RadarrHealth, RadarrMovie } from '@/lib/radarr-api';
import { sonarrAPI, SonarrSystemStatus, SonarrDiskSpace, SonarrHealth, SonarrSeries } from '@/lib/sonarr-api';

interface DashboardData {
  radarr: {
    systemStatus: RadarrSystemStatus | null;
    diskSpace: RadarrDiskSpace[];
    health: RadarrHealth[];
    movies: RadarrMovie[];
  };
  sonarr: {
    systemStatus: SonarrSystemStatus | null;
    diskSpace: SonarrDiskSpace[];
    health: SonarrHealth[];
    series: SonarrSeries[];
  };
  loading: boolean;
  error: string | null;
}

export default function OverViewPage() {
  const [data, setData] = useState<DashboardData>({
    radarr: {
      systemStatus: null,
      diskSpace: [],
      health: [],
      movies: []
    },
    sonarr: {
      systemStatus: null,
      diskSpace: [],
      health: [],
      series: []
    },
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // Récupérer les données Radarr et Sonarr en parallèle
        const [radarrData, sonarrData] = await Promise.allSettled([
          Promise.all([
            radarrAPI.getSystemStatus(),
            radarrAPI.getDiskSpace(),
            radarrAPI.getHealth(),
            radarrAPI.getMovies()
          ]),
          Promise.all([
            sonarrAPI.getSystemStatus(),
            sonarrAPI.getDiskSpace(),
            sonarrAPI.getHealth(),
            sonarrAPI.getSeries()
          ])
        ]);

        const newData: DashboardData = {
          radarr: {
            systemStatus: null,
            diskSpace: [],
            health: [],
            movies: []
          },
          sonarr: {
            systemStatus: null,
            diskSpace: [],
            health: [],
            series: []
          },
          loading: false,
          error: null
        };

        // Traiter les données Radarr
        if (radarrData.status === 'fulfilled') {
          const [status, disk, health, movies] = radarrData.value;
          newData.radarr = { systemStatus: status, diskSpace: disk, health, movies };
        }

        // Traiter les données Sonarr
        if (sonarrData.status === 'fulfilled') {
          const [status, disk, health, series] = sonarrData.value;
          newData.sonarr = { systemStatus: status, diskSpace: disk, health, series };
        }

        setData(newData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Error loading data' 
        }));
      }
    };

    fetchAllData();
  }, []);

  // Fonctions utilitaires
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDiskUsage = (diskSpace: any[], path: string = '/Data') => {
    const disk = diskSpace.find(d => d.path === path);
    if (!disk) return { used: 0, total: 0, percentage: 0 };
    
    const used = disk.totalSpace - disk.freeSpace;
    const percentage = (used / disk.totalSpace) * 100;
    
    return {
      used,
      total: disk.totalSpace,
      percentage: Math.round(percentage)
    };
  };

  const getHealthStatus = (health: any[]) => {
    const errors = health.filter(h => h.type === 'error').length;
    const warnings = health.filter(h => h.type === 'warning').length;
    
    if (errors > 0) return { status: 'error', count: errors, text: 'Errors' };
    if (warnings > 0) return { status: 'warning', count: warnings, text: 'Warnings' };
    return { status: 'healthy', count: 0, text: 'Healthy' };
  };

  // Calculs des statistiques
  const radarrDiskUsage = getDiskUsage(data.radarr.diskSpace);
  const sonarrDiskUsage = getDiskUsage(data.sonarr.diskSpace);
  
  const radarrHealthStatus = getHealthStatus(data.radarr.health);
  const sonarrHealthStatus = getHealthStatus(data.sonarr.health);

  const totalMovies = data.radarr.movies.length;
  const downloadedMovies = data.radarr.movies.filter(m => m.hasFile).length;
  const monitoredMovies = data.radarr.movies.filter(m => m.monitored).length;
  const movieDownloadRate = totalMovies > 0 ? (downloadedMovies / totalMovies) * 100 : 0;

  const totalSeries = data.sonarr.series.length;
  const monitoredSeries = data.sonarr.series.filter(s => s.monitored).length;
  const downloadedSeries = data.sonarr.series.filter(s => s.statistics.episodeFileCount > 0).length;
  const totalEpisodes = data.sonarr.series.reduce((acc, s) => acc + s.statistics.totalEpisodeCount, 0);
  const downloadedEpisodes = data.sonarr.series.reduce((acc, s) => acc + s.statistics.episodeFileCount, 0);
  const episodeDownloadRate = totalEpisodes > 0 ? (downloadedEpisodes / totalEpisodes) * 100 : 0;

  if (data.loading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Hi, Welcome back 👋
            </h2>
          </div>
          <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="@container/card">
                <CardHeader>
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[60px]" />
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (data.error) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <IconAlertTriangle className="h-5 w-5" />
                Erreur de connexion
              </CardTitle>
            </CardHeader>
            <CardFooter>
              <p className="text-muted-foreground">{data.error}</p>
            </CardFooter>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Refresh</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
              
              {/* Carte Radarr - Total Movies */}
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Movies</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {totalMovies.toLocaleString()}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline' className="bg-blue-50 text-blue-700 border-blue-200">
                      <IconMovie className="h-3 w-3 mr-1" />
                      Radarr
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium text-blue-600'>
                    {downloadedMovies} downloaded <IconDownload className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    {monitoredMovies} monitored
                  </div>
                </CardFooter>
              </Card>

              {/* Carte Sonarr - Total Series */}
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Series</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {totalSeries.toLocaleString()}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline' className="bg-green-50 text-green-700 border-green-200">
                      <IconDeviceTv className="h-3 w-3 mr-1" />
                      Sonarr
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium text-green-600'>
                    {monitoredSeries} monitored <IconDeviceTv className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    {downloadedSeries} with episodes
                  </div>
                </CardFooter>
              </Card>

              {/* Carte Total Episodes */}
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Episodes</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {totalEpisodes.toLocaleString()}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline' className="bg-purple-50 text-purple-700 border-purple-200">
                      <IconDownload className="h-3 w-3 mr-1" />
                      {downloadedEpisodes.toLocaleString()} Downloaded
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium text-purple-600'>
                    {Math.round(episodeDownloadRate)}% complete <IconDownload className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Across all series
                  </div>
                </CardFooter>
              </Card>

              {/* Carte Disk Usage */}
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Disk Usage</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {Math.max(radarrDiskUsage.percentage, sonarrDiskUsage.percentage)}%
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline' className="bg-orange-50 text-orange-700 border-orange-200">
                      <IconDeviceFloppy className="h-3 w-3 mr-1" />
                      {formatFileSize(Math.max(radarrDiskUsage.used, sonarrDiskUsage.used))}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium text-orange-600'>
                    {formatFileSize(Math.max(radarrDiskUsage.total, sonarrDiskUsage.total))} total <IconDeviceFloppy className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    /Data disk space
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Section des services */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              
              {/* Carte Radarr Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMovie className="h-5 w-5" />
                    Radarr Status
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <div className="grid grid-cols-2 gap-4 text-sm w-full">
                    <div>
                      <p className="text-muted-foreground">Version</p>
                      <p className="font-medium">{data.radarr.systemStatus?.version || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health</p>
                      <Badge 
                        variant="outline" 
                        className={
                          radarrHealthStatus.status === 'healthy' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : radarrHealthStatus.status === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {radarrHealthStatus.status === 'healthy' ? (
                          <IconCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <IconAlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {radarrHealthStatus.text}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Download Rate</p>
                      <p className="font-medium">{Math.round(movieDownloadRate)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Disk Usage</p>
                      <p className="font-medium">{radarrDiskUsage.percentage}%</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Carte Sonarr Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconDeviceTv className="h-5 w-5" />
                    Sonarr Status
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <div className="grid grid-cols-2 gap-4 text-sm w-full">
                    <div>
                      <p className="text-muted-foreground">Version</p>
                      <p className="font-medium">{data.sonarr.systemStatus?.version || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health</p>
                      <Badge 
                        variant="outline" 
                        className={
                          sonarrHealthStatus.status === 'healthy' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : sonarrHealthStatus.status === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {sonarrHealthStatus.status === 'healthy' ? (
                          <IconCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <IconAlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {sonarrHealthStatus.text}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Download Rate</p>
                      <p className="font-medium">{Math.round(episodeDownloadRate)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Disk Usage</p>
                      <p className="font-medium">{sonarrDiskUsage.percentage}%</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
