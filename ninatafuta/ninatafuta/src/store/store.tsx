import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState, Banner, CategoryId, Chat, CountryCode, DeliveryType, IdDocType, Lang, Listing, Note, NoteType,
  Order, OrderStep, Photo, ReportReason, Route, SearchCriteria, Seller, SheetKind, Shop, Tab,
} from '../types';
import { createSeed } from '../data/seed';
import { COUNTRIES, findTown } from '../data/countries';
import { CAT } from '../data/categories';

import { translate, type T, type TKey } from '../i18n';
import { uid } from '../lib/id';
import { distanceKm, jitter } from '../lib/geo';
import { centerOf, defaultCriteria, matches } from '../lib/search';
import { quote } from '../lib/pricing';
import { money } from '../lib/format';

// ---------------------------------------------------------------- persistence
// The prototype keeps all data on the device. Swap this adapter for API calls in production.
const STORAGE_KEY = 'ninatafuta:v2';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 2) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt – fall back to seed */
  }
  return createSeed();
}

function save(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or private mode – keep running in memory */
  }
}

// ---------------------------------------------------------------- helpers
export const ME = 'me';
const DAY = 86_400_000;

export function sellerInfo(state: AppState, id: string): Seller {
  if (id === ME && state.user) {
    const u = state.user;
    return {
      id: ME,
      name: u.shop?.name || u.name || translate(u.lang, 'common.you'),
      memberSince: u.memberSince,
      phoneVerified: true,
      idVerified: u.idStatus === 'verified',
      shop: u.shop ? { name: u.shop.name, description: u.shop.description, hours: u.shop.hours } : undefined,
    };
  }
  return state.sellers[id] ?? { id, name: '?', memberSince: Date.now(), phoneVerified: true, idVerified: false };
}

export function rating(state: AppState, sellerId: string): { avg: number; count: number } {
  const s = state.sellers[sellerId];
  const own = state.reviews.filter((r) => r.sellerId === sellerId);
  const seedCount = s?.seedStats?.count ?? 0;
  const seedSum = (s?.seedStats?.avg ?? 0) * seedCount;
  const count = seedCount + own.length;
  if (!count) return { avg: 0, count: 0 };
  return { avg: (seedSum + own.reduce((a, r) => a + r.stars, 0)) / count, count };
}

export function canPayFor(l: Listing): boolean {
  return !l.own && !l.sold && !l.removed && l.price > 0 && !['jobs', 'services', 'property', 'free'].includes(l.category);
}

export function canRate(state: AppState, listingId: string): boolean {
  const l = state.listings.find((x) => x.id === listingId);
  if (!l || l.own) return false;
  if (state.reviews.some((r) => r.listingId === listingId && r.mine)) return false;
  const chatted = state.chats.some((c) => c.ref.kind === 'listing' && c.ref.id === listingId && c.messages.some((m) => m.from === 'me'));
  const ordered = state.orders.some((o) => o.listingId === listingId && last(o).step === 'received');
  return chatted || ordered;
}

export const last = (o: Order) => o.history[o.history.length - 1];

function note(s: AppState, type: NoteType, key: TKey, vars?: Note['vars'], link?: Route): void {
  s.notes.unshift({ id: uid('n'), type, key, vars, link, date: Date.now(), read: false });
}

export interface ListingDraft {
  category: CategoryId | null;
  sub: string | null;
  title: string;
  price: string;
  town: string;
  area: string;
  description: string;
  photos: Photo[];
}

// ---------------------------------------------------------------- context
interface Toast { id: number; text: string }

export interface Store {
  state: AppState;
  lang: Lang;
  t: T;
  route: Route;
  canGoBack: boolean;
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  tab: (t: Tab) => void;
  sheet: SheetKind | null;
  openSheet: (s: SheetKind) => void;
  closeSheet: () => void;
  toast: Toast | null;
  say: (text: string) => void;
  actions: ReturnType<typeof makeActions>;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

type Mutate = (recipe: (draft: AppState) => void) => void;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number>();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => save(state), [state]);

  const mutate: Mutate = useCallback((recipe) => {
    setState((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      return next;
    });
  }, []);

  const lang: Lang = state.user?.lang ?? 'en';
  const t: T = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const say = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const go = useCallback((r: Route) => { setStack((s) => [...s, r]); window.scrollTo(0, 0); }, []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const tab = useCallback((name: Tab) => { setStack([{ name } as Route]); window.scrollTo(0, 0); }, []);

  const actions = useMemo(
    () => makeActions({ mutate, get: () => stateRef.current, say, go, replace, back, tab, setSheet, setStack }),
    [mutate, say, go, replace, back, tab],
  );

  const store: Store = {
    state, lang, t, route: stack[stack.length - 1], canGoBack: stack.length > 1,
    go, replace, back, tab, sheet, openSheet: setSheet, closeSheet: () => setSheet(null), toast, say, actions,
  };
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// ---------------------------------------------------------------- actions
interface Deps {
  mutate: Mutate;
  get: () => AppState;
  say: (text: string) => void;
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  tab: (t: Tab) => void;
  setSheet: (s: SheetKind | null) => void;
  setStack: (s: Route[]) => void;
}

function makeActions({ mutate, get, say, go, replace, back, tab, setSheet, setStack }: Deps) {
  const tr = (key: TKey, vars?: Note['vars']) => translate(get().user?.lang ?? 'en', key, vars);
  const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms);

  const user = () => {
    const u = get().user;
    if (!u) throw new Error('not registered');
    return u;
  };

  function findOrCreateChat(ref: Chat['ref'], partnerId: string, partnerName: string, subject: string): string {
    const existing = get().chats.find((c) => c.ref.kind === ref.kind && c.ref.id === ref.id && c.partnerId === partnerId);
    if (existing) return existing.id;
    const id = uid('c');
    mutate((s) => {
      s.chats.unshift({ id, ref, partnerId, partnerName, subject, messages: [], unread: 0, autoReplied: false });
    });
    return id;
  }

  function advanceOrder(orderId: string, step: OrderStep, key: TKey, delay: number) {
    later(delay, () => {
      mutate((s) => {
        const o = s.orders.find((x) => x.id === orderId);
        if (!o || ['received', 'dispute'].includes(last(o).step)) return;
        o.history.push({ step, at: Date.now() });
        note(s, 'order', key, { title: o.title, partner: o.partner ?? '' }, { name: 'order', id: o.id });
      });
    });
  }

  return {
    // ---------- account
    register(lang: Lang, country: CountryCode, phone: string) {
      const c = COUNTRIES[country];
      mutate((s) => {
        s.user = {
          id: uid('u'), lang, country, phone, town: c.towns[0].name, area: '', name: '',
          prefs: { push: true, sms: true, dataSaver: false }, idStatus: 'none', memberSince: Date.now(),
        };
        s.draftCriteria = defaultCriteria(c.towns[0].name);
        note(s, 'welcome', 'note.welcome', undefined, { name: 'profile' });
      });
      setStack([{ name: 'home' }]);
    },
    setLang(lang: Lang) {
      mutate((s) => { if (s.user) s.user.lang = lang; });
    },
    saveSettings(p: { name: string; country: CountryCode; town: string; area: string }) {
      mutate((s) => {
        if (!s.user) return;
        const countryChanged = s.user.country !== p.country;
        s.user.name = p.name.trim().slice(0, 40);
        s.user.country = p.country;
        s.user.town = countryChanged ? COUNTRIES[p.country].towns[0].name : p.town;
        s.user.area = countryChanged ? '' : p.area.trim();
        if (countryChanged) s.draftCriteria = defaultCriteria(s.user.town);
      });
      say(tr('profile.savedSettings'));
    },
    setPref(key: 'push' | 'sms' | 'dataSaver', value: boolean) {
      mutate((s) => { if (s.user) s.user.prefs[key] = value; });
    },
    logout() {
      mutate((s) => { s.user = null; });
    },
    reset() {
      const u = get().user;
      const fresh = createSeed();
      mutate((s) => {
        Object.assign(s, fresh);
        s.user = u ? { ...u, idStatus: 'none', idType: undefined, idLast3: undefined, shop: undefined } : null;
        if (u) s.draftCriteria = defaultCriteria(u.town);
      });
      tab('home');
    },

    // ---------- search
    setCriteria(patch: Partial<SearchCriteria>) {
      mutate((s) => { s.draftCriteria = { ...s.draftCriteria, ...patch }; });
    },
    saveSearch(label: string) {
      const criteria = structuredClone(get().draftCriteria);
      const id = uid('ss');
      mutate((s) => { s.saved.unshift({ id, label, criteria, date: Date.now() }); });
      say(tr('search.saved'));
      // simulate a new matching ad after ~7 s
      later(7000, () => {
        const st = get();
        if (!st.saved.some((x) => x.id === id) || !st.user) return;
        const center = centerOf(criteria, COUNTRIES[st.user.country]);
        const pool = st.listings.filter((l) => !l.own && matches(l, criteria, center));
        const base = pool[Math.floor(Math.random() * pool.length)];
        const cat: CategoryId = base?.category ?? (criteria.cat === 'all' ? 'electronics' : criteria.cat);
        const town = base?.town ?? center.country.towns[0].name;
        const pos = base ?? jitter(center, 4);
        const price = base ? Math.round((base.price * 0.95) / 100) * 100 : criteria.max ?? criteria.min ?? 0;
        const listing: Listing = {
          id: uid('l'), country: base?.country ?? center.country.code, category: cat, sub: base?.sub,
          title: base ? base.title : criteria.q || CAT[cat].name.en, price, currency: base?.currency ?? center.country.currency,
          town, area: base?.area ?? '', lat: pos.lat + 0.004, lng: pos.lng - 0.003, sellerId: 's_peter',
          photos: [], emoji: base?.emoji ?? CAT[cat].emoji, tint: CAT[cat].tint,
          description: base?.description ?? '', date: Date.now(), own: false, demo: true, sold: false, removed: false,
        };
        mutate((s) => {
          s.listings.unshift(listing);
          note(s, 'saved_search', 'note.saved_search', { title: listing.title }, { name: 'listing', id: listing.id });
        });
      });
    },
    applySaved(id: string) {
      const ss = get().saved.find((x) => x.id === id);
      if (!ss) return;
      mutate((s) => { s.draftCriteria = structuredClone(ss.criteria); });
      tab('search');
    },
    deleteSaved(id: string) {
      mutate((s) => { s.saved = s.saved.filter((x) => x.id !== id); });
    },

    // ---------- listings
    postListing(d: ListingDraft, editId?: string): string | null {
      const u = user();
      const country = COUNTRIES[u.country];
      const hit = findTown(d.town)?.town ?? country.towns[0];
      const pos = jitter(hit, 4);
      const isFree = d.category === 'free';
      const listingId = editId ?? uid('l');
      mutate((s) => {
        const prev = s.listings.find((l) => l.id === editId);
        const l: Listing = {
          id: listingId,
          country: u.country,
          category: d.category as CategoryId,
          sub: isFree ? undefined : d.sub ?? undefined,
          title: d.title.trim().slice(0, 70),
          price: isFree ? 0 : Number(d.price),
          currency: country.currency,
          town: hit.name,
          area: d.area.trim(),
          lat: prev && prev.town === hit.name ? prev.lat : pos.lat,
          lng: prev && prev.town === hit.name ? prev.lng : pos.lng,
          sellerId: ME,
          photos: d.photos,
          emoji: CAT[d.category as CategoryId].emoji,
          tint: CAT[d.category as CategoryId].tint,
          description: d.description.trim(),
          date: prev?.date ?? Date.now(),
          own: true, demo: false, sold: prev?.sold ?? false, removed: prev?.removed ?? false,
          boostEnd: prev?.boostEnd, boostKind: prev?.boostKind,
          phone: `${country.dial}${u.phone}`,
        };
        if (prev) Object.assign(prev, l);
        else s.listings.unshift(l);
      });
      say(tr(editId ? 'sell.updated' : 'sell.posted'));
      tab('home');
      go({ name: 'listing', id: listingId });
      return listingId;
    },
    markSold(id: string) {
      mutate((s) => {
        const l = s.listings.find((x) => x.id === id);
        if (l) l.sold = true;
      });
      say(tr('ad.markedSold'));
      // simulated buyer review after ~5 s
      later(5000, () => {
        mutate((s) => {
          const l = s.listings.find((x) => x.id === id);
          if (!l || s.reviews.some((r) => r.listingId === id && r.sellerId === ME)) return;
          s.reviews.unshift({
            id: uid('r'), sellerId: ME, listingId: id, stars: 5, tags: ['as_described', 'friendly'],
            comment: 'Smooth deal, thank you!', author: 'Juma', date: Date.now(),
          });
          note(s, 'review', 'note.review', { stars: '★★★★★' }, { name: 'seller', id: ME });
        });
      });
    },
    deleteListing(id: string) {
      mutate((s) => {
        s.listings = s.listings.filter((l) => l.id !== id);
        s.chats = s.chats.filter((c) => !(c.ref.kind === 'listing' && c.ref.id === id));
        s.favs = s.favs.filter((f) => f !== id);
      });
      say(tr('ad.deleted'));
      back();
    },
    toggleFav(id: string) {
      mutate((s) => {
        s.favs = s.favs.includes(id) ? s.favs.filter((f) => f !== id) : [id, ...s.favs];
      });
    },
    boost(id: string, kind: 'search' | 'home') {
      mutate((s) => {
        const l = s.listings.find((x) => x.id === id);
        if (!l) return;
        l.boostKind = kind;
        l.boostEnd = Date.now() + (kind === 'search' ? 3 : 7) * DAY;
      });
      setSheet(null);
      say(tr('boost.done'));
    },

    // ---------- requests
    postWanted(text: string, budget: number | undefined, town: string, area: string) {
      const u = user();
      const id = uid('w');
      mutate((s) => {
        s.wanted.unshift({
          id, country: u.country, text: text.trim().slice(0, 200), budget, currency: COUNTRIES[u.country].currency,
          town, area: area.trim(), requester: u.name || translate(u.lang, 'common.you'), own: true, date: Date.now(),
        });
      });
      say(tr('wanted.posted'));
      tab('home');
      // simulated seller reply after ~6 s
      later(6000, () => {
        const w = get().wanted.find((x) => x.id === id);
        if (!w) return;
        mutate((s) => {
          const chatId = uid('c');
          s.chats.unshift({
            id: chatId, ref: { kind: 'wanted', id }, partnerId: 's_peter', partnerName: 'Peter', subject: w.text,
            messages: [{ from: 'them', text: translate(s.user?.lang ?? 'en', 'home.haveThisMsg', { text: w.text }), at: Date.now() }],
            unread: 1, autoReplied: true,
          });
          note(s, 'wanted_reply', 'note.wanted_reply', { name: 'Peter' }, { name: 'chat', id: chatId });
        });
      });
    },
    deleteWanted(id: string) {
      mutate((s) => { s.wanted = s.wanted.filter((w) => w.id !== id); });
    },
    haveThis(wantedId: string) {
      const w = get().wanted.find((x) => x.id === wantedId);
      if (!w) return;
      const chatId = findOrCreateChat({ kind: 'wanted', id: w.id }, `req_${w.id}`, w.requester, w.text);
      go({ name: 'chat', id: chatId, draft: tr('home.haveThisMsg', { text: w.text }) });
    },

    // ---------- chat
    openChatFor(listingId: string) {
      const st = get();
      const l = st.listings.find((x) => x.id === listingId);
      if (!l) return;
      const seller = sellerInfo(st, l.sellerId);
      const chatId = findOrCreateChat({ kind: 'listing', id: l.id }, l.sellerId, seller.name, l.title);
      go({ name: 'chat', id: chatId });
    },
    sendMsg(chatId: string, text: string) {
      const body = text.trim();
      if (!body) return;
      mutate((s) => {
        const c = s.chats.find((x) => x.id === chatId);
        if (!c) return;
        c.messages.push({ from: 'me', text: body, at: Date.now() });
        s.chats = [c, ...s.chats.filter((x) => x.id !== chatId)];
      });
      const c = get().chats.find((x) => x.id === chatId);
      if (!c || c.autoReplied) return;
      // sellers answer once automatically
      later(2200, () => {
        mutate((s) => {
          const chat = s.chats.find((x) => x.id === chatId);
          if (!chat || chat.autoReplied) return;
          const seller = s.sellers[chat.partnerId];
          const lang = s.user?.lang ?? 'en';
          const reply = seller?.autoReply ?? (lang === 'sw' ? 'Habari! Ndiyo, bado inapatikana.' : 'Hello! Yes, it is still available.');
          chat.messages.push({ from: 'them', text: reply, at: Date.now() });
          chat.autoReplied = true;
          chat.unread += 1;
          note(s, 'message', 'note.message', { name: chat.partnerName }, { name: 'chat', id: chat.id });
        });
      });
    },
    readChat(chatId: string) {
      mutate((s) => {
        const c = s.chats.find((x) => x.id === chatId);
        if (c && c.unread) c.unread = 0;
      });
    },

    // ---------- trust
    rate(listingId: string, stars: number, tags: string[], comment: string, orderId?: string) {
      const st = get();
      const l = st.listings.find((x) => x.id === listingId);
      if (!l || !st.user) return;
      mutate((s) => {
        s.reviews.unshift({
          id: uid('r'), sellerId: l.sellerId, listingId, stars, tags, comment: comment.trim().slice(0, 300),
          author: s.user?.name || translate(s.user?.lang ?? 'en', 'common.you'), mine: true, date: Date.now(),
        });
        const o = s.orders.find((x) => x.id === orderId);
        if (o) o.rated = true;
      });
      setSheet(null);
      say(tr('rate.thanks'));
    },
    submitId(type: IdDocType, number: string) {
      const last3 = number.replace(/\s+/g, '').slice(-3).toUpperCase();
      mutate((s) => {
        if (!s.user) return;
        s.user.idStatus = 'review';
        s.user.idType = type;
        s.user.idLast3 = last3; // the full number is never stored
      });
      setSheet(null);
      say(tr('verify.sent'));
      later(5000, () => {
        mutate((s) => {
          if (!s.user || s.user.idStatus !== 'review') return;
          s.user.idStatus = 'verified';
          note(s, 'id', 'note.id', undefined, { name: 'profile' });
        });
      });
    },
    report(listingId: string, reason: ReportReason) {
      mutate((s) => { s.reports.push({ id: uid('rp'), listingId, reason, date: Date.now() }); });
      setSheet(null);
      say(tr('report.sent'));
    },
    moderate(listingId: string, decision: 'removed' | 'kept') {
      mutate((s) => {
        const l = s.listings.find((x) => x.id === listingId);
        if (!l) return;
        s.reports.filter((r) => r.listingId === listingId && !r.decision).forEach((r) => { r.decision = decision; });
        if (decision === 'removed') {
          l.removed = true;
          if (l.own) note(s, 'moderation', 'note.mod_owner', { title: l.title }, { name: 'profile' });
        }
        note(s, 'moderation', decision === 'removed' ? 'note.mod_removed' : 'note.mod_kept', { title: l.title }, { name: 'moderation' });
      });
    },

    // ---------- revenue
    openShop(shop: Omit<Shop, 'activeUntil'>) {
      const existing = get().user?.shop;
      mutate((s) => {
        if (!s.user) return;
        s.user.shop = { ...shop, activeUntil: existing?.activeUntil ?? Date.now() + 30 * DAY };
        if (!existing) note(s, 'shop', 'note.shop', undefined, { name: 'seller', id: ME });
      });
      setSheet(null);
    },
    closeShop() {
      mutate((s) => { if (s.user) s.user.shop = undefined; });
      say(tr('profile.shopClosed'));
    },
    bookBanner(b: Omit<Banner, 'id' | 'end' | 'own' | 'country'>, days: 7 | 30) {
      const u = user();
      mutate((s) => {
        s.banners.unshift({ ...b, id: uid('b'), country: findTown(b.town)?.country.code ?? u.country, end: Date.now() + days * DAY, own: true });
        note(s, 'banner', 'note.banner', undefined, { name: 'home' });
      });
      setSheet(null);
      say(tr('banner.done'));
    },

    // ---------- Ninatafuta Pay
    pay(p: { listingId: string; delivery: DeliveryType; partner?: string; address: string; method: string }) {
      const st = get();
      const l = st.listings.find((x) => x.id === p.listingId);
      const u = st.user;
      if (!l || !u) return;
      const buyerTown = findTown(u.town)?.town ?? COUNTRIES[u.country].towns[0];
      const dist = distanceKm(buyerTown, l);
      const q = quote(l.price, l.currency, p.delivery, dist);
      const order: Order = {
        id: uid('o'), listingId: l.id, sellerId: l.sellerId, title: l.title, price: l.price, currency: l.currency,
        delivery: p.delivery, partner: p.delivery === 'boda' ? p.partner : p.delivery === 'bus' ? 'Bus parcel' : undefined,
        deliveryFee: q.deliveryFee, payFee: q.payFee, total: q.total, method: p.method,
        address: p.delivery === 'pickup' ? '' : p.address.trim(), history: [{ step: 'paid', at: Date.now() }], rated: false,
      };
      mutate((s) => {
        s.orders.unshift(order);
        note(s, 'order', 'note.order_paid', { title: l.title }, { name: 'order', id: order.id });
      });
      setSheet(null);
      say(tr('pay.done'));
      go({ name: 'order', id: order.id });
      if (p.delivery === 'pickup') {
        advanceOrder(order.id, 'ready', 'note.order_ready', 3500);
      } else {
        advanceOrder(order.id, 'assigned', 'note.order_assigned', 3000);
        advanceOrder(order.id, 'onway', 'note.order_onway', 6500);
      }
    },
    confirmOrder(orderId: string) {
      const o = get().orders.find((x) => x.id === orderId);
      if (!o) return;
      mutate((s) => {
        const ord = s.orders.find((x) => x.id === orderId);
        if (!ord) return;
        ord.history.push({ step: 'received', at: Date.now() });
        const l = s.listings.find((x) => x.id === ord.listingId);
        if (l) l.sold = true;
        note(s, 'order', 'note.order_received', { title: ord.title }, { name: 'order', id: ord.id });
      });
      // one review per ad: only ask if the buyer has not rated this ad yet
      if (!get().reviews.some((r) => r.listingId === o.listingId && r.mine)) {
        setSheet({ kind: 'rate', listingId: o.listingId, orderId });
      }
    },
    disputeOrder(orderId: string) {
      mutate((s) => {
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) return;
        o.history.push({ step: 'dispute', at: Date.now() });
        note(s, 'order', 'note.order_dispute', { title: o.title }, { name: 'order', id: o.id });
      });
      say(tr('order.disputed'));
    },

    // ---------- notifications
    readAllNotes() {
      mutate((s) => { s.notes.forEach((n) => { n.read = true; }); });
    },
    openNote(link?: Route) {
      if (link) go(link);
    },

    // used by screens that need to jump without history
    replace,
  };
}

/** Text shown in the share sheet / WhatsApp. */
export function shareText(t: T, l: Listing): string {
  return t('ad.shareText', { title: l.title, price: l.price ? money(l.price, l.currency) : t('common.free'), town: l.town });
}

