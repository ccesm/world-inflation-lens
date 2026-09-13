// Registry for future data adapters. V0.1 links to providers but does not fetch live data.
export const sources = [
  { id: 'bis', short: 'BIS', name: 'Bank for International Settlements', url: 'https://www.bis.org/statistics/', description: { en: 'International monetary and financial statistics, including long-run price series.', zh: '国际货币与金融统计数据，包括长期价格序列。' } },
  { id: 'world-bank', short: 'WB', name: 'World Bank Open Data', url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG', description: { en: 'Country-level consumer price inflation indicators and development data.', zh: '各国消费者价格通胀指标及发展数据。' } },
  { id: 'imf', short: 'IMF', name: 'International Monetary Fund', url: 'https://www.imf.org/en/Data', description: { en: 'Macroeconomic datasets and cross-country inflation estimates.', zh: '宏观经济数据集与跨国通胀估计。' } },
  { id: 'fred', short: 'FRED', name: 'Federal Reserve Economic Data', url: 'https://fred.stlouisfed.org/', description: { en: 'U.S. consumer price index and other historical economic time series.', zh: '美国消费者价格指数及其他历史经济时间序列。' } },
  { id: 'events', short: 'HIS', name: 'Historical Event Datasets', url: 'https://www.nber.org/research/data', description: { en: 'Curated historical context for major inflation episodes; dataset selection is pending.', zh: '用于解释主要通胀时期的历史背景；具体数据集尚待确定。' } },
]
