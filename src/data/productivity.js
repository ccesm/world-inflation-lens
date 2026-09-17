import dataset from '../../data/productivity/series.json'
import {realGdpPerWorker} from '../utils/productivity.js'
export const productivityDataset=dataset
export const productivitySeries=Object.fromEntries(dataset.series.map(s=>[s.id,s]))
productivitySeries.REAL_GDP_WORKER=realGdpPerWorker(productivitySeries.GDPC1,productivitySeries.CE16OV)
