import { csvCell } from './workspace.js'
export const internationalPeriod = (date,frequency) => frequency === 'quarterly' ? `${date.slice(0,4)}-Q${Math.floor((Number(date.slice(5,7))-1)/3)+1}` : date
export const internationalUnits = (s,language) => language==='zh' ? (s.id.startsWith('COFER_')?'全球外汇储备占比（%）':s.units==='USD millions'?'百万美元':s.units) : s.units
export function internationalCsv(s,points,measure='level') {
 const fields=['series','source_period','internal_period_anchor','value','measure','units','original_units','frequency','denominator','geography','definition','source_key','source','download','source_updated','source_released','retrieved','source_flag','attribution']
 return '\ufeff'+[fields,...points.map(p=>[s.id,p.sourcePeriod||internationalPeriod(p.date,s.frequency),p.date,p.value,measure,measure==='yoy'?'Percent change in published levels':s.units,s.units,s.frequency,s.denominator,s.geography,s.definition,s.sourceKey||s.holderCode||s.currency,s.sourceUrl,s.downloadUrl,s.sourceUpdatedAt,s.sourceReleasedAt,s.retrievedAt,p.sourceFlag,s.attribution])].map(row=>row.map(csvCell).join(',')).join('\r\n')
}
