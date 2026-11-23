import type { OrderStep } from '../types';
import { useStore, last } from '../store/store';
import { PRICES } from '../data/prices';
import { clock, money } from '../lib/format';
import { BackLink, Btn, Empty } from '../components/ui';
import type { TKey } from '../i18n';

export function OrderView({ id }: { id: string }) {
  const { state, t, actions, openSheet, go } = useStore();
  const o = state.orders.find((x) => x.id === id);
  if (!o) return <div className="screen"><BackLink /><Empty>{t('ad.notFound')}</Empty></div>;
  const steps: OrderStep[] = o.delivery === 'pickup' ? ['paid', 'ready', 'received'] : ['paid', 'assigned', 'onway', 'received'];
  const at = (s: OrderStep) => o.history.find((h) => h.step === s)?.at;
  const status = last(o).step;
  const disputed = status === 'dispute';
  const done = status === 'received';
  const label = (s: OrderStep) => t(`order.${s}` as TKey, { partner: o.partner ?? '' });
  const rate = Math.round(PRICES[o.currency].payFeeRate * 100);
  const reviewed = o.rated || state.reviews.some((r) => r.listingId === o.listingId && r.mine);
  const chat = state.chats.find((c) => c.ref.kind === 'listing' && c.ref.id === o.listingId);

  return (
    <div className="screen">
      <BackLink />
      <h1 className="page-title">🔒 {t('order.title')}</h1>
      <p className="muted">{o.title}</p>
      <ol className="timeline">
        {steps.map((s) => (
          <li key={s} className={at(s) ? 'is-done' : ''}>
            <span className="tl-dot" aria-hidden>{at(s) ? '✓' : ''}</span>
            <span>{label(s)} {at(s) && <span className="muted small">{clock(at(s)!)}</span>}</span>
          </li>
        ))}
        {disputed && (
          <li className="is-dispute"><span className="tl-dot" aria-hidden>!</span><span>{t('order.dispute')} <span className="muted small">{clock(at('dispute')!)}</span></span></li>
        )}
      </ol>

      <dl className="sum">
        <div><dt>{t('pay.itemPrice')}</dt><dd>{money(o.price, o.currency)}</dd></div>
        <div><dt>{t('pay.delivery')}{o.address && <><br /><span className="muted small">{o.address}</span></>}</dt><dd>{o.deliveryFee ? money(o.deliveryFee, o.currency) : t('pay.freeLabel')}</dd></div>
        <div><dt>{t('pay.fee', { rate })}</dt><dd>{money(o.payFee, o.currency)}</dd></div>
        <div className="sum-total"><dt>{t('pay.total')}</dt><dd>{money(o.total, o.currency)}</dd></div>
      </dl>
      <p className="muted small">{t('order.payWith', { method: o.method })}</p>

      {!done && !disputed && status === 'paid' && <p className="muted small">⏳ {t('order.waiting')}</p>}
      {!done && !disputed && status !== 'paid' && <Btn variant="accent" block onClick={() => actions.confirmOrder(o.id)}>✓ {t('order.received_btn')}</Btn>}
      {done && !reviewed && <Btn variant="soft" block onClick={() => openSheet({ kind: 'rate', listingId: o.listingId, orderId: o.id })}>★ {t('ad.rate')}</Btn>}
      <Btn variant="soft" block onClick={() => (chat ? go({ name: 'chat', id: chat.id }) : actions.openChatFor(o.listingId))}>💬 {t('order.chat')}</Btn>
      {!done && !disputed && (
        <button type="button" className="link-danger" onClick={() => window.confirm(t('order.disputeConfirm')) && actions.disputeOrder(o.id)}>⚑ {t('order.report')}</button>
      )}
    </div>
  );
}
