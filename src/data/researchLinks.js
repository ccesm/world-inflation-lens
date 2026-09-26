// Official destination pages reviewed for V0.12. These are links, not live feeds.
export const researchLinks = [
  { en: 'BLS · Labor productivity and costs', zh: 'BLS · 劳动生产率与成本', url: 'https://www.bls.gov/productivity/', status: 'integrated', note: { en: 'Official concepts and releases behind productivity and labor-cost observations.', zh: '生产率和劳动成本指标的官方定义与发布资料。' } },
  { en: 'BEA · Gross Domestic Product', zh: 'BEA · 国内生产总值', url: 'https://www.bea.gov/data/gdp/gross-domestic-product', status: 'integrated', note: { en: 'Real growth and investment context; releases may revise earlier quarters.', zh: '实际增长与投资背景；新发布可能修订前期季度数据。' } },
  { en: 'Census · Construction spending', zh: 'Census · 建设施工支出', url: 'https://www.census.gov/construction/c30/c30index.html', status: 'integrated', note: { en: 'Data centers and broader nonresidential construction. Construction is not total AI spending.', zh: '数据中心与非住宅建设；建设支出不等于 AI 总投资。' } },
  { en: 'Federal Reserve · H.4.1 balance sheet', zh: '美联储 · H.4.1 资产负债表', url: 'https://www.federalreserve.gov/releases/h41/', status: 'integrated', note: { en: 'Official weekly balance-sheet releases; WALCL is available in the workspace.', zh: '官方每周资产负债表发布；工作台已提供 WALCL 序列。' } },
  { en: 'EIA · Electricity data', zh: 'EIA · 电力数据', url: 'https://www.eia.gov/electricity/data.php', status: 'reference', note: { en: 'Generation, sales and prices for further research. These detailed EIA datasets are not integrated; the existing demand proxy is a Federal Reserve index.', zh: '供进一步研究的发电、销售与价格数据。尚未接入这些 EIA 明细；现有需求代理指标来自美联储指数。' } },
  { en: 'Census · Business Trends and Outlook Survey', zh: 'Census · 企业趋势与展望调查', url: 'https://www.census.gov/hfp/btos/data', status: 'reference', note: { en: 'Candidate source for business technology adoption. No AI-adoption observations are integrated yet.', zh: '企业技术应用研究的候选来源；尚未接入 AI 应用观测。' } },
]
export const releaseCalendars = [
  { en: 'BLS · CPI release schedule', zh: 'BLS · CPI 发布日程', url: 'https://www.bls.gov/schedule/news_release/cpi.htm' },
  { en: 'BEA · GDP and PCE release schedule', zh: 'BEA · GDP 与 PCE 发布日程', url: 'https://www.bea.gov/news/schedule' },
  { en: 'Federal Reserve · H.4.1 releases', zh: '美联储 · H.4.1 发布日程', url: 'https://www.federalreserve.gov/releases/h41/' },
]
