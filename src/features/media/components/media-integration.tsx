'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IconSparkles, IconArrowRight, IconRefresh } from '@tabler/icons-react';

// Import de l'ancienne page
import { MediaMovieList } from './media-movie-list';
// Import de la nouvelle page
import { EnhancedMediaMovieList } from './media-movie-list-enhanced';

interface MediaIntegrationProps {
  userId: string;
}

/**
 * Composant d'intégration pour une migration progressive
 * Permet de basculer entre l'ancienne et la nouvelle interface
 */
export function MediaIntegration({ userId }: MediaIntegrationProps) {
  const [useEnhancedVersion, setUseEnhancedVersion] = useState(false);
  const [showMigrationInfo, setShowMigrationInfo] = useState(true);

  if (!useEnhancedVersion) {
    return (
      <div className="space-y-4">
        {/* Bannière de migration */}
        {showMigrationInfo && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconSparkles className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Nouvelle interface disponible !</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Découvrez les filtres avancés, les modes d'affichage et bien plus...
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMigrationInfo(false)}
                  className="text-muted-foreground"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enhanced-version"
                      checked={useEnhancedVersion}
                      onCheckedChange={setUseEnhancedVersion}
                    />
                    <Label htmlFor="enhanced-version" className="text-sm font-medium">
                      Activer la nouvelle interface
                    </Label>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Version Beta
                  </Badge>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUseEnhancedVersion(true)}
                  className="ml-4"
                >
                  <IconArrowRight className="h-4 w-4 mr-1" />
                  Essayer
                </Button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Filtres avancés par genre, année, note</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>3 modes d'affichage (Grille, Liste, Carrousel)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Actions rapides et sélection multiple</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interface actuelle */}
        <MediaMovieList userId={userId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de retour */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconSparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Vous utilisez la nouvelle interface améliorée
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Beta
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700"
              >
                <IconRefresh className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedVersion(false)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Revenir à l'ancienne interface
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nouvelle interface */}
      <EnhancedMediaMovieList userId={userId} />
    </div>
  );
}

/**
 * Hook pour détecter si l'utilisateur préfère la nouvelle interface
 */
export function useEnhancedInterface() {
  const [isEnhanced, setIsEnhanced] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('enhanced-interface') === 'true';
    }
    return false;
  });

  const toggleEnhanced = (value: boolean) => {
    setIsEnhanced(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enhanced-interface', value.toString());
    }
  };

  return { isEnhanced, toggleEnhanced };
}

/**
 * Version simplifiée pour un remplacement direct
 */
export function MediaMovieListWrapper({ userId }: MediaIntegrationProps) {
  const { isEnhanced } = useEnhancedInterface();
  
  // Pour une migration douce, utiliser l'ancienne interface par défaut
  // et permettre aux utilisateurs d'opter pour la nouvelle
  return isEnhanced ? (
    <EnhancedMediaMovieList userId={userId} />
  ) : (
    <MediaIntegration userId={userId} />
  );
}

// Export pour compatibilité avec l'API existante
export { MediaMovieList as LegacyMediaMovieList };
export { EnhancedMediaMovieList as NewMediaMovieList };