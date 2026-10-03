import cofer from '../../data/international-dollar/reserve-composition.json'
import tic from '../../data/international-dollar/treasury-holdings.json'
import bis from '../../data/international-dollar/global-dollar-credit.json'
import { withSeriesContract } from './seriesContract.js'
export const internationalDatasets = { cofer, tic, bis }
export const internationalSeries = Object.values(internationalDatasets).flatMap(dataset=>dataset.series.map(s=>withSeriesContract({...dataset.metadata,...s,topic:'international',tool:`#/research/international-dollar?focus=${dataset.metadata.id}`})))
export const internationalById = Object.fromEntries(internationalSeries.map(s=>[s.id,s]))
export const periodLabel = s => s.frequency === 'quarterly' ? date => `${date.slice(0,4)}-Q${Math.floor((Number(date.slice(5,7))-1)/3)+1}` : date => date
