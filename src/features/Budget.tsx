import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useSetting } from '../db';
import { formatDate, localDate, toNumber, useMoney } from '../format';

const jars = ['goose', 'dream', 'spend'] as const;
type Jar = (typeof jars)[number];
const defaults: Record<Jar, string> = { goose: '50', dream: '40', spend: '10' };

export default function Budget() {
  const { t, i18n } = useTranslation();
  const money = useMoney();
  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray(), []) ?? [];

  const ratio = {
    goose: useSetting('ratio.goose', defaults.goose),
    dream: useSetting('ratio.dream', defaults.dream),
    spend: useSetting('ratio.spend', defaults.spend),
  };
  const pct = (j: Jar) => toNumber(ratio[j][0]);
  const sum = jars.reduce((s, j) => s + pct(j), 0);
  const valid = Math.abs(sum - 100) < 0.001;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const totals = jars.reduce(
    (acc, j) => ({ ...acc, [j]: incomes.reduce((s, inc) => s + inc[j], 0) }),
    { goose: 0, dream: 0, spend: 0 } as Record<Jar, number>,
  );
  const max = Math.max(1, ...jars.map((j) => totals[j]));

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const n = toNumber(amount);
    if (n <= 0 || !valid) return;
    const round = (x: number) => Math.round(x * 100) / 100;
    const goose = round((n * pct('goose')) / 100);
    const dream = round((n * pct('dream')) / 100);
    await db.incomes.add({ amount: n, note: note.trim(), date: localDate(), goose, dream, spend: round(n - goose - dream) });
    setAmount('');
    setNote('');
  };

  return (
    <section className="panel">
      <h2>{t('budget.heading')}</h2>
      <p className="intro">{t('budget.intro')}</p>

      <div className="jars">
        {jars.map((j) => (
          <div key={j} className={`jar-col ${j}`}>
            <div className="jar" aria-hidden="true">
              <div className="fill" style={{ height: `${(totals[j] / max) * 100}%` }} />
            </div>
            <strong>{t(`budget.${j}`)}</strong>
            <span className="amount">{money(totals[j])}</span>
            <span className="hint">{t(`budget.${j}Desc`)}</span>
          </div>
        ))}
      </div>

      <fieldset className="ratio">
        <legend>{t('budget.ratio')}</legend>
        {jars.map((j) => (
          <label key={j} className="field small">
            <span>{t(`budget.${j}`)} %</span>
            <input type="number" min="0" max="100" value={ratio[j][0]} onChange={(e) => ratio[j][1](e.target.value)} />
          </label>
        ))}
        {!valid && <p className="error">{t('budget.ratioError', { sum })}</p>}
      </fieldset>

      <form className="row" onSubmit={add}>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('budget.amount')}
          aria-label={t('budget.amount')}
        />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('budget.note')} aria-label={t('budget.note')} />
        <button type="submit" disabled={!valid || toNumber(amount) <= 0}>{t('budget.add')}</button>
      </form>

      <h3>{t('budget.history')}</h3>
      {incomes.length === 0 && <p className="empty">{t('budget.empty')}</p>}
      <ul className="list">
        {incomes.map((inc) => (
          <li key={inc.id}>
            <span className="grow">
              <strong>{money(inc.amount)}</strong> {inc.note && <>· {inc.note}</>}
              <br />
              <span className="hint">
                {formatDate(inc.date, i18n.language)} — {t('budget.goose')} {money(inc.goose)}, {t('budget.dream')} {money(inc.dream)}, {t('budget.spend')} {money(inc.spend)}
              </span>
            </span>
            <button className="ghost" onClick={() => db.incomes.delete(inc.id!)}>{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
