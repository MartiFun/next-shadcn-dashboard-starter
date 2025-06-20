'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconStar,
  IconCalendar,
  IconClock,
  IconMovie,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import { EmbyMovie, MovieFilters, MovieSort } from '@/types/media';

interface MovieFiltersProps {
  movies: EmbyMovie[];
  filters: MovieFilters;
  sort: MovieSort;
  onFiltersChange: (filters: Partial<MovieFilters>) => void;
  onSortChange: (sort: MovieSort) => void;
  onResetFilters: () => void;
}

export function MovieFiltersComponent({
  movies,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onResetFilters,
}: MovieFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    search: true,
    genres: false,
    year: false,
    rating: false,
    duration: false,
    status: false,
    advanced: false,
  });

  // Extraire les valeurs uniques pour les filtres
  const uniqueGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach(movie => {
      movie.Genres?.forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [movies]);

  const uniqueStudios = useMemo(() => {
    const studios = new Set<string>();
    movies.forEach(movie => {
      movie.Studios?.forEach(studio => studios.add(studio.Name));
    });
    return Array.from(studios).sort();
  }, [movies]);

  const uniqueOfficialRatings = useMemo(() => {
    const ratings = new Set<string>();
    movies.forEach(movie => {
      if (movie.OfficialRating) ratings.add(movie.OfficialRating);
    });
    return Array.from(ratings).sort();
  }, [movies]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    movies.forEach(movie => {
      movie.Countries?.forEach(country => countries.add(country));
    });
    return Array.from(countries).sort();
  }, [movies]);

  const yearRange = useMemo(() => {
    const years = movies
      .map(m => m.ProductionYear)
      .filter((year): year is number => typeof year === 'number')
      .sort((a, b) => a - b);
    return years.length > 0 ? [years[0], years[years.length - 1]] : [1900, new Date().getFullYear()];
  }, [movies]);

  const ratingRange = useMemo(() => {
    const ratings = movies
      .map(m => m.CommunityRating)
      .filter((rating): rating is number => typeof rating === 'number')
      .sort((a, b) => a - b);
    return ratings.length > 0 ? [ratings[0], ratings[ratings.length - 1]] : [0, 10];
  }, [movies]);

  const durationRange = useMemo(() => {
    const durations = movies
      .map(m => m.RunTimeTicks ? Math.round(m.RunTimeTicks / 10000000 / 60) : 0)
      .filter(duration => duration > 0)
      .sort((a, b) => a - b);
    return durations.length > 0 ? [durations[0], durations[durations.length - 1]] : [0, 300];
  }, [movies]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value && value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return value && value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    }).length;
  }, [filters]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconFilter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtres & Recherche</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recherche */}
        <Collapsible open={expandedSections.search} onOpenChange={() => toggleSection('search')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconSearch className="h-4 w-4" />
                <span className="font-medium">Recherche</span>
              </div>
              {expandedSections.search ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par titre, acteur, réalisateur, genre..."
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tri */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconSortAscending className="h-4 w-4" />
            <span className="font-medium">Tri</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { field: 'title' as const, label: 'Titre' },
              { field: 'year' as const, label: 'Année' },
              { field: 'rating' as const, label: 'Note' },
              { field: 'duration' as const, label: 'Durée' },
              { field: 'dateAdded' as const, label: 'Ajouté le' },
            ].map(({ field, label }) => (
              <Button
                key={field}
                variant={sort.field === field ? "default" : "outline"}
                size="sm"
                onClick={() => onSortChange({
                  field,
                  order: sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
                })}
                className="flex items-center gap-1"
              >
                {label}
                {sort.field === field && (
                  sort.order === 'asc' ? 
                    <IconSortAscending className="h-3 w-3" /> : 
                    <IconSortDescending className="h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Genres */}
        <Collapsible open={expandedSections.genres} onOpenChange={() => toggleSection('genres')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconMovie className="h-4 w-4" />
                <span className="font-medium">Genres</span>
                {filters.genres && filters.genres.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.genres.length}
                  </Badge>
                )}
              </div>
              {expandedSections.genres ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {uniqueGenres.map(genre => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre}`}
                    checked={filters.genres?.includes(genre) || false}
                    onCheckedChange={(checked) => {
                      const currentGenres = filters.genres || [];
                      if (checked) {
                        onFiltersChange({ genres: [...currentGenres, genre] });
                      } else {
                        onFiltersChange({ genres: currentGenres.filter(g => g !== genre) });
                      }
                    }}
                  />
                  <Label htmlFor={`genre-${genre}`} className="text-sm cursor-pointer">
                    {genre}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Année */}
        <Collapsible open={expandedSections.year} onOpenChange={() => toggleSection('year')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                <span className="font-medium">Année de sortie</span>
                {filters.years && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.years[0]} - {filters.years[1]}
                  </Badge>
                )}
              </div>
              {expandedSections.year ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  min={yearRange[0]}
                  max={yearRange[1]}
                  step={1}
                  value={filters.years || yearRange}
                  onValueChange={(value) => onFiltersChange({ years: value as [number, number] })}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.years?.[0] || yearRange[0]}</span>
                <span>{filters.years?.[1] || yearRange[1]}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Note */}
        <Collapsible open={expandedSections.rating} onOpenChange={() => toggleSection('rating')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconStar className="h-4 w-4" />
                <span className="font-medium">Note</span>
                {filters.rating && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.rating[0]} - {filters.rating[1]}
                  </Badge>
                )}
              </div>
              {expandedSections.rating ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  min={ratingRange[0]}
                  max={ratingRange[1]}
                  step={0.1}
                  value={filters.rating || ratingRange}
                  onValueChange={(value) => onFiltersChange({ rating: value as [number, number] })}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.rating?.[0]?.toFixed(1) || ratingRange[0]}</span>
                <span>{filters.rating?.[1]?.toFixed(1) || ratingRange[1]}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Durée */}
        <Collapsible open={expandedSections.duration} onOpenChange={() => toggleSection('duration')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                <span className="font-medium">Durée (minutes)</span>
                {filters.duration && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.duration[0]} - {filters.duration[1]}min
                  </Badge>
                )}
              </div>
              {expandedSections.duration ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  min={durationRange[0]}
                  max={durationRange[1]}
                  step={5}
                  value={filters.duration || durationRange}
                  onValueChange={(value) => onFiltersChange({ duration: value as [number, number] })}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.duration?.[0] || durationRange[0]}min</span>
                <span>{filters.duration?.[1] || durationRange[1]}min</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Statut */}
        <Collapsible open={expandedSections.status} onOpenChange={() => toggleSection('status')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconMovie className="h-4 w-4" />
                <span className="font-medium">Statut</span>
              </div>
              {expandedSections.status ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="watched-filter">Films vus uniquement</Label>
                <Switch
                  id="watched-filter"
                  checked={filters.watched === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ watched: checked ? true : null })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="unwatched-filter">Films non vus uniquement</Label>
                <Switch
                  id="unwatched-filter"
                  checked={filters.watched === false}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ watched: checked ? false : null })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="favorite-filter">Favoris uniquement</Label>
                <Switch
                  id="favorite-filter"
                  checked={filters.favorite === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ favorite: checked ? true : null })
                  }
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Filtres avancés */}
        <Collapsible open={expandedSections.advanced} onOpenChange={() => toggleSection('advanced')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <IconFilter className="h-4 w-4" />
                <span className="font-medium">Filtres avancés</span>
              </div>
              {expandedSections.advanced ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {/* Classification */}
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select
                value={filters.officialRating?.[0] || "all"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    officialRating: value === "all" ? undefined : [value] 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classifications</SelectItem>
                  {uniqueOfficialRatings.map(rating => (
                    <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Studios */}
            <div className="space-y-2">
              <Label>Studio</Label>
              <Select
                value={filters.studios?.[0] || "all"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    studios: value === "all" ? undefined : [value] 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les studios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les studios</SelectItem>
                  {uniqueStudios.map(studio => (
                    <SelectItem key={studio} value={studio}>{studio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={filters.countries?.[0] || "all"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    countries: value === "all" ? undefined : [value] 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}