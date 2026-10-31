/** Un épisode, tel que l'écrit `tools/sync-episodes.mjs` dans `data/episodes.json`. */
export interface Episode {
  /** Identifiant stable, repris dans l'URL (`/episodes/:id`). */
  readonly id: string;
  readonly title: string;
  /** Texte brut : jamais du HTML (la description vient d'un tiers). */
  readonly description: string;
  /** Date de publication, ISO 8601 en UTC. */
  readonly publishedAt: string;
  readonly durationSeconds: number;
  readonly episodeNumber?: number;
  /** Identifiant Spotify de l'épisode, pour le lien « Écouter sur Spotify ». */
  readonly spotifyId?: string;
  /** Fichier audio du flux RSS, lu par le lecteur natif. */
  readonly audioUrl?: string;
}

export interface Podcast {
  readonly title: string;
  readonly author: string;
  readonly description: string | null;
  readonly siteUrl: string;
  readonly spotifyShowUrl: string;
}
