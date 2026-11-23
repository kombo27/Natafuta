import { Fragment, useState } from 'react';
import { useStore } from '../store/store';
import { CATEGORIES } from '../data/categories';
import { COUNTRIES } from '../data/countries';
import { homeFeed } from '../lib/search';
import { money, timeAgo } from '../lib/format';
import { ListingRow } from '../components/ui';
import { BannerSlot } from '../components/Chrome';

export function SearchBar({ initial = '', onSubmit }: { initial?: string; onSubmit: (q: string) => void }) {
  const { t } = useStore();
  const [q, setQ] = useState(initial);
  return (
    <form className="searchbar" role="search" onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim()); }}>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPh')} aria-label={t('common.search')} />
      <button type="submit" className="btn btn-primary">{t('common.search')}</button>
    </form>
  );
}

export function Home() {
  const { state, lang, t, tab, go, actions } = useStore();
  const u = state.user!;
  const feed = homeFeed(state, u.country, u.town);
  const wanted = [...state.wanted].sort(
    (a, b) => Number(b.own) - Number(a.own) || Number(b.country === u.country) - Number(a.country === u.country) || b.date - a.date,
  );

  const searchFor = (q: string) => {
    actions.setCriteria({ q, cat: 'all', sub: 'all' });
    tab('search');
  };

  return (
    <div className="screen">
      <SearchBar onSubmit={searchFor} />

      <div className="hero-actions">
        <button type="button" className="hero hero-uza" onClick={() => tab('sell')}>
          <strong>{t('home.uza')}</strong><span>{t('home.uzaSub')}</span>
        </button>
        <button type="button" className="hero hero-nina" onClick={() => go({ name: 'wanted' })}>
          <strong>{t('home.nina')}</strong><span>{t('home.ninaSub')}</span>
        </button>
      </div>

      <h2 className="section-title">{t('home.categories')}</h2>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="cat-tile" onClick={() => { actions.setCriteria({ q: '', cat: c.id, sub: 'all' }); tab('search'); }}>
            <span className="cat-emoji" aria-hidden>{c.emoji}</span>
            <span>{c.name[lang]}</span>
          </button>
        ))}
      </div>

      {wanted.length > 0 && (
        <>
          <h2 className="section-title">{t('home.lookingFor')}</h2>
          <div className="wanted-strip">
            {wanted.map((w) => (
              <article key={w.id} className="wanted-card">
                <p className="wanted-text">“{w.text}”</p>
                <p className="row-meta">
                  {w.budget ? <>{t('home.budget', { amount: money(w.budget, w.currency) })}<br /></> : null}
                  {[w.area, w.town].filter(Boolean).join(', ')}
                  {w.country !== u.country && <> {COUNTRIES[w.country].flag}</>}, {timeAgo(w.date, lang)}
                </p>
                {!w.own && <button type="button" className="btn btn-primary btn-sm" onClick={() => actions.haveThis(w.id)}>{t('home.haveThis')}</button>}
              </article>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">{t('home.allListings', { n: feed.length })}</h2>
      <div className="list">
        {feed.map((l, i) => (
          <Fragment key={l.id}>
            <ListingRow listing={l} />
            {i === 3 && <BannerSlot town={u.town} />}
          </Fragment>
        ))}
        {feed.length <= 3 && <BannerSlot town={u.town} />}
      </div>
    </div>
  );
}
