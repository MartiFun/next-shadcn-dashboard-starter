'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconMovie, 
  IconDownload, 
  IconAlertTriangle, 
  IconDatabase,
  IconClock,
  IconCheck,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconServer,
  IconDeviceDesktop,
  IconActivity,
  IconEye,
  IconEyeOff,
  IconStar,
  IconFile,
  IconSend,
  IconCalendar
} from '@tabler/icons-react';
import { radarrAPI, RadarrSystemStatus, RadarrDiskSpace, RadarrHealth, RadarrMovie } from '@/lib/radarr-api';
import * as Sentry from '@sentry/nextjs';

export function RadarrOverview() {
  const [systemStatus, setSystemStatus] = useState<RadarrSystemStatus | null>(null);
  const [diskSpace, setDiskSpace] = useState<RadarrDiskSpace[]>([]);
  const [health, setHealth] = useState<RadarrHealth[]>([]);
  const [movies, setMovies] = useState<RadarrMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusData, diskData, healthData, moviesData] = await Promise.all([
          radarrAPI.getSystemStatus(),
          radarrAPI.getDiskSpace(),
          radarrAPI.getHealth(),
          radarrAPI.getMovies()
        ]);
        
        setSystemStatus(statusData);
        setDiskSpace(diskData);
        setHealth(healthData);
        setMovies(moviesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
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
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <IconX className="h-5 w-5" />
            Erreur de connexion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculs des statistiques
  // Utiliser seulement le disque /Data pour les statistiques
  const dataDisk = diskSpace.find(disk => disk.path === '/Data');
  const totalDiskSpace = dataDisk ? dataDisk.totalSpace : 0;
  const usedDiskSpace = dataDisk ? (dataDisk.totalSpace - dataDisk.freeSpace) : 0;
  const diskUsagePercent = totalDiskSpace > 0 ? (usedDiskSpace / totalDiskSpace) * 100 : 0;

  const healthIssues = health.filter(h => h.type === 'error' || h.type === 'warning');
  const criticalIssues = health.filter(h => h.type === 'error');

  const totalMovies = movies.length;
  const downloadedMovies = movies.filter(m => m.hasFile).length;
  const monitoredMovies = movies.filter(m => m.monitored).length;
  const downloadRate = totalMovies > 0 ? (downloadedMovies / totalMovies) * 100 : 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUptime = () => {
    if (!systemStatus?.startTime) return 'N/A';
    const startTime = new Date(systemStatus.startTime);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}j ${hours}h`;
  };

  // Debug: Afficher les valeurs brutes pour diagnostiquer
  console.log('Disk Space Raw Data:', diskSpace);
  console.log('Total Space Raw:', totalDiskSpace, 'bytes');
  console.log('Used Space Raw:', usedDiskSpace, 'bytes');
  console.log('Formatted Total:', formatFileSize(totalDiskSpace));
  console.log('Formatted Used:', formatFileSize(usedDiskSpace));
  
  // Debug détaillé de chaque disque
  diskSpace.forEach((disk, index) => {
    console.log(`Disk ${index + 1}:`, {
      path: disk.path,
      label: disk.label,
      totalSpace: disk.totalSpace,
      freeSpace: disk.freeSpace,
      usedSpace: disk.totalSpace - disk.freeSpace,
      totalFormatted: formatFileSize(disk.totalSpace),
      usedFormatted: formatFileSize(disk.totalSpace - disk.freeSpace),
      freeFormatted: formatFileSize(disk.freeSpace)
    });
  });
  
  // Test avec différentes unités pour diagnostiquer
  const testUnits = (bytes: number) => {
    console.log('Testing units for:', bytes);
    console.log('As GB:', bytes / (1024 * 1024 * 1024));
    console.log('As TB:', bytes / (1024 * 1024 * 1024 * 1024));
    console.log('As MB:', bytes / (1024 * 1024));
    // Test si c'est déjà en GB
    console.log('If already in GB:', bytes, 'GB');
    console.log('If already in GB as TB:', bytes / 1000, 'TB');
  };
  
  if (totalDiskSpace > 0) {
    testUnits(totalDiskSpace);
  }

  // Vérifier si les valeurs sont déjà en GB (si totalDiskSpace < 1000000000, probablement déjà en GB)
  const isAlreadyInGB = totalDiskSpace < 1000000000;
  
  const formatDiskSpace = (value: number) => {
    if (isAlreadyInGB) {
      // Si c'est déjà en GB, convertir en TB
      return (value / 1000).toFixed(2) + ' TB';
    }
    return formatFileSize(value);
  };

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconMovie className="h-6 w-6" />
          Welcome to Radarr 👋
        </h2>
        <Badge variant="outline" className="text-sm">
          {systemStatus?.version || 'N/A'}
        </Badge>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Movies</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalMovies.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconTrendingUp className="h-3 w-3 mr-1" />
                +{Math.round(downloadRate)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
              {downloadedMovies} downloaded <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {monitoredMovies} monitored movies
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Disk Space</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {Math.round(diskUsagePercent)}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={diskUsagePercent > 80 ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                {diskUsagePercent > 80 ? <IconTrendingDown className="h-3 w-3 mr-1" /> : <IconTrendingUp className="h-3 w-3 mr-1" />}
                {Math.round(usedDiskSpace / 1024 / 1024 / 1024)}GB
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {formatDiskSpace(usedDiskSpace)} used <IconDeviceDesktop className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {formatDiskSpace(totalDiskSpace)} total
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {healthIssues.length === 0 ? 'OK' : healthIssues.length}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className={healthIssues.length === 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                {healthIssues.length === 0 ? <IconCheck className="h-3 w-3 mr-1" /> : <IconAlertTriangle className="h-3 w-3 mr-1" />}
                {healthIssues.length === 0 ? 'Healthy' : `${criticalIssues.length} critical`}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {healthIssues.length === 0 ? 'System operational' : 'Issues detected'} <IconActivity className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {systemStatus?.isProduction ? 'Production Mode' : 'Development Mode'}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Uptime</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {getUptime()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconServer className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Stable startup <IconClock className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {systemStatus?.startTime ? new Date(systemStatus.startTime).toLocaleDateString() : 'N/A'}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Grille de statistiques détaillées */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Statistiques des films */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMovie className="h-5 w-5" />
                Movie Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Downloaded</span>
                    <span className="font-medium">{downloadedMovies}</span>
                  </div>
                  <Progress value={downloadRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monitored</span>
                    <span className="font-medium">{monitoredMovies}</span>
                  </div>
                  <Progress value={(monitoredMovies / totalMovies) * 100} className="h-2" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalMovies}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{downloadedMovies}</div>
                  <div className="text-xs text-muted-foreground">Downloaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalMovies - downloadedMovies}</div>
                  <div className="text-xs text-muted-foreground">Missing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations système */}
        <div className="col-span-4 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconServer className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">OS:</span>
                <span className="text-sm font-medium">{systemStatus?.osName} {systemStatus?.osVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Runtime:</span>
                <span className="text-sm font-medium">{systemStatus?.runtimeName} {systemStatus?.runtimeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Base URL:</span>
                <span className="text-sm font-medium">{systemStatus?.urlBase || '/'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Authentication:</span>
                <span className="text-sm font-medium">{systemStatus?.authentication}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Espace disque détaillé */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDeviceDesktop className="h-5 w-5" />
                Disk Space - /Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataDisk ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{dataDisk.label || dataDisk.path}</span>
                      <span className="text-muted-foreground">
                        {Math.round(diskUsagePercent)}%
                      </span>
                    </div>
                    <Progress value={diskUsagePercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDiskSpace(usedDiskSpace)} used</span>
                      <span>{formatDiskSpace(totalDiskSpace)} total</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">/Data disk not found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Problèmes de santé */}
        <div className="col-span-4 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthIssues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck className="h-4 w-4" />
                  <span className="text-sm">No issues detected</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {healthIssues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                        {issue.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.source}</p>
                        <p className="text-xs text-muted-foreground">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                  {healthIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      And {healthIssues.length - 3} more issues...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 