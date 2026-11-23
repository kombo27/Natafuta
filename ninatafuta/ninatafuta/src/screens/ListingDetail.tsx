import { useStore, canPayFor, canRate, shareText } from '../store/store';
import { CAT } from '../data/categories';
import { findTown } from '../data/countries';
import { distanceKm } from '../lib/geo';
import { km, timeAgo } from '../lib/format';
import { isBoosted } from '../lib/search';
import { BackLink, Btn, Empty, Price, SellerCard, Thumb } from '../components/ui';

export function ListingDetail({ id }: { id: string }) {
  const { state, lang, t, go, openSheet, actions, say } = useStore();
  const l = state.listings.find((x) => x.id === id);
  if (!l) return <div className="screen"><BackLink /><Empty>{t('ad.notFound')}</Empty></div>;

  const u = state.user!;
  const cat = CAT[l.category];
  const sub = cat.subs.find((s) => s.id === l.sub);
  const userTown = findTown(u.town)?.town;
  const dist = userTown ? distanceKm(userTown, l) : undefined;
  const saved = state.favs.includes(l.id);
  const text = shareText(t, l);

  const contact = (kind: 'call' | 'wa') => {
    if (l.demo || !l.phone) return say(t('ad.demoContact'));
    window.location.href = kind === 'call' ? `tel:${l.phone}` : `https://wa.me/${l.phone.replace('+', '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="screen">
      <BackLink />
      <Thumb listing={l} large />
      {l.photos.length > 1 && (
        <div className="photo-strip">{l.photos.slice(1).map((p, i) => <img key={i} src={p.preview} alt="" className="thumb" />)}</div>
      )}

      <div className="detail-head">
        <Price listing={l} />
        {l.category === 'property' && l.sub === 'rent' && <span className="muted"> {t('ad.perMonth')}</span>}
        {isBoosted(l) && <span className="tag tag-featured">{t('common.featured')}</span>}
        {l.sold && <span className="tag">{t('common.sold')}</span>}
        {l.removed && <span className="tag tag-danger">{t('common.removed')}</span>}
      </div>
      <h1 className="detail-title">{l.title}</h1>

      <div className="btn-row">
        <Btn variant="soft" className="btn-sm" onClick={() => actions.toggleFav(l.id)} aria-pressed={saved}>{saved ? '♥' : '♡'} {saved ? t('ad.saved') : t('ad.save')}</Btn>
        <Btn variant="soft" className="btn-sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')}>↗ {t('ad.share')}</Btn>
      </div>

      <ul className="facts">
        <li>{cat.emoji} {cat.name[lang]}{sub ? ` › ${sub.name[lang]}` : ''}</li>
        <li>📍 {[l.area, l.town].filter(Boolean).join(', ')}</li>
        {dist != null && <li>↔ {t('search.fromYou', { km: km(dist), town: u.town })}</li>}
        <li>{timeAgo(l.date, lang)}</li>
      </ul>
      {l.description && <p className="description">{l.description}</p>}
      {l.removed && <p className="notice notice-danger">{t('ad.removedNote')}</p>}

      <SellerCard sellerId={l.sellerId} />

      {l.own ? (
        <div className="btn-row">
          <Btn variant="soft" onClick={() => go({ name: 'sell', editId: l.id })}>✎ {t('ad.edit')}</Btn>
          {!l.sold && !l.removed && <Btn variant="accent" onClick={() => openSheet({ kind: 'boost', listingId: l.id })}>⬆ {t('ad.boost')}</Btn>}
          {!l.sold && <Btn variant="soft" onClick={() => actions.markSold(l.id)}>{t('ad.markSold')}</Btn>}
          <Btn variant="danger" onClick={() => window.confirm(t('ad.deleteConfirm')) && actions.deleteListing(l.id)}>{t('common.delete')}</Btn>
        </div>
      ) : (
        <>
          {canPayFor(l) && (
            <>
              <Btn variant="accent" block onClick={() => openSheet({ kind: 'pay', listingId: l.id })}>🔒 {t('ad.buyPay')}</Btn>
              <p className="muted small">{t('ad.payNote')}</p>
            </>
          )}
          <div className="contact-row">
            <Btn onClick={() => contact('call')}>{t('ad.call')}</Btn>
            <Btn className="btn-wa" onClick={() => contact('wa')}>{t('ad.whatsapp')}</Btn>
            <Btn variant="soft" onClick={() => actions.openChatFor(l.id)}>{t('ad.chat')}</Btn>
          </div>
          {canRate(state, l.id) && <Btn variant="soft" block onClick={() => openSheet({ kind: 'rate', listingId: l.id })}>★ {t('ad.rate')}</Btn>}
          <p className="notice">🛡️ {t('ad.safety')}</p>
          <button type="button" className="link-danger" onClick={() => openSheet({ kind: 'report', listingId: l.id })}>⚑ {t('ad.report')}</button>
        </>
      )}
    </div>
  );
}
