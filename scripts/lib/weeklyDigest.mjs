import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {createDigest,runUrl} from './notification.mjs'
import {seriesMetadata} from '../../src/data/seriesContract.js'

const kinds=['added','filled','revised','withdrawn']
const keyIds=['CPIAUCNS','PCEPILFE','FEDFUNDS','DGS10','DFII10','T5YIFR','DTWEXBGS','WALCL','OPHNFB','ULCNFB','PNFIC1','GDPC1','MCOILWTICO','MHHNGSP','CENSUS_DATACENTER','COFER_USD','TIC_TOTAL','TIC_JAPAN','TIC_CHINA','BIS_USD_TOTAL']
const stamp=value=>{assert.equal(typeof value,'string','Missing recorded check time');assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(value)&&Number.isFinite(Date.parse(value)),'Invalid recorded check time');return Date.parse(value)}
const local=value=>new Intl.DateTimeFormat('zh-CN',{timeZone:'America/Los_Angeles',dateStyle:'medium',timeStyle:'short',hour12:false}).format(new Date(value))
const localDate=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
const number=value=>value===null?'未披露 / unavailable':String(value)

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
   for(const e of change.examples||[]){assert.ok(kinds.includes(e.kind)&&typeof e.date==='string');for(const k of ['before','after'])assert.ok(e[k]===null||Number.isFinite(e[k]),'Invalid example value');if(item.examples.length<3)item.examples.push({...e,checkedAt:record.checkCompletedAt})}
   changed.set(item.id,item)
  }
 }
 const byId=new Map();for(const s of sources){assert.ok(!byId.has(s.id),'Duplicate weekly source');byId.set(s.id,s)}
 const title=id=>{const s=byId.get(id);if(!s)return id==='FP.CPI.TOTL.ZG'?'各国年度 CPI / Country annual CPI':id;const m=seriesMetadata(s);return `${m.title.zh} / ${m.title.en}`}
 const reading=id=>{
  const s=byId.get(id);if(!s)return '当前快照未提供独立读数 / Current snapshot reading unavailable'
  const m=seriesMetadata(s)
  if(s.countryPanel)return `分国年度面板，截至 / Country annual panel through ${s.latestPeriod}; 不生成全球平均值 / no global average\n来源 / Source: ${m.publisher} · ${m.sourceUrl}`
  const last=s.observations.at(-1)
  assert.ok(last&&typeof last.date==='string'&&(last.value===null||Number.isFinite(last.value)),'Invalid latest observation')
  assert.ok(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(last.date)&&last.date<=new Date(end).toISOString().slice(0,10),'Future or malformed observation period')
  assert.ok(s.retrievedAt&&s.retrievedAt.slice(0,10)<=new Date(end).toISOString().slice(0,10),'Future or missing source retrieval')
  if(s.retrievedAt.includes('T'))assert.ok(stamp(s.retrievedAt)<=end,'Future source retrieval timestamp')
  const lines=[`${last.date}: ${number(last.value)} ${m.units} · ${m.frequency} · ${m.seasonalAdjustment}`]
  if(last.value===null){const valid=s.observations.findLast(p=>Number.isFinite(p.value));if(valid)lines.push(`最近有效 / Last valid: ${valid.date}: ${valid.value} ${m.units}`)}
  assert.ok(/^https:\/\//.test(m.sourceUrl||''),'Missing public source URL')
  lines.push(`来源 / Source: ${m.publisher} · ${m.sourceUrl}`,`来源更新 / Source updated: ${s.sourceUpdatedAt??'未披露 / not disclosed'}; 抓取 / Retrieved: ${s.retrievedAt}`)
  return lines.join('\n')
 }
 const subject=`World Inflation Lens · 每周数据周报 / Weekly data summary · ${localDate(end)}`
 const lines=[subject,'',`近 7×24 小时已记录变化 / Recorded change window: ${local(start)} — ${local(end)} (America/Los_Angeles)`,`成功检查次数 / Completed checks: ${records.length}`,`历史覆盖 / Retained history: ${complete?'覆盖完整窗口 / full window covered':'不足完整窗口，以下计数不完整 / partial window; counts incomplete'}`,
 `新增 / New: ${totals.added}; 补齐 / Filled: ${totals.filled}; 修订 / Revised: ${totals.revised}; 撤回 / Withdrawn: ${totals.withdrawn}`,
 '这些是记录的变化次数，可能包含同一历史观测的多次修订，不是独立观测数。Counts are recorded change events, not unique observations.',
 '', '一、本周捕获的新数据与修订 / Newly captured data and revisions']
 if(!changed.size)lines.push(complete?'该窗口已记录的成功检查没有观测值变化。No observation changes recorded in this covered window.':'可用记录中未见变化，但窗口覆盖不足。No changes in available records; the full window is not covered.')
 for(const item of [...changed.values()].sort((a,b)=>a.id.localeCompare(b.id))){lines.push('',`${title(item.id)} [${item.id}]`,kinds.map(k=>`${k}=${item[k]}`).join('; '),reading(item.id));for(const e of item.examples)lines.push(`  ${e.date} · ${e.kind}: ${number(e.before)} → ${number(e.after)}`);if(item.examples.length)lines.push('以上仅为保留的修订样本，不是完整明细。Retained examples only; not the full change history.')}
 lines.push('','二、关键指标最新可用读数 / Latest available key observations')
 for(const id of keyIds)lines.push('',`${title(id)} [${id}]`,reading(id))
 lines.push('','观测期、来源更新时间和抓取时间不同；本周捕获不表示经济活动发生于本周。Observation periods, source updates and retrieval dates differ; capture this week does not imply economic activity this week.',
 '保留原始单位、频率和缺失值；本邮件不计算周度经济增速，也不提供预测、评分或投资建议。Native units/frequencies/missingness are preserved; no weekly growth conversion, forecast, score or investment advice.',
 '周报覆盖现有自动更新数据；CBO、SIPRI 等固定或人工审核版本仍按原规则维护。This digest covers existing automated datasets; fixed/manual vintages retain their existing review rules.',
 '',`核对记录 / Workflow: ${runUrl(runId)}`,'历史记录 / History: https://ccesm.github.io/world-inflation-lens/#/research/updates','https://ccesm.github.io/world-inflation-lens/')
 return {subject,text:lines.join('\n'),success:true,window:{start:new Date(start).toISOString(),end:new Date(end).toISOString(),complete},totals,changedSeries:changed.size}
}
