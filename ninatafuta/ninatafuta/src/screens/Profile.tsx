import { useState } from 'react';
import type { CountryCode, Lang } from '../types';
import type { TKey } from '../i18n';
import { useStore, ME, last, sellerInfo } from '../store/store';
import { COUNTRIES, COUNTRY_LIST } from '../data/countries';
import { centerOf, searchListings } from '../lib/search';
import { dateShort, money } from '../lib/format';
import { Badges, Btn, Empty, Field, ListingRow, Toggle } from '../components/ui';

export function Profile() {
  const { state, lang, t, go, openSheet, actions } = useStore();
  const u = state.user!;
  const me = sellerInfo(state, ME);
  const country = COUNTRIES[u.country];
  const [name, setName] = useState(u.name);
  const [co, setCo] = useState<CountryCode>(u.country);
  const [town, setTown] = useState(u.town);
  const [area, setArea] = useState(u.area);
  const myAds = state.listings.filter((l) => l.own);
  const myWanted = state.wanted.filter((w) => w.own);
  const favs = state.favs.map((id) => state.listings.find((l) => l.id === id)).filter((l) => l && !l.removed);
  const pretty = `${country.dial} ${u.phone.slice(0, 3)} ${u.phone.slice(3, 6)} ${u.phone.slice(6)}`;

  return (
    <div className="screen">
      <div className="profile-head">
        <span className="avatar avatar-lg">{(u.name || 'K').charAt(0).toUpperCase()}</span>
        <div>
          <strong>{pretty}</strong>
          <Badges seller={me} />
          <button type="button" className="link" onClick={() => go({ name: 'seller', id: ME })}>{t('profile.viewPublic')} ›</button>
        </div>
      </div>

      {u.idStatus === 'none' && <Btn variant="soft" block onClick={() => openSheet({ kind: 'verify' })}>🪪 {t('profile.getId')}</Btn>}
      {u.idStatus === 'review' && <p className="card">⏳ {t('profile.idReview')}</p>}
      {u.idStatus === 'verified' && (
        <p className="card">🪪 {t('profile.idDone', { doc: t(`verify.${u.idType ?? 'national_id'}` as TKey), last3: u.idLast3 ?? '' })}</p>
      )}

      {u.shop ? (
        <div className="card">
          <strong>🏪 {u.shop.name}</strong>
          <p>{u.shop.description}</p>
          <p className="muted small">🕘 {u.shop.hours}<br />{t('profile.shopActive', { date: dateShort(u.shop.activeUntil) })}</p>
          <div className="btn-row">
            <Btn variant="soft" className="btn-sm" onClick={() => openSheet({ kind: 'shop' })}>{t('profile.editShop')}</Btn>
            <Btn variant="soft" className="btn-sm" onClick={actions.closeShop}>{t('profile.closeShop')}</Btn>
          </div>
        </div>
      ) : (
        <Btn variant="soft" block onClick={() => openSheet({ kind: 'shop' })}>🏪 {t('profile.openShop')}</Btn>
      )}

      <h2 className="section-title">{t('order.my')}</h2>
      {state.orders.length === 0 ? <Empty>{t('profile.noOrders')}</Empty> : (
        <div className="list">
          {state.orders.map((o) => (
            <button key={o.id} type="button" className="row" onClick={() => go({ name: 'order', id: o.id })}>
              <span className="thumb" style={{ background: 'var(--soft)' }}><span>🔒</span></span>
              <span className="row-body">
                <span className="row-title">{o.title}</span>
                <strong className="price">{money(o.total, o.currency)}</strong>
                <span className="row-meta">{t(`order.${last(o).step}` as TKey, { partner: o.partner ?? '' })}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <h2 className="section-title">♥ {t('profile.savedAds')}</h2>
      {favs.length === 0 ? <Empty>{t('profile.noSaved')}</Empty> : <div className="list">{favs.map((l) => <ListingRow key={l!.id} listing={l!} />)}</div>}

      <h2 className="section-title">{t('profile.settings')}</h2>
      <div className="card form">
        <Field label={t('profile.name')}><input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
        <span className="field-label">{t('profile.language')}</span>
        <div className="segmented" role="radiogroup">
          {(['sw', 'en'] as Lang[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'is-active' : ''} onClick={() => actions.setLang(l)}>
              {l === 'sw' ? 'Kiswahili' : 'English'}
            </button>
          ))}
        </div>
        <Field label={t('onb.country')} hint={co !== u.country ? t('profile.countryNote') : undefined}>
          <select value={co} onChange={(e) => { const c = e.target.value as CountryCode; setCo(c); setTown(COUNTRIES[c].towns[0].name); }}>
            {COUNTRY_LIST.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name[lang]}</option>)}
          </select>
        </Field>
        <span className="field-label">📍 {t('sell.location')}</span>
        <div className="split">
          <select value={town} onChange={(e) => setTown(e.target.value)} aria-label={t('sell.location')}>
            {COUNTRIES[co].towns.map((tw) => <option key={tw.name}>{tw.name}</option>)}
          </select>
          <input value={area} placeholder={t('sell.areaPh')} onChange={(e) => setArea(e.target.value)} aria-label={t('sell.areaPh')} />
        </div>
        <Btn onClick={() => actions.saveSettings({ name, country: co, town, area })}>{t('common.save')}</Btn>
      </div>

      <h2 className="section-title">{t('profile.notifications')}</h2>
      <div className="card form">
        <Toggle label={t('profile.push')} checked={u.prefs.push} onChange={(v) => actions.setPref('push', v)} />
        <Toggle label={t('profile.sms')} checked={u.prefs.sms} onChange={(v) => actions.setPref('sms', v)} />
        <Toggle label={t('profile.dataSaver')} checked={u.prefs.dataSaver} onChange={(v) => actions.setPref('dataSaver', v)} />
      </div>

      <h2 className="section-title">{t('profile.myAds')}</h2>
      {myAds.length === 0 ? <Empty>{t('profile.noAds')}</Empty> : <div className="list">{myAds.map((l) => <ListingRow key={l.id} listing={l} />)}</div>}

      <h2 className="section-title">{t('wanted.my')}</h2>
      {myWanted.length === 0 ? <Empty>{t('profile.noRequests')}</Empty> : myWanted.map((w) => (
        <div key={w.id} className="card">
          <strong>“{w.text}”</strong>
          <p className="muted small">{w.budget ? `${t('home.budget', { amount: money(w.budget, w.currency) })}, ` : ''}{w.town}</p>
          <button type="button" className="link-danger" onClick={() => actions.deleteWanted(w.id)}>{t('wanted.delete')}</button>
        </div>
      ))}

      <h2 className="section-title">{t('profile.savedSearches')}</h2>
      {state.saved.length === 0 ? <Empty>{t('profile.noSavedSearches')}</Empty> : state.saved.map((s) => {
        const n = searchListings(state, s.criteria, centerOf(s.criteria, country)).length;
        return (
          <div key={s.id} className="card saved-row">
            <span><strong>{s.label}</strong><br /><span className="muted small">{t('profile.matching', { n })}</span></span>
            <Btn variant="soft" className="btn-sm" onClick={() => actions.applySaved(s.id)}>{t('common.search')}</Btn>
            <button type="button" className="icon-btn" aria-label={t('common.delete')} onClick={() => actions.deleteSaved(s.id)}>×</button>
          </div>
        );
      })}
      <p className="muted small">🔔 {t('profile.alertNote')}</p>

      <Btn variant="soft" block onClick={() => openSheet({ kind: 'banner' })}>📣 {t('profile.bookBanner')}</Btn>

      <h2 className="section-title">{t('profile.prohibited')}</h2>
      <p className="card">{t('profile.prohibitedText')}</p>
      <Btn variant="soft" block onClick={() => go({ name: 'moderation' })}>🛡️ {t('profile.moderator')}</Btn>

      <div className="footer-links">
        <button type="button" className="link" onClick={() => window.confirm(t('profile.resetConfirm')) && actions.reset()}>{t('profile.reset')}</button>
        <button type="button" className="link-danger" onClick={actions.logout}>{t('profile.logout')}</button>
      </div>
    </div>
  );
}
