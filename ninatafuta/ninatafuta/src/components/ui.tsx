import { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Listing, Seller } from '../types';
import { useStore, rating, sellerInfo } from '../store/store';
import { CAT } from '../data/categories';
import { COUNTRIES } from '../data/countries';
import { money, timeAgo, km } from '../lib/format';
import { isBoosted } from '../lib/search';

type BtnVariant = 'primary' | 'accent' | 'soft' | 'ghost' | 'danger';

export function Btn({ variant = 'primary', block, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean }) {
  return <button type="button" className={`btn btn-${variant}${block ? ' btn-block' : ''} ${className}`} {...rest} />;
}

export function BackLink() {
  const { back, t } = useStore();
  return <button type="button" className="back" onClick={back}>‹ {t('common.back')}</button>;
}

export function Chip({ active, dim, count, children, onClick }:
  { active?: boolean; dim?: boolean; count?: number; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={`chip${active ? ' is-active' : ''}${dim ? ' is-dim' : ''}`} onClick={onClick} aria-pressed={active}>
      {children}
      {count != null && <span className="chip-count">{count}</span>}
    </button>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden />
    </label>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Option({ selected, onClick, children, right }:
  { selected: boolean; onClick: () => void; children: ReactNode; right?: ReactNode }) {
  return (
    <button type="button" className={`option${selected ? ' is-selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <span>{children}</span>
      {right && <strong>{right}</strong>}
    </button>
  );
}

/** Bottom sheet: closes with Cancel, a tap outside or Escape. */
export function Sheet({ title, children, onClose }: { title: ReactNode; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const full = Math.round(value);
  return <span className={`stars stars-${size}`} aria-label={`${value.toFixed(1)} / 5`}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export function Badges({ seller }: { seller: Seller }) {
  const { t } = useStore();
  return (
    <span className="badges">
      {seller.phoneVerified && <span className="badge">✓ {t('badge.phone')}</span>}
      {seller.idVerified && <span className="badge">🪪 {t('badge.id')}</span>}
      {seller.shop && <span className="badge badge-shop">🏪 {t('badge.shop')}</span>}
    </span>
  );
}

export function Thumb({ listing, large }: { listing: Listing; large?: boolean }) {
  const { state, t } = useStore();
  const [loaded, setLoaded] = useState(false);
  const saver = state.user?.prefs.dataSaver ?? false;
  const photo = listing.photos[0];
  if (photo && (!saver || loaded)) {
    return <img className={large ? 'photo-large' : 'thumb'} src={large && loaded ? photo.full : photo.preview} alt=""
      onClick={large ? () => setLoaded(true) : undefined} />;
  }
  if (photo && saver) {
    return (
      <button type="button" className={large ? 'photo-large photo-placeholder' : 'thumb'} style={{ background: listing.tint }}
        onClick={(e) => { e.stopPropagation(); setLoaded(true); }}>
        {large ? t('ad.tapPhoto') : '🖼️'}
      </button>
    );
  }
  return <div className={large ? 'photo-large' : 'thumb'} style={{ background: listing.tint }} aria-hidden><span>{listing.emoji}</span></div>;
}

export function Price({ listing }: { listing: Listing }) {
  const { t } = useStore();
  if (listing.category === 'free' || listing.price === 0) return <span className="tag tag-free">{t('common.free')}</span>;
  return <strong className="price">{money(listing.price, listing.currency)}</strong>;
}

export function ListingRow({ listing, distance }: { listing: Listing; distance?: number }) {
  const { state, go, lang, t } = useStore();
  const user = state.user;
  const foreign = user && listing.country !== user.country;
  const seller = sellerInfo(state, listing.sellerId);
  return (
    <button type="button" className="row" onClick={() => go({ name: 'listing', id: listing.id })}>
      <Thumb listing={listing} />
      <span className="row-body">
        <span className="row-title">{listing.title}</span>
        <Price listing={listing} />
        <span className="row-meta">
          {[listing.area, listing.town].filter(Boolean).join(', ')}
          {foreign && <> {COUNTRIES[listing.country].flag}</>}
        </span>
        <span className="row-meta">
          {distance != null ? `${km(distance)} · ` : ''}{timeAgo(listing.date, lang)}
          {isBoosted(listing) && <span className="tag tag-featured">{t('common.featured')}</span>}
          {seller.shop && <span className="tag">🏪 {t('common.shop')}</span>}
          {listing.sold && <span className="tag">{t('common.sold')}</span>}
          {listing.removed && <span className="tag tag-danger">{t('common.removed')}</span>}
        </span>
      </span>
    </button>
  );
}

export function SellerCard({ sellerId }: { sellerId: string }) {
  const { state, go, t } = useStore();
  const s = sellerInfo(state, sellerId);
  const r = rating(state, sellerId);
  return (
    <button type="button" className="card seller-card" onClick={() => go({ name: 'seller', id: sellerId })}>
      <span className="avatar">{s.name.charAt(0).toUpperCase()}</span>
      <span className="seller-body">
        <strong>{s.name}</strong>
        <span className="row-meta">
          {r.count ? <><span className="star">★</span> {r.avg.toFixed(1)} ({t('common.reviews', { n: r.count })})</> : t('common.noReviews')}
        </span>
        <Badges seller={s} />
      </span>
      <span aria-hidden>›</span>
    </button>
  );
}

export function CategoryName({ id }: { id: Listing['category'] }) {
  const { lang } = useStore();
  return <>{CAT[id].name[lang]}</>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
