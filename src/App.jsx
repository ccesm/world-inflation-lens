import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { copy } from './i18n/translations.js'
import { primaryRoutes, routeSection, routeFromHash } from './utils/routing.js'
import { iaCopy, sectionLinks } from './i18n/architecture.js'
import { DollarPower } from './components/DollarPower.jsx'
import { PageIntro } from './components/PageIntro.jsx'
import { Home } from './pages/DollarHome.jsx'
import { Monitor } from './pages/Monitor.jsx'
import { Scenarios } from './pages/Scenarios.jsx'
import { Fiscal } from './pages/Fiscal.jsx'
import { Regimes } from './pages/Regimes.jsx'
import { Since1971 } from './pages/Since1971.jsx'
import { GlobalOverview } from './pages/GlobalOverview.jsx'
import { Timeline } from './pages/Timeline.jsx'
import { GlobalMap } from './pages/GlobalMap.jsx'
import { ResearchLoadBoundary } from './components/ResearchLoadBoundary.jsx'
import { UsCpi } from './pages/UsCpi.jsx'
import { DigitalMoney } from './pages/DigitalMoney.jsx'
import { AiProductivity } from './pages/AiProductivity.jsx'
import { Drivers } from './pages/Drivers.jsx'

const UpdateJournal = lazy(() => import('./pages/UpdateJournal.jsx').then(m => ({default:m.UpdateJournal})))
import { workspaceCopy } from './i18n/workspace.js'
import { ResearchContext } from './components/ResearchContext.jsx'
import './research-map.css'
import './treasury-pricing.css'

const InternationalDollar = lazy(() => import('./pages/InternationalDollar.jsx').then(m => ({default:m.InternationalDollar})))
const Sources = lazy(() => import('./pages/Sources.jsx').then(m => ({default:m.Sources})))
const DataWorkspace = lazy(() => import('./pages/DataWorkspace.jsx').then(m => ({default:m.DataWorkspace})))

const SectionLanding = lazy(() => import('./pages/SectionLanding.jsx').then(module => ({ default: module.SectionLanding })))
const ExternalShocks = lazy(() => import('./pages/ExternalShocks.jsx').then(module => ({ default: module.ExternalShocks })))

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

// Mounted inside Suspense so navigation focuses the resolved page, not its loading state.
function RouteFocus({ navigationKey, mainRef, previousNavigationKey }) {
  useEffect(() => {
    const focus = new URLSearchParams(navigationKey.split('?')[1]).get('focus')
    const legacyTargets = { model: 'fiscal-model', outlook: 'fiscal-outlook', compare: 'country-compare', health: 'data-status' }
    // The research map owns its section IDs. Preserve the established deep-link aliases.
    const route = navigationKey.split('?')[0].replace(/^#\//, '')
    const targetId = route === 'research/ai-productivity' ? `ai-${focus}` : route === 'research/digital-money' ? `dm-${focus}` : legacyTargets[focus] || focus
    const focusedSection = focus ? document.getElementById(targetId) : null
    const destination = focusedSection && mainRef.current?.contains(focusedSection) ? focusedSection : null
    const navigated = previousNavigationKey.current !== navigationKey
    previousNavigationKey.current = navigationKey
    // On initial load leave focus at the document, where Tab reaches the skip link first.
    if (!destination && !navigated) return
    if (destination?.tagName === 'DETAILS') destination.open = true
    const heading = destination?.querySelector('h1, h2, h3, h4, summary') || destination || mainRef.current?.querySelector('h1') || mainRef.current
    if (heading) {
      if (heading.tagName !== 'SUMMARY') heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
    destination?.scrollIntoView({ block: 'start' })
  }, [navigationKey])
  return null
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [navigationKey, setNavigationKey] = useState(() => window.location.hash)
  const [language, setLanguage] = useState(initialLanguage)
  const [theme, setTheme] = useState(initialTheme)
  const mainRef = useRef(null)
  const previousNavigationKey = useRef(navigationKey)
  const a = iaCopy[language], t = { ...copy[language], nav: { ...copy[language].nav, ...a.nav, 'research/data': workspaceCopy[language].title, 'research/updates': workspaceCopy[language].journal, 'research/international-dollar': language === 'zh' ? '国际美元' : 'International Dollar' } }
  const section = routeSection(route), links = sectionLinks[section] || []
  const selectedSectionLink = links.find(([href]) => href === navigationKey)?.[0] || links.find(([href]) => href === navigationKey.split('?')[0])?.[0] || ''

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
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); mainRef.current?.focus({ preventScroll: true }); mainRef.current?.scrollIntoView({ block: 'start' }) }}>{language === 'zh' ? '跳至主要内容' : 'Skip to main content'}</a>
    <header className="site-header">
      <a className="brand" href="#/home" aria-label={language === 'zh' ? '全球通胀透视 · 首页' : 'World Inflation Lens home'}><span className="brand-mark">◎</span><span>WORLD<br /><strong>INFLATION LENS</strong>{language === 'zh' && <small className="brand-chinese">全球通胀透视</small>}</span></a>
      <nav className="desktop-nav" aria-label={t.navigation}>
        {primaryRoutes.map(item => <a key={item} href={`#/${item}`} className={section === item ? 'active' : ''} aria-current={section === item ? (route === item ? 'page' : 'location') : undefined}>{t.nav[item]}</a>)}
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
    <nav className="mobile-nav" aria-label={t.navigation}>{primaryRoutes.map(item => <a key={item} href={`#/${item}`} className={section === item ? 'active' : ''} aria-current={section === item ? (route === item ? 'page' : 'location') : undefined}>{t.nav[item]}</a>)}</nav>
    {links.length > 0 && <div className="section-navigation"><nav aria-label={a.sectionNavigation}>{links.map(([href, zh, en]) => <a key={href} href={href} aria-current={selectedSectionLink === href ? 'page' : undefined}>{language === 'zh' ? zh : en}</a>)}</nav><label>{a.sectionNavigation}<select value={selectedSectionLink} onChange={event => { window.location.hash = event.target.value }}><option value="" disabled>{a.nav[section]}</option>{links.map(([href, zh, en]) => <option key={href} value={href}>{language === 'zh' ? zh : en}</option>)}</select></label></div>}
    <main key={navigationKey} id="main-content" tabIndex={-1} ref={mainRef}>
      <ResearchContext route={route} navigationKey={navigationKey} language={language} />
      <ResearchLoadBoundary key={navigationKey} language={language}><Suspense fallback={<p className="content-section" role="status">{language === 'zh' ? '正在加载研究…' : 'Loading research…'}</p>}>
      <RouteFocus navigationKey={navigationKey} mainRef={mainRef} previousNavigationKey={previousNavigationKey} />
      {route === 'home' && <Home language={language} />}
      {['dollar', 'research'].includes(route) && <SectionLanding section={route} language={language} />}
      {route === 'purchasing-power' && <><PageIntro eyebrow="DOLLAR / CPI" title={a.powerTitle} description={a.powerClarify} /><section className="content-section global-section"><DollarPower language={language} /></section></>}
      {route === 'monitor' && <Monitor language={language} />}
      {route === 'scenarios' && <Scenarios language={language} />}
      {route === 'fiscal' && <Fiscal language={language} />}
      {['regimes', 'history'].includes(route) && <Regimes language={language} />}
      {route === 'since-1971' && <Since1971 language={language} />}
      {route === 'overview' && <GlobalOverview language={language} />}
      {route === 'timeline' && <Timeline language={language} />}
      {route === 'us-cpi' && <UsCpi language={language} />}
      {route === 'map' && <GlobalMap language={language} />}
      {route === 'drivers' && <Drivers language={language} />}
      {route === 'research/digital-money' && <DigitalMoney language={language} />}
      {route === 'research/ai-productivity' && <AiProductivity language={language} />}
      {route === 'external-shocks' && <ExternalShocks language={language} />}
      {route === 'sources' && <Sources t={t} language={language} />}
      {route === 'research/international-dollar' && <InternationalDollar language={language} />}
      {route === 'research/data' && <DataWorkspace language={language} />}
      {route === 'research/updates' && <UpdateJournal language={language} />}
      </Suspense></ResearchLoadBoundary>
    </main>
    <footer><span>© {new Date().getFullYear()} World Inflation Lens</span><span>{t.footer}</span></footer>
  </div>
}
