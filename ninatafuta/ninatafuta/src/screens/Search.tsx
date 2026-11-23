import { Fragment, useState } from 'react';
import { useStore } from '../store/store';
import { CAT, CATEGORIES } from '../data/categories';
import { COUNTRIES, COUNTRY_LIST } from '../data/countries';
import {
  RADIUS_ALL, RADIUS_COUNTRY, RADIUS_STEPS, centerOf, countByCategory, countBySub, criteriaLabel, searchListings,
} from '../lib/search';
import { distanceKm, currentPosition } from '../lib/geo';
import { Btn, Chip, Empty, ListingRow } from '../components/ui';
import { BannerSlot } from '../components/Chrome';

const QUICK = [1, 3, 5, RADIUS_COUNTRY, RADIUS_ALL]; // 5 km, 25 km, 100 km, country, East Africa

export function Search() {
  const { state, lang, t, go, actions, say } = useStore();
  const u = state.user!;
  const c = state.draftCriteria;
  const center = centerOf(c, COUNTRIES[u.country]);
  const results = searchListings(state, c, center);
  const catCounts = countByCategory(state, c, center);
  const subCounts = countBySub(state, c, center);
  const [locating, setLocating] = useState(false);
  const cur = center.country.currency;
  const r = RADIUS_STEPS[c.radius];
  const crossesCurrency = (c.min != null || c.max != null) && results.some((l) => l.currency !== cur);
  const radiusText = r.kind === 'km' ? t('search.within', { km: r.km }) : r.kind === 'country' ? center.country.name[lang] : t('search.allEA');
  const quickLabel = (i: number) => {
    const s = RADIUS_STEPS[i];
    return s.kind === 'km' ? `${s.km} km` : s.kind === 'country' ? center.country.name[lang] : t('search.allEA');
  };

  const onWhere = async (value: string) => {
    if (value !== '__gps__') return actions.setCriteria({ town: value, gps: undefined });
    setLocating(true);
    try {
      const gps = await currentPosition();
      actions.setCriteria({ town: '__gps__', gps });
    } catch {
      say(t('search.locateErr'));
    } finally {
      setLocating(false);
    }
  };

  const num = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Number(v.replace(/\D/g, ''))));
  const cat = c.cat !== 'all' ? CAT[c.cat] : null;

  return (
    <div className="screen">
      <div className="searchbar">
        <input type="search" value={c.q} placeholder={t('home.searchPh')} aria-label={t('common.search')}
          onChange={(e) => actions.setCriteria({ q: e.target.value })} />
        {c.q && <button type="button" className="clear" aria-label="Clear" onClick={() => actions.setCriteria({ q: '' })}>×</button>}
      </div>

      <div className="chip-row" role="toolbar">
        <Chip active={c.cat === 'all'} count={catCounts.all} onClick={() => actions.setCriteria({ cat: 'all', sub: 'all' })}>{t('search.allCats')}</Chip>
        {CATEGORIES.map((x) => (
          <Chip key={x.id} active={c.cat === x.id} dim={!catCounts[x.id]} count={catCounts[x.id] ?? 0}
            onClick={() => actions.setCriteria({ cat: x.id, sub: 'all' })}>
            {x.emoji} {x.name[lang]}
          </Chip>
        ))}
      </div>

      {cat && cat.subs.length > 0 && (
        <div className="chip-row chip-row-sub">
          <Chip active={c.sub === 'all'} count={catCounts[cat.id] ?? 0} onClick={() => actions.setCriteria({ sub: 'all' })}>
            {t('search.allIn', { cat: cat.name[lang] })}
          </Chip>
          {cat.subs.map((s) => (
            <Chip key={s.id} active={c.sub === s.id} dim={!subCounts[s.id]} count={subCounts[s.id] ?? 0}
              onClick={() => actions.setCriteria({ sub: s.id })}>{s.name[lang]}</Chip>
          ))}
        </div>
      )}

      <section className="card where">
        <label className="field">
          <span className="field-label">📍 {t('search.where')}</span>
          <select value={c.town} onChange={(e) => onWhere(e.target.value)} disabled={locating}>
            <option value="__gps__">{locating ? t('search.locating') : `◎ ${t('search.myLocation')}`}</option>
            {COUNTRY_LIST.map((co) => (
              <optgroup key={co.code} label={`${co.flag} ${co.name[lang]}`}>
                {co.towns.map((tw) => <option key={tw.name} value={tw.name}>{tw.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="area-head">
          <span className="field-label">{t('search.area')}</span>
          <strong className="accent-text">{radiusText}</strong>
        </div>
        <input type="range" min={0} max={RADIUS_ALL} step={1} value={c.radius} aria-label={t('search.area')}
          onChange={(e) => actions.setCriteria({ radius: Number(e.target.value) })} />
        <div className="chip-wrap">
          {QUICK.map((i) => <Chip key={i} active={c.radius === i} onClick={() => actions.setCriteria({ radius: i })}>{quickLabel(i)}</Chip>)}
        </div>
        {r.kind !== 'all' && (
          <p className="muted small">{c.town === '__gps__' ? t('search.gpsNote') : t('search.centreNote', { town: c.town })}</p>
        )}
      </section>

      <div className="price-row">
        <input inputMode="numeric" placeholder={t('search.min', { cur })} value={c.min ?? ''} onChange={(e) => actions.setCriteria({ min: num(e.target.value) })} />
        <input inputMode="numeric" placeholder={t('search.max', { cur })} value={c.max ?? ''} onChange={(e) => actions.setCriteria({ max: num(e.target.value) })} />
      </div>
      {crossesCurrency && <p className="muted small">{t('search.currencyNote', { cur })}</p>}

      <div className="results-head">
        <strong>{t('search.count', { n: results.length })}</strong>
        <Btn variant="soft" className="btn-sm" onClick={() => actions.saveSearch(criteriaLabel(c, lang))}>♡ {t('search.save')}</Btn>
      </div>

      {results.length === 0 ? (
        <div className="card empty-card">
          <Empty>{t('search.empty')}</Empty>
          <Btn onClick={() => go({ name: 'wanted' })}>{t('search.postRequest')}</Btn>
        </div>
      ) : (
        <div className="list">
          {results.map((l, i) => (
            <Fragment key={l.id}>
              <ListingRow listing={l} distance={distanceKm(center, l)} />
              {i === 2 && c.town !== '__gps__' && <BannerSlot town={c.town} category={c.cat} />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
