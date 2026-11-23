import type { AppState, Banner, CategoryId, Country, Listing, SearchCriteria } from '../types';
import { CAT } from '../data/categories';
import { COUNTRIES, findTown } from '../data/countries';
import { distanceKm } from './geo';

export type RadiusDef = { kind: 'km'; km: number } | { kind: 'country' } | { kind: 'all' };

export const RADIUS_STEPS: RadiusDef[] = [
  { kind: 'km', km: 2 }, { kind: 'km', km: 5 }, { kind: 'km', km: 10 }, { kind: 'km', km: 25 },
  { kind: 'km', km: 50 }, { kind: 'km', km: 100 }, { kind: 'km', km: 250 }, { kind: 'km', km: 500 },
  { kind: 'country' }, { kind: 'all' },
];
export const RADIUS_ALL = RADIUS_STEPS.length - 1;
export const RADIUS_COUNTRY = RADIUS_STEPS.length - 2;

export function defaultCriteria(town: string): SearchCriteria {
  return { q: '', cat: 'all', sub: 'all', town, radius: RADIUS_ALL };
}

export function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ');
}

export interface SearchCenter {
  lat: number;
  lng: number;
  country: Country;
}

export function centerOf(c: SearchCriteria, fallbackCountry: Country): SearchCenter {
  if (c.town === '__gps__' && c.gps) {
    // nearest known town decides the country of a GPS position
    let best = fallbackCountry;
    let bestD = Infinity;
    for (const country of Object.values(COUNTRIES)) {
      for (const t of country.towns) {
        const d = distanceKm(c.gps, t);
        if (d < bestD) { bestD = d; best = country; }
      }
    }
    return { ...c.gps, country: best };
  }
  const hit = findTown(c.town);
  if (hit) return { lat: hit.town.lat, lng: hit.town.lng, country: hit.country };
  const t = fallbackCountry.towns[0];
  return { lat: t.lat, lng: t.lng, country: fallbackCountry };
}

export function isActive(l: Listing): boolean {
  return !l.sold && !l.removed;
}

export function isBoosted(l: Listing, kind?: 'search' | 'home', now = Date.now()): boolean {
  if (!l.boostEnd || l.boostEnd < now) return false;
  return kind ? l.boostKind === kind || l.boostKind === 'home' : true;
}

function haystack(l: Listing): string {
  const cat = CAT[l.category];
  const sub = cat.subs.find((s) => s.id === l.sub);
  return norm([l.title, l.description, l.area, l.town, cat.name.en, cat.name.sw, sub?.name.en ?? '', sub?.name.sw ?? ''].join(' '));
}

export interface MatchOptions {
  ignoreCategory?: boolean;
}

export function matches(l: Listing, c: SearchCriteria, center: SearchCenter, opts: MatchOptions = {}): boolean {
  if (!isActive(l)) return false;
  if (!opts.ignoreCategory) {
    if (c.cat !== 'all' && l.category !== c.cat) return false;
    if (c.cat !== 'all' && c.sub !== 'all' && l.sub !== c.sub) return false;
  }
  const words = norm(c.q).split(' ').filter(Boolean);
  if (words.length) {
    const h = haystack(l);
    if (!words.every((w) => h.includes(w))) return false;
  }
  const r = RADIUS_STEPS[c.radius] ?? RADIUS_STEPS[RADIUS_ALL];
  if (r.kind === 'country' && l.country !== center.country.code) return false;
  if (r.kind === 'km' && distanceKm(center, l) > r.km) return false;
  // Prices only compare within one currency; ads in other currencies are not price-filtered.
  if (l.currency === center.country.currency) {
    if (c.min != null && l.price < c.min) return false;
    if (c.max != null && l.price > c.max) return false;
  }
  return true;
}

export function searchListings(state: AppState, c: SearchCriteria, center: SearchCenter): Listing[] {
  const now = Date.now();
  return state.listings
    .filter((l) => matches(l, c, center))
    .sort((a, b) =>
      Number(isBoosted(b, 'search', now)) - Number(isBoosted(a, 'search', now)) ||
      distanceKm(center, a) - distanceKm(center, b) ||
      b.date - a.date,
    );
}

export function countByCategory(state: AppState, c: SearchCriteria, center: SearchCenter): Record<CategoryId | 'all', number> {
  const counts = { all: 0 } as Record<CategoryId | 'all', number>;
  for (const l of state.listings) {
    if (!matches(l, { ...c, cat: 'all', sub: 'all' }, center, { ignoreCategory: true })) continue;
    counts.all++;
    counts[l.category] = (counts[l.category] ?? 0) + 1;
  }
  return counts;
}

export function countBySub(state: AppState, c: SearchCriteria, center: SearchCenter): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of state.listings) {
    if (c.cat === 'all' || l.category !== c.cat) continue;
    if (!matches(l, { ...c, sub: 'all' }, center)) continue;
    if (l.sub) counts[l.sub] = (counts[l.sub] ?? 0) + 1;
  }
  return counts;
}

/** Home feed: featured, own country, own town, newest. */
export function homeFeed(state: AppState, country: string, town: string): Listing[] {
  const now = Date.now();
  return state.listings
    .filter(isActive)
    .sort((a, b) =>
      Number(isBoosted(b, 'home', now)) - Number(isBoosted(a, 'home', now)) ||
      Number(b.country === country) - Number(a.country === country) ||
      Number(b.town === town) - Number(a.town === town) ||
      b.date - a.date,
    );
}

export function bannerFor(state: AppState, town: string, cat: CategoryId | 'all' = 'all', now = Date.now()): Banner | undefined {
  return state.banners.find(
    (b) => b.end > now && b.town === town && (b.category === 'all' || cat === 'all' || b.category === cat),
  );
}

export function criteriaLabel(c: SearchCriteria, lang: 'en' | 'sw'): string {
  const r = RADIUS_STEPS[c.radius];
  const where = c.town === '__gps__' ? (lang === 'sw' ? 'mahali nilipo' : 'my location') : c.town;
  const area = r.kind === 'km'
    ? (lang === 'sw' ? `Ndani ya km ${r.km} kutoka ${where}` : `Within ${r.km} km of ${where}`)
    : r.kind === 'country'
      ? (lang === 'sw' ? `Nchi nzima (${where})` : `Whole country (${where})`)
      : (lang === 'sw' ? 'Afrika Mashariki yote' : 'All East Africa');
  const parts = [c.q ? `“${c.q}”` : '', c.cat !== 'all' ? CAT[c.cat].name[lang] : '', area].filter(Boolean);
  return parts.join(', ');
}
