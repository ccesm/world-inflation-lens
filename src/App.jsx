import { useEffect, useState } from 'react'
import { copy } from './i18n/translations.js'
import { routes, routeFromHash } from './utils/routing.js'
import { Home } from './pages/Home.jsx'
import { Overview } from './pages/Overview.jsx'
import { Timeline } from './pages/Timeline.jsx'
import { Placeholder } from './pages/Placeholder.jsx'
import { Sources } from './pages/Sources.jsx'

export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [language, setLanguage] = useState(() => localStorage.getItem('wil-language') === 'zh' ? 'zh' : 'en')
  const t = copy[language]

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = `${t.nav[route]} | World Inflation Lens`
    localStorage.setItem('wil-language', language)
  }, [language, route, t])

  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="#/home" aria-label="World Inflation Lens home"><span className="brand-mark">◎</span><span>WORLD<br /><strong>INFLATION LENS</strong></span></a>
      <nav className="desktop-nav" aria-label={t.navigation}>
        {routes.map(item => <a key={item} href={`#/${item}`} className={route === item ? 'active' : ''} aria-current={route === item ? 'page' : undefined}>{t.nav[item]}</a>)}
      </nav>
      <div className="language-toggle" role="group" aria-label={t.language}>
        <button onClick={() => setLanguage('en')} className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'}>EN</button>
        <button onClick={() => setLanguage('zh')} className={language === 'zh' ? 'selected' : ''} aria-pressed={language === 'zh'}>中文</button>
      </div>
    </header>
    <nav className="mobile-nav" aria-label={t.navigation}>{routes.map(item => <a key={item} href={`#/${item}`} className={route === item ? 'active' : ''} aria-current={route === item ? 'page' : undefined}>{t.nav[item]}</a>)}</nav>
    <main key={route}>
      {route === 'home' && <Home t={t} />}
      {route === 'overview' && <Overview t={t} />}
      {route === 'timeline' && <Timeline t={t} />}
      {route === 'us-cpi' && <Placeholder t={t} kind="us-cpi" />}
      {route === 'map' && <Placeholder t={t} kind="map" />}
      {route === 'sources' && <Sources t={t} language={language} />}
    </main>
    <footer><span>© {new Date().getFullYear()} World Inflation Lens</span><span>{t.footer}</span></footer>
  </div>
}
