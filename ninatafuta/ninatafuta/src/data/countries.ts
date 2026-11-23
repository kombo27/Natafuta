import type { Country, CountryCode, Town } from '../types';

// Town coordinates are approximate town centres (example data, verify before use).
// Payment providers are examples and must be confirmed per country.
export const COUNTRIES: Record<CountryCode, Country> = {
  KE: {
    code: 'KE',
    name: { en: 'Kenya', sw: 'Kenya' },
    flag: '🇰🇪',
    dial: '+254',
    currency: 'KES',
    payMethods: ['M-Pesa', 'Airtel Money'],
    towns: [
      { name: 'Nairobi', lat: -1.2864, lng: 36.8172 },
      { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
      { name: 'Kisumu', lat: -0.0917, lng: 34.768 },
      { name: 'Nakuru', lat: -0.3031, lng: 36.08 },
      { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
      { name: 'Thika', lat: -1.0333, lng: 37.0693 },
    ],
  },
  TZ: {
    code: 'TZ',
    name: { en: 'Tanzania', sw: 'Tanzania' },
    flag: '🇹🇿',
    dial: '+255',
    currency: 'TZS',
    payMethods: ['M-Pesa', 'Airtel Money', 'Mixx by Yas'],
    towns: [
      { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
      { name: 'Arusha', lat: -3.3869, lng: 36.683 },
      { name: 'Mwanza', lat: -2.5164, lng: 32.9175 },
      { name: 'Dodoma', lat: -6.163, lng: 35.7516 },
      { name: 'Zanzibar', lat: -6.1659, lng: 39.2026 },
      { name: 'Moshi', lat: -3.3349, lng: 37.3404 },
    ],
  },
  UG: {
    code: 'UG',
    name: { en: 'Uganda', sw: 'Uganda' },
    flag: '🇺🇬',
    dial: '+256',
    currency: 'UGX',
    payMethods: ['MTN MoMo', 'Airtel Money'],
    towns: [
      { name: 'Kampala', lat: 0.3476, lng: 32.5825 },
      { name: 'Entebbe', lat: 0.0512, lng: 32.4637 },
      { name: 'Jinja', lat: 0.4244, lng: 33.2042 },
      { name: 'Mbarara', lat: -0.6072, lng: 30.6545 },
      { name: 'Gulu', lat: 2.7724, lng: 32.2881 },
    ],
  },
};

export const COUNTRY_LIST: Country[] = [COUNTRIES.KE, COUNTRIES.TZ, COUNTRIES.UG];

export function findTown(name: string): { town: Town; country: Country } | undefined {
  for (const c of COUNTRY_LIST) {
    const town = c.towns.find((t) => t.name === name);
    if (town) return { town, country: c };
  }
  return undefined;
}
