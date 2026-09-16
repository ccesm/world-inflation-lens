import gpr from '../../data/external/gpr.json'
import gscpi from '../../data/external/gscpi.json'
import fao from '../../data/external/fao-food.json'
import sipri from '../../data/external/sipri-military.json'
import { driverSeries } from './drivers.js'
export const externalDatasets = [gpr, gscpi, fao, sipri]
export const externalSeries = Object.fromEntries(externalDatasets.flatMap(d => d.series.map(s => [s.id, { ...s, points: s.observations, metadata: d.metadata, frequency: d.metadata.frequency }])))
export const transmissionSeries = { ...externalSeries, ...Object.fromEntries(Object.entries(driverSeries).map(([id, s]) => [id, { ...s, frequency: s.metadata.frequency, units: s.measure, metadata: { ...s.metadata, provider: s.metadata.publisher, attribution: `${s.metadata.publisher} / FRED`, status: 'historical_observations' } }])) }
