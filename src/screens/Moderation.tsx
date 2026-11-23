import type { TKey } from '../i18n';
import { useStore } from '../store/store';
import { BackLink, Btn, Empty, ListingRow } from '../components/ui';

export function Moderation() {
  const { state, t, actions } = useStore();
  const open = state.reports.filter((r) => !r.decision);
  const byListing = [...new Set(open.map((r) => r.listingId))];
  return (
    <div className="screen">
      <BackLink />
      <h1 className="page-title">🛡️ {t('mod.title')}</h1>
      <p className="muted">{t('mod.sub')}</p>
      {byListing.length === 0 && <Empty>{t('mod.empty')}</Empty>}
      {byListing.map((id) => {
        const l = state.listings.find((x) => x.id === id);
        if (!l) return null;
        const reps = open.filter((r) => r.listingId === id);
        const reasons = [...new Set(reps.map((r) => t(`report.${r.reason}` as TKey)))].join(', ');
        return (
          <div key={id} className="card mod-card">
            <ListingRow listing={l} />
            <p className="muted small">{t('mod.reports', { n: reps.length, reasons })}</p>
            <div className="btn-row">
              <Btn variant="danger" className="btn-sm" onClick={() => actions.moderate(id, 'removed')}>{t('mod.remove')}</Btn>
              <Btn variant="soft" className="btn-sm" onClick={() => actions.moderate(id, 'kept')}>{t('mod.keep')}</Btn>
            </div>
          </div>
        );
      })}
      <h2 className="section-title">{t('profile.prohibited')}</h2>
      <p className="card">{t('profile.prohibitedText')}</p>
    </div>
  );
}
