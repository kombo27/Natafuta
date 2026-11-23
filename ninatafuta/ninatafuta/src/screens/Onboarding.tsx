import { useRef, useState } from 'react';
import type { CountryCode, Lang } from '../types';
import { COUNTRIES, COUNTRY_LIST } from '../data/countries';
import { translate, type TKey } from '../i18n';
import { useStore } from '../store/store';
import { Btn, Field } from '../components/ui';

type Step = 'lang' | 'phone' | 'code';

/** Strips spaces, a leading 0 or a typed country code; returns 9 digits or null. */
export function normalizePhone(raw: string, dial: string): string | null {
  let d = raw.replace(/\D/g, '');
  const cc = dial.replace('+', '');
  if (d.startsWith(cc) && d.length > 9) d = d.slice(cc.length);
  if (d.startsWith('0')) d = d.slice(1);
  return /^\d{9}$/.test(d) ? d : null;
}

export function Onboarding() {
  const { actions } = useStore();
  const [step, setStep] = useState<Step>('lang');
  const [lang, setLang] = useState<Lang>('sw');
  const [country, setCountry] = useState<CountryCode>('KE');
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState(false);
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(false);
  const expected = useRef('');
  const t = (k: TKey, v?: Record<string, string | number>) => translate(lang, k, v);
  const c = COUNTRIES[country];
  const normalized = normalizePhone(phone, c.dial);

  const sendCode = () => {
    if (!normalized) return setPhoneErr(true);
    // In production: POST /auth/otp → SMS gateway. The prototype shows the code on screen.
    expected.current = String(1000 + Math.floor(Math.random() * 9000));
    setCode('');
    setCodeErr(false);
    setStep('code');
  };

  const onCode = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setCode(digits);
    setCodeErr(false);
    if (digits.length === 4) {
      if (digits === expected.current) actions.register(lang, country, normalized!);
      else setCodeErr(true);
    }
  };

  const pretty = normalized ? `${c.dial} ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}` : '';

  return (
    <main className="onb">
      {step === 'lang' && (
        <section className="onb-step">
          <h1 className="onb-logo">Ninatafuta</h1>
          <div className="stripe stripe-short" aria-hidden />
          <p className="muted">{translate('sw', 'onb.tagline')}<br />{translate('en', 'onb.tagline')}</p>
          <h2>{t('onb.chooseLang')}</h2>
          {(['sw', 'en'] as Lang[]).map((l) => (
            <button key={l} type="button" className="card lang-card" onClick={() => { setLang(l); setStep('phone'); }}>
              <strong>{l === 'sw' ? 'Kiswahili' : 'English'}</strong>
              <span className="muted">{translate(l, `onb.${l}.sub` as TKey)}</span>
            </button>
          ))}
        </section>
      )}

      {step === 'phone' && (
        <section className="onb-step">
          <button type="button" className="back" onClick={() => setStep('lang')}>‹ {t('common.back')}</button>
          <h2>{t('onb.phoneTitle')}</h2>
          <p className="muted">{t('onb.phoneSub')}</p>
          <Field label={t('onb.country')}>
            <select value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
              {COUNTRY_LIST.map((x) => <option key={x.code} value={x.code}>{x.flag} {x.name[lang]}</option>)}
            </select>
          </Field>
          <Field label={t('onb.phone')} hint={phoneErr ? t('onb.phoneErr') : undefined}>
            <span className={`phone-input${phoneErr ? ' is-error' : ''}`}>
              <span className="prefix">{c.dial}</span>
              <input inputMode="tel" autoComplete="tel-national" placeholder="712345678" value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneErr(false); }}
                onKeyDown={(e) => e.key === 'Enter' && sendCode()} />
            </span>
          </Field>
          <Btn block onClick={sendCode}>{t('onb.continue')}</Btn>
        </section>
      )}

      {step === 'code' && (
        <section className="onb-step">
          <button type="button" className="back" onClick={() => setStep('phone')}>‹ {t('onb.changeNumber')}</button>
          <h2>{t('onb.codeTitle')}</h2>
          <p className="muted">{t('onb.sentTo', { phone: pretty })}</p>
          <p className="notice">{t('onb.demoCode', { code: expected.current })}</p>
          <input className={`code-input${codeErr ? ' is-error' : ''}`} inputMode="numeric" autoComplete="one-time-code"
            maxLength={4} value={code} onChange={(e) => onCode(e.target.value)} autoFocus aria-label={t('onb.codeTitle')} />
          {codeErr && <p className="error">{t('onb.codeErr')}</p>}
          <Btn block onClick={() => onCode(code)}>{t('onb.confirm')}</Btn>
        </section>
      )}
    </main>
  );
}
