import { internationalSeries } from './internationalDollar.js'
import headline from '../../data/inflation/fred.json'
import drivers from '../../data/inflation/drivers.json'
import monitor from '../../data/inflation/monitor.json'
import productivity from '../../data/productivity/series.json'
import bank from '../../data/digital-money/bank-deposits.json'
import gpr from '../../data/external/gpr.json'
import gscpi from '../../data/external/gscpi.json'
import fao from '../../data/external/fao-food.json'
import sipri from '../../data/external/sipri-military.json'
import { withSeriesContract } from './seriesContract.js'

// A view over validated snapshots: no second ingestion pipeline or invented data.
export const catalog = [
  ...internationalSeries,
  { ...headline, topic: 'inflation', tool: '#/us-cpi' },
  ...drivers.series.map(s => ({ ...s, topic: 'drivers', tool: '#/drivers' })),
  ...monitor.series.map(s => ({ ...s, topic: 'dollar', tool: '#/monitor' })),
  ...productivity.series.map(s => ({ ...s, topic: 'productivity', tool: '#/research/ai-productivity' })),
  { ...bank, topic: 'money', tool: '#/research/digital-money' },
  ...[gpr, gscpi, fao, sipri].flatMap(dataset => dataset.series.map(s => ({
    ...dataset.metadata, ...s, title: s.title || s.id, topic: 'external', tool: '#/external-shocks',
    seasonalAdjustment: s.seasonalAdjustment || 'not specified by source',
  }))),
].map(withSeriesContract)
export const catalogById = Object.fromEntries(catalog.map(s => [s.id, s]))
export function seriesName(s, language) {
  return s.contract?.title?.[language] || s.title || s.id
}
