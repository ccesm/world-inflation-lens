import React, { useEffect, useState } from 'react'
import { copy } from './i18n/translations.js'
import { routes, routeFromHash } from './utils/routing.js'
import { Home } from './pages/Home.jsx'
import { GlobalOverview } from './pages/GlobalOverview.jsx'
import { Timeline } from './pages/Timeline.jsx'
import { GlobalMap } from './pages/GlobalMap.jsx'
import { Sources } from './pages/Sources.jsx'
import { UsCpi } from './pages/UsCpi.jsx'
import { Drivers } from './pages/Drivers.jsx'

function initialLanguage() {
  try {
    const saved = localStorage.getItem('wil-language')
    if (saved === 'zh' || saved === 'en') return saved
  } catch { /* Storage may be disabled; the interface still works. */ }
  return navigator.language.startsWith('zh') ? 'zh' : 'en'
}

function initialTheme() {
  try {
    const saved = localStorage.getItem('wil-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage may be disabled; the theme still works. */ }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [navigationKey, setNavigationKey] = useState(() => window.location.hash)
  const [language, setLanguage] = useState(initialLanguage)
  const [theme, setTheme] = useState(initialTheme)
  const t = copy[language]

  useEffect(() => {
    const onHashChange = () => { setRoute(routeFromHash()); setNavigationKey(window.location.hash); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = `${t.nav[route]} | World Inflation Lens`
    try { localStorage.setItem('wil-language', language) } catch { /* Optional persistence. */ }
  }, [language, route, t])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111814' : '#f5f3ed')
    try { localStorage.setItem('wil-theme', theme) } catch { /* Optional persistence. */ }
  }, [theme])

  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="#/home" aria-label={language === 'zh' ? '全球通胀透视 · 首页' : 'World Inflation Lens home'}><span className="brand-mark">◎</span><span>WORLD<br /><strong>INFLATION LENS</strong>{language === 'zh' && <small className="brand-chinese">全球通胀透视</small>}</span></a>
      <nav className="desktop-nav" aria-label={t.navigation}>
        {routes.map(item => <a key={item} href={`#/${item}`} className={route === item ? 'active' : ''} aria-current={route === item ? 'page' : undefined}>{t.nav[item]}</a>)}
      </nav>
      <div className="header-actions">
        <button className="theme-toggle" type="button" onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? (language === 'zh' ? '切换到深色模式' : 'Switch to dark mode') : (language === 'zh' ? '切换到浅色模式' : 'Switch to light mode')} aria-pressed={theme === 'dark'} title={theme === 'light' ? (language === 'zh' ? '深色模式' : 'Dark mode') : (language === 'zh' ? '浅色模式' : 'Light mode')}>
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
        </button>
        <div className="language-toggle" role="group" aria-label={t.language}>
          <button onClick={() => setLanguage('en')} className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'}>EN</button>
          <button onClick={() => setLanguage('zh')} className={language === 'zh' ? 'selected' : ''} aria-pressed={language === 'zh'}>中文</button>
        </div>
      </div>
    </header>
    <nav className="mobile-nav" aria-label={t.navigation}>{routes.map(item => <a key={item} href={`#/${item}`} className={route === item ? 'active' : ''} aria-current={route === item ? 'page' : undefined}>{t.nav[item]}</a>)}</nav>
    <main key={navigationKey}>
      {route === 'home' && <Home language={language} />}
      {route === 'overview' && <GlobalOverview language={language} />}
      {route === 'timeline' && <Timeline language={language} />}
      {route === 'us-cpi' && <UsCpi language={language} />}
      {route === 'map' && <GlobalMap language={language} />}
      {route === 'drivers' && <Drivers language={language} />}
      {route === 'sources' && <Sources t={t} language={language} />}
    </main>
    <footer><span>© {new Date().getFullYear()} World Inflation Lens</span><span>{t.footer}</span></footer>
  </div>
}
