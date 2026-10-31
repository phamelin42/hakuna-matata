import { formatDate, formatDuration } from './format';

describe('formatDuration', () => {
  it.each([
    [1418, '24 min'],
    [30, '1 min'],
    [3540, '59 min'],
    [3600, '1 h 00'],
    [3900, '1 h 05'],
    [7380, '2 h 03'],
  ])('%s s devient « %s »', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('écrit la date en français', () => {
    expect(formatDate('2026-01-09T18:29:00Z')).toBe('9 janvier 2026');
  });

  it("donne le jour de Paris, pas celui de l'UTC, pour que le pré-rendu et le navigateur s'accordent", () => {
    expect(formatDate('2026-01-09T23:30:00Z')).toBe('10 janvier 2026');
  });
});
