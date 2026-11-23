import { useStore, rating, sellerInfo } from '../store/store';
import { timeAgo } from '../lib/format';
import { isActive } from '../lib/search';
import { BackLink, Badges, Empty, ListingRow, Stars } from '../components/ui';

export function SellerProfile({ id }: { id: string }) {
  const { state, lang, t } = useStore();
  const s = sellerInfo(state, id);
  const r = rating(state, id);
  const reviews = state.reviews.filter((x) => x.sellerId === id).sort((a, b) => b.date - a.date);
  const ads = state.listings.filter((l) => l.sellerId === id && isActive(l));
  return (
    <div className="screen">
      <BackLink />
      <div className="profile-head">
        <span className="avatar avatar-lg">{s.name.charAt(0).toUpperCase()}</span>
        <div>
          <h1 className="page-title">{s.name}</h1>
          <p className="muted small">{t('seller.since', { year: new Date(s.memberSince).getFullYear() })}</p>
          <Badges seller={s} />
        </div>
      </div>
      {s.shop && (
        <div className="card">
          <p>{s.shop.description}</p>
          <p className="muted small">🕘 {t('seller.hours', { hours: s.shop.hours })}</p>
        </div>
      )}
      <h2 className="section-title">
        {t('seller.reviews')} {r.count > 0 && <><span className="star">★</span> {r.avg.toFixed(1)} <span className="muted">({t('common.reviews', { n: r.count })})</span></>}
      </h2>
      {reviews.length === 0 && r.count === 0 && <Empty>{t('common.noReviews')}</Empty>}
      {reviews.map((rv) => (
        <article key={rv.id} className="card review">
          <p><Stars value={rv.stars} /> <strong>{rv.mine ? t('common.you') : rv.author}</strong> <span className="muted small">{timeAgo(rv.date, lang)}</span></p>
          {rv.tags.length > 0 && <p className="muted small">{rv.tags.map((tg) => t(`rate.tag.${tg}` as Parameters<typeof t>[0])).join(', ')}</p>}
          {rv.comment && <p>{rv.comment}</p>}
        </article>
      ))}
      <h2 className="section-title">{t('seller.activeAds', { n: ads.length })}</h2>
      <div className="list">{ads.map((l) => <ListingRow key={l.id} listing={l} />)}</div>
    </div>
  );
}
