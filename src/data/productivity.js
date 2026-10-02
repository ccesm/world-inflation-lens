import dataset from '../../data/productivity/series.json'
import {realGdpPerWorker} from '../utils/productivity.js'
import {withSeriesContract} from './seriesContract.js'
export const productivityDataset={...dataset,series:dataset.series.map(withSeriesContract)}
export const productivitySeries=Object.fromEntries(productivityDataset.series.map(s=>[s.id,s]))
productivitySeries.REAL_GDP_WORKER=withSeriesContract(realGdpPerWorker(productivitySeries.GDPC1,productivitySeries.CE16OV))
