import { createHash } from 'node:crypto'
import { temporalValue } from '../../../src/utils/timeSemantics.js'
import { zonedInstant } from '../../../src/utils/releaseCalendar.js'
export const VERSION = 'offline-prototype/0.1.1'
export const MODES = ['CURRENT_SNAPSHOT','CURRENT_VINTAGE_RECONSTRUCTION','RECORDED_AS_OF','TRUE_RELEASE_VINTAGE']
export const unknownTime = () => ({value:null,precision:'unknown',timeZone:null,evidenceRef:null})
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export function canonical(value) {
 if (typeof value==='number') { if(!Number.isFinite(value))throw Error('NONFINITE_JSON'); return Object.is(value,-0)?0:value }
 if(Array.isArray(value))return value.map(canonical)
 if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort((a,b)=>a<b?-1:a>b?1:0).map(k=>[k,canonical(value[k])]))
 return value
}
export const serialize = value => JSON.stringify(canonical(value))+'\n'
export const contentHash = value => sha256(serialize(value))
export function instant(value) {
 if(typeof value!=='string'|| !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('EXPLICIT_UTC_INSTANT_REQUIRED')
 calendarDate(value.slice(0,10))
 const parsed=new Date(value).toISOString()
 if(parsed.slice(0,19)!==value.slice(0,19))throw Error('INVALID_CLOCK_TIME')
 return new Date(value).toISOString()
}
export function calendarDate(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('INVALID_CALENDAR_DATE')
 return value
}
export function timeEvidence(value,ref=null,zone=null) {
 const t=typeof value==='object'&&value?value:temporalValue(value)
 const precision=['timestamp','date','month'].includes(t.precision)?t.precision:'unknown'
 return {value:t.value||null,precision,timeZone:precision==='timestamp'?'UTC':zone,evidenceRef:ref}
}
export function availabilityBound(t) {
 if(!t?.value)return null
 if(t.precision==='timestamp')return instant(t.value)
 if(!t.timeZone)return null
 let next
 if(t.precision==='date') {
  const d=new Date(`${t.value}T00:00:00Z`);if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==t.value)throw Error('INVALID_RELEASE_DATE')
  next=new Date(+d+86400000).toISOString().slice(0,10)
 } else if(t.precision==='month') {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(t.value))throw Error('INVALID_RELEASE_MONTH')
  const [y,m]=t.value.split('-').map(Number);next=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10)
 } else return null
 return zonedInstant(next,0,0,t.timeZone)
}
export function period(date,frequency,sourcePeriod=null,periodBasis='') {
 if(frequency==='publication snapshot')return date?{kind:'publication_fact',label:calendarDate(date),start:`${date}T00:00:00.000Z`,end:`${date}T23:59:59.999Z`}:{kind:'publication_fact',label:'UNKNOWN_OBSERVATION',start:null,end:null}
 let y,m,d,start,end,kind,label
 if(frequency==='monthly'||frequency==='quarterly') {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(date))throw Error('INVALID_PERIOD')
  ;[y,m]=date.split('-').map(Number)
  if(frequency==='quarterly'&&![1,4,7,10].includes(m))throw Error('INVALID_QUARTER_ANCHOR')
  kind=frequency==='quarterly'?'quarter':'month';label=kind==='quarter'?`${y}-Q${(m+2)/3}`:date
  if(sourcePeriod&&sourcePeriod!==label)throw Error('SOURCE_PERIOD_MISMATCH')
  start=Date.UTC(y,m-1,1);end=Date.UTC(y,m-1+(kind==='quarter'?3:1),1)-1
 } else if(frequency.startsWith('annual')) {
  y=Number(date.slice(0,4));if(!Number.isInteger(y)||!/^\d{4}(?:-\d{2}-\d{2})?$/.test(date))throw Error('INVALID_ANNUAL_PERIOD')
  if(date.length===10)calendarDate(date)
  kind=/fiscal/i.test(frequency+' '+periodBasis)?'fiscal_year':'calendar_year';label=kind==='fiscal_year'?`FY${y}`:String(y)
  // Fiscal source endpoints are retained; modern US fiscal years run Oct–Sep.
  if(kind==='fiscal_year'&&date.length===10){end=Date.parse(`${date}T23:59:59.999Z`);start=Date.UTC(y-1,Number(date.slice(5,7)),1)}
  else {start=Date.UTC(y,0,1);end=Date.UTC(y+1,0,1)-1}
 } else {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('INVALID_DAILY_PERIOD')
  kind=frequency.startsWith('weekly')?'week':'day';label=date;start=Date.parse(`${date}T00:00:00Z`);end=start+86400000-1
 }
 return {kind,label,start:new Date(start).toISOString(),end:new Date(end).toISOString()}
}
export const ordinal = (date,freq) => freq==='quarterly'?Number(date.slice(0,4))*4+(Number(date.slice(5,7))-1)/3:Number(date.slice(0,4))*12+Number(date.slice(5,7))-1
export function dateAt(n,freq) {const base=freq==='quarterly'?4:12;const y=Math.floor(n/base),m=(n%base)*(freq==='quarterly'?3:1)+1;return `${y}-${String(m).padStart(2,'0')}`}
export function roundComparison(n) {return Math.sign(n)*Math.round((Math.abs(n)+Number.EPSILON)*1e8)/1e8}
export function confirmedBand(values,factor,scenario={multiplier:1,persistenceOffset:0}) {
 const n=Math.max(1,factor.persistencePeriods+scenario.persistenceOffset),z=values.slice(-n).map(roundComparison),entry=roundComparison(factor.entry*scenario.multiplier),quiet=roundComparison(factor.quiet*scenario.multiplier)
 if(z.length!==n||!z.every(Number.isFinite))return factor.states.missing
 if(z.every(v=>v>=entry))return factor.states.positive
 if(z.every(v=>v<=-entry))return factor.states.negative
 if(z.every(v=>Math.abs(v)<=quiet))return factor.states.quiet
 return factor.states.unconfirmed
}
export function transformWindow(source,factor,config,endpoint,scenario={multiplier:1,persistenceOffset:0}) {
 const tr=config.transforms[factor.transformId],n=Math.max(1,factor.persistencePeriods+scenario.persistenceOffset),count=tr.minimumPeriodsSingleResult+n-1
 const points=new Map(source.observations.map(p=>[p.date,p])),last=ordinal(endpoint,factor.frequency),raw=[]
 for(let i=last-count+1;i<=last;i++) {const p=points.get(dateAt(i,factor.frequency));if(!p||p.value===null||!Number.isFinite(p.value))return {error:'INCOMPLETE_CONTIGUOUS_WINDOW'};raw.push(p)}
 if(tr.requiresPositiveFullWindow&&raw.some(p=>p.value<=0))return {error:'NONPOSITIVE_PERCENT_CHANGE_INPUT'}
 if(factor.valueRange&&raw.some(p=>p.value<factor.valueRange[0]||p.value>factor.valueRange[1]))return {error:'INVALID_SHARE_RANGE'}
 if(raw.some(p=>p.sourceFlag==='B'||p.sourcePreBreak!==undefined))return {error:'DEFINITION_BREAK'}
 if(new Set(raw.map(p=>p.methodologyId).filter(Boolean)).size>1)return {error:'DEFINITION_BREAK'}
 const get=i=>points.get(dateAt(i,factor.frequency)).value
 const yoy=(i,lag)=>100*(get(i)/get(i-lag)-1)
 const transformed=[]
 for(let i=last-n+1;i<=last;i++) {
  let value
  switch(factor.transformId) {
   case 'yoy_monthly':value=yoy(i,12);break
   case 'yoy_quarterly':value=yoy(i,4);break
   case 'core_yoy_delta_3m':value=yoy(i,12)-yoy(i-3,12);break
   case 'gscpi_mean_delta_3m':value=(get(i)+get(i-1)+get(i-2))/3-(get(i-3)+get(i-4)+get(i-5))/3;break
   case 'rate_delta_3m':value=get(i)-get(i-3);break
   case 'share_delta_8q':value=get(i)-get(i-8);break
   default:throw Error('UNKNOWN_TRANSFORM')
  }
  if(!Number.isFinite(value))return {error:'NONFINITE_TRANSFORM'}
  transformed.push({observationPeriod:period(dateAt(i,factor.frequency),factor.frequency),value,units:tr.units})
 }
 return {raw,transformed,direction:confirmedBand(transformed.map(p=>p.value),factor,scenario)}
}
export function scenarios(config) {return config.sensitivity.entryAndQuietJointMultipliers.flatMap(multiplier=>config.sensitivity.persistenceOffsets.map(persistenceOffset=>({multiplier,persistenceOffset,id:`bands-${multiplier}_persistence-${persistenceOffset}`})))}
export function contemporaneous(a,b) {
 if(!a?.start||!b?.start||!a.end||!b.end)return false
 return Math.abs(Date.parse(a.end)-Date.parse(b.end))<=100*86400000&&Date.parse(a.start)<=Date.parse(b.end)&&Date.parse(b.start)<=Date.parse(a.end)
}
