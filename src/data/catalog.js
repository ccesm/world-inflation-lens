import headline from '../../data/inflation/fred.json'
import drivers from '../../data/inflation/drivers.json'
import monitor from '../../data/inflation/monitor.json'
import productivity from '../../data/productivity/series.json'
import bank from '../../data/digital-money/bank-deposits.json'
import gpr from '../../data/external/gpr.json'
import gscpi from '../../data/external/gscpi.json'
import fao from '../../data/external/fao-food.json'
import sipri from '../../data/external/sipri-military.json'
import { aiCopy } from '../i18n/productivity.js'
import { updatesCopy } from '../i18n/updates.js'
import { transmissionCopy } from '../i18n/transmission.js'

// A view over validated snapshots: no second ingestion pipeline or invented data.
export const catalog = [
  { ...headline, topic: 'inflation', tool: '#/us-cpi' },
  ...drivers.series.map(s => ({ ...s, topic: 'drivers', tool: '#/drivers' })),
  ...monitor.series.map(s => ({ ...s, topic: 'dollar', tool: '#/monitor' })),
  ...productivity.series.map(s => ({ ...s, topic: 'productivity', tool: '#/research/ai-productivity' })),
  { ...bank, topic: 'money', tool: '#/research/digital-money' },
  ...[gpr, gscpi, fao, sipri].flatMap(dataset => dataset.series.map(s => ({
    ...dataset.metadata, ...s, title: s.title || s.id, topic: 'external', tool: '#/external-shocks',
    seasonalAdjustment: s.seasonalAdjustment || 'not specified by source',
  }))),
]
export const catalogById = Object.fromEntries(catalog.map(s => [s.id, s]))
const monitorNames = {
  PCEPILFE: ['核心 PCE 价格指数', 'Core PCE Price Index'], T5YIFR: ['5年后5年期通胀补偿', '5-Year, 5-Year Forward Inflation Compensation'],
  DFII10: ['10年期国债实际收益率', '10-Year Treasury Real Yield'], DGS10: ['10年期国债收益率', '10-Year Treasury Yield'],
  DTWEXBGS: ['广义美元指数', 'Broad Dollar Index'], WALCL: ['美联储总资产', 'Federal Reserve Total Assets'],
  FYPUGDA188S: ['公众持有联邦债务 / GDP', 'Federal Debt Held by the Public / GDP'], FYFSGDA188S: ['联邦盈余或赤字（负值）/ GDP', 'Federal Surplus or Deficit (Negative) / GDP'],
  FYOINT: ['联邦利息支出', 'Federal Interest Outlays'], FYFR: ['联邦财政收入', 'Federal Receipts'],
  DPSACBM027SBOG: ['美国商业银行存款', 'U.S. Commercial Bank Deposits'],
}
export function seriesName(s, language) {
  return monitorNames[s.id]?.[language === 'zh' ? 0 : 1] || aiCopy[language].names[s.id] || transmissionCopy[language].names[s.id] || updatesCopy[language].sourceTitles?.[s.id] || s.title
}
