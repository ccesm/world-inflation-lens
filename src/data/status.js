import headline from '../../data/inflation/fred.json'
import drivers from '../../data/inflation/drivers.json'
import world from '../../data/inflation/worldbank.json'
import history from '../../data/updates/history.json'
import monitor from '../../data/inflation/monitor.json'
import { observationStatus } from '../utils/dataStatus.js'

export { history }
export function sourceStatus(now = new Date()) {
  const monthly = [headline, ...drivers.series, ...monitor.series].map(source => ({
    id: source.id, title: source.title, frequency: source.frequency, sourceUrl: source.sourceUrl,
    updated: source.sourceUpdatedAt, retrieved: source.retrievedAt, ...observationStatus(source.observations, source.frequency, now),
  }))
  const points = Object.values(world.values).flatMap(values => values.map((value, i) => ({ date: String(world.metadata.startYear + i), value })))
  return [...monthly, { id: world.metadata.indicator, title: 'World Bank · Consumer price inflation', frequency: 'annual', sourceUrl: world.metadata.url,
    updated: world.metadata.sourceUpdatedAt, retrieved: world.metadata.retrievedAt, ...observationStatus(points, 'annual', now) }]
}
