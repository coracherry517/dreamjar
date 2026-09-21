import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry } from '../db';
import { formatDate, localDate } from '../format';

const DAILY_GOAL = 5;

function streak(dates: Set<string>) {
  const day = new Date();
  if (!dates.has(localDate(day))) day.setDate(day.getDate() - 1); // today not written yet: count up to yesterday
  let count = 0;
  while (dates.has(localDate(day))) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

export default function Journal() {
  const { t, i18n } = useTranslation();
  const entries = useLiveQuery(() => db.journal.orderBy('date').reverse().toArray(), []) ?? [];
  const [text, setText] = useState('');
  const today = localDate();

  const todayCount = entries.filter((e) => e.date === today).length;
  const days = streak(new Set(entries.map((e) => e.date)));

  const groups = entries.reduce<Record<string, JournalEntry[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    await db.journal.add({ date: today, text: value, createdAt: Date.now() });
    setText('');
  };

  return (
    <section className="panel">
      <h2>{t('journal.heading')}</h2>
      <p className="intro">{t('journal.intro')}</p>

      <div className="tally">
        <div className="dots" aria-label={t('journal.today', { n: todayCount, goal: DAILY_GOAL })}>
          {Array.from({ length: DAILY_GOAL }, (_, i) => (
            <span key={i} className={i < todayCount ? 'dot on' : 'dot'} />
          ))}
        </div>
        <p>{t('journal.today', { n: todayCount, goal: DAILY_GOAL })}</p>
        {days > 0 && <p className="hint">{t('journal.streak', { count: days })}</p>}
      </div>

      <form className="row" onSubmit={add}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('journal.placeholder')}
          aria-label={t('journal.placeholder')}
          maxLength={200}
        />
        <button type="submit" disabled={!text.trim()}>{t('journal.add')}</button>
      </form>

      {entries.length === 0 && <p className="empty">{t('journal.empty')}</p>}

      {Object.entries(groups).map(([date, items]) => (
        <div key={date} className="day">
          <h3>{formatDate(date, i18n.language)}</h3>
          <ul className="list">
            {items
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((item) => (
                <li key={item.id}>
                  <span className="grow">{item.text}</span>
                  <button className="ghost" onClick={() => db.journal.delete(item.id!)}>{t('common.delete')}</button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
