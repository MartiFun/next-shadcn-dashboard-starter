# 🎬 Intégration Radarr - Guide d'Utilisation

## 📋 Vue d'ensemble

Cette intégration remplace l'iframe Radarr par une interface native utilisant l'API Radarr et shadcn/ui. Elle offre une expérience utilisateur améliorée avec des fonctionnalités avancées.

## 🚀 Fonctionnalités

### 1. **Vue d'ensemble (Overview)**
- **Statistiques système** : Version, espace disque, problèmes de santé
- **Informations détaillées** : OS, runtime, configuration
- **Monitoring de l'espace disque** : Utilisation par partition
- **État de santé** : Problèmes détectés avec liens vers la documentation

### 2. **Gestion des Films**
- **Liste complète** : Tous les films avec posters et métadonnées
- **Recherche en temps réel** : Filtrage par titre, année
- **Actions rapides** : Toggle monitoring, informations détaillées
- **Statistiques** : Nombre de films, téléchargés, surveillés

### 3. **Recherche de Nouveaux Films**
- **Recherche TMDB** : Intégration avec la base de données de films
- **Ajout en un clic** : Ajout direct à Radarr avec configuration
- **Prévisualisation** : Posters, notes, genres, synopsis
- **Gestion des erreurs** : Messages d'erreur clairs

### 4. **File d'Attente**
- **Suivi en temps réel** : Mise à jour automatique toutes les 5 secondes
- **Progression visuelle** : Barres de progression pour chaque téléchargement
- **Actions** : Pause, reprise, suppression
- **Informations détaillées** : Taille, temps restant, client de téléchargement

## ⚙️ Configuration

### 1. **Variables d'Environnement**

Ajoutez ces variables à votre fichier `.env.local` :

```env
# URL de votre instance Radarr (sans le /api/v3)
NEXT_PUBLIC_RADARR_URL=http://192.168.1.128:7878

# Clé API Radarr (trouvée dans Settings > General > Security > API Key)
RADARR_API_KEY=your_radarr_api_key_here
```

### 2. **Obtention de la Clé API Radarr**

1. Ouvrez votre interface Radarr
2. Allez dans **Settings** > **General** > **Security**
3. Copiez la **API Key**
4. Collez-la dans votre fichier `.env.local`

### 3. **Configuration des Profils de Qualité**

Dans le composant `MovieSearch`, ajustez ces valeurs selon votre configuration :

```typescript
const movieData = {
  ...movie,
  monitored: true,
  qualityProfileId: 1, // Ajustez selon vos profils de qualité
  rootFolderPath: '/movies', // Ajustez selon votre configuration
  addOptions: {
    searchForMovie: true
  }
};
```

## 🎯 Utilisation

### Navigation
- **Onglet Vue d'ensemble** : Monitoring système et santé
- **Onglet Films** : Gestion de votre bibliothèque
- **Onglet Rechercher** : Ajout de nouveaux films
- **Onglet File d'attente** : Suivi des téléchargements
- **Onglet Manquants** : Films non téléchargés (à venir)

### Actions Principales

#### Ajouter un Film
1. Allez dans l'onglet **Rechercher**
2. Entrez le titre du film
3. Cliquez sur **Rechercher**
4. Cliquez sur **Ajouter** sur le film souhaité

#### Gérer le Monitoring
1. Allez dans l'onglet **Films**
2. Cliquez sur le badge **Surveillé/Non surveillé** sur un film
3. Le statut se met à jour automatiquement

#### Suivre les Téléchargements
1. Allez dans l'onglet **File d'attente**
2. Surveillez la progression en temps réel
3. Utilisez les actions pour contrôler les téléchargements

## 🔧 Personnalisation

### Ajout de Nouvelles Fonctionnalités

1. **Créer un nouveau composant** dans `src/features/radarr/components/`
2. **Ajouter les types** dans `src/lib/radarr-api.ts`
3. **Implémenter les méthodes API** dans la classe `RadarrAPI`
4. **Intégrer dans la page** `src/app/dashboard/radarr/page.tsx`

### Exemple d'Ajout d'Onglet

```typescript
// 1. Créer le composant
export function NewFeature() {
  // Votre logique ici
}

// 2. Ajouter l'onglet
<TabsTrigger value="new-feature">
  <IconNewFeature className="h-4 w-4" />
  Nouvelle Fonctionnalité
</TabsTrigger>

// 3. Ajouter le contenu
<TabsContent value="new-feature">
  <NewFeature />
</TabsContent>
```

## 🐛 Dépannage

### Erreurs Courantes

#### "Erreur de connexion"
- Vérifiez que l'URL Radarr est correcte
- Vérifiez que la clé API est valide
- Vérifiez que Radarr est accessible depuis votre serveur

#### "Aucun film trouvé"
- Vérifiez votre connexion internet
- Vérifiez que l'API TMDB est accessible
- Vérifiez les logs de la console

#### "Erreur lors de l'ajout"
- Vérifiez que le dossier racine existe
- Vérifiez que le profil de qualité est correct
- Vérifiez les permissions de Radarr

### Logs et Debug

Activez les logs dans la console du navigateur pour voir les détails des erreurs :

```typescript
// Dans radarr-api.ts, les erreurs sont déjà loggées
console.error('Radarr API request failed:', error);
```

## 🔄 Mise à Jour

Pour mettre à jour l'intégration :

1. **Sauvegardez** votre configuration
2. **Mettez à jour** les dépendances
3. **Testez** les nouvelles fonctionnalités
4. **Ajustez** la configuration si nécessaire

## 📈 Améliorations Futures

- [ ] Films manquants avec recherche automatique
- [ ] Calendrier des sorties
- [ ] Gestion des collections
- [ ] Historique des téléchargements
- [ ] Notifications en temps réel
- [ ] Mode sombre/clair
- [ ] Export/import de configuration

## 🤝 Contribution

Pour contribuer à cette intégration :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité
3. **Implémentez** vos changements
4. **Testez** exhaustivement
5. **Soumettez** une pull request

---

**Note** : Cette intégration est conçue pour fonctionner avec Radarr v3+. Pour les versions antérieures, certaines fonctionnalités peuvent ne pas être disponibles. 