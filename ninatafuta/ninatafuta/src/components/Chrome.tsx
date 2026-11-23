import { useEffect, useState } from 'react';
import type { CategoryId, Tab } from '../types';
import { useStore } from '../store/store';
import { COUNTRIES } from '../data/countries';
import { bannerFor } from '../lib/search';

export function Header() {
  const { state, go, tab } = useStore();
  const u = state.user!;
  const unread = state.notes.filter((n) => !n.read).length;
  return (
    <header className="topbar">
      <button type="button" className="wordmark" onClick={() => tab('home')}>Ninatafuta</button>
      <div className="topbar-right">
        <button type="button" className="loc-chip" onClick={() => tab('profile')}>
          <span aria-hidden>{COUNTRIES[u.country].flag}</span> {u.town}
        </button>
        <button type="button" className="bell" onClick={() => go({ name: 'notifications' })} aria-label="Notifications">
          🔔{unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </div>
      <div className="stripe" aria-hidden />
    </header>
  );
}

const TABS: Tab[] = ['home', 'search', 'sell', 'messages', 'profile'];

export function BottomNav() {
  const { route, tab, t, state } = useStore();
  const unread = state.chats.reduce((a, c) => a + c.unread, 0);
  const active: Tab | null = TABS.includes(route.name as Tab)
    ? (route.name as Tab) : null;
  return (
    <nav className="bottomnav" aria-label="Main">
      {TABS.map((id) => (
        <button key={id} type="button" className={`nav-item${active === id ? ' is-active' : ''}`}
          onClick={() => tab(id)} aria-current={active === id ? 'page' : undefined}>
          <span className="nav-icon" aria-hidden>
            {id === 'sell' ? <span className="sell-fab">+</span> : <NavIcon id={id} />}
            {id === 'messages' && unread > 0 && <span className="dot">{unread}</span>}
          </span>
          <span className="nav-label">{t(`tab.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}

function NavIcon({ id }: { id: Tab }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'home': return <svg {...common}><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
    case 'messages': return <svg {...common}><path d="M4 5h16v11H9l-5 4z" /></svg>;
    case 'profile': return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
    default: return null;
  }
}

export function BannerSlot({ town, category = 'all' }: { town: string; category?: CategoryId | 'all' }) {
  const { state, t, openSheet } = useStore();
  const b = bannerFor(state, town, category);
  if (!b) {
    return (
      <button type="button" className="banner banner-empty" onClick={() => openSheet({ kind: 'banner' })}>
        <strong>📣 {t('home.bookBanner')}</strong>
        <span>{t('home.bookBannerSub')}</span>
      </button>
    );
  }
  return (
    <div className="banner">
      <span className="banner-label">📣 {t('common.sponsored')}</span>
      <strong>{b.business}</strong>
      <span>{b.text}</span>
    </div>
  );
}

export function OfflineBar() {
  const { t, say } = useStore();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => { setOnline(true); say(t('common.online')); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [say, t]);
  if (online) return null;
  return <div className="offline" role="status">📶 {t('common.offline')}</div>;
}
