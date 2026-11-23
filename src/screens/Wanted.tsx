import { useState } from 'react';
import { useStore } from '../store/store';
import { COUNTRIES } from '../data/countries';
import { BackLink, Btn, Field } from '../components/ui';

export function WantedForm() {
  const { state, t, actions } = useStore();
  const u = state.user!;
  const country = COUNTRIES[u.country];
  const [text, setText] = useState('');
  const [budget, setBudget] = useState('');
  const [town, setTown] = useState(u.town);
  const [area, setArea] = useState(u.area);
  const [err, setErr] = useState(false);

  const submit = () => {
    if (!text.trim()) return setErr(true);
    const b = budget.trim() ? Number(budget.replace(/\D/g, '')) : undefined;
    actions.postWanted(text, b || undefined, town, area);
  };

  return (
    <div className="screen">
      <BackLink />
      <h1 className="page-title">{t('wanted.title')}</h1>
      <p className="muted">{t('wanted.sub')}</p>
      <Field label={t('wanted.what')} hint={err ? t('wanted.err') : `${text.length}/200`}>
        <textarea rows={3} maxLength={200} value={text} className={err ? 'is-error' : ''}
          onChange={(e) => { setText(e.target.value); setErr(false); }} />
      </Field>
      <Field label={t('wanted.budget', { cur: country.currency })}>
        <input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <span className="field-label">📍 {t('sell.location')}</span>
      <div className="split">
        <select value={town} onChange={(e) => setTown(e.target.value)} aria-label={t('sell.location')}>
          {country.towns.map((tw) => <option key={tw.name}>{tw.name}</option>)}
        </select>
        <input value={area} placeholder={t('sell.areaPh')} onChange={(e) => setArea(e.target.value)} aria-label={t('sell.areaPh')} />
      </div>
      <Btn block onClick={submit}>{t('wanted.post')}</Btn>
    </div>
  );
}
