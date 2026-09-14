import fred from '../../data/inflation/fred.json'
import { withAnnualChange } from '../utils/inflation.js'

// Bundled snapshots work offline after load and require no browser API keys.
export const cpiMetadata = { ...fred, observations: undefined }
export const cpi = withAnnualChange(fred.observations)
export const latestCpi = cpi.findLast(point => point.value != null)
