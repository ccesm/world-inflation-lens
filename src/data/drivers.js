import snapshot from '../../data/inflation/drivers.json'
import { cpi, cpiMetadata } from './inflation.js'
import { withAnnualChange } from '../utils/inflation.js'

export const driverMetadata = snapshot.series.map(({ observations, ...metadata }) => metadata)
const raw = Object.fromEntries(snapshot.series.map(series => [series.id, series]))
const cpiSeries = (id, points, metadata) => ({ id, measure: 'yoy_percent', points: points.map(p => ({ date: p.date, value: p.inflation })), metadata })
export const driverSeries = {
  headline: cpiSeries('CPIAUCNS', cpi, cpiMetadata),
  food: cpiSeries('CPIUFDNS', withAnnualChange(raw.CPIUFDNS.observations), driverMetadata.find(s => s.id === 'CPIUFDNS')),
  energy: cpiSeries('CPIENGNS', withAnnualChange(raw.CPIENGNS.observations), driverMetadata.find(s => s.id === 'CPIENGNS')),
  oil: { id: 'MCOILWTICO', measure: 'usd_per_barrel', points: raw.MCOILWTICO.observations, metadata: driverMetadata.find(s => s.id === 'MCOILWTICO') },
  rates: { id: 'FEDFUNDS', measure: 'rate_percent', points: raw.FEDFUNDS.observations, metadata: driverMetadata.find(s => s.id === 'FEDFUNDS') },
}
export const driverTopics = ['food', 'energy', 'rates']
export const topicKeys = { food: ['headline', 'food'], energy: ['headline', 'energy', 'oil'], rates: ['headline', 'rates'] }
export const driverStart = '1954-07'
// Include the latest published month of any source; retain gaps in less current series.
export const driverEnd = Object.values(driverSeries).map(s => s.points.at(-1).date).sort().at(-1)
