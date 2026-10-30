const DATE = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeZone: 'Europe/Paris',
});

/** « 9 janvier 2026 », à l'heure de Paris : le pré-rendu et le navigateur disent la même chose. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

/** « 24 min », « 1 h 05 » : l'heure n'apparaît qu'à partir de 60 minutes. */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
