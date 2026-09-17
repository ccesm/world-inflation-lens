import { monthNumber } from './inflation.js'
export function bankGrowth(series) {
 const byMonth=new Map(series.observations.map(p=>[monthNumber(p.date),p.value]))
 return series.observations.map(p=>{const prior=byMonth.get(monthNumber(p.date)-12);return {date:p.date,value:Number.isFinite(p.value)&&Number.isFinite(prior)&&prior>0?(p.value/prior-1)*100:null}})
}
export function digitalCsv(records) {
 const quote=v=>`"${String(v??'').replaceAll('"','""')}"`
 const fields=['id','value','units','observationDate','qualifier','sourceUpdatedAt','retrievedAt','frequency','seasonalAdjustment','sourceUrl','underlyingProvider','definition','status','license']
 return '\ufeff'+[fields,...records.map(r=>fields.map(k=>r[k]))].map(row=>row.map(quote).join(',')).join('\r\n')
}
export function bankCsv(series,points,mode){return digitalCsv(points.map(p=>({...series,value:p.value,units:mode==='yoy'?'percent year-over-year':series.units,observationDate:p.date,qualifier:'',underlyingProvider:series.publisher})))}
