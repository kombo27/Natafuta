import { useRef, useState } from 'react';
import type { CategoryId } from '../types';
import { useStore, type ListingDraft } from '../store/store';
import { CAT, CATEGORIES } from '../data/categories';
import { COUNTRIES } from '../data/countries';
import { makePhoto } from '../lib/image';
import { BackLink, Btn, Chip, Field } from '../components/ui';
import type { TKey } from '../i18n';

const MAX_PHOTOS = 4;

export function Sell({ editId }: { editId?: string }) {
  const { state, lang, t, actions, say, canGoBack } = useStore();
  const u = state.user!;
  const country = COUNTRIES[u.country];
  const editing = editId ? state.listings.find((l) => l.id === editId && l.own) : undefined;
  const [d, setD] = useState<ListingDraft>(() => editing
    ? { category: editing.category, sub: editing.sub ?? null, title: editing.title, price: editing.price ? String(editing.price) : '',
        town: editing.town, area: editing.area, description: editing.description, photos: editing.photos }
    : { category: null, sub: null, title: '', price: '', town: u.town, area: u.area, description: '', photos: [] });
  const [missing, setMissing] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ListingDraft>) => { setD((x) => ({ ...x, ...patch })); setMissing([]); };
  const isFree = d.category === 'free';
  const cat = d.category ? CAT[d.category] : null;

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - d.photos.length;
    if (files.length > room) say(t('sell.maxPhotos'));
    const picked = Array.from(files).slice(0, room);
    try {
      const photos = await Promise.all(picked.map(makePhoto));
      setD((x) => ({ ...x, photos: [...x.photos, ...photos].slice(0, MAX_PHOTOS) }));
    } catch {
      say(t('sell.photoErr'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const post = () => {
    const miss: TKey[] = [];
    if (!d.category) miss.push('sell.f.category');
    if (d.category && !isFree && cat!.subs.length && !d.sub) miss.push('sell.f.type');
    if (!d.title.trim()) miss.push('sell.f.title');
    if (!isFree && !(Number(d.price) > 0)) miss.push('sell.f.price');
    if (miss.length) {
      setMissing(miss);
      say(t('sell.missing', { fields: miss.map((k) => t(k)).join(', ') }));
      return;
    }
    actions.postListing(d, editing?.id);
  };

  const err = (k: TKey) => missing.includes(k);

  return (
    <div className="screen">
      {canGoBack && <BackLink />}
      <h1 className="page-title">{editing ? t('sell.editTitle') : t('sell.title')}</h1>
      <p className="muted">{t('sell.sub')}</p>

      <span className="field-label">{t('sell.photos')}</span>
      <div className="photo-picker">
        {d.photos.map((p, i) => (
          <span key={i} className="photo-slot">
            <img src={p.preview} alt="" />
            <button type="button" aria-label="Remove photo" onClick={() => set({ photos: d.photos.filter((_, j) => j !== i) })}>×</button>
          </span>
        ))}
        {d.photos.length < MAX_PHOTOS && (
          <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>+<br />{t('sell.addPhoto')}</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
      </div>

      <span className={`field-label${err('sell.f.category') ? ' is-error-text' : ''}`}>{t('sell.category')}</span>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className={`cat-tile${d.category === c.id ? ' is-selected' : ''}`}
            onClick={() => set({ category: c.id as CategoryId, sub: null })} aria-pressed={d.category === c.id}>
            <span className="cat-emoji" aria-hidden>{c.emoji}</span><span>{c.name[lang]}</span>
          </button>
        ))}
      </div>

      {cat && cat.subs.length > 0 && (
        <>
          <span className={`field-label${err('sell.f.type') ? ' is-error-text' : ''}`}>{t('sell.type')}</span>
          <div className="chip-wrap">
            {cat.subs.map((s) => <Chip key={s.id} active={d.sub === s.id} onClick={() => set({ sub: s.id })}>{s.name[lang]}</Chip>)}
          </div>
        </>
      )}

      <Field label={t('sell.titleLabel')} hint={`${d.title.length}/70`}>
        <input maxLength={70} value={d.title} placeholder={t('sell.titlePh')} className={err('sell.f.title') ? 'is-error' : ''}
          onChange={(e) => set({ title: e.target.value })} />
      </Field>

      {!isFree && (
        <Field label={t('sell.price', { cur: country.currency })}>
          <input inputMode="numeric" value={d.price} className={err('sell.f.price') ? 'is-error' : ''}
            onChange={(e) => set({ price: e.target.value.replace(/\D/g, '') })} />
        </Field>
      )}

      <span className="field-label">📍 {t('sell.location')}</span>
      <div className="split">
        <select value={d.town} onChange={(e) => set({ town: e.target.value })} aria-label={t('sell.location')}>
          {country.towns.map((tw) => <option key={tw.name}>{tw.name}</option>)}
        </select>
        <input value={d.area} placeholder={t('sell.areaPh')} onChange={(e) => set({ area: e.target.value })} aria-label={t('sell.areaPh')} />
      </div>

      <Field label={t('sell.details')}>
        <textarea rows={3} maxLength={1000} value={d.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>

      <Btn block onClick={post}>{editing ? t('sell.saveChanges') : t('sell.post')}</Btn>
    </div>
  );
}
