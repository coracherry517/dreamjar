import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

export interface Wish {
  id?: number;
  title: string;
  isTop: number;        // 1 = one of the top 3 goals
  target: number;
  saved: number;
  image?: string;       // data URL
  createdAt: number;
  starredAt?: number;   // when it became a goal (starts the 72-hour clock)
  firstStepDone: number;
}

export interface JournalEntry {
  id?: number;
  date: string;         // YYYY-MM-DD, local time
  text: string;
  createdAt: number;
}

export interface Income {
  id?: number;
  amount: number;
  note: string;
  date: string;
  // the split is stored per income, so changing the ratio later never rewrites history
  goose: number;
  dream: number;
  spend: number;
}

export interface Setting {
  key: string;
  value: string;
}

class DreamJarDB extends Dexie {
  wishes!: Table<Wish, number>;
  journal!: Table<JournalEntry, number>;
  incomes!: Table<Income, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('dreamjar');
    this.version(1).stores({
      wishes: '++id, createdAt',
      journal: '++id, date',
      incomes: '++id, date',
      settings: 'key',
    });
  }
}

export const db = new DreamJarDB();

export function useSetting(key: string, fallback: string): [string, (v: string) => void] {
  const row = useLiveQuery(() => db.settings.get(key), [key]);
  const setValue = (value: string) => {
    void db.settings.put({ key, value });
  };
  return [row?.value ?? fallback, setValue];
}

export async function exportAll() {
  return {
    app: 'dreamjar',
    version: 1,
    exportedAt: new Date().toISOString(),
    wishes: await db.wishes.toArray(),
    journal: await db.journal.toArray(),
    incomes: await db.incomes.toArray(),
    settings: await db.settings.toArray(),
  };
}

export async function importAll(data: any) {
  if (!data || data.app !== 'dreamjar') throw new Error('Not a DreamJar backup');
  await db.transaction('rw', [db.wishes, db.journal, db.incomes, db.settings], async () => {
    await Promise.all([db.wishes.clear(), db.journal.clear(), db.incomes.clear(), db.settings.clear()]);
    await db.wishes.bulkAdd(data.wishes ?? []);
    await db.journal.bulkAdd(data.journal ?? []);
    await db.incomes.bulkAdd(data.incomes ?? []);
    await db.settings.bulkAdd(data.settings ?? []);
  });
}
