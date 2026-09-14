// Provider registry. FRED snapshots and cited historical chapters are integrated; other providers are planned.
export const sources = [
  { id: 'bis', short: 'BIS', name: 'Bank for International Settlements', url: 'https://www.bis.org/statistics/', description: { en: 'International monetary and financial statistics, including long-run price series.', zh: '国际货币与金融统计数据，包括长期价格序列。' } },
  { id: 'world-bank', short: 'WB', name: 'World Bank Open Data', url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG', description: { en: 'Country-level consumer price inflation indicators and development data.', zh: '各国消费者价格通胀指标及发展数据。' } },
  { id: 'imf', short: 'IMF', name: 'International Monetary Fund', url: 'https://www.imf.org/en/Data', description: { en: 'Macroeconomic datasets and cross-country inflation estimates.', zh: '宏观经济数据集与跨国通胀估计。' } },
  { id: 'fred', short: 'FRED', name: 'Federal Reserve Economic Data', url: 'https://fred.stlouisfed.org/series/CPIAUCNS', description: { en: 'U.S. consumer price index and other historical economic time series.', zh: '美国消费者价格指数及其他历史经济时间序列。' } },
  { id: 'events', short: 'HIS', name: 'Federal Reserve History / IMF', url: 'https://www.federalreservehistory.org/essays', description: { en: 'Cited historical chapters from Federal Reserve History and the IMF; each chapter links to its reference.', zh: '基于美联储历史资料和 IMF 文献编写的历史章节，每章附来源链接。' } },
]
