import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toNumber, useMoney } from '../format';

interface Row { year: number; balance: number; contributed: number }

function simulate(principal: number, monthly: number, ratePct: number, years: number): Row[] {
  const r = ratePct / 100 / 12;
  let balance = principal;
  let contributed = principal;
  const rows: Row[] = [];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + r) + monthly;
      contributed += monthly;
    }
    rows.push({ year: y, balance, contributed });
  }
  return rows;
}

export default function Calculator() {
  const { t } = useTranslation();
  const money = useMoney();
  const [principal, setPrincipal] = useState('1000');
  const [monthly, setMonthly] = useState('100');
  const [rate, setRate] = useState('5');
  const [years, setYears] = useState('10');

  const rows = simulate(toNumber(principal), toNumber(monthly), toNumber(rate), Math.min(60, Math.max(0, Math.round(toNumber(years)))));
  const last = rows[rows.length - 1];

  const fields: [string, string, (v: string) => void][] = [
    ['principal', principal, setPrincipal],
    ['monthly', monthly, setMonthly],
    ['rate', rate, setRate],
    ['years', years, setYears],
  ];

  return (
    <section className="panel">
      <h2>{t('calc.heading')}</h2>
      <p className="intro">{t('calc.intro')}</p>

      <div className="grid">
        {fields.map(([key, value, set]) => (
          <label key={key} className="field">
            <span>{t(`calc.${key}`)}</span>
            <input type="number" min="0" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} />
          </label>
        ))}
      </div>

      {last && (
        <div className="result">
          <p className="big">{money(last.balance)}</p>
          <p>{t('calc.result', { years: last.year, contributed: money(last.contributed), interest: money(last.balance - last.contributed) })}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('calc.year')}</th>
                <th>{t('calc.contributed')}</th>
                <th>{t('calc.interest')}</th>
                <th>{t('calc.total')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{money(r.contributed)}</td>
                  <td>{money(r.balance - r.contributed)}</td>
                  <td>{money(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
