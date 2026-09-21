import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Wishes from './features/Wishes';
import Journal from './features/Journal';
import Budget from './features/Budget';
import Calculator from './features/Calculator';
import Settings from './features/Settings';

const tabs = ['wishes', 'journal', 'budget', 'calculator', 'settings'] as const;
type Tab = (typeof tabs)[number];

export default function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('wishes');

  return (
    <div className="shell">
      <header className="masthead">
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}</p>
      </header>

      <nav className="tabs" aria-label={t('nav.label')}>
        {tabs.map((key) => (
          <button
            key={key}
            className={tab === key ? 'tab active' : 'tab'}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key)}
          >
            {t(`nav.${key}`)}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'wishes' && <Wishes />}
        {tab === 'journal' && <Journal />}
        {tab === 'budget' && <Budget />}
        {tab === 'calculator' && <Calculator />}
        {tab === 'settings' && <Settings />}
      </main>

      <footer className="footer">
        <p>{t('app.privacy')}</p>
        <p>{t('app.disclaimer')}</p>
      </footer>
    </div>
  );
}
