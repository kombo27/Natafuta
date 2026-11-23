import { useEffect } from 'react';
import type { NoteType } from '../types';
import type { TKey } from '../i18n';
import { useStore } from '../store/store';
import { clock, timeAgo } from '../lib/format';
import { BackLink, Empty } from '../components/ui';

const ICON: Record<NoteType, string> = {
  message: '💬', wanted_reply: '🙋', saved_search: '🔎', order: '🔒', id: '🪪', shop: '🏪',
  banner: '📣', review: '★', moderation: '🛡️', welcome: '👋',
};

export function Notifications() {
  const { state, lang, t, actions } = useStore();
  const notes = state.notes;
  const hasUnread = notes.some((n) => !n.read);
  // opening the centre marks everything as read (after first paint, so unread rows stay highlighted)
  useEffect(() => { if (hasUnread) { const h = window.setTimeout(actions.readAllNotes, 1200); return () => window.clearTimeout(h); } }, [hasUnread, actions]);
  return (
    <div className="screen">
      <BackLink />
      <h1 className="page-title">🔔 {t('notes.title')}</h1>
      {notes.length === 0 ? <Empty>{t('notes.empty')}</Empty> : (
        <div className="list">
          {notes.map((n) => (
            <button key={n.id} type="button" className={`row note-row${n.read ? '' : ' is-unread'}`} onClick={() => actions.openNote(n.link)}>
              <span className="avatar avatar-sm" aria-hidden>{ICON[n.type]}</span>
              <span className="row-body">
                <strong>{t(n.key as TKey, n.vars)}</strong>
                <span className="row-meta">{timeAgo(n.date, lang)}, {clock(n.date)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
