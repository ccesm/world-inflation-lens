import fred from '../../data/inflation/fred.json'
import { withAnnualChange } from '../utils/inflation.js'
import { withSeriesContract } from './seriesContract.js'

// Bundled snapshots work offline after load and require no browser API keys.
export const cpiMetadata = { ...withSeriesContract(fred), observations: undefined }
export const cpi = withAnnualChange(fred.observations)
export const latestCpi = cpi.findLast(point => point.value != null)
