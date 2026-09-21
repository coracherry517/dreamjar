import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Wish } from '../db';
import { toNumber, useMoney } from '../format';

const MAX_WISHES = 10;
const MAX_TOP = 3;
const HOURS = 72;

// shrink photos before saving so backups stay small
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function Wishes() {
  const { t } = useTranslation();
  const wishes = useLiveQuery(() => db.wishes.orderBy('createdAt').toArray(), []) ?? [];
  const [title, setTitle] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const top = wishes.filter((w) => w.isTop);
  const others = wishes.filter((w) => !w.isTop);
  const full = wishes.length >= MAX_WISHES;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value || full) return;
    await db.wishes.add({ title: value, isTop: 0, target: 0, saved: 0, createdAt: Date.now(), firstStepDone: 0 });
    setTitle('');
  };

  const toggleTop = async (w: Wish) => {
    if (!w.isTop && top.length >= MAX_TOP) {
      alert(t('wishes.starLimit'));
      return;
    }
    await db.wishes.update(w.id!, w.isTop ? { isTop: 0 } : { isTop: 1, starredAt: w.starredAt ?? Date.now() });
  };

  return (
    <section className="panel">
      <h2>{t('wishes.heading')}</h2>
      <p className="intro">{t('wishes.intro')}</p>

      <form className="row" onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('wishes.placeholder')}
          aria-label={t('wishes.placeholder')}
          disabled={full}
          maxLength={80}
        />
        <button type="submit" disabled={full || !title.trim()}>{t('wishes.add')}</button>
      </form>
      <p className="hint">{full ? t('wishes.limit') : t('wishes.count', { n: wishes.length, max: MAX_WISHES })}</p>

      {wishes.length === 0 && <p className="empty">{t('wishes.empty')}</p>}

      {top.length > 0 && (
        <>
          <h3>{t('wishes.topHeading')}</h3>
          <div className="goals">
            {top.map((w) => (
              <GoalCard key={w.id} wish={w} now={now} onUnstar={() => toggleTop(w)} />
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h3>{t('wishes.otherHeading')}</h3>
          <ul className="list">
            {others.map((w) => (
              <li key={w.id}>
                <button className="star" onClick={() => toggleTop(w)} aria-label={t('wishes.makeGoal')} title={t('wishes.makeGoal')}>☆</button>
                <span className="grow">{w.title}</span>
                <button className="ghost" onClick={() => db.wishes.delete(w.id!)}>{t('common.delete')}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function GoalCard({ wish, now, onUnstar }: { wish: Wish; now: number; onUnstar: () => void }) {
  const { t } = useTranslation();
  const money = useMoney();
  const [deposit, setDeposit] = useState('');

  const pct = wish.target > 0 ? Math.min(100, (wish.saved / wish.target) * 100) : 0;
  const hoursLeft = Math.ceil(HOURS - (now - (wish.starredAt ?? now)) / 3_600_000);

  const addDeposit = async (e: FormEvent) => {
    e.preventDefault();
    const n = toNumber(deposit);
    if (!n) return;
    await db.wishes.update(wish.id!, { saved: Math.max(0, wish.saved + n) });
    setDeposit('');
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    await db.wishes.update(wish.id!, { image: await readImage(file) });
  };

  return (
    <article className="goal">
      <label className="photo">
        {wish.image ? <img src={wish.image} alt={wish.title} /> : <span>{t('wishes.addImage')}</span>}
        <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} />
      </label>

      <div className="goal-body">
        <div className="goal-head">
          <h4>{wish.title}</h4>
          <button className="star on" onClick={onUnstar} aria-label={t('wishes.unstar')} title={t('wishes.unstar')}>★</button>
        </div>

        <label className="field">
          <span>{t('wishes.target')}</span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            defaultValue={wish.target || ''}
            onBlur={(e) => db.wishes.update(wish.id!, { target: toNumber(e.target.value) })}
          />
        </label>

        <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="hint">{t('wishes.progress', { saved: money(wish.saved), target: money(wish.target) })}</p>

        <form className="row" onSubmit={addDeposit}>
          <input
            type="number"
            inputMode="decimal"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder={t('wishes.depositPlaceholder')}
            aria-label={t('wishes.depositPlaceholder')}
          />
          <button type="submit">{t('wishes.deposit')}</button>
        </form>

        <div className={wish.firstStepDone ? 'step done' : hoursLeft > 0 ? 'step' : 'step late'}>
          {wish.firstStepDone
            ? t('wishes.firstStepDone')
            : hoursLeft > 0
              ? t('wishes.countdown', { count: hoursLeft })
              : t('wishes.overdue')}
          <label className="check">
            <input
              type="checkbox"
              checked={!!wish.firstStepDone}
              onChange={(e) => db.wishes.update(wish.id!, { firstStepDone: e.target.checked ? 1 : 0 })}
            />
            {t('wishes.firstStep')}
          </label>
        </div>
      </div>
    </article>
  );
}
