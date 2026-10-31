import { Service } from '@angular/core';
import episodes from '../data/episodes.json';
import podcast from '../data/podcast.json';
import { Episode, Podcast } from './episode';
import { sortEpisodes } from './episode-query';

/** Le catalogue est embarqué au build : aucun appel réseau à l'exécution. */
@Service()
export class Catalog {
  readonly podcast: Podcast = podcast;
  readonly episodes: readonly Episode[] = sortEpisodes(episodes as Episode[], 'newest');

  find(id: string | undefined): Episode | undefined {
    return this.episodes.find((episode) => episode.id === id);
  }

  /** L'épisode publié juste avant et celui publié juste après. */
  neighbours(episode: Episode): { older?: Episode; newer?: Episode } {
    const index = this.episodes.indexOf(episode);
    return { newer: this.episodes[index - 1], older: this.episodes[index + 1] };
  }
}
