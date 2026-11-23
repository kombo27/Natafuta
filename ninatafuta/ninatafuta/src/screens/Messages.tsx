import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { clock } from '../lib/format';
import { BackLink, Btn, Empty } from '../components/ui';

export function Messages() {
  const { state, t, go } = useStore();
  const chats = [...state.chats]
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? 0) - (a.messages[a.messages.length - 1]?.at ?? 0));
  return (
    <div className="screen">
      <h1 className="page-title">{t('msg.title')}</h1>
      {chats.length === 0 ? <Empty>{t('msg.empty')}</Empty> : (
        <div className="list">
          {chats.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button key={c.id} type="button" className="row chat-row" onClick={() => go({ name: 'chat', id: c.id })}>
                <span className="avatar">{c.partnerName.charAt(0)}</span>
                <span className="row-body">
                  <strong>{c.partnerName}</strong>
                  <span className="row-meta">{t('msg.about', { subject: c.subject })}</span>
                  <span className="row-snippet">{lastMsg?.text}</span>
                </span>
                {c.unread > 0 && <span className="dot dot-inline">{c.unread}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatView({ id, draft }: { id: string; draft?: string }) {
  const { state, t, go, actions } = useStore();
  const chat = state.chats.find((c) => c.id === id);
  const [text, setText] = useState(draft ?? '');
  const endRef = useRef<HTMLDivElement>(null);
  const unread = chat?.unread ?? 0;
  const count = chat?.messages.length ?? 0;

  useEffect(() => { if (unread) actions.readChat(id); }, [unread, id, actions]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [count]);

  if (!chat) return <div className="screen"><BackLink /></div>;
  const send = () => { actions.sendMsg(id, text); setText(''); };
  const openRef = () => chat.ref.kind === 'listing' && go({ name: 'listing', id: chat.ref.id });

  return (
    <div className="screen chat-screen">
      <BackLink />
      <button type="button" className="card chat-head" onClick={openRef}>
        <span className="avatar">{chat.partnerName.charAt(0)}</span>
        <span><strong>{chat.partnerName}</strong><br /><span className="row-meta">{t('msg.about', { subject: chat.subject })}</span></span>
      </button>
      <div className="bubbles">
        {chat.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.from === 'me' ? 'bubble-me' : 'bubble-them'}`}>
            {m.text}<span className="bubble-time">{clock(m.at)}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea rows={1} value={text} placeholder={t('msg.write')} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Btn type="submit" disabled={!text.trim()}>{t('msg.send')}</Btn>
      </form>
    </div>
  );
}
