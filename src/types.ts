// Data model – mirrors appendix D of "Screens and functions v2.0".
// In production the same objects live in the central backend.

export type Lang = 'sw' | 'en';
export type CountryCode = 'KE' | 'TZ' | 'UG';
export type Currency = 'KES' | 'TZS' | 'UGX';

export type CategoryId =
  | 'electronics' | 'vehicles' | 'agriculture' | 'property' | 'jobs' | 'services'
  | 'fashion' | 'home' | 'kids' | 'sports' | 'pets' | 'free';

export interface Localized { en: string; sw: string }

export interface Town {
  name: string;
  lat: number;
  lng: number;
}

export interface Country {
  code: CountryCode;
  name: Localized;
  flag: string;
  dial: string;
  currency: Currency;
  towns: Town[];
  payMethods: string[];
}

export type IdDocType = 'national_id' | 'passport' | 'driving_licence';

export interface Shop {
  name: string;
  description: string;
  hours: string;
  activeUntil: number;
}

export interface Preferences {
  push: boolean;
  sms: boolean;
  dataSaver: boolean;
}

export interface User {
  id: string;
  lang: Lang;
  country: CountryCode;
  phone: string; // national number without prefix
  town: string;
  area: string;
  name: string;
  prefs: Preferences;
  idStatus: 'none' | 'review' | 'verified';
  idType?: IdDocType;
  idLast3?: string; // only the last three characters are kept
  shop?: Shop;
  memberSince: number;
}

export interface Photo {
  preview: string; // small data URL
  full: string; // larger data URL, loaded on tap
}

export interface Seller {
  id: string;
  name: string;
  memberSince: number;
  phoneVerified: boolean;
  idVerified: boolean;
  shop?: Pick<Shop, 'name' | 'description' | 'hours'>;
  /** Historical ratings not stored as individual reviews (demo data). */
  seedStats?: { count: number; avg: number };
  autoReply?: string;
}

export interface Listing {
  id: string;
  country: CountryCode;
  category: CategoryId;
  sub?: string;
  title: string;
  price: number; // 0 for Bure
  currency: Currency;
  town: string;
  area: string;
  lat: number;
  lng: number;
  sellerId: string;
  photos: Photo[];
  emoji: string; // placeholder artwork for demo ads
  tint: string;
  description: string;
  date: number;
  own: boolean;
  demo: boolean;
  sold: boolean;
  removed: boolean;
  boostEnd?: number;
  boostKind?: 'search' | 'home';
  phone?: string; // full international number for real (own) ads
}

export interface Wanted {
  id: string;
  country: CountryCode;
  text: string;
  budget?: number;
  currency: Currency;
  town: string;
  area: string;
  requester: string;
  own: boolean;
  date: number;
}

export interface Message {
  from: 'me' | 'them';
  text: string;
  at: number;
}

export interface Chat {
  id: string;
  ref: { kind: 'listing' | 'wanted'; id: string };
  partnerId: string;
  partnerName: string;
  subject: string;
  messages: Message[];
  unread: number;
  autoReplied: boolean;
}

export type DeliveryType = 'pickup' | 'boda' | 'bus';
export type OrderStep = 'paid' | 'ready' | 'assigned' | 'onway' | 'received' | 'dispute';

export interface Order {
  id: string;
  listingId: string;
  sellerId: string;
  title: string;
  price: number;
  currency: Currency;
  delivery: DeliveryType;
  partner?: string;
  deliveryFee: number;
  payFee: number;
  total: number;
  method: string;
  address: string;
  history: { step: OrderStep; at: number }[];
  rated: boolean;
}

export interface Review {
  id: string;
  sellerId: string;
  listingId: string;
  stars: number;
  tags: string[];
  comment: string;
  author: string;
  mine?: boolean;
  date: number;
}

export type NoteType =
  | 'message' | 'wanted_reply' | 'saved_search' | 'order' | 'id' | 'shop'
  | 'banner' | 'review' | 'moderation' | 'welcome';

export interface Note {
  id: string;
  type: NoteType;
  /** i18n key and values, translated when shown so a language switch applies. */
  key: string;
  vars?: Record<string, string | number>;
  link?: Route;
  date: number;
  read: boolean;
}

export type RadiusStep = number; // index into RADIUS_STEPS

export interface SearchCriteria {
  q: string;
  cat: CategoryId | 'all';
  sub: string | 'all';
  town: string; // town name or '__gps__'
  gps?: { lat: number; lng: number };
  radius: RadiusStep;
  min?: number;
  max?: number;
}

export interface SavedSearch {
  id: string;
  label: string;
  criteria: SearchCriteria;
  date: number;
}

export interface Banner {
  id: string;
  business: string;
  text: string;
  category: CategoryId | 'all';
  town: string;
  country: CountryCode;
  end: number;
  own: boolean;
}

export type ReportReason = 'scam' | 'prohibited' | 'wrong' | 'other';

export interface Report {
  id: string;
  listingId: string;
  reason: ReportReason;
  date: number;
  decision?: 'removed' | 'kept';
}

export interface AppState {
  version: 2;
  user: User | null;
  sellers: Record<string, Seller>;
  listings: Listing[];
  wanted: Wanted[];
  chats: Chat[];
  orders: Order[];
  reviews: Review[];
  notes: Note[];
  saved: SavedSearch[];
  favs: string[];
  banners: Banner[];
  reports: Report[];
  draftCriteria: SearchCriteria;
}

// ---------- navigation ----------
export type Tab = 'home' | 'search' | 'sell' | 'messages' | 'profile';

export type Route =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'sell'; editId?: string }
  | { name: 'messages' }
  | { name: 'profile' }
  | { name: 'listing'; id: string }
  | { name: 'chat'; id: string; draft?: string }
  | { name: 'wanted' }
  | { name: 'seller'; id: string }
  | { name: 'order'; id: string }
  | { name: 'notifications' }
  | { name: 'moderation' };

export type SheetKind =
  | { kind: 'pay'; listingId: string }
  | { kind: 'rate'; listingId: string; orderId?: string }
  | { kind: 'report'; listingId: string }
  | { kind: 'boost'; listingId: string }
  | { kind: 'verify' }
  | { kind: 'shop' }
  | { kind: 'banner' };
