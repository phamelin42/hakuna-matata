# ADR 001 : données du podcast au build, pré-rendu, lecteur natif

## Contexte

Le site présente les épisodes du podcast Hakuna Matata (émission Spotify) : lecture, filtre, tri.
Spotify n'expose la liste des épisodes ni sur sa page publique (une application monopage) ni par
l'embed (le dernier épisode seulement) ; son API demande une clé et un serveur.

## Décisions

1. **Les épisodes viennent du flux RSS du podcast, lu au build** par `tools/sync-episodes.mjs`, qui écrit
   `src/app/data/episodes.json`. Le site ne contacte jamais le flux à l'exécution : pas de serveur,
   pas de clé, pas de panne côté visiteur. Le flux est une entrée d'un tiers : taille bornée,
   2000 épisodes au plus, descriptions réduites à du texte brut, audio en `https` seulement.
   Mettre à jour le catalogue = lancer la commande, relire le diff, ouvrir une PR.
2. **Pré-rendu statique** (`@angular/ssr`, `outputMode: 'static'`) : chaque page, y compris une par
   épisode, est du HTML complet lisible sans JavaScript (SEO, aperçus de partage). Dépendance de
   build, pas de serveur d'exécution.
3. **Lecteur `<audio>` natif** sur le fichier du flux, plus un lien « Écouter sur Spotify ». Pas
   d'iframe Spotify : elle dépose des cookies tiers, ce que le contexte commun exclut, et elle est
   moins accessible qu'un lecteur natif. Un épisode sans fichier audio n'a que le lien Spotify.
4. **Filtres et tris côté navigateur**, sur le catalogue embarqué (fonctions pures testées). Texte
   sans accents ni casse, année, durée (courts < 15 min, longs ≥ 30 min), cinq tris.

## Conséquences

- Un nouvel épisode n'apparaît qu'après une synchronisation et un déploiement.
- Sans `audioUrl`, la lecture se fait sur Spotify.
- Pas de transcription : le flux n'en fournit pas (WCAG 1.2.1 pour l'audio seul). À demander à Soraya.
