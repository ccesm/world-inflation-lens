import {monthNumber} from './inflation.js'
export const monthAt=n=>`${Math.floor(n/12)}-${String(n%12+1).padStart(2,'0')}`
export const periodLabel=(date,frequency)=>frequency==='quarterly'?`${date.slice(0,4)} Q${Math.floor((Number(date.slice(5))-1)/3)+1}`:date
export const lastValue=points=>points.findLast(p=>Number.isFinite(p.value))||null
export function growth(s,mode='yoy') {
 const byDate=new Map(s.observations.map(p=>[p.date,p.value]))
 const lag=mode==='yoy'?12:s.frequency==='quarterly'?3:1
 return s.observations.map(p=>{const prior=byDate.get(monthAt(monthNumber(p.date)-lag));return {date:p.date,value:Number.isFinite(p.value)&&Number.isFinite(prior)&&prior>0?((p.value/prior)**(mode==='annualized'?(s.frequency==='quarterly'?4:12):1)-1)*100:null}})
}
export function movingMean(points,count=20){return points.map((p,i)=>{const window=points.slice(Math.max(0,i-count+1),i+1);return {date:p.date,value:window.length===count&&window.every(p=>Number.isFinite(p.value))?window.reduce((n,p)=>n+p.value,0)/count:null}})}
export function quarterlyAverage(s){const map=new Map(s.observations.map(p=>[p.date,p.value])),start=monthNumber(s.observations[0].date),end=monthNumber(s.observations.at(-1).date);const out=[];for(let n=Math.ceil(start/3)*3;n+2<=end;n+=3){const values=[0,1,2].map(k=>map.get(monthAt(n+k)));out.push({date:monthAt(n),value:values.every(v=>Number.isFinite(v))?values.reduce((a,b)=>a+b,0)/3:null})}return {...s,frequency:'quarterly',observations:out}}
export function realGdpPerWorker(gdp,employment){const quarters=new Map(quarterlyAverage(employment).observations.map(p=>[p.date,p.value]));const observations=gdp.observations.filter(p=>p.date>=employment.observations[0].date).map(p=>({date:p.date,value:Number.isFinite(p.value)&&Number.isFinite(quarters.get(p.date))&&quarters.get(p.date)>0?p.value/quarters.get(p.date)*1e6:null}));return {...gdp,coverage:{start:observations[0].date,end:observations.at(-1).date},latestObservation:lastValue(observations)?.date||null,retrievedAt:[gdp.retrievedAt,employment.retrievedAt].sort().at(-1),id:'REAL_GDP_WORKER',units:'2017 USD per employed person, annualized',proxy:true,status:'derived_from_observations',definition:'GDPC1 (billions of chained 2017 USD, SAAR) / mean of all three CE16OV monthly observations (thousands of civilian employed persons) × 1,000,000. Broad cross-survey output-per-worker proxy, not nonfarm output per hour; household-survey breaks remain.',sourceUrl:gdp.sourceUrl,inputSources:[gdp,employment].map(({observations,...m})=>m),observations}}
export function movement(s,points= growth(s)){const last=lastValue(points),previous=last&&points.find(p=>monthNumber(p.date)===monthNumber(last.date)-(s.frequency==='quarterly'?3:1));const delta=last&&Number.isFinite(previous?.value)?last.value-previous.value:null;return {last,delta,key:delta===null?'missing':Math.abs(delta)<1e-9?'stable':delta>0?'rising':'falling'}}
export function aiAssessment(byId,now=new Date()) {
 const groups={labor:['OPHNFB','ULCNFB','COMPNFB'],demand:['PNFIC1','CENSUS_DATACENTER','CUUR0000SEHF01']}
 return Object.fromEntries(Object.entries(groups).map(([group,ids])=>{
  const inputs=ids.map(id=>byId[id].frequency==='quarterly'?byId[id]:quarterlyAverage(byId[id]));const values=inputs.map(s=>growth(s));
  const date=values[0].filter(p=>Number.isFinite(p.value)).map(p=>p.date).reverse().find(d=>values.every(points=>Number.isFinite(points.find(p=>p.date===d)?.value)))
  if(!date||monthNumber(now.toISOString().slice(0,7))-monthNumber(date)>8)return [group,{code:'insufficient',date:date||null,evidence:[]}]
  const evidence=ids.map((id,i)=>{const value=values[i].find(p=>p.date===date).value,prior=values[i].find(p=>monthNumber(p.date)===monthNumber(date)-3)?.value;return {id,date,value,prior}})
  if(evidence.some(e=>!Number.isFinite(e.prior)))return[group,{code:'insufficient',date,evidence}]
  const code=group==='labor'?(evidence[0].value>0&&evidence[1].value<evidence[1].prior?'easing':'mixed'):evidence.every(e=>e.value>0)?'expansion':'mixed'
  return[group,{code,date,evidence}]
 }))
}
export const productivityEras=[{id:'1950',from:'1950-01',to:'1969-10'},{id:'1970',from:'1970-01',to:'1979-10'},{id:'1990',from:'1990-01',to:'1999-10'},{id:'2000',from:'2000-01',to:'2009-10'},{id:'2010',from:'2010-01',to:'2019-10'},{id:'2020',from:'2020-01',to:null}]
export function productivityCsv(s,points,measure){const cell=v=>`"${String(v??'').replaceAll('"','""')}"`;return '\ufeff'+[['series','period','value','measure','original_units','frequency','seasonal_adjustment','AI_proxy','source','source_update','retrieved','input_sources','license','source_flag'],...points.map(p=>[s.id,periodLabel(p.date,s.frequency),p.value,measure,s.units,s.frequency,s.seasonalAdjustment,s.proxy,s.sourceUrl,s.sourceUpdatedAt,s.retrievedAt,JSON.stringify(s.inputSources||[]),s.license,s.observations.find(o=>o.date===p.date)?.sourceFlag])].map(r=>r.map(cell).join(',')).join('\r\n')}
