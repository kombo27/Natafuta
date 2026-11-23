import { useState } from 'react';
import type { CategoryId, DeliveryType, IdDocType, ReportReason, SheetKind } from '../types';
import type { TKey } from '../i18n';
import { useStore, sellerInfo } from '../store/store';
import { CATEGORIES } from '../data/categories';
import { COUNTRIES, COUNTRY_LIST, findTown } from '../data/countries';
import { BODA_PARTNERS, PRICES } from '../data/prices';
import { distanceKm } from '../lib/geo';
import { deliveryOptions, quote } from '../lib/pricing';
import { km, money } from '../lib/format';
import { Btn, Chip, Field, Option, Sheet } from '../components/ui';

export function SheetHost() {
  const { sheet, closeSheet } = useStore();
  if (!sheet) return null;
  return <SheetBody sheet={sheet} onClose={closeSheet} />;
}

function SheetBody({ sheet, onClose }: { sheet: SheetKind; onClose: () => void }) {
  switch (sheet.kind) {
    case 'pay': return <PaySheet listingId={sheet.listingId} onClose={onClose} />;
    case 'rate': return <RateSheet listingId={sheet.listingId} orderId={sheet.orderId} onClose={onClose} />;
    case 'report': return <ReportSheet listingId={sheet.listingId} onClose={onClose} />;
    case 'boost': return <BoostSheet listingId={sheet.listingId} onClose={onClose} />;
    case 'verify': return <VerifySheet onClose={onClose} />;
    case 'shop': return <ShopSheet onClose={onClose} />;
    case 'banner': return <BannerSheet onClose={onClose} />;
  }
}

function PayMethods({ methods, value, onChange }: { methods: string[]; value: string; onChange: (m: string) => void }) {
  const { t } = useStore();
  return (
    <>
      <span className="field-label">{t('common.payWith')}</span>
      {methods.map((m) => <Option key={m} selected={value === m} onClick={() => onChange(m)}>{m}</Option>)}
    </>
  );
}

// ---------------------------------------------------------------- Ninatafuta Pay
function PaySheet({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { state, t, actions } = useStore();
  const l = state.listings.find((x) => x.id === listingId)!;
  const u = state.user!;
  const buyerTown = findTown(u.town)?.town ?? COUNTRIES[u.country].towns[0];
  const dist = distanceKm(buyerTown, l);
  const opts = deliveryOptions(dist);
  const methods = COUNTRIES[l.country].payMethods;
  const [delivery, setDelivery] = useState<DeliveryType>(opts[1]);
  const [partner, setPartner] = useState(BODA_PARTNERS[0]);
  const [address, setAddress] = useState(u.area || u.town);
  const [method, setMethod] = useState(methods[0]);
  const [err, setErr] = useState(false);
  const q = quote(l.price, l.currency, delivery, dist);
  const rate = Math.round(PRICES[l.currency].payFeeRate * 100);
  const label = (d: DeliveryType) => d === 'pickup' ? t('pay.pickup') : t(d === 'boda' ? 'pay.boda' : 'pay.bus', { km: km(dist) });
  const fee = (d: DeliveryType) => { const f = quote(l.price, l.currency, d, dist).deliveryFee; return f ? money(f, l.currency) : t('pay.freeLabel'); };

  const submit = () => {
    if (delivery !== 'pickup' && !address.trim()) return setErr(true);
    actions.pay({ listingId, delivery, partner, address, method });
  };

  return (
    <Sheet title={<>🔒 {t('pay.title')}</>} onClose={onClose}>
      <p className="muted small">{l.title}</p>
      <span className="field-label">{t('pay.delivery')}</span>
      {opts.map((d) => <Option key={d} selected={delivery === d} onClick={() => setDelivery(d)} right={fee(d)}>{label(d)}</Option>)}
      {delivery === 'boda' && (
        <>
          <span className="field-label">{t('pay.partner')}</span>
          <div className="chip-wrap">{BODA_PARTNERS.map((p) => <Chip key={p} active={partner === p} onClick={() => setPartner(p)}>🛵 {p}</Chip>)}</div>
        </>
      )}
      {delivery !== 'pickup' && (
        <Field label={t('pay.address')} hint={err ? t('pay.addressErr') : undefined}>
          <input value={address} className={err ? 'is-error' : ''} onChange={(e) => { setAddress(e.target.value); setErr(false); }} />
        </Field>
      )}
      <dl className="sum">
        <div><dt>{t('pay.itemPrice')}</dt><dd>{money(q.price, l.currency)}</dd></div>
        <div><dt>{t('pay.delivery')}</dt><dd>{q.deliveryFee ? money(q.deliveryFee, l.currency) : t('pay.freeLabel')}</dd></div>
        <div><dt>{t('pay.fee', { rate })}</dt><dd>{money(q.payFee, l.currency)}</dd></div>
        <div className="sum-total"><dt>{t('pay.total')}</dt><dd>{money(q.total, l.currency)}</dd></div>
      </dl>
      <PayMethods methods={methods} value={method} onChange={setMethod} />
      <p className="notice">🔒 {t('pay.holdNote')}</p>
      <p className="muted small">{t('common.demoPay')}</p>
      <Btn variant="accent" block onClick={submit}>{t('pay.payBtn', { amount: money(q.total, l.currency) })}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- rating
const TAGS = ['as_described', 'quick', 'fair', 'friendly'] as const;

function RateSheet({ listingId, orderId, onClose }: { listingId: string; orderId?: string; onClose: () => void }) {
  const { state, t, actions, say } = useStore();
  const l = state.listings.find((x) => x.id === listingId);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  if (!l) return null;
  const seller = sellerInfo(state, l.sellerId);
  const toggle = (tag: string) => setTags((x) => (x.includes(tag) ? x.filter((y) => y !== tag) : [...x, tag]));
  return (
    <Sheet title={t('rate.title', { name: seller.name })} onClose={onClose}>
      <div className="star-picker" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} className={n <= stars ? 'is-on' : ''} onClick={() => setStars(n)}>
            {n <= stars ? '★' : '☆'}
          </button>
        ))}
      </div>
      <div className="chip-wrap">
        {TAGS.map((tag) => <Chip key={tag} active={tags.includes(tag)} onClick={() => toggle(tag)}>{t(`rate.tag.${tag}` as TKey)}</Chip>)}
      </div>
      <Field label={t('rate.comment')}><textarea rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      <Btn block onClick={() => (stars ? actions.rate(listingId, stars, tags, comment, orderId) : say(t('rate.needStars')))}>{t('rate.send')}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- report
function ReportSheet({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { t, actions } = useStore();
  const reasons: ReportReason[] = ['scam', 'prohibited', 'wrong', 'other'];
  return (
    <Sheet title={t('report.title')} onClose={onClose}>
      {reasons.map((r) => (
        <button key={r} type="button" className="option" onClick={() => actions.report(listingId, r)}>
          <span>{t(`report.${r}` as TKey)}</span><span aria-hidden>›</span>
        </button>
      ))}
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- boost
function BoostSheet({ listingId, onClose }: { listingId: string; onClose: () => void }) {
  const { state, t, actions } = useStore();
  const l = state.listings.find((x) => x.id === listingId)!;
  const p = PRICES[l.currency];
  const methods = COUNTRIES[l.country].payMethods;
  const [kind, setKind] = useState<'search' | 'home'>('search');
  const [method, setMethod] = useState(methods[0]);
  return (
    <Sheet title={t('boost.title')} onClose={onClose}>
      <Option selected={kind === 'search'} onClick={() => setKind('search')} right={money(p.boost3, l.currency)}>{t('boost.search')}</Option>
      <Option selected={kind === 'home'} onClick={() => setKind('home')} right={money(p.boost7, l.currency)}>{t('boost.home')}</Option>
      <PayMethods methods={methods} value={method} onChange={setMethod} />
      <p className="muted small">{t('common.demoPay')}</p>
      <Btn variant="accent" block onClick={() => actions.boost(listingId, kind)}>{t('boost.pay')}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- ID verification
function VerifySheet({ onClose }: { onClose: () => void }) {
  const { t, actions, say } = useStore();
  const [type, setType] = useState<IdDocType>('national_id');
  const [num, setNum] = useState('');
  const [selfie, setSelfie] = useState(false);
  const [consent, setConsent] = useState(false);
  const submit = () => (num.trim().length >= 5 && selfie && consent ? actions.submitId(type, num) : say(t('verify.err')));
  return (
    <Sheet title={<>🪪 {t('verify.title')}</>} onClose={onClose}>
      <p className="muted small">{t('verify.sub')}</p>
      {(['national_id', 'passport', 'driving_licence'] as IdDocType[]).map((d) => (
        <Option key={d} selected={type === d} onClick={() => setType(d)}>{t(`verify.${d}` as TKey)}</Option>
      ))}
      <Field label={t('verify.number')}><input value={num} autoComplete="off" onChange={(e) => setNum(e.target.value)} /></Field>
      <span className="field-label">{t('verify.selfie')}</span>
      {/* Demo: the selfie is never read or uploaded. Production uses a certified ID-verification provider. */}
      <label className="btn btn-soft btn-sm file-btn">
        📷 {selfie ? t('verify.selfieAdded') : t('sell.addPhoto')}
        <input type="file" accept="image/*" capture="user" hidden onChange={(e) => { setSelfie(!!e.target.files?.length); e.target.value = ''; }} />
      </label>
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t('verify.consent')}</span>
      </label>
      <p className="muted small">{t('verify.demo')}</p>
      <Btn block onClick={submit}>{t('verify.submit')}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- shop account
function ShopSheet({ onClose }: { onClose: () => void }) {
  const { state, t, actions, say } = useStore();
  const u = state.user!;
  const cur = COUNTRIES[u.country].currency;
  const methods = COUNTRIES[u.country].payMethods;
  const [name, setName] = useState(u.shop?.name ?? '');
  const [desc, setDesc] = useState(u.shop?.description ?? '');
  const [hours, setHours] = useState(u.shop?.hours ?? 'Mon–Sat 9:00–19:00');
  const [method, setMethod] = useState(methods[0]);
  const price = money(PRICES[cur].shopMonth, cur);
  const submit = () => (name.trim() ? actions.openShop({ name: name.trim(), description: desc.trim(), hours: hours.trim() }) : say(t('shop.err')));
  return (
    <Sheet title={<>🏪 {t('shop.title')}</>} onClose={onClose}>
      <p className="muted small">{t('shop.sub')}</p>
      <Field label={t('shop.name')}><input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label={t('shop.desc')}><textarea rows={2} maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      <Field label={t('shop.hours')}><input value={hours} maxLength={60} onChange={(e) => setHours(e.target.value)} /></Field>
      {!u.shop && (
        <>
          <span className="field-label">{t('shop.plan', { amount: price })}</span>
          <PayMethods methods={methods} value={method} onChange={setMethod} />
          <p className="muted small">{t('common.demoPay')}</p>
        </>
      )}
      <Btn variant={u.shop ? 'primary' : 'accent'} block onClick={submit}>{u.shop ? t('shop.save') : t('shop.pay', { amount: price })}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}

// ---------------------------------------------------------------- banner booking
function BannerSheet({ onClose }: { onClose: () => void }) {
  const { state, lang, t, actions, say } = useStore();
  const u = state.user!;
  const [business, setBusiness] = useState(u.shop?.name ?? '');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [town, setTown] = useState(u.town);
  const [days, setDays] = useState<7 | 30>(7);
  const country = findTown(town)?.country ?? COUNTRIES[u.country];
  const p = PRICES[country.currency];
  const [method, setMethod] = useState(country.payMethods[0]);
  const submit = () => (business.trim() && text.trim()
    ? actions.bookBanner({ business: business.trim(), text: text.trim(), category, town }, days)
    : say(t('banner.err')));
  return (
    <Sheet title={<>📣 {t('banner.title')}</>} onClose={onClose}>
      <p className="muted small">{t('banner.sub')}</p>
      <Field label={t('banner.business')}><input value={business} maxLength={50} onChange={(e) => setBusiness(e.target.value)} /></Field>
      <Field label={t('banner.text')} hint={`${text.length}/70`}><input value={text} maxLength={70} onChange={(e) => setText(e.target.value)} /></Field>
      <span className="field-label">{t('banner.showIn')}</span>
      <div className="split">
        <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'all')} aria-label={t('sell.category')}>
          <option value="all">{t('search.allCats')}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
        </select>
        <select value={town} onChange={(e) => { setTown(e.target.value); setMethod((findTown(e.target.value)?.country ?? country).payMethods[0]); }} aria-label={t('sell.location')}>
          {COUNTRY_LIST.map((co) => (
            <optgroup key={co.code} label={`${co.flag} ${co.name[lang]}`}>
              {co.towns.map((tw) => <option key={tw.name}>{tw.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <Option selected={days === 7} onClick={() => setDays(7)} right={money(p.banner7, country.currency)}>{t('banner.days', { n: 7 })}</Option>
      <Option selected={days === 30} onClick={() => setDays(30)} right={money(p.banner30, country.currency)}>{t('banner.days', { n: 30 })}</Option>
      <PayMethods methods={country.payMethods} value={method} onChange={setMethod} />
      <p className="muted small">{t('common.demoPay')}</p>
      <Btn variant="accent" block onClick={submit}>{t('boost.pay')}</Btn>
      <Btn variant="soft" block onClick={onClose}>{t('common.cancel')}</Btn>
    </Sheet>
  );
}
