import { useState, useEffect } from 'react';

export const LANG_KEY = 'bioneer_language';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

const TRANSLATIONS = {
  en: {},
  es: {
    'LIVE SESSION': 'SESIÓN EN VIVO',
    'TECHNIQUE': 'TÉCNICA',
    'ANALYTICS': 'ANÁLISIS',
    'LIBRARY': 'BIBLIOTECA',
    'HISTORY': 'HISTORIAL',
    'ACHIEVEMENTS': 'LOGROS',
    'SETTINGS': 'AJUSTES',
    'Settings': 'Ajustes',
    'Preferences & configuration': 'Preferencias y configuración',
    'AI Coach': 'Entrenador IA',
    'Tracking': 'Seguimiento',
    'Data': 'Datos',
    'STOP SESSION': 'DETENER SESIÓN',
    'Start Session': 'Iniciar Sesión',
    'Back': 'Volver',
    'Export All Sessions': 'Exportar Todas las Sesiones',
    'Clear All Sessions': 'Borrar Todas las Sesiones',
    'Language': 'Idioma',
    'Movement Library': 'Biblioteca de Movimientos',
    'Select movement to analyze': 'Selecciona movimiento a analizar',
    'Strength Training': 'Entrenamiento de Fuerza',
    'Sports Performance': 'Rendimiento Deportivo',
  },
  pt: {
    'LIVE SESSION': 'SESSÃO AO VIVO',
    'TECHNIQUE': 'TÉCNICA',
    'ANALYTICS': 'ANÁLISE',
    'LIBRARY': 'BIBLIOTECA',
    'HISTORY': 'HISTÓRICO',
    'ACHIEVEMENTS': 'CONQUISTAS',
    'SETTINGS': 'CONFIGURAÇÕES',
    'Settings': 'Configurações',
    'Preferences & configuration': 'Preferências e configuração',
    'AI Coach': 'Treinador IA',
    'Tracking': 'Rastreamento',
    'Data': 'Dados',
    'STOP SESSION': 'PARAR SESSÃO',
    'Start Session': 'Iniciar Sessão',
    'Back': 'Voltar',
    'Export All Sessions': 'Exportar Todas as Sessões',
    'Clear All Sessions': 'Limpar Todas as Sessões',
    'Language': 'Idioma',
    'Movement Library': 'Biblioteca de Movimentos',
    'Select movement to analyze': 'Selecione o movimento para analisar',
    'Strength Training': 'Treinamento de Força',
    'Sports Performance': 'Desempenho Esportivo',
  },
  de: {
    'LIVE SESSION': 'LIVE-SITZUNG',
    'TECHNIQUE': 'TECHNIK',
    'ANALYTICS': 'ANALYTIK',
    'LIBRARY': 'BIBLIOTHEK',
    'HISTORY': 'VERLAUF',
    'ACHIEVEMENTS': 'ERRUNGENSCHAFTEN',
    'SETTINGS': 'EINSTELLUNGEN',
    'Settings': 'Einstellungen',
    'Preferences & configuration': 'Einstellungen & Konfiguration',
    'AI Coach': 'KI-Trainer',
    'Tracking': 'Tracking',
    'Data': 'Daten',
    'STOP SESSION': 'SITZUNG BEENDEN',
    'Start Session': 'Sitzung starten',
    'Back': 'Zurück',
    'Export All Sessions': 'Alle Sitzungen exportieren',
    'Clear All Sessions': 'Alle Sitzungen löschen',
    'Language': 'Sprache',
    'Movement Library': 'Bewegungsbibliothek',
    'Select movement to analyze': 'Bewegung zur Analyse auswählen',
    'Strength Training': 'Krafttraining',
    'Sports Performance': 'Sportliche Leistung',
  },
  ja: {
    'LIVE SESSION': 'ライブセッション',
    'TECHNIQUE': 'テクニック',
    'ANALYTICS': '分析',
    'LIBRARY': 'ライブラリ',
    'HISTORY': '履歴',
    'ACHIEVEMENTS': '実績',
    'SETTINGS': '設定',
    'Settings': '設定',
    'Preferences & configuration': '設定と構成',
    'AI Coach': 'AIコーチ',
    'Tracking': 'トラッキング',
    'Data': 'データ',
    'STOP SESSION': 'セッション終了',
    'Start Session': 'セッション開始',
    'Back': '戻る',
    'Export All Sessions': '全セッションをエクスポート',
    'Clear All Sessions': '全セッションを削除',
    'Language': '言語',
    'Movement Library': '動作ライブラリ',
    'Select movement to analyze': '分析する動作を選択',
    'Strength Training': '筋力トレーニング',
    'Sports Performance': 'スポーツパフォーマンス',
  },
};

export function useT() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en');

  useEffect(() => {
    const onStorage = () => setLang(localStorage.getItem(LANG_KEY) || 'en');
    window.addEventListener('bioneer_lang_change', onStorage);
    return () => window.removeEventListener('bioneer_lang_change', onStorage);
  }, []);

  return (key) => TRANSLATIONS[lang]?.[key] ?? key;
}

export function setLanguage(code) {
  localStorage.setItem(LANG_KEY, code);
  window.dispatchEvent(new Event('bioneer_lang_change'));
}

export function getCurrentLang() {
  return localStorage.getItem(LANG_KEY) || 'en';
}