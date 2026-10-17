import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {createDigest,runUrl} from './notification.mjs'
import {seriesMetadata} from '../../src/data/seriesContract.js'
import {weeklyTableRow,renderWeeklyTable} from './weeklyTable.mjs'

const kinds=['added','filled','revised','withdrawn']
const stamp=value=>{assert.equal(typeof value,'string','Missing recorded check time');assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(value)&&Number.isFinite(Date.parse(value)),'Invalid recorded check time');return Date.parse(value)}
const local=value=>new Intl.DateTimeFormat('zh-CN',{timeZone:'America/Los_Angeles',dateStyle:'medium',timeStyle:'short',hour12:false}).format(new Date(value))
const localDate=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))

export async function loadWeeklySources(root){
 const read=async path=>JSON.parse(await readFile(resolve(root,'data',path),'utf8'))
 const sources=[await read('inflation/fred.json'),...(await read('inflation/drivers.json')).series,...(await read('inflation/monitor.json')).series,...(await read('productivity/series.json')).series,await read('digital-money/bank-deposits.json')]
 for(const path of ['external/gpr','external/gscpi','external/fao-food','international-dollar/reserve-composition','international-dollar/treasury-holdings','international-dollar/global-dollar-credit']){const d=await read(path+'.json');sources.push(...d.series.map(s=>({...d.metadata,...s})))}
 const world=await read('inflation/worldbank.json')
 sources.push({...world.metadata,id:world.metadata.indicator,sourceUrl:world.metadata.url,countryPanel:true,latestPeriod:String(world.metadata.endYear),observations:[]})
 const seen=new Map()
 for(const s of sources){assert.ok(s.id&&Array.isArray(s.observations));if(seen.has(s.id))assert.deepEqual(s,seen.get(s.id),'Conflicting duplicate source');else seen.set(s.id,s)}
 return [...seen.values()]
}

export function createWeeklyDigest(args){
 const base=createDigest(args)
 if(!base.success)return base // Failed refresh/deployment remains an error notice, never a weekly success claim.
 const {ledger,runId,sources=[]}=args,current=ledger.runs.find(r=>r.runUrl===runUrl(runId))
 const end=stamp(current.checkCompletedAt),start=end-7*24*60*60*1000
 const unique=new Map()
 for(const r of ledger.runs){
  if(!r.checkCompletedAt)continue // Legacy entries cannot establish a completed check.
  const completed=stamp(r.checkCompletedAt)
  if(completed>end)continue
  assert.equal(r.runUrl,runUrl(r.runUrl?.split('/').at(-1)),'Invalid change-record URL')
  if(unique.has(r.runUrl))assert.deepEqual(r,unique.get(r.runUrl),'Conflicting duplicate check')
  else unique.set(r.runUrl,r)
 }
 const records=[...unique.values()].filter(r=>stamp(r.checkCompletedAt)>start)
 const complete=ledger.runs.every(r=>r.checkCompletedAt) && [...unique.values()].some(r=>stamp(r.checkCompletedAt)<=start)
 const totals=Object.fromEntries(kinds.map(k=>[k,0])),changed=new Map()
 for(const record of records){
  const ids=new Set()
  for(const change of record.changes){
   assert.ok(typeof change.id==='string'&&!ids.has(change.id),'Duplicate or missing changed series');ids.add(change.id)
   for(const k of kinds)assert.ok(Number.isSafeInteger(change[k])&&change[k]>=0,'Invalid weekly revision count')
   const count=kinds.reduce((n,k)=>n+change[k],0)
   if(!count)continue
   const item=changed.get(change.id)||{id:change.id,...Object.fromEntries(kinds.map(k=>[k,0])),examples:[]}
   for(const k of kinds){item[k]+=change[k];totals[k]+=change[k];assert.ok(Number.isSafeInteger(totals[k]),'Revision count overflow')}
   for(const e of change.examples||[]){assert.ok(kinds.includes(e.kind)&&typeof e.date==='string');for(const k of ['before','after'])assert.ok(e[k]===null||Number.isFinite(e[k]),'Invalid example value');item.examples.push({...e,checkedAt:record.checkCompletedAt})}
   changed.set(item.id,item)
  }
 }
 const byId=new Map();for(const s of sources){assert.ok(!byId.has(s.id),'Duplicate weekly source');byId.set(s.id,s)}
 const validateSource=id=>{
  const s=byId.get(id);if(!s||s.countryPanel)return
  const m=seriesMetadata(s)
  const last=s.observations.at(-1)
  assert.ok(last&&typeof last.date==='string'&&(last.value===null||Number.isFinite(last.value)),'Invalid latest observation')
  assert.ok(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(last.date)&&last.date<=new Date(end).toISOString().slice(0,10),'Future or malformed observation period')
  assert.ok(s.retrievedAt&&s.retrievedAt.slice(0,10)<=new Date(end).toISOString().slice(0,10),'Future or missing source retrieval')
  if(s.retrievedAt.includes('T'))assert.ok(stamp(s.retrievedAt)<=end,'Future source retrieval timestamp')
  assert.ok(/^https:\/\//.test(m.sourceUrl||''),'Missing public source URL')
 }
 const subject=`World Inflation Lens · 每周数据周报 / Weekly data summary · ${localDate(end)}`
 const rows=[...changed.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(item=>{
  validateSource(item.id) // Validate source clocks, native units and endpoint before presentation.
  return weeklyTableRow(item,byId.get(item.id),new Date(end).toISOString())
 })
 const window={start:new Date(start).toISOString(),end:new Date(end).toISOString(),complete}
 const rendered=renderWeeklyTable({subject,window,totals,rows,runId,localWindow:`近七天 / Last seven days: ${local(start)} — ${local(end)} (America/Los_Angeles)`})
 return {subject,...rendered,success:true,window,changedSeries:changed.size}
}
