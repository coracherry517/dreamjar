import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';
import { exportAll, importAll, useSetting } from '../db';
import { currencies, defaultCurrency, localDate } from '../format';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [currency, setCurrency] = useSetting('currency', defaultCurrency(i18n.language));
  const [message, setMessage] = useState('');

  const download = async () => {
    const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dreamjar-backup-${localDate()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (!confirm(t('settings.importConfirm'))) return;
    try {
      await importAll(JSON.parse(await file.text()));
      setMessage(t('settings.importDone'));
    } catch {
      setMessage(t('settings.importError'));
    }
  };

  return (
    <section className="panel">
      <h2>{t('settings.heading')}</h2>

      <label className="field">
        <span>{t('settings.language')}</span>
        <select value={i18n.resolvedLanguage} onChange={(e) => i18n.changeLanguage(e.target.value)}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>{t('settings.currency')}</span>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <h3>{t('settings.backup')}</h3>
      <p className="intro">{t('settings.backupIntro')}</p>
      <div className="row">
        <button onClick={download}>{t('settings.export')}</button>
        <label className="button-like">
          {t('settings.import')}
          <input type="file" accept="application/json" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {message && <p className="hint" role="status">{message}</p>}
    </section>
  );
}
