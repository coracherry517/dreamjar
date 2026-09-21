import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';
import de from './locales/de.json';
import ja from './locales/ja.json';

// 新增语言：1) 在 src/locales 里加一个 JSON 文件  2) 在这里 import 并加到下面两个位置
export const languages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

const rtl = ['ar', 'he', 'fa', 'ur'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      en: { translation: en },
      de: { translation: de },
      ja: { translation: ja },
    },
    supportedLngs: languages.map((l) => l.code),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

function applyDocumentLanguage(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = rtl.some((code) => lng.startsWith(code)) ? 'rtl' : 'ltr';
}
applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
