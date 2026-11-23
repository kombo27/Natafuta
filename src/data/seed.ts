import type { AppState, Banner, CategoryId, CountryCode, Listing, Review, Seller, Wanted } from '../types';
import { COUNTRIES } from './countries';
import { CAT } from './categories';
import { defaultCriteria } from '../lib/search';

// Example ads for the demo feed. All names, places and prices are invented examples.
const DAY = 86_400_000;
const YEAR_2025 = new Date('2025-03-01').getTime();

const sellers: Seller[] = [
  { id: 's_otieno', name: 'Otieno', memberSince: YEAR_2025, phoneVerified: true, idVerified: true,
    seedStats: { count: 13, avg: 4.7 }, autoReply: "Hello! Yes, it's still available. When can you come to see it?" },
  { id: 's_wanjiru', name: 'Wanjiru', memberSince: YEAR_2025, phoneVerified: true, idVerified: false, seedStats: { count: 4, avg: 4.5 } },
  { id: 's_kilimani', name: 'Kilimani Phone Centre', memberSince: YEAR_2025 - 200 * DAY, phoneVerified: true, idVerified: true,
    shop: { name: 'Kilimani Phone Centre', description: 'New and used phones, laptops and repairs. 6-month warranty.', hours: 'Mon–Sat 8:30–19:00' },
    seedStats: { count: 41, avg: 4.6 } },
  { id: 's_kiprop', name: 'Kiprop', memberSince: YEAR_2025 + 60 * DAY, phoneVerified: true, idVerified: true, seedStats: { count: 7, avg: 4.9 } },
  { id: 's_achieng', name: 'Achieng', memberSince: YEAR_2025 + 120 * DAY, phoneVerified: true, idVerified: false },
  { id: 's_mwanaisha', name: 'Mwanaisha', memberSince: YEAR_2025 + 90 * DAY, phoneVerified: true, idVerified: false, seedStats: { count: 2, avg: 5 } },
  { id: 's_hassan', name: 'Hassan Juma', memberSince: YEAR_2025, phoneVerified: true, idVerified: true, seedStats: { count: 11, avg: 4.4 } },
  { id: 's_neema', name: 'Neema', memberSince: YEAR_2025 + 30 * DAY, phoneVerified: true, idVerified: false },
  { id: 's_okello', name: 'Okello', memberSince: YEAR_2025 + 10 * DAY, phoneVerified: true, idVerified: true, seedStats: { count: 6, avg: 4.3 } },
  { id: 's_nakato', name: 'Nakato', memberSince: YEAR_2025 + 150 * DAY, phoneVerified: true, idVerified: false },
  { id: 's_peter', name: 'Peter', memberSince: YEAR_2025 + 40 * DAY, phoneVerified: true, idVerified: false },
];

type Row = [
  id: string, country: CountryCode, cat: CategoryId, sub: string | undefined, title: string,
  price: number, town: string, area: string, lat: number, lng: number, seller: string,
  daysAgo: number, description: string, emoji?: string,
];

const rows: Row[] = [
  ['d1', 'KE', 'electronics', 'phones', 'Samsung Galaxy A15, 128 GB, like new', 16500, 'Nairobi', 'Westlands', -1.2676, 36.8108, 's_wanjiru', 0, 'Bought in March, always in a case. Charger and box included.'],
  ['d2', 'KE', 'vehicles', 'cars', 'Toyota Vitz 2012, automatic', 780000, 'Nairobi', 'Ngong Road', -1.3, 36.78, 's_otieno', 1, 'Clean, logbook ready. Viewing on weekends.', '🚗'],
  ['d3', 'KE', 'kids', 'strollers', 'Baby stroller, foldable', 6500, 'Nairobi', 'Westlands', -1.2655, 36.8031, 's_wanjiru', 1, 'Light and easy to fold. Rain cover included.'],
  ['d4', 'KE', 'property', 'rent', 'Bedsitter to let, KES 9,000 per month', 9000, 'Nairobi', 'Kasarani', -1.2219, 36.8968, 's_achieng', 2, 'Water and security included. Near the main road.'],
  ['d5', 'KE', 'agriculture', 'livestock', 'Friesian dairy cow, 2 years', 85000, 'Nakuru', 'Lanet', -0.2913, 36.1483, 's_kiprop', 2, 'Healthy, vaccinated, about 14 litres per day.'],
  ['d6', 'KE', 'sports', 'sports', 'Football boots, size 42', 2500, 'Kisumu', 'Milimani', -0.1016, 34.7559, 's_achieng', 3, 'Worn twice. Firm-ground studs.'],
  ['d7', 'KE', 'home', 'furniture', 'Wooden bed 5×6 with mattress', 14000, 'Kisumu', 'Milimani', -0.1, 34.758, 's_achieng', 4, 'Solid mahogany frame, mattress 8 inches.', '🛏️'],
  ['d8', 'KE', 'free', undefined, 'Baby clothes bundle, 0–12 months', 0, 'Mombasa', 'Nyali', -4.0236, 39.7203, 's_mwanaisha', 0, 'Free to a family who needs them. Pick up in Nyali.'],
  ['d9', 'KE', 'electronics', 'laptops', 'HP EliteBook 840, Core i5, 8 GB', 38000, 'Nairobi', 'Kilimani, near Yaya Centre', -1.2925, 36.7867, 's_kilimani', 2, 'Refurbished, 256 GB SSD, 6-month shop warranty.', '💻'],
  ['d10', 'KE', 'vehicles', 'motorbikes', 'Boda boda Bajaj Boxer, 2020', 95000, 'Thika', 'Makongeni', -1.0459, 37.0855, 's_kiprop', 5, 'Good engine, new tyres. Logbook available.'],
  ['d11', 'KE', 'jobs', 'fulltime', 'Shop assistant wanted, phone shop', 15000, 'Nairobi', 'CBD', -1.2833, 36.8233, 's_kilimani', 1, 'Monthly salary. Basic English and Swahili. Apply by chat.'],
  ['d12', 'KE', 'services', 'repairs', 'Phone screen repair, same day', 1500, 'Nairobi', 'Kilimani', -1.2899, 36.7848, 's_kilimani', 6, 'Price from KES 1,500 depending on the model.', '🔧'],
  ['d13', 'KE', 'pets', 'dogs', 'German Shepherd puppies, 8 weeks', 15000, 'Eldoret', 'Elgon View', 0.5076, 35.2836, 's_kiprop', 3, 'Dewormed, first vaccination done.'],
  ['d14', 'KE', 'fashion', 'women', 'Ankara dress, size M', 1800, 'Mombasa', 'Nyali', -4.0302, 39.7121, 's_mwanaisha', 2, 'Tailor-made, worn once.'],
  ['d15', 'TZ', 'electronics', 'phones', 'Infinix Hot 40, 128 GB', 270000, 'Dar es Salaam', 'Kariakoo', -6.8193, 39.2741, 's_hassan', 0, 'New in box, one-year warranty.'],
  ['d16', 'TZ', 'vehicles', 'motorbikes', 'Bajaj Boxer 150, 2021', 2300000, 'Dar es Salaam', 'Sinza', -6.7746, 39.2235, 's_hassan', 1, 'Low mileage, papers ready.'],
  ['d17', 'TZ', 'agriculture', 'poultry', 'Layer chickens, 50 birds', 750000, 'Arusha', 'Njiro', -3.4048, 36.7114, 's_neema', 2, 'Laying hens, 7 months old.', '🐔'],
  ['d18', 'TZ', 'property', 'land', 'Plot 20×30 m, Kigamboni', 15000000, 'Dar es Salaam', 'Kigamboni', -6.8433, 39.3133, 's_neema', 6, 'Surveyed plot with title deed, near the ferry.'],
  ['d19', 'TZ', 'electronics', 'tv', 'Smart TV 43 inch', 650000, 'Dar es Salaam', 'Mikocheni', -6.7633, 39.2489, 's_hassan', 3, 'Full HD, wall bracket included.', '📺'],
  ['d20', 'UG', 'electronics', 'phones', 'Tecno Spark 20, 256 GB', 450000, 'Kampala', 'Ntinda', 0.3542, 32.6156, 's_okello', 1, 'Used for three months, no scratches.'],
  ['d21', 'UG', 'agriculture', 'seeds', 'Hybrid maize seed, 10 kg', 60000, 'Jinja', 'Mpumudde', 0.4369, 33.2216, 's_nakato', 4, 'Certified seed, this season.', '🌽'],
  ['d22', 'UG', 'home', 'furniture', 'Sofa set, 5 seater', 1800000, 'Kampala', 'Kira', 0.3976, 32.6386, 's_nakato', 5, 'Brown fabric, very comfortable.'],
];

function listingFromRow(r: Row, now: number): Listing {
  const [id, country, cat, sub, title, price, town, area, lat, lng, sellerId, daysAgo, description, emoji] = r;
  return {
    id, country, category: cat, sub, title, price, currency: COUNTRIES[country].currency,
    town, area, lat, lng, sellerId, photos: [], emoji: emoji ?? CAT[cat].emoji, tint: CAT[cat].tint,
    description, date: now - daysAgo * DAY - 3_600_000, own: false, demo: true, sold: false, removed: false,
  };
}

export function createSeed(now = Date.now()): AppState {
  const wanted: Wanted[] = [
    { id: 'w1', country: 'KE', text: 'Used Toyota Vitz under 1.5M KES', budget: 1500000, currency: 'KES', town: 'Nairobi', area: '', requester: 'Brian', own: false, date: now - 2 * 3_600_000 },
    { id: 'w2', country: 'KE', text: 'Laptop for university, Core i5', budget: 40000, currency: 'KES', town: 'Kisumu', area: 'Kondele', requester: 'Akinyi', own: false, date: now - DAY },
    { id: 'w3', country: 'TZ', text: 'Small fridge for a shop', budget: 600000, currency: 'TZS', town: 'Dar es Salaam', area: 'Tegeta', requester: 'Rehema', own: false, date: now - DAY },
    { id: 'w4', country: 'UG', text: 'Two goats for breeding', budget: 700000, currency: 'UGX', town: 'Mbarara', area: '', requester: 'Tumusiime', own: false, date: now - 2 * DAY },
  ];
  const reviews: Review[] = [
    { id: 'r1', sellerId: 's_otieno', listingId: 'old', stars: 4, tags: ['as_described', 'quick'], comment: 'Item exactly as described. Quick replies.', author: 'Hassan', date: now - 10 * DAY },
    { id: 'r2', sellerId: 's_otieno', listingId: 'old2', stars: 5, tags: [], comment: 'Met in a public place, everything went well.', author: 'Peter', date: now - 27 * DAY },
  ];
  const banners: Banner[] = [
    { id: 'b1', business: 'Kilimani Phone Centre', text: 'New phones with 6-month warranty', category: 'all', town: 'Nairobi', country: 'KE', end: now + 20 * DAY, own: false },
    { id: 'b2', business: 'Kariakoo Electronics', text: 'Smartphones at wholesale prices', category: 'all', town: 'Dar es Salaam', country: 'TZ', end: now + 20 * DAY, own: false },
  ];
  return {
    version: 2,
    user: null,
    sellers: Object.fromEntries(sellers.map((s) => [s.id, s])),
    listings: rows.map((r) => listingFromRow(r, now)),
    wanted,
    chats: [],
    orders: [],
    reviews,
    notes: [],
    saved: [],
    favs: [],
    banners,
    reports: [],
    draftCriteria: defaultCriteria('Nairobi'),
  };
}
