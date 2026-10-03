import React from 'react'
// Keep the site shell usable if a newly loaded evidence module fails to download.
export class ResearchLoadBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    const zh = this.props.language === 'zh'
    return <section className="content-section" role="alert"><h1>{zh ? '暂时无法载入研究资料' : 'Research could not be loaded'}</h1><p>{zh ? '下载没有完成。可重新载入页面，或使用导航查看其他研究。' : 'The download did not complete. Reload this page or use navigation to explore other research.'}</p><button className="global-button" onClick={() => window.location.reload()}>{zh ? '重新载入页面' : 'Reload page'}</button></section>
  }
}
